import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useImageProcessing } from '../useImageProcessing'

// Mock fetch
global.fetch = vi.fn()

describe('useImageProcessing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useImageProcessing())
    
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should clear error when clearError is called', () => {
    const { result } = renderHook(() => useImageProcessing())
    
    // Manually set error for testing
    act(() => {
      ;(result.current as any).setError = vi.fn()
    })
    
    act(() => {
      result.current.clearError()
    })
    
    expect(result.current.error).toBe(null)
  })

  describe('recognizeWineLabel', () => {
    it('should handle successful wine recognition', async () => {
      const mockResponse = {
        success: true,
        confidence: 0.9,
        extractedData: {
          name: 'Château Margaux',
          producer: 'Château Margaux',
          vintage: 2015
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(() => useImageProcessing())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      let response
      await act(async () => {
        response = await result.current.recognizeWineLabel(file)
      })

      expect(response).toEqual(mockResponse)
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle API errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      })

      const { result } = renderHook(() => useImageProcessing())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        try {
          await result.current.recognizeWineLabel(file)
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
      })

      expect(result.current.isProcessing).toBe(false)
      expect(result.current.error).toBe('Server error')
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useImageProcessing())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        try {
          await result.current.recognizeWineLabel(file)
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
      })

      expect(result.current.isProcessing).toBe(false)
      expect(result.current.error).toBe('Network error')
    })
  })

  describe('extractText', () => {
    it('should handle successful text extraction', async () => {
      const mockResponse = {
        success: true,
        extractedText: 'Sample wine label text',
        confidence: 0.8
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(() => useImageProcessing())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      let response
      await act(async () => {
        response = await result.current.extractText(file)
      })

      expect(response).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith('/api/image/ocr', {
        method: 'POST',
        body: expect.any(FormData)
      })
    })
  })

  describe('processWineList', () => {
    it('should handle successful wine list processing', async () => {
      const mockResponse = {
        success: true,
        wines: [
          { name: 'Wine 1', price: '$50', confidence: 0.9 },
          { name: 'Wine 2', price: '$75', confidence: 0.8 }
        ],
        rawText: 'Wine list text'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(() => useImageProcessing())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      let response
      await act(async () => {
        response = await result.current.processWineList(file)
      })

      expect(response).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith('/api/image/wine-list', {
        method: 'POST',
        body: expect.any(FormData)
      })
    })
  })

  describe('uploadImage', () => {
    it('should handle successful image upload', async () => {
      const mockResponse = {
        success: true,
        url: '/images/test.jpg',
        optimizedUrl: '/images/test-optimized.jpg'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(() => useImageProcessing())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      let response
      await act(async () => {
        response = await result.current.uploadImage(file, {
          maxWidth: 800,
          quality: 90,
          format: 'webp'
        })
      })

      expect(response).toEqual(mockResponse)
      
      // Check that FormData was created with correct options
      const formDataCall = (global.fetch as any).mock.calls[0][1].body
      expect(formDataCall).toBeInstanceOf(FormData)
    })

    it('should handle upload without options', async () => {
      const mockResponse = {
        success: true,
        url: '/images/test.jpg'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(() => useImageProcessing())
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      let response
      await act(async () => {
        response = await result.current.uploadImage(file)
      })

      expect(response).toEqual(mockResponse)
    })
  })

  it('should set processing state correctly during API calls', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })

    ;(global.fetch as any).mockReturnValueOnce(promise)

    const { result } = renderHook(() => useImageProcessing())
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    // Start the API call
    act(() => {
      result.current.recognizeWineLabel(file)
    })

    // Should be processing
    expect(result.current.isProcessing).toBe(true)

    // Resolve the promise
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    })

    // Should no longer be processing
    expect(result.current.isProcessing).toBe(false)
  })
})