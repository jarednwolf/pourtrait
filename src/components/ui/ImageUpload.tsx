'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { PhotoIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import { CameraCapture } from './CameraCapture'
import { CameraCapture as CameraCaptureType } from '@/types'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  onImageCapture?: (capture: CameraCaptureType) => void
  accept?: string[]
  maxSize?: number
  className?: string
  disabled?: boolean
}

export function ImageUpload({
  onImageSelect,
  onImageCapture,
  accept = ['image/jpeg', 'image/png', 'image/webp'],
  maxSize = 10 * 1024 * 1024, // 10MB
  className = '',
  disabled = false
}: ImageUploadProps) {
  const [showCamera, setShowCamera] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setError(`File is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`)
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setError('Invalid file type. Please select a JPEG, PNG, or WebP image.')
      } else {
        setError('Invalid file. Please try again.')
      }
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
      
      // Call the callback
      onImageSelect(file)
    }
  }, [onImageSelect, maxSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false,
    disabled
  })

  const handleCameraCapture = useCallback((capture: CameraCaptureType) => {
    setShowCamera(false)
    setPreview(capture.preview)
    
    if (onImageCapture) {
      onImageCapture(capture)
    } else {
      onImageSelect(capture.file)
    }
  }, [onImageSelect, onImageCapture])

  const clearPreview = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
    setError(null)
  }, [preview])

  // Check if camera is available
  const isCameraAvailable = typeof navigator !== 'undefined' && 
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onCancel={() => setShowCamera(false)}
      />
    )
  }

  return (
    <div className={className}>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
          />
          <Button
            onClick={clearPreview}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
          >
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <PhotoIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          
          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop the image here</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag and drop an image here, or click to select
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports JPEG, PNG, WebP up to {Math.round(maxSize / 1024 / 1024)}MB
              </p>
              
              <div className="flex justify-center space-x-2">
                <Button variant="outline" size="sm" disabled={disabled}>
                  <PhotoIcon className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                
                {isCameraAvailable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCamera(true)
                    }}
                    disabled={disabled}
                  >
                    <CameraIcon className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}