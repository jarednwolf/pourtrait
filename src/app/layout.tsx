import type { Metadata, Viewport } from 'next'
import { createSSRServerClient } from '@/lib/supabase/clients.server'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { OnboardingRedirect } from '@/components/providers/OnboardingRedirect'
import { BrandHomeLink } from '@/components/layout/BrandHomeLink'
import { HeaderCta } from '@/components/layout/HeaderCta'
import React from 'react'
import { PushOptInBanner } from '@/components/notifications/PushOptInBanner'
import { WebVitalsProvider } from '@/components/providers/WebVitalsProvider'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { SignUpDialog } from '@/components/auth/SignUpDialog'
import { AuthBottomNav } from '@/components/layout/AuthBottomNav'

// Fonts are provided via system fallbacks to avoid build-time fetch failures

export const metadata: Metadata = {
  title: 'Pourtrait - AI Wine Sommelier',
  description: 'Your personal AI-powered wine cellar and sommelier. Each bottle a brushstroke.',
  icons: {
    icon: [
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: ['/icons/icon-32x32.png']
  },
  openGraph: {
    type: 'website',
    siteName: 'Pourtrait',
    title: 'Pourtrait - AI Wine Sommelier',
    description: 'Your personal AI-powered wine cellar and sommelier. Each bottle a brushstroke.',
    images: [
      { url: '/images/og-card.jpg' }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pourtrait - AI Wine Sommelier',
    description: 'Your personal AI-powered wine cellar and sommelier. Each bottle a brushstroke.',
    images: ['/images/og-card.jpg']
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6D28D9' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0B0E' }
  ]
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createSSRServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userData = session ? await supabase.auth.getUser() : null
  const initialUser = userData?.data.user || null
  return (
    <html lang="en">
      <body className="bg-surface text-gray-900 dark:bg-dark-surface dark:text-gray-100">
        {/* Always remove dark class ASAP to prevent FOUC; add SW kill switch via ?sw=off */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  document.documentElement.classList.remove('dark');
                  var params = new URLSearchParams(location.search);
                  var disableSW = params.get('sw') === 'off';
                  var isPreview = ${JSON.stringify(process.env.VERCEL_ENV === 'preview')};
                  var disablePWA = isPreview || ${JSON.stringify(process.env.NEXT_PUBLIC_DISABLE_PWA === 'true')};
                  if ('serviceWorker' in navigator && (disablePWA || disableSW)) {
                    navigator.serviceWorker.getRegistrations().then(function(regs){
                      regs.forEach(function(r){ r.unregister(); });
                    }).then(function(){
                      if (window.caches && caches.keys) {
                        caches.keys().then(function(keys){ keys.forEach(function(k){ caches.delete(k); }); });
                      }
                      // Force a one-time reload to pick up fresh assets
                      if (!sessionStorage.getItem('reloadedAfterSWKill')) {
                        sessionStorage.setItem('reloadedAfterSWKill', '1');
                        location.replace(location.pathname + location.search + location.hash);
                      }
                    });
                  }
                } catch(e) { /* no-op */ }
              })();
            `,
          }}
        />
        <AuthProvider initialSession={session} initialUser={initialUser as any}>
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <header className="border-b border-gray-200 bg-white text-gray-900 dark:bg-dark-surface dark:border-gray-800" role="banner">
            <div className="max-w-6xl mx-auto px-4 h-18 flex items-center justify-between">
              <BrandHomeLink />
              <nav aria-label="Primary navigation" className="flex items-center gap-4">
                <ThemeToggle />
                <HeaderCta />
              </nav>
            </div>
              </header>
              {/* Removed Google Fonts preconnect to ensure offline-safe builds */}
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
          <SignUpDialog />
          <div className="md:hidden"><AuthBottomNav /></div>
        </AuthProvider>
      </body>
    </html>
  )
}