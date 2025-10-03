import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/design-system/utils'
import { buttonVariants, type ButtonVariants } from '@/lib/design-system/variants'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  asChild?: boolean
}

/**
 * Professional button component with consistent styling
 * Follows design system guidelines with no emoji support
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }