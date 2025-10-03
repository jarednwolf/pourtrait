import * as React from 'react'
import { cn } from '@/lib/design-system/utils'
import { inputVariants, type InputVariants } from '@/lib/design-system/variants'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    InputVariants {}

/**
 * Professional input component with consistent styling
 * Supports various states and sizes for form consistency
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, state, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ size, state, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }