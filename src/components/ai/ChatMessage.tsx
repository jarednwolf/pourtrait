'use client'

import React, { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { ConfidenceIndicator } from './ConfidenceIndicator'

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  confidence?: number
  timestamp?: Date
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
  validationPassed?: boolean
}

interface ChatMessageProps {
  message: ChatMessage
  showConfidence?: boolean
  onFeedback?: (messageId: string, feedback: 'helpful' | 'not_helpful') => void
}

// ============================================================================
// Chat Message Component
// ============================================================================

export function ChatMessage({ 
  message, 
  showConfidence = false,
  onFeedback 
}: ChatMessageProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not_helpful' | null>(null)
  const [showFullMessage, setShowFullMessage] = useState(false)

  const isUser = message.role === 'user'
  const isLongMessage = message.content.length > 500

  // Handle feedback submission
  const handleFeedback = (feedback: 'helpful' | 'not_helpful') => {
    if (message.id && onFeedback) {
      onFeedback(message.id, feedback)
      setFeedbackGiven(feedback)
    }
  }

  // Format message content with proper line breaks
  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ))
  }

  // Truncate long messages
  const displayContent = isLongMessage && !showFullMessage 
    ? message.content.substring(0, 500) + '...'
    : message.content

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-purple-100 text-purple-600'
          }`}>
            <Icon 
              name={isUser ? 'user' : 'sparkles'} 
              className="w-4 h-4" 
            />
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div className={`rounded-lg px-4 py-3 max-w-full ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900 border border-gray-200'
          }`}>
            {/* Validation Warning */}
            {!isUser && message.validationPassed === false && (
              <div className="flex items-center space-x-2 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                <Icon name="exclamation-triangle" className="w-4 h-4" />
                <span>This response may need refinement</span>
              </div>
            )}

            {/* Message Text */}
            <div className="prose prose-sm max-w-none">
              {formatContent(displayContent)}
            </div>

            {/* Show More/Less Button */}
            {isLongMessage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullMessage(!showFullMessage)}
                className={`mt-2 text-xs ${
                  isUser ? 'text-blue-100 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {showFullMessage ? 'Show less' : 'Show more'}
              </Button>
            )}
          </div>

          {/* Message Metadata */}
          <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 ${
            isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
          }`}>
            {/* Timestamp */}
            {message.timestamp && (
              <span>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}

            {/* Confidence Indicator */}
            {!isUser && showConfidence && message.confidence !== undefined && (
              <ConfidenceIndicator 
                confidence={message.confidence}
                size="sm"
              />
            )}

            {/* Experience Level Badge */}
            {!isUser && message.experienceLevel && (
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                {message.experienceLevel}
              </span>
            )}
          </div>

          {/* Feedback Buttons */}
          {!isUser && message.id && (
            <div className="flex items-center space-x-1 mt-2">
              {feedbackGiven ? (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Icon 
                    name={feedbackGiven === 'helpful' ? 'hand-thumb-up' : 'hand-thumb-down'} 
                    className="w-3 h-3" 
                  />
                  <span>Thank you for your feedback</span>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback('helpful')}
                    className="text-gray-400 hover:text-green-600 p-1"
                    title="This was helpful"
                  >
                    <Icon name="hand-thumb-up" className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback('not_helpful')}
                    className="text-gray-400 hover:text-red-600 p-1"
                    title="This was not helpful"
                  >
                    <Icon name="hand-thumb-down" className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// System Message Component (for notifications, etc.)
// ============================================================================

export function SystemMessage({ 
  content, 
  type = 'info' 
}: { 
  content: string
  type?: 'info' | 'warning' | 'error' | 'success'
}) {
  const typeStyles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200'
  }

  const typeIcons = {
    info: 'information-circle',
    warning: 'exclamation-triangle',
    error: 'x-circle',
    success: 'check-circle'
  }

  return (
    <div className="flex justify-center mb-4">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm ${typeStyles[type]}`}>
        <Icon name={typeIcons[type]} className="w-4 h-4" />
        <span>{content}</span>
      </div>
    </div>
  )
}

// ============================================================================
// Message Loading Skeleton
// ============================================================================

export function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar Skeleton */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        </div>

        {/* Message Skeleton */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className="bg-gray-200 rounded-lg px-4 py-3 animate-pulse">
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-48" />
              <div className="h-4 bg-gray-300 rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}