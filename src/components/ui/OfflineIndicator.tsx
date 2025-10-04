/**
 * Offline Status Indicator Component
 * 
 * Shows the current network status and provides feedback about offline capabilities
 * and pending sync operations.
 */

'use client'

import { useState, useEffect } from 'react'
import { usePWA } from '@/hooks/usePWA'
import { Icon } from './Icon'
import { Button } from './Button'

interface OfflineIndicatorProps {
  className?: string
  showSyncStatus?: boolean
  onSyncRequested?: () => void
}

export function OfflineIndicator({ 
  className = '', 
  showSyncStatus = true,
  onSyncRequested 
}: OfflineIndicatorProps) {
  const { isOnline } = usePWA()
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)
  const [hasPendingSync] = useState(false)

  // Show offline message when going offline
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowOfflineMessage(false)
      }, 5000)
      return () => clearTimeout(timer)
    } else {
      setShowOfflineMessage(false)
    }
  }, [isOnline])

  // Check for pending sync operations (this would integrate with your sync service)
  useEffect(() => {
    // This would check your offline cache service for pending operations
    // For now, we'll simulate it
    const checkPendingSync = () => {
      // setHasPendingSync(offlineCacheService.hasPendingOperations())
    }
    
    checkPendingSync()
    const interval = setInterval(checkPendingSync, 5000)
    return () => clearInterval(interval)
  }, [])

  if (isOnline && !hasPendingSync) return null

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-40 ${className}`}>
      {/* Offline Status */}
      {!isOnline && (
        <div className={`
          flex items-center gap-2 px-4 py-2 bg-amber-100 border border-amber-300 rounded-lg shadow-sm
          transition-all duration-300 ${showOfflineMessage ? 'opacity-100 translate-y-0' : 'opacity-75 -translate-y-1'}
        `}>
          <Icon name="wifi-slash" className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            You're offline
          </span>
          <span className="text-xs text-amber-600">
            Changes will sync when reconnected
          </span>
        </div>
      )}

      {/* Sync Status */}
      {isOnline && hasPendingSync && showSyncStatus && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-300 rounded-lg shadow-sm">
          <Icon name="arrow-path" className="h-4 w-4 text-blue-600 animate-spin" />
          <span className="text-sm font-medium text-blue-800">
            Syncing changes...
          </span>
          {onSyncRequested && (
            <Button
              onClick={onSyncRequested}
              size="sm"
              variant="outline"
              className="ml-2 h-6 px-2 text-xs"
            >
              Retry
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Compact version for status bars
export function OfflineStatusBadge({ className = '' }: { className?: string }) {
  const { isOnline } = usePWA()

  if (isOnline) {
    return null
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs ${className}`}>
      <Icon name="wifi-slash" className="h-3 w-3" />
      <span>Offline</span>
    </div>
  )
}

// Network status hook for other components
export function useNetworkStatus() {
  const { isOnline } = usePWA()
  const [connectionType, setConnectionType] = useState<string>('unknown')

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection?.effectiveType || 'unknown')

      const handleConnectionChange = () => {
        setConnectionType(connection?.effectiveType || 'unknown')
      }

      connection?.addEventListener('change', handleConnectionChange)
      return () => {
        connection?.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [])

  return {
    isOnline,
    connectionType,
    isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g',
  }
}