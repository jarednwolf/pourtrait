'use client'

import { useState } from 'react'
import { Wine, Notification } from '@/types'
import { DrinkingWindowService } from '@/lib/services/drinking-window'
// import { NotificationService } from '@/lib/services/notification-service'
import { useDrinkingWindowNotifications } from '@/hooks/useDrinkingWindowNotifications'
import { DrinkingWindowIndicator, DrinkingUrgencyBadge } from './DrinkingWindowIndicator'
// import { WineCard } from './WineCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
// import { Alert } from '@/components/ui/Alert'

interface DrinkingWindowAlertsProps {
  userId: string
  wines: Wine[]
  className?: string
}

export function DrinkingWindowAlerts({ 
  userId, 
  wines, 
  className = '' 
}: DrinkingWindowAlertsProps) {
  const { notifications, loading, markAsRead } = useDrinkingWindowNotifications(userId)
  const [showAll, setShowAll] = useState(false)
  
  // Get wines that need attention
  const winesNeedingAttention = wines
    .map(wine => ({
      wine,
      urgencyScore: DrinkingWindowService.getDrinkingUrgencyScore(wine)
    }))
    .filter(({ urgencyScore }) => urgencyScore >= 40) // Medium priority and above
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
  
  const displayedWines = showAll ? winesNeedingAttention : winesNeedingAttention.slice(0, 3)
  
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    )
  }
  
  if (winesNeedingAttention.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 text-green-700">
          <Icon name="check-circle" size="lg" />
          <div>
            <h3 className="font-medium">All wines are aging well</h3>
            <p className="text-sm text-gray-600">No immediate drinking window alerts</p>
          </div>
        </div>
      </Card>
    )
  }
  
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="alert-triangle" size="lg" className="text-amber-600" />
          <h3 className="text-lg font-semibold">Drinking Window Alerts</h3>
          {winesNeedingAttention.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded-full">
              {winesNeedingAttention.length}
            </span>
          )}
        </div>
        
        {winesNeedingAttention.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-sm"
          >
            {showAll ? 'Show Less' : `Show All (${winesNeedingAttention.length})`}
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        {displayedWines.map(({ wine, urgencyScore }) => (
          <DrinkingWindowAlertItem
            key={wine.id}
            wine={wine}
            urgencyScore={urgencyScore}
          />
        ))}
      </div>
      
      {notifications.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Recent Notifications</h4>
          <div className="space-y-2">
            {notifications.slice(0, 3).map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => markAsRead(notification.id)}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

interface DrinkingWindowAlertItemProps {
  wine: Wine
  urgencyScore: number
}

function DrinkingWindowAlertItem({ wine, urgencyScore }: DrinkingWindowAlertItemProps) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0">
        {wine.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={wine.imageUrl}
            alt={wine.name}
            className="w-12 h-16 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
            <Icon name="wine" className="text-gray-400 h-5 w-5" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-gray-900 truncate">
              {wine.name} ({wine.vintage})
            </h4>
            <p className="text-sm text-gray-600">{wine.producer}</p>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <DrinkingUrgencyBadge urgencyScore={urgencyScore} />
            <DrinkingWindowIndicator drinkingWindow={wine.drinkingWindow} size="sm" />
          </div>
        </div>
        
        <div className="mt-2">
          <DrinkingWindowMessage wine={wine} />
        </div>
      </div>
    </div>
  )
}

interface DrinkingWindowMessageProps {
  wine: Wine
}

function DrinkingWindowMessage({ wine }: DrinkingWindowMessageProps) {
  const { drinkingWindow } = wine
  const now = new Date()
  
  const getMessage = () => {
    switch (drinkingWindow.currentStatus) {
      case 'peak': {
        const daysUntilEnd = Math.ceil(
          (new Date(drinkingWindow.peakEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysUntilEnd <= 30) {
          return `This wine is at its peak but will start declining in ${daysUntilEnd} days. Perfect time to enjoy it!`
        }
        return 'This wine is at its peak drinking window. An excellent time to enjoy it.'
      }
      
      case 'ready': {
        const daysUntilPeak = Math.ceil(
          (new Date(drinkingWindow.peakStartDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return `This wine is ready to drink and will enter its peak window in ${daysUntilPeak} days.`
      }
      
      case 'declining': {
        const daysUntilOver = Math.ceil(
          (new Date(drinkingWindow.latestDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return `This wine is past its peak but still enjoyable. Consider drinking within ${daysUntilOver} days.`
      }
      
      case 'over_hill':
        return 'This wine is past its optimal drinking window. While it may still be drinkable, quality may have declined.'
      
      default:
        return 'Monitor this wine\'s drinking window for optimal enjoyment.'
    }
  }
  
  return (
    <p className="text-sm text-gray-700">
      {getMessage()}
    </p>
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkRead: () => void
}

function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
      <Icon name="bell" size="md" className="text-blue-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-900">{notification.title}</p>
        <p className="text-xs text-blue-700 mt-1">{notification.message}</p>
        <p className="text-xs text-blue-600 mt-1">
          {new Date(notification.createdAt).toLocaleDateString()}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onMarkRead}
        className="text-blue-600 hover:text-blue-800 p-1"
      >
        <Icon name="x" size="sm" />
      </Button>
    </div>
  )
}

interface DrinkingWindowSummaryProps {
  wines: Wine[]
  className?: string
}

export function DrinkingWindowSummary({ wines, className = '' }: DrinkingWindowSummaryProps) {
  const summary = wines.reduce((acc, wine) => {
    const status = wine.drinkingWindow.currentStatus
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const totalWines = wines.length
  
  if (totalWines === 0) {
    return null
  }
  
  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="font-medium text-gray-900 mb-3">Drinking Window Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { status: 'too_young', label: 'Too Young', color: 'text-blue-600 bg-blue-50' },
          { status: 'ready', label: 'Ready', color: 'text-green-600 bg-green-50' },
          { status: 'peak', label: 'At Peak', color: 'text-emerald-600 bg-emerald-50' },
          { status: 'declining', label: 'Declining', color: 'text-yellow-600 bg-yellow-50' },
          { status: 'over_hill', label: 'Past Prime', color: 'text-red-600 bg-red-50' }
        ].map(({ status, label, color }) => {
          const count = summary[status] || 0
          const percentage = totalWines > 0 ? Math.round((count / totalWines) * 100) : 0
          
          return (
            <div key={status} className={`p-3 rounded-lg ${color}`}>
              <div className="text-lg font-semibold">{count}</div>
              <div className="text-xs font-medium">{label}</div>
              <div className="text-xs opacity-75">{percentage}%</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}