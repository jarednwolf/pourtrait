import * as React from 'react'
import { cn } from '@/lib/design-system/utils'
import { badgeVariants, type BadgeVariants } from '@/lib/design-system/variants'

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    BadgeVariants {}

/**
 * Professional badge component for status indicators
 * Used for wine categories, drinking windows, and other status displays
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }