import * as React from 'react'
import { cn } from '@/lib/design-system/utils'
import { Container } from './Container'

export interface AppShellProps {
  children: React.ReactNode
  header?: React.ReactNode
  sidebar?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

/**
 * Main application shell component
 * Provides consistent layout structure optimized for mobile-first design
 */
export function AppShell({ 
  children, 
  header, 
  sidebar, 
  footer, 
  className 
}: AppShellProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          {header}
        </header>
      )}
      
      {/* Main content area */}
      <div className="flex flex-1">
        {/* Sidebar - hidden on mobile, shown on desktop */}
        {sidebar && (
          <aside className="hidden w-64 border-r border-gray-200 bg-white lg:block">
            <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
              {sidebar}
            </div>
          </aside>
        )}
        
        {/* Main content */}
        <main className="flex-1">
          <Container className="py-6">
            {children}
          </Container>
        </main>
      </div>
      
      {/* Footer */}
      {footer && (
        <footer className="border-t border-gray-200 bg-white">
          {footer}
        </footer>
      )}
    </div>
  )
}

/**
 * Mobile-optimized header component
 */
export interface HeaderProps {
  title?: string
  children?: React.ReactNode
  className?: string
}

export function Header({ title, children, className }: HeaderProps) {
  return (
    <Container className={cn('flex h-16 items-center justify-between', className)}>
      {title && (
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      )}
      {children}
    </Container>
  )
}

/**
 * Mobile bottom navigation component
 */
export interface BottomNavigationProps {
  children: React.ReactNode
  className?: string
}

export function BottomNavigation({ children, className }: BottomNavigationProps) {
  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 lg:hidden',
      className
    )}>
      <div className="flex h-16 items-center justify-around px-4">
        {children}
      </div>
    </nav>
  )
}