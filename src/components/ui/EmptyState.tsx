'use client'

import React from 'react'
import { Card, CardContent } from './Card'
import { Icon } from './Icon'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
  'aria-label'?: string
}

export function EmptyState({
  icon = 'info',
  title,
  description,
  children,
  className = '',
  'aria-label': ariaLabel
}: EmptyStateProps) {
  return (
    <Card className={className} aria-label={ariaLabel || 'Empty state'}>
      <CardContent className="p-8 text-center">
        <Icon name={icon} className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        {description && (
          <p className="text-gray-600 mb-4">{description}</p>
        )}
        {children && (
          <div className="flex flex-wrap gap-2 justify-center" aria-label="Actions">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


