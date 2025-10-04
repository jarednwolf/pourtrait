import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

export const metadata: Metadata = {
  title: 'Pourtrait - AI Wine Sommelier',
  description: 'Your personal AI-powered wine cellar and sommelier',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <header className="border-b border-gray-200 bg-white">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
              <a href="/" className="flex items-center font-semibold text-gray-900" aria-label="Go to home">
                <Icon name="wine" className="w-5 h-5 mr-2 text-purple-600" aria-hidden="true" />
                Pourtrait
              </a>
              <nav aria-label="Primary">
                <Button asChild size="sm">
                  <a href="/chat" aria-label="Ask the Sommelier" onClick={() => track('nav_chat_click')}>
                    Ask the Sommelier
                    <Icon name="arrow-right" className="w-4 h-4 ml-2" aria-hidden="true" />
                  </a>
                </Button>
              </nav>
            </div>
          </header>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}