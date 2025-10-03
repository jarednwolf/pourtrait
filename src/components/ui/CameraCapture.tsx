'use client'

import React, { useRef, useState, useCallback } from 'react'
import { CameraIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import { CameraCapture as CameraCaptureType } from '@/types'

interface CameraCaptureProps {
  onCapture: (capture: CameraCaptureType) => void
  onCancel: () => void
  className?: string
}

export function CameraCapture({ onCapture, onCancel, className = '' }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      // Request camera access with optimal settings for wine label scanning
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
        setStream(mediaStream)
        setIsStreaming(true)
      }
    } catch (err) {
      console.error('Camera access failed:', err)
      setError('Unable to access camera. Please check permissions and try again.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsStreaming(false)
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob and create preview URL
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `wine-label-${Date.now()}.jpg`, { type: 'image/jpeg' })
        const preview = URL.createObjectURL(blob)
        
        setCapturedImage(preview)
        stopCamera()
      }
    }, 'image/jpeg', 0.9)
  }, [stopCamera])

  const confirmCapture = useCallback(() => {
    if (!capturedImage || !canvasRef.current) return

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `wine-label-${Date.now()}.jpg`, { type: 'image/jpeg' })
        const capture: CameraCaptureType = {
          file,
          preview: capturedImage,
          timestamp: new Date()
        }
        onCapture(capture)
      }
    }, 'image/jpeg', 0.9)
  }, [capturedImage, onCapture])

  const retakePhoto = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
      setCapturedImage(null)
    }
    startCamera()
  }, [capturedImage, startCamera])

  const handleCancel = useCallback(() => {
    stopCamera()
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
    onCancel()
  }, [stopCamera, capturedImage, onCancel])

  // Start camera when component mounts
  React.useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`fixed inset-0 z-50 bg-black ${className}`}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <h2 className="text-lg font-semibold">
            {capturedImage ? 'Review Photo' : 'Scan Wine Label'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-white hover:bg-white/10"
          >
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Camera/Preview Area */}
        <div className="flex-1 relative overflow-hidden">
          {error ? (
            <div className="flex h-full items-center justify-center p-4">
              <div className="text-center text-white">
                <p className="mb-4">{error}</p>
                <Button onClick={startCamera} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured wine label"
              className="h-full w-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                muted
              />
              
              {/* Camera overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white/50 rounded-lg w-80 h-48 flex items-center justify-center">
                  <div className="text-white/70 text-center">
                    <CameraIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Position wine label in frame</p>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-6 bg-black/50">
          {capturedImage ? (
            <div className="flex justify-center space-x-4">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-black"
              >
                Retake
              </Button>
              <Button
                onClick={confirmCapture}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                Use Photo
              </Button>
            </div>
          ) : isStreaming ? (
            <div className="flex justify-center">
              <Button
                onClick={capturePhoto}
                size="lg"
                className="rounded-full w-16 h-16 bg-white hover:bg-gray-100 text-black p-0"
              >
                <div className="w-12 h-12 rounded-full border-2 border-black" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button
                onClick={startCamera}
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-black"
              >
                <CameraIcon className="h-5 w-5 mr-2" />
                Start Camera
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}