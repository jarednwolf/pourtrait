import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ErrorProvider } from '@/components/providers/ErrorProvider'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { PWAInstallPrompt } from '@/components/ui/PWAInstallPrompt'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pourtrait - AI Wine Sommelier',
  description: 'Your personal AI-powered wine cellar and sommelier. Every bottle a brushstroke.',
  keywords: ['wine', 'sommelier', 'AI', 'cellar', 'recommendations'],
  authors: [{ name: 'Pourtrait Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pourtrait',
  },
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
  formatDetection: {
    telephone: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6D28D9' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0B0E' }
  ],
  openGraph: {
    type: 'website',
    siteName: 'Pourtrait',
    title: 'Pourtrait - AI Wine Sommelier',
    description: 'Your personal AI-powered wine cellar and sommelier. Every bottle a brushstroke.',
    images: [
      { url: '/images/og-card.jpg' }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pourtrait - AI Wine Sommelier',
    description: 'Your personal AI-powered wine cellar and sommelier. Every bottle a brushstroke.',
    images: ['/images/og-card.jpg']
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#7c2d12',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <ErrorProvider>
            <AuthProvider>
              {children}
              <OfflineIndicator />
              <PWAInstallPrompt />
            </AuthProvider>
          </ErrorProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}