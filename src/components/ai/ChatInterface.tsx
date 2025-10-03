'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAIChat } from '@/hooks/useAIRecommendations'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAsyncOperation } from '@/hooks/useAsyncOperation'
import { AppError } from '@/lib/errors'

// ============================================================================
// Types
// ============================================================================

interface ChatInterfaceProps {
  className?: string
  initialMessage?: string
  showSuggestions?: boolean
  maxHeight?: string
}



// ============================================================================
// Chat Interface Component
// ============================================================================

export function ChatInterface({
  className = '',
  initialMessage,
  showSuggestions = true,
  maxHeight = '600px'
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState(initialMessage || '')
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
    isAuthenticated
  } = useAIChat({ maxMessages: 50 })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || loading) {
      return
    }

    const message = inputMessage.trim()
    setInputMessage('')
    
    try {
      await sendMessage(message)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: string) => {
    setInputMessage(suggestion)
    // Always send the message when a suggestion is selected
    await sendMessage(suggestion)
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    } else if (e.key === 'Escape') {
      setIsExpanded(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <Icon name="user" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Sign in to chat with your AI sommelier</h3>
        <p className="text-gray-600 mb-4">
          Get personalized wine recommendations and expert advice tailored to your taste profile.
        </p>
        <Button variant="primary" onClick={() => window.location.href = '/auth/signin'}>
          Sign In
        </Button>
      </Card>
    )
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Icon name="star" className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="font-semibold text-gray-900">AI Sommelier</h3>
            <p className="text-sm text-gray-500">
              Your personal wine expert
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-gray-500 hover:text-gray-700"
            >
              <Icon name="trash" className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Icon 
              name={isExpanded ? "chevron-down" : "chevron-up"} 
              className="w-4 h-4" 
            />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: isExpanded ? maxHeight : '300px' }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="star" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to your AI Sommelier
            </h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Ask me anything about wine! I can help you choose what to drink tonight, 
              suggest food pairings, or recommend new wines to try.
            </p>
            
            {showSuggestions && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">
                  Try asking me about:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "What should I drink tonight?",
                    "Recommend a wine for dinner",
                    "What pairs with salmon?",
                    "Suggest a wine under $30"
                  ].map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="justify-start text-left h-auto p-3 hover:bg-purple-50 hover:border-purple-200 transition-colors text-sm"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.content}
                  {message.confidence && (
                    <div className="text-xs mt-1 opacity-75">
                      Confidence: {Math.round(message.confidence * 100)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Icon name="loader" className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">AI Sommelier is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <div className="flex items-center space-x-2 text-red-700">
            <Icon name="warning" className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about wine recommendations, pairings, or anything wine-related..."
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <Button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="px-4"
          >
            {loading ? (
              <Icon name="loader" className="w-4 h-4 animate-spin" />
            ) : (
              <Icon name="arrow-right" className="w-4 h-4" />
            )}
          </Button>
        </form>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{inputMessage.length}/2000</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Compact Chat Interface (for sidebars, etc.)
// ============================================================================

export function CompactChatInterface({ className = '' }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg ${className}`}
        variant="primary"
      >
        <Icon name="star" className="w-6 h-6" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="font-semibold text-gray-900">AI Sommelier</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Icon name="x" className="w-4 h-4" />
        </Button>
      </div>
      
      <ChatInterface 
        className="h-full"
        maxHeight="400px"
        showSuggestions={false}
      />
    </div>
  )
}