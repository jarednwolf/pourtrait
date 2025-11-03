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
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'

// ============================================================================
// Chat Page Component
// ============================================================================

function ChatContent() {
  const search = useSearchParams()
  const initialMessage = useMemo(() => search?.get('prompt') || search?.get('q') || '', [search])
  const shouldAutoSend = useMemo(() => search?.get('autoSend') === 'true' || search?.get('send') === '1', [search])
  const { user } = useAuth()

  useEffect(() => {
    track(user ? 'chat_opened_auth' : 'chat_opened_guest')
  }, [user])

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
        {!user ? (
          <GuestChatTeaser />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col">
              <TasteSummaryHeader />
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
        )}
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

function GuestChatTeaser() {
  const examples = [
    { q: 'I’m cooking salmon tonight', a: 'Try an Oregon Pinot Noir' },
    { q: 'What should I open for pizza?', a: 'A Barbera or Chianti Classico' },
    { q: 'I like crisp whites', a: 'Explore Sancerre or Albariño' }
  ]

  const openSignup = (source?: string) => {
    try {
      if (source) { track('cta_signup_clicked', { source }) }
      window.dispatchEvent(new CustomEvent('open-signup-dialog'))
    } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="overflow-hidden">
        <div className="relative h-48">
          <Image src="/images/hero.jpg" alt="Wine ambience" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent" />
        </div>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900">Ask anything—your personal sommelier</h2>
          <p className="text-sm text-gray-600 mt-1">See how recommendations feel, then create your free account.</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {examples.map((ex, i) => (
              <button key={i} onClick={() => { track('guest_chat_example_click', { index: i, q: ex.q }); openSignup('chat_teaser_example') }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm hover:border-gray-400">
                <div className="font-medium">{ex.q}</div>
                <div className="text-gray-600 text-xs mt-1">{ex.a}</div>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={() => openSignup('chat_teaser_primary')}>Create your free account</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function TasteSummaryHeader() {
  const { user } = useAuth()
  const summary = useMemo(() => {
    const prefs = (user as any)?.profile?.preferences as any
    if (!prefs) { return 'Personalized picks once your profile is set' }
    const tannins = prefs?.tannins ?? 'medium'
    const whites = prefs?.whiteStyle ?? 'crisp'
    return `Loves: ${tannins}-tannin reds, ${whites} whites`
  }, [user])
  return (
    <div className="border-b border-gray-200 p-3 text-sm text-gray-700">
      {summary}
    </div>
  )
}