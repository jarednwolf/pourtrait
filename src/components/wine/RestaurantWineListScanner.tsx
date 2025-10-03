'use client'

import React, { useState, useCallback } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { useImageProcessing } from '@/hooks/useImageProcessing'
import { RestaurantWineRecommendations } from '@/components/recommendations/RestaurantWineRecommendations'
import { WineListExtraction, CameraCapture, ExtractedWineListItem } from '@/types'

interface RestaurantWineListScannerProps {
  onWineListProcessed?: (wines: ExtractedWineListItem[]) => void
  onCancel?: () => void
  className?: string
}

export function RestaurantWineListScanner({ 
  onWineListProcessed, 
  onCancel, 
  className = '' 
}: RestaurantWineListScannerProps) {
  const [scanResult, setScanResult] = useState<WineListExtraction | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const { processWineList, isProcessing, error, clearError } = useImageProcessing()

  const handleImageSelect = useCallback(async (file: File) => {
    setSelectedImage(file)
    clearError()
    
    try {
      const result = await processWineList(file)
      setScanResult(result)
    } catch (err) {
      console.error('Wine list processing failed:', err)
    }
  }, [processWineList, clearError])

  const handleCameraCapture = useCallback(async (capture: CameraCapture) => {
    setSelectedImage(capture.file)
    clearError()
    
    try {
      const result = await processWineList(capture.file)
      setScanResult(result)
    } catch (err) {
      console.error('Wine list processing failed:', err)
    }
  }, [processWineList, clearError])

  const handleUseResult = useCallback(() => {
    if (scanResult?.success && scanResult.wines) {
      if (onWineListProcessed) {
        onWineListProcessed(scanResult.wines)
      } else {
        setShowRecommendations(true)
      }
    }
  }, [scanResult, onWineListProcessed])

  const handleBackToScanner = useCallback(() => {
    setShowRecommendations(false)
  }, [])

  const handleRetry = useCallback(() => {
    setScanResult(null)
    setSelectedImage(null)
    clearError()
  }, [clearError])

  // Show recommendations if we have processed wines and user clicked "Get Recommendations"
  if (showRecommendations && scanResult?.success && scanResult.wines) {
    return (
      <RestaurantWineRecommendations
        wines={scanResult.wines}
        onBack={handleBackToScanner}
        className={className}
      />
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan Restaurant Wine List</h2>
        <p className="text-gray-600">
          Take a photo of the restaurant's wine menu to get personalized recommendations
        </p>
      </div>

      {/* Image Upload/Camera */}
      {!selectedImage && (
        <ImageUpload
          onImageSelect={handleImageSelect}
          onImageCapture={handleCameraCapture}
          className="max-w-md mx-auto"
        />
      )}

      {/* Processing State */}
      {isProcessing && (
        <Card className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing wine list...</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Processing Failed
              </h3>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <div className="flex space-x-3">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
                {onCancel && (
                  <Button
                    onClick={onCancel}
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:bg-red-100"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Success State */}
      {scanResult?.success && scanResult.wines.length > 0 && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-start">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800 mb-3">
                Wine List Processed Successfully
              </h3>
              
              <p className="text-sm text-green-700 mb-4">
                Found {scanResult.wines.length} wines. Here's a preview:
              </p>

              {/* Wine List Preview */}
              <div className="bg-white rounded border p-4 mb-4 max-h-64 overflow-y-auto">
                <div className="space-y-3">
                  {scanResult.wines.slice(0, 5).map((wine, index) => (
                    <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                      <div className="font-medium text-gray-900">{wine.name}</div>
                      {wine.producer && (
                        <div className="text-sm text-gray-600">{wine.producer}</div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {wine.vintage && `${wine.vintage} • `}
                          Confidence: {Math.round(wine.confidence * 100)}%
                        </span>
                        {wine.price && (
                          <span className="font-medium text-gray-900">{wine.price}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {scanResult.wines.length > 5 && (
                    <div className="text-sm text-gray-500 text-center pt-2">
                      ... and {scanResult.wines.length - 5} more wines
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleUseResult}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Get Recommendations
                </Button>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  Scan Another
                </Button>
                {onCancel && (
                  <Button
                    onClick={onCancel}
                    variant="ghost"
                    size="sm"
                    className="text-green-700 hover:bg-green-100"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* No Wines Found State */}
      {scanResult?.success && scanResult.wines.length === 0 && (
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                No Wines Detected
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                We couldn't identify any wines in the image. The text might be unclear or 
                the format might not be recognized.
              </p>
              
              {scanResult.rawText && (
                <div className="bg-white p-3 rounded border text-sm text-gray-700 mb-4 max-h-32 overflow-y-auto">
                  <strong>Extracted text:</strong><br />
                  {scanResult.rawText}
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  Try Again
                </Button>
                {onCancel && (
                  <Button
                    onClick={onCancel}
                    variant="ghost"
                    size="sm"
                    className="text-yellow-700 hover:bg-yellow-100"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Tips for Better Results</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Capture the entire wine section of the menu</li>
          <li>• Ensure good lighting and avoid shadows</li>
          <li>• Hold the camera steady to avoid blur</li>
          <li>• Try to keep the menu flat and avoid glare</li>
          <li>• Include wine names, producers, and prices if visible</li>
        </ul>
      </Card>
    </div>
  )
}