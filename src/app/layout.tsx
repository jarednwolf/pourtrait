import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}