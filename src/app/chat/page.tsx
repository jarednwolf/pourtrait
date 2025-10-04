'use client'

import React, { useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChatInterface } from '@/components/ai/ChatInterface'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

// ============================================================================
// Chat Page Component
// ============================================================================

export default function ChatPage() {
  const search = useSearchParams()
  const initialMessage = useMemo(() => search?.get('prompt') || search?.get('q') || '', [search])
  const shouldAutoSend = useMemo(() => search?.get('autoSend') === 'true' || search?.get('send') === '1', [search])

  useEffect(() => {
    if (initialMessage) {
      track('chat_prompt_sent', { source: 'prefill', autoSend: shouldAutoSend ? 1 : 0 })
    }
  }, [initialMessage, shouldAutoSend])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <Icon name="star" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Sommelier Chat</h1>
              <p className="text-gray-600">
                Get personalized wine recommendations and expert advice
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col">
              <ChatInterface 
                className="flex-1"
                maxHeight="600px"
                showSuggestions={true}
                initialMessage={initialMessage}
                autoSend={shouldAutoSend}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tips Card */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Icon name="info" className="w-5 h-5 mr-2 text-yellow-500" />
                Chat Tips
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <Icon name="wine" className="w-4 h-4 mt-0.5 text-purple-500" />
                  <span>Ask about specific wines in your collection</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Icon name="wine" className="w-4 h-4 mt-0.5 text-purple-500" />
                  <span>Request food pairing suggestions</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Icon name="plus" className="w-4 h-4 mt-0.5 text-purple-500" />
                  <span>Get recommendations for new purchases</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Icon name="document" className="w-4 h-4 mt-0.5 text-purple-500" />
                  <span>Learn about wine regions and styles</span>
                </div>
              </div>
            </Card>

            {/* Example Questions */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Icon name="info" className="w-5 h-5 mr-2 text-blue-500" />
                Example Questions
              </h3>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  &quot;What should I drink with grilled salmon tonight?&quot;
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  &quot;Recommend a wine under $25 for a dinner party&quot;
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  &quot;Explain the difference between Burgundy and Bordeaux&quot;
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  &quot;Which wines in my cellar are ready to drink?&quot;
                </div>
              </div>
            </Card>

            {/* Features */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Icon name="star" className="w-5 h-5 mr-2 text-green-500" />
                AI Features
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Icon name="check" className="w-4 h-4 text-green-500" />
                  <span>Personalized recommendations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="check" className="w-4 h-4 text-green-500" />
                  <span>Experience-appropriate responses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="check" className="w-4 h-4 text-green-500" />
                  <span>Confidence indicators</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="check" className="w-4 h-4 text-green-500" />
                  <span>Conversation memory</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="check" className="w-4 h-4 text-green-500" />
                  <span>Professional sommelier tone</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}