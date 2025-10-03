import * as React from 'react'
import { cn } from '@/lib/design-system/utils'

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: boolean
}

/**
 * Responsive grid component for consistent layouts
 * Mobile-first design with automatic responsive behavior
 */
export function Grid({ 
  className, 
  cols = 1, 
  gap = 'md', 
  responsive = true,
  children, 
  ...props 
}: GridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: responsive ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2',
    3: responsive ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-3',
    4: responsive ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-4',
    6: responsive ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' : 'grid-cols-6',
    12: responsive ? 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-12' : 'grid-cols-12',
  }
  
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }
  
  return (
    <div
      className={cn(
        'grid',
        colClasses[cols],
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: 1 | 2 | 3 | 4 | 6 | 12
  spanSm?: 1 | 2 | 3 | 4 | 6 | 12
  spanLg?: 1 | 2 | 3 | 4 | 6 | 12
}

/**
 * Grid item component with responsive span control
 */
export function GridItem({ 
  className, 
  span, 
  spanSm, 
  spanLg, 
  children, 
  ...props 
}: GridItemProps) {
  const spanClasses = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    6: 'col-span-6',
    12: 'col-span-12',
  }
  
  return (
    <div
      className={cn(
        span && spanClasses[span],
        spanSm && `sm:${spanClasses[spanSm]}`,
        spanLg && `lg:${spanClasses[spanLg]}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}