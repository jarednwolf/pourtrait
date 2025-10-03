import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImageProcessingService } from '../image-processing'

// Mock Google Vision API
vi.mock('@google-cloud/vision', () => ({
  ImageAnnotatorClient: vi.fn().mockImplementation(() => ({
    textDetection: vi.fn()
  }))
}))

// Mock Sharp
vi.mock('sharp', () => {
  const mockSharp = vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    sharpen: vi.fn().mockReturnThis(),
    normalize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('optimized-image'))
  }))
  return { default: mockSharp }
})

describe('ImageProcessingService', () => {
  let service: ImageProcessingService
  let mockBuffer: Buffer

  beforeEach(() => {
    service = new ImageProcessingService()
    mockBuffer = Buffer.from('test-image-data')
    vi.clearAllMocks()
  })

  describe('parseWineInformation', () => {
    it('should extract vintage from text', () => {
      const text = 'Château Margaux 2015 Bordeaux'
      const result = (service as any).parseWineInformation(text)
      
      expect(result.vintage).toBe(2015)
    })

    it('should extract region from text', () => {
      const text = 'Great wine from Bordeaux region'
      const result = (service as any).parseWineInformation(text)
      
      expect(result.region).toBe('Bordeaux')
    })

    it('should extract varietal from text', () => {
      const text = 'Cabernet Sauvignon blend with Merlot'
      const result = (service as any).parseWineInformation(text)
      
      expect(result.varietal).toContain('Cabernet Sauvignon')
    })

    it('should extract producer and name from lines', () => {
      const text = 'Domaine de la Côte\nPinot Noir\n2020'
      const result = (service as any).parseWineInformation(text)
      
      expect(result.producer).toBe('Domaine de la Côte')
      expect(result.name).toBe('Pinot Noir')
    })
  })

  describe('parseWineListEntries', () => {
    it('should parse wine list with prices', () => {
      const text = `
        Château Margaux 2015 - $150
        Opus One 2018 - $300
        Dom Pérignon 2012 - $200
      `
      const result = (service as any).parseWineListEntries(text)
      
      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({
        name: 'Château Margaux 2015',
        price: '$150'
      })
    })

    it('should extract vintage from wine names', () => {
      const text = 'Barolo Brunate 2017, Vietti'
      const result = (service as any).parseWineListEntries(text)
      
      expect(result[0].vintage).toBe(2017)
      expect(result[0].confidence).toBeGreaterThan(0.7)
    })

    it('should skip header lines', () => {
      const text = `
        RED WINES
        BY THE GLASS
        Château Margaux 2015 - $150
      `
      const result = (service as any).parseWineListEntries(text)
      
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Château Margaux 2015')
    })
  })

  describe('optimizeAndStoreImage', () => {
    it('should optimize image with default settings', async () => {
      const result = await service.optimizeAndStoreImage(mockBuffer)
      
      expect(result.success).toBe(true)
      expect(result.url).toBeDefined()
      expect(result.optimizedUrl).toBeDefined()
    })

    it('should apply custom optimization settings', async () => {
      const options = {
        maxWidth: 800,
        maxHeight: 600,
        quality: 90,
        format: 'webp' as const
      }
      
      const result = await service.optimizeAndStoreImage(mockBuffer, options)
      
      expect(result.success).toBe(true)
    })

    it('should handle optimization errors', async () => {
      const sharp = await import('sharp')
      const mockSharp = sharp.default as any
      mockSharp.mockImplementationOnce(() => ({
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockRejectedValue(new Error('Optimization failed'))
      }))

      const result = await service.optimizeAndStoreImage(mockBuffer)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Optimization failed')
    })
  })

  describe('fallbackTextExtraction', () => {
    it('should return error when Google Vision is not configured', async () => {
      const result = await (service as any).fallbackTextExtraction(mockBuffer)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Google Vision API not configured')
    })
  })

  describe('recognizeWineLabel', () => {
    it('should handle OCR failure gracefully', async () => {
      // Mock OCR to fail
      vi.spyOn(service, 'extractTextFromImage').mockResolvedValue({
        success: false,
        extractedText: '',
        confidence: 0,
        error: 'OCR failed'
      })

      const result = await service.recognizeWineLabel(mockBuffer)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('OCR failed')
    })

    it('should process successful OCR results', async () => {
      // Mock successful OCR
      vi.spyOn(service, 'extractTextFromImage').mockResolvedValue({
        success: true,
        extractedText: 'Château Margaux\n2015\nBordeaux',
        confidence: 0.9
      })

      const result = await service.recognizeWineLabel(mockBuffer)
      
      expect(result.success).toBe(true)
      expect(result.confidence).toBe(0.9)
      expect(result.extractedData?.vintage).toBe(2015)
    })
  })

  describe('processWineListImage', () => {
    it('should process wine list successfully', async () => {
      // Mock successful OCR
      vi.spyOn(service, 'extractTextFromImage').mockResolvedValue({
        success: true,
        extractedText: 'Château Margaux 2015 - $150\nOpus One 2018 - $300',
        confidence: 0.8
      })

      const result = await service.processWineListImage(mockBuffer)
      
      expect(result.success).toBe(true)
      expect(result.wines).toHaveLength(2)
      expect(result.wines[0].name).toBe('Château Margaux 2015')
      expect(result.wines[0].price).toBe('$150')
    })

    it('should handle OCR failure in wine list processing', async () => {
      // Mock OCR failure
      vi.spyOn(service, 'extractTextFromImage').mockResolvedValue({
        success: false,
        extractedText: '',
        confidence: 0,
        error: 'OCR failed'
      })

      const result = await service.processWineListImage(mockBuffer)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('OCR failed')
    })
  })
})