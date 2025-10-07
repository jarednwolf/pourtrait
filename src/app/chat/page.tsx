'use client'
export const dynamic = 'force-dynamic'

import React, { Suspense, useEffect, useMemo } from 'react'
import nextDynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { ChatInterface } from '@/components/ai/ChatInterface'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'
const ChatSidebar = nextDynamic(() => import('@/components/ai/ChatSidebar').then(m => m.ChatSidebar), {
  ssr: false,
  loading: () => <div className="h-64 rounded-md bg-gray-100 animate-pulse" aria-hidden="true" />
})
import { Button } from '@/components/ui/Button'

// ============================================================================
// Chat Page Component
// ============================================================================

function ChatContent() {
  const search = useSearchParams()
  const initialMessage = useMemo(() => search?.get('prompt') || search?.get('q') || '', [search])
  const shouldAutoSend = useMemo(() => search?.get('autoSend') === 'true' || search?.get('send') === '1', [search])

  useEffect(() => {
    track('chat_opened')
  }, [])

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
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
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
      <div className="max-w-5xl mx-auto px-4 py-8">
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
            <ChatSidebar />
            <div>
              <Button asChild onClick={() => track('complete_profile_cta_clicked', { source: 'chat' })}>
                <a href="/onboarding/step1" aria-label="Complete your profile">Complete your profile</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <ChatContent />
    </Suspense>
  )
}