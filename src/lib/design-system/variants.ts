import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Button component variants using class-variance-authority
 * Provides consistent styling across all button components
 */
export const buttonVariants = cva(
  // Base styles applied to all buttons
  'btn inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_a]:no-underline',
  {
    variants: {
      variant: {
        primary: 'bg-primary hover:bg-primary-600 focus-visible:ring-primary-600',
        secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-primary-600',
        outline: 'border border-primary text-primary hover:bg-primary/10 focus-visible:ring-primary-600',
        ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
        link: 'text-primary underline-offset-4 hover:underline focus-visible:ring-primary-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

/**
 * Card component variants for consistent container styling
 */
export const cardVariants = cva(
  'rounded-lg bg-white shadow-sm ring-1 ring-gray-200 dark:bg-dark-surface dark:ring-gray-800',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      shadow: {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
      },
    },
    defaultVariants: {
      padding: 'md',
      shadow: 'sm',
    },
  }
)

/**
 * Input component variants for form elements
 */
export const inputVariants = cva(
  'flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      state: {
        default: 'border-gray-300',
        error: 'border-red-500 focus-visible:ring-red-500',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  }
)

/**
 * Badge component variants for status indicators
 */
export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-gray-100 text-gray-600',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800',
        wine: 'bg-wine-100 text-wine-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

/**
 * Alert component variants for notifications and messages
 */
export const alertVariants = cva(
  'relative w-full rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'bg-white border-gray-200 text-gray-900',
        info: 'bg-blue-50 border-blue-200 text-blue-900',
        success: 'bg-green-50 border-green-200 text-green-900',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        error: 'bg-red-50 border-red-200 text-red-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// Export types for component props
export type ButtonVariants = VariantProps<typeof buttonVariants>
export type CardVariants = VariantProps<typeof cardVariants>
export type InputVariants = VariantProps<typeof inputVariants>
export type BadgeVariants = VariantProps<typeof badgeVariants>
export type AlertVariants = VariantProps<typeof alertVariants>