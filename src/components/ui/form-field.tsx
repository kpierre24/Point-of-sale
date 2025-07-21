"use client"

import * as React from "react"
import { AlertCircle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export interface FormFieldWrapperProps {
  children: React.ReactNode
  label?: string
  required?: boolean
  error?: string
  success?: string
  hint?: string
  className?: string
  id?: string
}

const FormFieldWrapper = React.forwardRef<
  HTMLDivElement,
  FormFieldWrapperProps
>(({ children, label, required, error, success, hint, className, id, ...props }, ref) => {
  const fieldId = id || React.useId()
  const hasError = Boolean(error)
  const hasSuccess = Boolean(success) && !hasError

  return (
    <div ref={ref} className={cn("space-y-2", className)} {...props}>
      {label && (
        <Label 
          htmlFor={fieldId}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            hasError && "text-red-600",
            hasSuccess && "text-green-600"
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative group">
        {React.isValidElement(children) ? (
          React.cloneElement(children, {
            id: fieldId,
            className: cn(
              children.props.className,
              "transition-all duration-200 ease-in-out",
              hasError && "border-red-300 focus:border-red-500 focus:ring-red-500 focus:shadow-md shadow-red-100",
              hasSuccess && "border-green-300 focus:border-green-500 focus:ring-green-500 focus:shadow-md shadow-green-100"
            ),
            'aria-invalid': hasError,
            'aria-describedby': [
              hint && `${fieldId}-hint`,
              error && `${fieldId}-error`,
              success && `${fieldId}-success`,
            ].filter(Boolean).join(' ') || undefined,
          })
        ) : (
          children
        )}
        
        {/* Status icon */}
        {(hasError || hasSuccess) && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {hasError && <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />}
            {hasSuccess && <CheckCircle className="h-4 w-4 text-green-500 animate-bounce" />}
          </div>
        )}
      </div>

      {hint && !error && !success && (
        <div className="flex items-start gap-1">
          <Info className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p 
            id={`${fieldId}-hint`}
            className="text-xs text-muted-foreground leading-relaxed"
          >
            {hint}
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-1">
          <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
          <p 
            id={`${fieldId}-error`}
            className="text-xs text-red-600 leading-relaxed font-medium"
          >
            {error}
          </p>
        </div>
      )}

      {success && !error && (
        <div className="flex items-start gap-1">
          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
          <p 
            id={`${fieldId}-success`}
            className="text-xs text-green-600 leading-relaxed font-medium"
          >
            {success}
          </p>
        </div>
      )}
    </div>
  )
})
FormFieldWrapper.displayName = "FormFieldWrapper"

export { FormFieldWrapper }