/**
 * PWA Install Prompt Component
 * 
 * Provides a user-friendly interface for installing the Pourtrait PWA
 * with proper timing and user experience considerations.
 */

'use client'

import { useState, useEffect } from 'react'
import { usePWA } from '@/hooks/usePWA'
import { Button } from './Button'
import { Card } from './Card'
import { Icon } from './Icon'

interface PWAInstallPromptProps {
  className?: string
  onInstall?: () => void
  onDismiss?: () => void
}

export function PWAInstallPrompt({ 
  className = '', 
  onInstall, 
  onDismiss 
}: PWAInstallPromptProps) {
  const { canInstall, isStandalone, promptInstall } = usePWA()
  const [isDismissed, setIsDismissed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  // Show prompt after a delay to avoid interrupting initial user experience
  useEffect(() => {
    if (canInstall && !isStandalone && !isDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000) // Show after 3 seconds

      return () => clearTimeout(timer)
    }
  }, [canInstall, isStandalone, isDismissed])

  // Don't show if already installed or dismissed
  if (!showPrompt || isStandalone || isDismissed) {
    return null
  }

  const handleInstall = async () => {
    try {
      const installed = await promptInstall()
      if (installed) {
        onInstall?.()
      }
    } catch (error) {
      console.error('Error installing PWA:', error)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    setShowPrompt(false)
    onDismiss?.()
  }

  return (
    <Card className={`fixed bottom-4 left-4 right-4 z-50 border-wine-600 bg-white shadow-lg md:left-auto md:right-4 md:w-96 ${className}`}>
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0">
          <Icon 
            name="device-phone-mobile" 
            className="h-6 w-6 text-wine-600" 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">
            Install Pourtrait
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Add Pourtrait to your home screen for quick access to your wine collection and AI sommelier.
          </p>
          
          <div className="mt-3 flex gap-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="bg-wine-600 hover:bg-wine-700"
            >
              Install App
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
            >
              Not Now
            </Button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss install prompt"
        >
          <Icon name="x-mark" className="h-5 w-5" />
        </button>
      </div>
    </Card>
  )
}

// Compact version for header/navigation
export function PWAInstallButton({ className = '' }: { className?: string }) {
  const { canInstall, isStandalone, promptInstall } = usePWA()

  if (!canInstall || isStandalone) {
    return null
  }

  const handleInstall = async () => {
    try {
      await promptInstall()
    } catch (error) {
      console.error('Error installing PWA:', error)
    }
  }

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className={`gap-2 ${className}`}
    >
      <Icon name="arrow-down-tray" className="h-4 w-4" />
      Install App
    </Button>
  )
}