"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-button hover:shadow-button-hover hover:scale-[1.02] active:scale-[0.98] transform-gpu",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
        success: "bg-success text-success-foreground hover:bg-success/90 active:bg-success/95",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 active:bg-warning/95",
      },
      size: {
        default: "h-11 px-4 py-2 min-h-touch-target", // Increased to meet 44px touch target
        sm: "h-10 rounded-md px-3 text-xs min-h-button", // Minimum 40px for small buttons
        lg: "h-12 rounded-md px-8 text-base min-h-touch-target", // Increased for better touch
        xl: "h-14 rounded-md px-10 text-lg min-h-touch-target", // Increased for prominence
        icon: "h-11 w-11 min-h-touch-target", // Increased to meet touch target
        "icon-sm": "h-10 w-10 min-h-button", // Minimum for small icons
        "icon-lg": "h-12 w-12 min-h-touch-target", // Increased for better touch
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading
    
    // When using asChild with loading state, we need to handle the content differently
    const buttonContent = loading ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        {loadingText || children}
      </>
    ) : children

    // If asChild is true and we have loading content (multiple elements), 
    // we can't use Slot directly as it expects a single child
    if (asChild && loading) {
      // When asChild is true but we have loading state, render as button instead
      // to avoid the React.Children.only error
      return (
        <button
          className={cn(
            buttonVariants({ variant, size, className }),
            "cursor-not-allowed opacity-50"
          )}
          ref={ref}
          disabled={isDisabled}
          {...props}
        >
          {buttonContent}
        </button>
      )
    }
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && "cursor-not-allowed",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {buttonContent}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
