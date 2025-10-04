'use client'

import { DrinkingWindow, Wine } from '@/types'
import { DrinkingWindowUtils } from '@/lib/services/drinking-window'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'

interface DrinkingWindowIndicatorProps {
  drinkingWindow: DrinkingWindow
  wine?: Wine
  showDetails?: boolean
  showDataSource?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function DrinkingWindowIndicator({
  drinkingWindow,
  wine,
  showDetails = false,
  showDataSource = false,
  size = 'md',
  className = ''
}: DrinkingWindowIndicatorProps) {
  const statusText = DrinkingWindowUtils.getStatusText(drinkingWindow.currentStatus)
  const statusColor = DrinkingWindowUtils.getStatusColor(drinkingWindow.currentStatus)
  const statusChange = DrinkingWindowUtils.getDaysUntilStatusChange(drinkingWindow)
  const dataSource = wine ? DrinkingWindowUtils.getDrinkingWindowDataSource(wine) : null
  
  const getStatusIcon = (status: DrinkingWindow['currentStatus']) => {
    switch (status) {
      case 'too_young':
        return 'clock'
      case 'ready':
        return 'check-circle'
      case 'peak':
        return 'star'
      case 'declining':
        return 'trending-down'
      case 'over_hill':
        return 'x-circle'
      default:
        return 'help-circle'
    }
  }
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }
  
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Badge 
        variant="secondary" 
        className={`${statusColor} ${sizeClasses[size]} flex items-center gap-1.5 font-medium`}
      >
        <Icon 
          name={getStatusIcon(drinkingWindow.currentStatus)} 
          className={size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-3.5 w-3.5' : 'h-4 w-4'} 
        />
        {statusText}
      </Badge>
      
      {showDetails && (
        <div className="text-xs text-gray-600 space-y-1">
          <div>
            {DrinkingWindowUtils.formatDrinkingWindow(drinkingWindow)}
          </div>
          {statusChange.daysUntil !== null && statusChange.daysUntil > 0 && (
            <div className="text-gray-500">
              {statusChange.description}
            </div>
          )}
          {showDataSource && dataSource && (
            <div className="text-gray-400 flex items-center gap-1">
              <Icon 
                name={dataSource.isExpertData ? 'check-circle' : 'info'} 
                className="h-2.5 w-2.5" 
              />
              <span>{dataSource.source}</span>
              {dataSource.isExpertData && (
                <span className="text-green-600 font-medium">Expert</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface DrinkingWindowTimelineProps {
  drinkingWindow: DrinkingWindow
  className?: string
}

export function DrinkingWindowTimeline({ 
  drinkingWindow, 
  className = '' 
}: DrinkingWindowTimelineProps) {
  const now = new Date()
  const earliest = new Date(drinkingWindow.earliestDate)
  const peakStart = new Date(drinkingWindow.peakStartDate)
  const peakEnd = new Date(drinkingWindow.peakEndDate)
  const latest = new Date(drinkingWindow.latestDate)
  
  // Calculate position percentages
  const totalSpan = latest.getTime() - earliest.getTime()
  const currentPosition = Math.max(0, Math.min(100, 
    ((now.getTime() - earliest.getTime()) / totalSpan) * 100
  ))
  
  const peakStartPercent = ((peakStart.getTime() - earliest.getTime()) / totalSpan) * 100
  const peakEndPercent = ((peakEnd.getTime() - earliest.getTime()) / totalSpan) * 100
  
  return (
    <div className={`w-full ${className}`}>
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        {/* Ready period */}
        <div 
          className="absolute top-0 left-0 h-full bg-green-300"
          style={{ width: `${peakStartPercent}%` }}
        />
        
        {/* Peak period */}
        <div 
          className="absolute top-0 h-full bg-emerald-400"
          style={{ 
            left: `${peakStartPercent}%`,
            width: `${peakEndPercent - peakStartPercent}%`
          }}
        />
        
        {/* Declining period */}
        <div 
          className="absolute top-0 h-full bg-yellow-300"
          style={{ 
            left: `${peakEndPercent}%`,
            width: `${100 - peakEndPercent}%`
          }}
        />
        
        {/* Current position indicator */}
        <div 
          className="absolute top-0 w-0.5 h-full bg-gray-800 z-10"
          style={{ left: `${currentPosition}%` }}
        />
      </div>
      
      {/* Timeline labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{earliest.getFullYear()}</span>
        <span className="font-medium">Peak: {peakStart.getFullYear()}-{peakEnd.getFullYear()}</span>
        <span>{latest.getFullYear()}</span>
      </div>
    </div>
  )
}

interface DrinkingUrgencyBadgeProps {
  urgencyScore: number
  className?: string
}

export function DrinkingUrgencyBadge({ 
  urgencyScore, 
  className = '' 
}: DrinkingUrgencyBadgeProps) {
  const urgency = DrinkingWindowUtils.getUrgencyIndicator(urgencyScore)
  
  if (urgency.level === 'low') {
    return null // Don't show low priority badges
  }
  
  return (
    <Badge 
      variant="secondary"
      className={`${urgency.color} text-xs font-medium ${className}`}
    >
      {urgency.text}
    </Badge>
  )
}