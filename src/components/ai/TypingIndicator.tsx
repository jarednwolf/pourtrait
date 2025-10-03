'use client'

import React from 'react'
import { Icon } from '@/components/ui/Icon'

// ============================================================================
// Typing Indicator Component
// ============================================================================

export function TypingIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-start mb-4 ${className}`}>
      <div className="flex max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
            <Icon name="sparkles" className="w-4 h-4" />
          </div>
        </div>

        {/* Typing Animation */}
        <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-600 mr-2">AI Sommelier is thinking</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Processing Indicator (for longer operations)
// ============================================================================

export function ProcessingIndicator({ 
  message = "Analyzing your request...",
  className = '' 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <div className={`flex justify-start mb-4 ${className}`}>
      <div className="flex max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
            <Icon name="sparkles" className="w-4 h-4 animate-pulse" />
          </div>
        </div>

        {/* Processing Message */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
              <div className="w-1 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
            </div>
            <span className="text-sm text-purple-700">{message}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Streaming Indicator (for real-time responses)
// ============================================================================

export function StreamingIndicator({ 
  partialContent = "",
  className = '' 
}: { 
  partialContent?: string
  className?: string 
}) {
  return (
    <div className={`flex justify-start mb-4 ${className}`}>
      <div className="flex max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
            <Icon name="sparkles" className="w-4 h-4" />
          </div>
        </div>

        {/* Streaming Content */}
        <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 min-w-0 flex-1">
          <div className="prose prose-sm max-w-none">
            {partialContent && (
              <span className="text-gray-900">{partialContent}</span>
            )}
            <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Error Recovery Indicator
// ============================================================================

export function ErrorRecoveryIndicator({ 
  className = '' 
}: { 
  className?: string 
}) {
  return (
    <div className={`flex justify-start mb-4 ${className}`}>
      <div className="flex max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <Icon name="exclamation-triangle" className="w-4 h-4" />
          </div>
        </div>

        {/* Error Recovery Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <div className="flex items-center space-x-2">
            <Icon name="arrow-path" className="w-4 h-4 text-red-600 animate-spin" />
            <span className="text-sm text-red-700">
              Something went wrong. Let me try again...
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Custom Typing Animation Styles
// ============================================================================

export const typingAnimationStyles = `
  @keyframes typing-dot {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-10px);
      opacity: 1;
    }
  }
  
  .typing-dot-1 {
    animation: typing-dot 1.4s infinite ease-in-out;
    animation-delay: 0s;
  }
  
  .typing-dot-2 {
    animation: typing-dot 1.4s infinite ease-in-out;
    animation-delay: 0.2s;
  }
  
  .typing-dot-3 {
    animation: typing-dot 1.4s infinite ease-in-out;
    animation-delay: 0.4s;
  }
`

// ============================================================================
// Enhanced Typing Indicator with Custom Animation
// ============================================================================

export function EnhancedTypingIndicator({ 
  message = "AI Sommelier is crafting your recommendation...",
  showProgress = false,
  progress = 0,
  className = '' 
}: { 
  message?: string
  showProgress?: boolean
  progress?: number
  className?: string 
}) {
  return (
    <div className={`flex justify-start mb-4 ${className}`}>
      <div className="flex max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center">
            <Icon name="sparkles" className="w-4 h-4 animate-pulse" />
          </div>
        </div>

        {/* Enhanced Typing Content */}
        <div className="bg-gradient-to-r from-gray-50 to-purple-50 border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
          <div className="flex items-center space-x-3">
            {/* Custom Typing Dots */}
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot-1" />
              <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot-2" />
              <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot-3" />
            </div>
            
            <div className="flex-1">
              <span className="text-sm text-gray-700">{message}</span>
              
              {/* Progress Bar */}
              {showProgress && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-purple-500 h-1 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Inject custom styles */}
      <style jsx>{typingAnimationStyles}</style>
    </div>
  )
}