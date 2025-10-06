import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { OnboardingRedirect } from '@/components/providers/OnboardingRedirect'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Inter, Playfair_Display } from 'next/font/google'
import React from 'react'
import { PushOptInBanner } from '@/components/notifications/PushOptInBanner'
import { WebVitalsProvider } from '@/components/providers/WebVitalsProvider'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'Pourtrait - AI Wine Sommelier',
  description: 'Your personal AI-powered wine cellar and sommelier. Each bottle a brushstroke.',
  icons: {
    icon: '/favicon.svg'
  },
  openGraph: {
    type: 'website',
    siteName: 'Pourtrait',
    title: 'Pourtrait - AI Wine Sommelier',
    description: 'Your personal AI-powered wine cellar and sommelier. Each bottle a brushstroke.',
    images: [
      { url: '/images/hero.jpg' }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pourtrait - AI Wine Sommelier',
    description: 'Your personal AI-powered wine cellar and sommelier. Each bottle a brushstroke.',
    images: ['/images/hero.jpg']
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-surface text-gray-900">
        <AuthProvider>
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <header className="border-b border-gray-200 bg-white text-gray-900" role="banner">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              <a href="/" className="flex items-center" aria-label="Pourtrait home">
                <img src="/branding/wordmark.svg" alt="Pourtrait" className="h-7 sm:h-8 w-auto" />
              </a>
              <nav aria-label="Primary navigation">
                <Button asChild size="sm">
                  <a href="/chat" aria-label="Ask the Sommelier">
                    Ask the Sommelier
                    <Icon name="arrow-right" className="w-4 h-4 ml-2" aria-hidden="true" />
                  </a>
                </Button>
              </nav>
            </div>
              </header>
              {/* Preconnects for critical third-parties */}
              <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
              {/* Preconnect to Supabase for faster initial auth/db calls. Use env if available. */}
              {process.env.NEXT_PUBLIC_SUPABASE_URL && (
                <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
              )}
          <PushOptInBanner />
          <OnboardingRedirect />
          <main id="main-content" tabIndex={-1} role="main">
            {children}
          </main>
          <WebVitalsProvider />
        </AuthProvider>
      </body>
    </html>
  )
}