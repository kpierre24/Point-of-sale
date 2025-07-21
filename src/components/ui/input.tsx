import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border bg-background text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transform-gpu",
  {
    variants: {
      variant: {
        default: "border-input hover:border-ring/50 hover:shadow-sm focus-visible:shadow-md",
        error: "border-destructive focus-visible:ring-destructive hover:border-destructive/70 focus-visible:shadow-md shadow-destructive/10",
        success: "border-success focus-visible:ring-success hover:border-success/70 focus-visible:shadow-md shadow-success/10",
      },
      size: {
        default: "h-11 px-3 py-2", // Increased to meet 44px touch target
        sm: "h-10 px-2 py-1 text-sm", // Minimum for small inputs
        lg: "h-12 px-4 py-3 text-base", // Already touch-friendly
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  error?: boolean
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type, error, success, ...props }, ref) => {
    // Determine variant based on error/success props
    const computedVariant = error ? "error" : success ? "success" : variant

    return (
      <input
        type={type}
        className={cn(inputVariants({ variant: computedVariant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
