import * as React from 'react'
import { cn } from '@/lib/design-system/utils'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  center?: boolean
}

/**
 * Responsive container component optimized for Vercel deployment
 * Provides consistent max-widths and centering across breakpoints
 */
export function Container({ 
  className, 
  size = 'lg', 
  center = true, 
  children, 
  ...props 
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full',
  }
  
  return (
    <div
      className={cn(
        'w-full px-4 sm:px-6 lg:px-8',
        sizeClasses[size],
        center && 'mx-auto',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}