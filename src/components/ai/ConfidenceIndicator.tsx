'use client'

import React from 'react'
import { Icon } from '@/components/ui/Icon'

// ============================================================================
// Types
// ============================================================================

interface ConfidenceIndicatorProps {
  confidence: number // 0-1 scale
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showTooltip?: boolean
  className?: string
}

// ============================================================================
// Confidence Indicator Component
// ============================================================================

export function ConfidenceIndicator({
  confidence,
  size = 'md',
  showLabel = false,
  showTooltip = true,
  className = ''
}: ConfidenceIndicatorProps) {
  // Clamp confidence to 0-1 range
  const clampedConfidence = Math.max(0, Math.min(1, confidence))
  const percentage = Math.round(clampedConfidence * 100)

  // Determine confidence level and styling
  const getConfidenceLevel = (conf: number) => {
    if (conf >= 0.8) return { level: 'high', color: 'green', label: 'High confidence' }
    if (conf >= 0.6) return { level: 'medium', color: 'yellow', label: 'Medium confidence' }
    return { level: 'low', color: 'red', label: 'Low confidence' }
  }

  const { level, color, label } = getConfidenceLevel(clampedConfidence)

  // Size configurations
  const sizeConfig = {
    sm: {
      bar: 'h-1 w-12',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      bar: 'h-2 w-16',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      bar: 'h-3 w-20',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  }

  const config = sizeConfig[size]

  // Color configurations
  const colorConfig: Record<'green' | 'yellow' | 'red', { bg: string; fill: string; text: string; icon: string }> = {
    green: {
      bg: 'bg-green-100',
      fill: 'bg-green-500',
      text: 'text-green-700',
      icon: 'text-green-600'
    },
    yellow: {
      bg: 'bg-yellow-100',
      fill: 'bg-yellow-500',
      text: 'text-yellow-700',
      icon: 'text-yellow-600'
    },
    red: {
      bg: 'bg-red-100',
      fill: 'bg-red-500',
      text: 'text-red-700',
      icon: 'text-red-600'
    }
  }

  const colors = colorConfig[color as 'green' | 'yellow' | 'red']

  const tooltipText = `${label}: ${percentage}% confidence in this recommendation`

  return (
    <div 
      className={`flex items-center space-x-2 ${className}`}
      title={showTooltip ? tooltipText : undefined}
    >
      {/* Confidence Icon */}
      <Icon 
        name={level === 'high' ? 'check-circle' : level === 'medium' ? 'exclamation-circle' : 'help-circle'}
        className={`${config.icon} ${colors.icon}`}
      />

      {/* Confidence Bar */}
      <div className={`${config.bar} ${colors.bg} rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${colors.fill} transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Confidence Label */}
      {showLabel && (
        <span className={`${config.text} ${colors.text} font-medium`}>
          {percentage}%
        </span>
      )}
    </div>
  )
}

// ============================================================================
// Detailed Confidence Display
// ============================================================================

export function DetailedConfidenceIndicator({
  confidence,
  factors,
  className = ''
}: {
  confidence: number
  factors?: Array<{
    name: string
    impact: number // -1 to 1
    description?: string
  }>
  className?: string
}) {
  const { level, color, label } = (() => {
    const clampedConfidence = Math.max(0, Math.min(1, confidence))
    if (clampedConfidence >= 0.8) return { level: 'high', color: 'green', label: 'High confidence' }
    if (clampedConfidence >= 0.6) return { level: 'medium', color: 'yellow', label: 'Medium confidence' }
    return { level: 'low', color: 'red', label: 'Low confidence' }
  })()

  const percentage = Math.round(confidence * 100)

  return (
    <div className={`p-3 bg-gray-50 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Recommendation Confidence</span>
        <ConfidenceIndicator 
          confidence={confidence} 
          size="sm" 
          showLabel 
          showTooltip={false}
        />
      </div>

      <p className="text-xs text-gray-600 mb-3">
        {level === 'high' && 'I am very confident in this recommendation based on your preferences and wine knowledge.'}
        {level === 'medium' && 'This is a good recommendation, though there may be other suitable options.'}
        {level === 'low' && 'This recommendation is based on limited information. Consider it as one option among many.'}
      </p>

      {factors && factors.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-700">Confidence factors:</span>
          {factors.map((factor, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{factor.name}</span>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  factor.impact > 0.5 ? 'bg-green-400' :
                  factor.impact > 0 ? 'bg-yellow-400' :
                  factor.impact > -0.5 ? 'bg-orange-400' : 'bg-red-400'
                }`} />
                <span className={`${
                  factor.impact > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {factor.impact > 0 ? '+' : ''}{Math.round(factor.impact * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Uncertainty Indicator
// ============================================================================

export function UncertaintyIndicator({
  uncertaintyLevel,
  reasons,
  suggestions,
  className = ''
}: {
  uncertaintyLevel: 'low' | 'medium' | 'high'
  reasons?: string[]
  suggestions?: string[]
  className?: string
}) {
  const levelConfig = {
    low: {
      icon: 'information-circle',
      color: 'blue',
      title: 'Some uncertainty',
      description: 'I have most of the information needed for a good recommendation.'
    },
    medium: {
      icon: 'exclamation-triangle',
      color: 'yellow',
      title: 'Moderate uncertainty',
      description: 'Additional information would help me provide better recommendations.'
    },
    high: {
      icon: 'question-mark-circle',
      color: 'red',
      title: 'High uncertainty',
      description: 'I need more information to provide confident recommendations.'
    }
  }

  const config = levelConfig[uncertaintyLevel]

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800'
  }

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[config.color]} ${className}`}>
      <div className="flex items-start space-x-2">
        <Icon name={config.icon} className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium mb-1">{config.title}</h4>
          <p className="text-xs mb-2">{config.description}</p>
          
          {reasons && reasons.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-medium">Why I'm uncertain:</span>
              <ul className="text-xs mt-1 space-y-1">
                {reasons.map((reason, index) => (
                  <li key={index} className="flex items-start space-x-1">
                    <span className="text-gray-400">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {suggestions && suggestions.length > 0 && (
            <div>
              <span className="text-xs font-medium">To improve recommendations:</span>
              <ul className="text-xs mt-1 space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-1">
                    <span className="text-gray-400">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}