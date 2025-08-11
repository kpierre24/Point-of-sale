"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw, X, Info, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { type UserFriendlyError } from "@/lib/error-messages"

export interface ErrorDisplayProps {
  error: UserFriendlyError
  variant?: "default" | "destructive" | "warning" | "info"
  size?: "sm" | "default" | "lg"
  showIcon?: boolean
  showDismiss?: boolean
  onDismiss?: () => void
  onRetry?: () => void
  className?: string
}

const variantConfig = {
  default: {
    icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-900",
    iconClassName: "text-blue-600"
  },
  destructive: {
    icon: AlertCircle,
    className: "border-red-200 bg-red-50 text-red-900",
    iconClassName: "text-red-600"
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-900",
    iconClassName: "text-amber-600"
  },
  info: {
    icon: CheckCircle,
    className: "border-green-200 bg-green-50 text-green-900",
    iconClassName: "text-green-600"
  }
}

export function ErrorDisplay({
  error,
  variant = "destructive",
  size = "default",
  showIcon = true,
  showDismiss = false,
  onDismiss,
  onRetry,
  className,
}: ErrorDisplayProps) {
  const config = variantConfig[variant]
  const IconComponent = config.icon

  const sizeClasses = {
    sm: "p-3 text-sm",
    default: "p-4",
    lg: "p-6 text-lg"
  }

  return (
    <Alert className={cn(config.className, sizeClasses[size], className)}>
      <div className="flex items-start gap-3">
        {showIcon && (
          <IconComponent className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconClassName)} />
        )}
        
        <div className="flex-1 min-w-0">
          <AlertTitle className="font-semibold mb-1">
            {error.title}
          </AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">
            {error.message}
            {error.suggestion && (
              <div className="mt-2 text-xs opacity-90 font-medium">
                💡 {error.suggestion}
              </div>
            )}
          </AlertDescription>
          
          {(onRetry || error.action) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-8 px-3 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              )}
              {error.action && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={error.action.handler}
                  className="h-8 px-3 text-xs"
                >
                  {error.action.label}
                </Button>
              )}
            </div>
          )}
        </div>

        {showDismiss && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </Alert>
  )
}

/**
 * Inline error display for form fields
 */
export interface InlineErrorProps {
  message?: string
  className?: string
}

export function InlineError({ message, className }: InlineErrorProps) {
  if (!message) return null

  return (
    <div className={cn("flex items-center gap-1 text-sm text-red-600 mt-1", className)}>
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

/**
 * Error boundary fallback component
 */
export interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          We encountered an unexpected error. Please try refreshing the page.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="default" 
            size="sm"
          >
            Refresh Page
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-xs text-gray-500 cursor-pointer">
              Error Details (Development)
            </summary>
            <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded overflow-auto">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
