'use client'

import React, { useState, useCallback } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { useImageProcessing } from '@/hooks/useImageProcessing'
import { WineRecognitionResult, CameraCapture, WineInput } from '@/types'

interface WineLabelScannerProps {
  onWineDetected: (wineData: Partial<WineInput>) => void
  onCancel?: () => void
  className?: string
}

export function WineLabelScanner({ onWineDetected, onCancel, className = '' }: WineLabelScannerProps) {
  const [scanResult, setScanResult] = useState<WineRecognitionResult | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const { recognizeWineLabel, isProcessing, error, clearError } = useImageProcessing()

  const handleImageSelect = useCallback(async (file: File) => {
    setSelectedImage(file)
    clearError()
    
    try {
      const result = await recognizeWineLabel(file)
      setScanResult(result)
    } catch (err) {
      console.error('Wine recognition failed:', err)
    }
  }, [recognizeWineLabel, clearError])

  const handleCameraCapture = useCallback(async (capture: CameraCapture) => {
    setSelectedImage(capture.file)
    clearError()
    
    try {
      const result = await recognizeWineLabel(capture.file)
      setScanResult(result)
    } catch (err) {
      console.error('Wine recognition failed:', err)
    }
  }, [recognizeWineLabel, clearError])

  const handleUseResult = useCallback(() => {
    if (scanResult?.success && scanResult.extractedData) {
      const wineData: Partial<WineInput> = {
        name: scanResult.extractedData.name || '',
        producer: scanResult.extractedData.producer || '',
        vintage: scanResult.extractedData.vintage,
        region: scanResult.extractedData.region || '',
        varietal: scanResult.extractedData.varietal || [],
        type: scanResult.extractedData.type || 'red',
        quantity: 1
      }
      onWineDetected(wineData)
    }
  }, [scanResult, onWineDetected])

  const handleRetry = useCallback(() => {
    setScanResult(null)
    setSelectedImage(null)
    clearError()
  }, [clearError])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan Wine Label</h2>
        <p className="text-gray-600">
          Take a photo or upload an image of your wine label to automatically extract wine information
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
          <p className="text-gray-600">Analyzing wine label...</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Recognition Failed
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
      {scanResult?.success && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-start">
            <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800 mb-3">
                Wine Information Detected
              </h3>
              
              <div className="space-y-2 mb-4">
                {scanResult.extractedData?.name && (
                  <div>
                    <span className="text-sm font-medium text-green-800">Name: </span>
                    <span className="text-sm text-green-700">{scanResult.extractedData.name}</span>
                  </div>
                )}
                
                {scanResult.extractedData?.producer && (
                  <div>
                    <span className="text-sm font-medium text-green-800">Producer: </span>
                    <span className="text-sm text-green-700">{scanResult.extractedData.producer}</span>
                  </div>
                )}
                
                {scanResult.extractedData?.vintage && (
                  <div>
                    <span className="text-sm font-medium text-green-800">Vintage: </span>
                    <span className="text-sm text-green-700">{scanResult.extractedData.vintage}</span>
                  </div>
                )}
                
                {scanResult.extractedData?.region && (
                  <div>
                    <span className="text-sm font-medium text-green-800">Region: </span>
                    <span className="text-sm text-green-700">{scanResult.extractedData.region}</span>
                  </div>
                )}
                
                {scanResult.extractedData?.varietal && scanResult.extractedData.varietal.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-green-800">Varietal: </span>
                    <span className="text-sm text-green-700">
                      {scanResult.extractedData.varietal.join(', ')}
                    </span>
                  </div>
                )}
                
                <div>
                  <span className="text-sm font-medium text-green-800">Confidence: </span>
                  <span className="text-sm text-green-700">
                    {Math.round(scanResult.confidence * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleUseResult}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Use This Information
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

      {/* Partial Success State */}
      {scanResult?.success === false && scanResult.rawText && (
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                Partial Recognition
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                We detected text but couldn't identify specific wine information. 
                You can manually enter the details using the text below as reference.
              </p>
              
              <div className="bg-white p-3 rounded border text-sm text-gray-700 mb-4 max-h-32 overflow-y-auto">
                {scanResult.rawText}
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => onWineDetected({})}
                  size="sm"
                  variant="outline"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  Enter Manually
                </Button>
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
        <h4 className="text-sm font-medium text-blue-800 mb-2">Tips for Better Recognition</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Ensure the wine label is well-lit and clearly visible</li>
          <li>• Hold the camera steady and avoid blurry images</li>
          <li>• Make sure the entire label fits in the frame</li>
          <li>• Clean the label if it's dusty or has condensation</li>
        </ul>
      </Card>
    </div>
  )
}