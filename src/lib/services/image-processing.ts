import { ImageAnnotatorClient } from '@google-cloud/vision'
import sharp from 'sharp'
import { 
  WineRecognitionResult, 
  OCRResult, 
  WineListExtraction, 
  ImageProcessingOptions,
  ImageUploadResult
} from '@/types'
import { ImageProcessingError as _ImageProcessingError, WineRecognitionError as _WineRecognitionError } from '../errors'
import { withRetry as _withRetry, retryConditions as _retryConditions } from '../utils/retry'
import { ImageProcessingFallbacks as _ImageProcessingFallbacks } from '../utils/fallback'
import { imageLogger } from '../utils/logger'
import { performanceMonitor as _performanceMonitor } from '../monitoring/performance'

/**
 * Image Processing Service
 * Handles wine label recognition, OCR, and image optimization
 */
export class ImageProcessingService {
  private visionClient: ImageAnnotatorClient | null = null

  constructor() {
    // Initialize Google Vision client if API key is available
    if (process.env.GOOGLE_VISION_API_KEY) {
      this.visionClient = new ImageAnnotatorClient({
        apiKey: process.env.GOOGLE_VISION_API_KEY,
      })
    }
  }

  /**
   * Recognize wine label from image buffer
   */
  async recognizeWineLabel(imageBuffer: Buffer): Promise<WineRecognitionResult> {
    const _startTime = performance.now();
    
    imageLogger.info('Starting wine label recognition', {
      imageSize: imageBuffer.length,
      operation: 'wine_label_recognition'
    });

    try {
      // First, optimize the image for better recognition
      const optimizedBuffer = await this.optimizeImageForOCR(imageBuffer)
      
      // Extract text using OCR
      const ocrResult = await this.extractTextFromImage(optimizedBuffer)
      
      if (!ocrResult.success) {
        return {
          success: false,
          confidence: 0,
          error: ocrResult.error || 'OCR failed'
        }
      }

      // Parse wine information from extracted text
      const wineData = this.parseWineInformation(ocrResult.extractedText)
      
      return {
        success: true,
        confidence: ocrResult.confidence,
        extractedData: wineData,
        rawText: ocrResult.extractedText
      }
    } catch (error) {
      console.error('Wine label recognition failed:', error)
      return {
        success: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Extract text from image using OpenAI Vision API
   */
  async extractTextFromImage(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      // Use OpenAI Vision API for text extraction
      if (process.env.OPENAI_API_KEY) {
        return this.extractTextWithOpenAI(imageBuffer)
      }
      
      // Fallback if no API key available
      return this.fallbackTextExtraction(imageBuffer);
    } catch (error) {
      return {
        success: false,
        extractedText: '',
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Legacy Google Vision API method (kept for reference)
   */
  private async extractTextWithGoogleVision(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      const [result] = await this.visionClient.textDetection({
        image: { content: imageBuffer }
      })

      const detections = result.textAnnotations || []
      
      if (detections.length === 0) {
        return {
          success: false,
          extractedText: '',
          confidence: 0,
          error: 'No text detected in image'
        }
      }

      // First annotation contains the full text
      const fullText = detections[0]?.description || ''
      
      // Calculate average confidence from individual detections
      const confidenceSum = detections.slice(1).reduce((sum, detection) => {
        return sum + (detection.confidence || 0)
      }, 0)
      const averageConfidence = detections.length > 1 ? confidenceSum / (detections.length - 1) : 0

      // Extract bounding boxes for individual words
      const boundingBoxes = detections.slice(1).map(detection => ({
        text: detection.description || '',
        confidence: detection.confidence || 0,
        vertices: detection.boundingPoly?.vertices?.map(vertex => ({
          x: vertex.x || 0,
          y: vertex.y || 0
        })) || []
      }))

      return {
        success: true,
        extractedText: fullText,
        confidence: averageConfidence,
        boundingBoxes
      }
    } catch (error) {
      console.error('OCR extraction failed:', error)
      return {
        success: false,
        extractedText: '',
        confidence: 0,
        error: error instanceof Error ? error.message : 'OCR failed'
      }
    }
  }

  /**
   * Process restaurant wine list image
   */
  async processWineListImage(imageBuffer: Buffer): Promise<WineListExtraction> {
    try {
      // Extract text from the wine list image
      const ocrResult = await this.extractTextFromImage(imageBuffer)
      
      if (!ocrResult.success) {
        return {
          success: false,
          wines: [],
          rawText: '',
          error: ocrResult.error || 'Failed to extract text from wine list'
        }
      }

      // Parse wine list entries from extracted text
      const wines = this.parseWineListEntries(ocrResult.extractedText)
      
      return {
        success: true,
        wines,
        rawText: ocrResult.extractedText
      }
    } catch (error) {
      console.error('Wine list processing failed:', error)
      return {
        success: false,
        wines: [],
        rawText: '',
        error: error instanceof Error ? error.message : 'Wine list processing failed'
      }
    }
  }

  /**
   * Optimize and store image
   */
  async optimizeAndStoreImage(
    imageBuffer: Buffer, 
    options: ImageProcessingOptions = {}
  ): Promise<ImageUploadResult> {
    try {
      const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 85,
        format = 'jpeg'
      } = options

      // Optimize image using Sharp
      let sharpInstance = sharp(imageBuffer)
        .resize(maxWidth, maxHeight, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })

      // Apply format-specific optimizations
      switch (format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality, progressive: true })
          break
        case 'png':
          sharpInstance = sharpInstance.png({ quality })
          break
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality })
          break
      }

      const _optimizedBuffer = await sharpInstance.toBuffer()
      
      // In a real implementation, you would upload to your storage service here
      // For now, we'll return a placeholder URL
      const timestamp = Date.now()
      const filename = `wine-image-${timestamp}.${format}`
      
      // TODO: Implement actual file upload to Supabase Storage or similar
      const url = `/api/images/${filename}`
      
      return {
        success: true,
        url,
        optimizedUrl: url
      }
    } catch (error) {
      console.error('Image optimization failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image optimization failed'
      }
    }
  }

  /**
   * Optimize image specifically for OCR processing
   */
  private async optimizeImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .sharpen()
      .normalize()
      .jpeg({ quality: 95 })
      .toBuffer()
  }

  /**
   * Parse wine information from OCR text
   */
  private parseWineInformation(text: string): Partial<WineRecognitionResult['extractedData']> {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
    const result: Partial<WineRecognitionResult['extractedData']> = {}

    // Common wine label patterns
    const vintagePattern = /\b(19|20)\d{2}\b/
    const regionPatterns = [
      /\b(Bordeaux|Burgundy|Champagne|Chianti|Rioja|Napa|Sonoma|Barolo|Brunello)\b/i,
      /\b(Tuscany|Loire|Rhône|Alsace|Mosel|Piedmont|Mendoza|Marlborough)\b/i
    ]
    const varietalPatterns = [
      /\b(Cabernet Sauvignon|Merlot|Pinot Noir|Chardonnay|Sauvignon Blanc)\b/i,
      /\b(Riesling|Syrah|Shiraz|Grenache|Sangiovese|Nebbiolo|Tempranillo)\b/i
    ]

    // Extract vintage
    const vintageMatch = text.match(vintagePattern)
    if (vintageMatch) {
      result.vintage = parseInt(vintageMatch[0])
    }

    // Extract region
    for (const pattern of regionPatterns) {
      const regionMatch = text.match(pattern)
      if (regionMatch) {
        result.region = regionMatch[0]
        break
      }
    }

    // Extract varietal
    const varietals: string[] = []
    for (const pattern of varietalPatterns) {
      const varietalMatch = text.match(pattern)
      if (varietalMatch) {
        varietals.push(varietalMatch[0])
      }
    }
    if (varietals.length > 0) {
      result.varietal = varietals
    }

    // Try to identify producer and wine name
    // Usually the first few lines contain this information
    if (lines.length > 0) {
      // First line is often the producer or wine name
      const firstLine = lines[0]
      if (firstLine.length > 2 && !vintagePattern.test(firstLine)) {
        result.producer = firstLine
      }
      
      // Second line might be the wine name if first was producer
      if (lines.length > 1 && result.producer) {
        const secondLine = lines[1]
        if (secondLine.length > 2 && !vintagePattern.test(secondLine)) {
          result.name = secondLine
        }
      } else if (!result.producer) {
        result.name = firstLine
      }
    }

    return result
  }

  /**
   * Parse wine list entries from restaurant menu text
   */
  private parseWineListEntries(text: string): WineListExtraction['wines'] {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
    const wines: WineListExtraction['wines'] = []

    // Price pattern (various currencies and formats)
    const pricePattern = /[\$£€¥]\s*\d+(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?\s*[\$£€¥]/

    for (const line of lines) {
      // Skip lines that are clearly headers or categories
      if (line.length < 5 || /^(red|white|sparkling|wine|by the glass|by the bottle)/i.test(line)) {
        continue
      }

      // Extract price if present
      const priceMatch = line.match(pricePattern)
      const price = priceMatch ? priceMatch[0] : undefined

      // Remove price from line to get wine description
      const wineDescription = price ? line.replace(pricePattern, '').trim() : line

      // Try to parse wine name and producer
      const parts = wineDescription.split(/[,\-–—]/).map(p => p.trim())
      
      if (parts.length > 0) {
        const wine = {
          name: parts[0],
          producer: parts.length > 1 ? parts[1] : undefined,
          price,
          description: wineDescription,
          confidence: 0.7 // Base confidence for parsed entries
        }

        // Try to extract vintage
        const vintageMatch = wineDescription.match(/\b(19|20)\d{2}\b/)
        if (vintageMatch) {
          wine.vintage = parseInt(vintageMatch[0])
          wine.confidence += 0.1
        }

        wines.push(wine)
      }
    }

    return wines
  }

  /**
   * Extract text using OpenAI Vision API
   */
  private async extractTextWithOpenAI(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      const base64Image = imageBuffer.toString('base64')
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text from this wine label image. Return only the text you can see, preserving line breaks and formatting as much as possible.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const extractedText = data.choices[0]?.message?.content || ''

      return {
        success: true,
        confidence: 0.9, // OpenAI Vision is generally high confidence
        extractedText,
        boundingBoxes: [], // OpenAI doesn't provide bounding boxes
        metadata: {
          model: 'gpt-4-vision-preview',
          processingTime: Date.now()
        }
      }

    } catch (error) {
      console.error('OpenAI Vision API error:', error)
      return {
        success: false,
        confidence: 0,
        extractedText: '',
        error: error instanceof Error ? error.message : 'OpenAI Vision API failed'
      }
    }
  }

  /**
   * Fallback text extraction when no vision service is available
   */
  private async fallbackTextExtraction(_imageBuffer: Buffer): Promise<OCRResult> {
    return {
      success: false,
      extractedText: '',
      confidence: 0,
      error: 'Google Vision API not configured'
    }
  }
}

// Export singleton instance
export const imageProcessingService = new ImageProcessingService()