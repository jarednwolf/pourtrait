'use client'

import { useState, useCallback } from 'react'
import { 
  WineRecognitionResult, 
  OCRResult, 
  WineListExtraction, 
  ImageUploadResult,
  CameraCapture
} from '@/types'

interface UseImageProcessingReturn {
  // State
  isProcessing: boolean
  error: string | null
  
  // Wine label recognition
  recognizeWineLabel: (file: File) => Promise<WineRecognitionResult>
  
  // OCR text extraction
  extractText: (file: File) => Promise<OCRResult>
  
  // Wine list processing
  processWineList: (file: File) => Promise<WineListExtraction>
  
  // Image upload and optimization
  uploadImage: (file: File, options?: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  }) => Promise<ImageUploadResult>
  
  // Utility functions
  clearError: () => void
}

export function useImageProcessing(): UseImageProcessingReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<Response>,
    errorMessage: string
  ): Promise<T> => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await apiCall()
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      if (!result.success) {
        throw new Error(result.error || errorMessage)
      }

      return result as T
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : errorMessage
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const recognizeWineLabel = useCallback(async (file: File): Promise<WineRecognitionResult> => {
    const formData = new FormData()
    formData.append('image', file)

    return handleApiCall<WineRecognitionResult>(
      () => fetch('/api/image/recognize-wine', {
        method: 'POST',
        body: formData,
      }),
      'Failed to recognize wine label'
    )
  }, [handleApiCall])

  const extractText = useCallback(async (file: File): Promise<OCRResult> => {
    const formData = new FormData()
    formData.append('image', file)

    return handleApiCall<OCRResult>(
      () => fetch('/api/image/ocr', {
        method: 'POST',
        body: formData,
      }),
      'Failed to extract text from image'
    )
  }, [handleApiCall])

  const processWineList = useCallback(async (file: File): Promise<WineListExtraction> => {
    const formData = new FormData()
    formData.append('image', file)

    return handleApiCall<WineListExtraction>(
      () => fetch('/api/image/wine-list', {
        method: 'POST',
        body: formData,
      }),
      'Failed to process wine list'
    )
  }, [handleApiCall])

  const uploadImage = useCallback(async (
    file: File, 
    options: {
      maxWidth?: number
      maxHeight?: number
      quality?: number
      format?: 'jpeg' | 'png' | 'webp'
    } = {}
  ): Promise<ImageUploadResult> => {
    const formData = new FormData()
    formData.append('image', file)
    
    if (options.maxWidth) formData.append('maxWidth', options.maxWidth.toString())
    if (options.maxHeight) formData.append('maxHeight', options.maxHeight.toString())
    if (options.quality) formData.append('quality', options.quality.toString())
    if (options.format) formData.append('format', options.format)

    return handleApiCall<ImageUploadResult>(
      () => fetch('/api/image/upload', {
        method: 'POST',
        body: formData,
      }),
      'Failed to upload image'
    )
  }, [handleApiCall])

  return {
    isProcessing,
    error,
    recognizeWineLabel,
    extractText,
    processWineList,
    uploadImage,
    clearError
  }
}

// Utility hook for camera capture processing
export function useCameraCapture() {
  const { recognizeWineLabel, isProcessing, error } = useImageProcessing()

  const processCameraCapture = useCallback(async (capture: CameraCapture): Promise<WineRecognitionResult> => {
    return recognizeWineLabel(capture.file)
  }, [recognizeWineLabel])

  return {
    processCameraCapture,
    isProcessing,
    error
  }
}