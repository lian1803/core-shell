import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md',
        outline: 'border border-border bg-surface text-text-primary hover:bg-background hover:border-primary/30 hover:text-primary',
        ghost: 'text-text-secondary hover:bg-background hover:text-text-primary',
        destructive: 'bg-destructive text-white hover:bg-red-600 shadow-sm',
        success: 'bg-accent text-white hover:bg-emerald-600 shadow-sm',
      },
      size: {
        sm: 'h-9 px-3.5 text-xs rounded-lg',
        default: 'h-11 px-5 py-2.5',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
