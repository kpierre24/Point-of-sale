"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { LoadingState } from "@/components/ui/loading-state"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"

export interface FeedbackSystemProps {
  children: React.ReactNode
  isLoading?: boolean
  loadingMessage?: string
  loadingType?: "spinner" | "skeleton" | "progress"
  error?: string | null
  success?: string | null
  warning?: string | null
  info?: string | null
  showToasts?: boolean
  className?: string
}

const FeedbackSystem = React.forwardRef<HTMLDivElement, FeedbackSystemProps>(
  ({
    children,
    isLoading = false,
    loadingMessage = "Loading...",
    loadingType = "spinner",
    error,
    success,
    warning,
    info,
    showToasts = true,
    className,
    ...props
  }, ref) => {
    const { success: showSuccess, error: showError, warning: showWarning, info: showInfo } = useToast()
    const prevError = React.useRef<string | null>(null)
    const prevSuccess = React.useRef<string | null>(null)
    const prevWarning = React.useRef<string | null>(null)
    const prevInfo = React.useRef<string | null>(null)

    // Show toasts when feedback messages change
    React.useEffect(() => {
      if (showToasts) {
        if (error && error !== prevError.current) {
          showError("Error", error)
          prevError.current = error
        }
        if (success && success !== prevSuccess.current) {
          showSuccess("Success", success)
          prevSuccess.current = success
        }
        if (warning && warning !== prevWarning.current) {
          showWarning("Warning", warning)
          prevWarning.current = warning
        }
        if (info && info !== prevInfo.current) {
          showInfo("Info", info)
          prevInfo.current = info
        }
      }
    }, [error, success, warning, info, showToasts, showError, showSuccess, showWarning, showInfo])

    // Reset previous values when messages are cleared
    React.useEffect(() => {
      if (!error) prevError.current = null
      if (!success) prevSuccess.current = null
      if (!warning) prevWarning.current = null
      if (!info) prevInfo.current = null
    }, [error, success, warning, info])

    if (isLoading) {
      return (
        <div ref={ref} className={cn("relative", className)} {...props}>
          <LoadingState
            type={loadingType}
            message={loadingMessage}
            className="min-h-[200px]"
          />
        </div>
      )
    }

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        {children}
        
        {/* Inline feedback messages */}
        {(error || success || warning || info) && !showToasts && (
          <div className="mt-4 space-y-2">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 text-sm text-success bg-success/10 border border-success/20 rounded-md">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
            {warning && (
              <div className="flex items-center gap-2 p-3 text-sm text-warning bg-warning/10 border border-warning/20 rounded-md">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            )}
            {info && (
              <div className="flex items-center gap-2 p-3 text-sm text-primary bg-primary/10 border border-primary/20 rounded-md">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span>{info}</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)
FeedbackSystem.displayName = "FeedbackSystem"

// Hook for managing async operations with feedback
export function useAsyncOperation<T = any>() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [data, setData] = React.useState<T | null>(null)

  const execute = React.useCallback(async (
    operation: () => Promise<T>,
    options?: {
      successMessage?: string
      errorMessage?: string
      onSuccess?: (data: T) => void
      onError?: (error: Error) => void
    }
  ) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await operation()
      setData(result)
      
      if (options?.successMessage) {
        setSuccess(options.successMessage)
      }
      
      options?.onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(options?.errorMessage || errorMessage)
      options?.onError?.(err instanceof Error ? err : new Error(errorMessage))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = React.useCallback(() => {
    setIsLoading(false)
    setError(null)
    setSuccess(null)
    setData(null)
  }, [])

  return {
    isLoading,
    error,
    success,
    data,
    execute,
    reset,
  }
}

// Hook for form submission with feedback
export function useFormSubmission<T = any>() {
  const asyncOp = useAsyncOperation<T>()
  const { saveSuccess, saveError, validationError } = useToast()

  const submitForm = React.useCallback(async (
    submitFn: () => Promise<T>,
    options?: {
      itemName?: string
      onSuccess?: (data: T) => void
      onError?: (error: Error) => void
      showToasts?: boolean
    }
  ) => {
    const { itemName = "Item", showToasts = true, ...restOptions } = options || {}

    try {
      const result = await asyncOp.execute(submitFn, {
        successMessage: showToasts ? undefined : `${itemName} saved successfully`,
        errorMessage: showToasts ? undefined : `Failed to save ${itemName.toLowerCase()}`,
        ...restOptions,
      })

      if (showToasts) {
        saveSuccess(itemName)
      }

      return result
    } catch (error) {
      if (showToasts) {
        if (error instanceof Error && error.message.includes('validation')) {
          validationError(error.message)
        } else {
          saveError(itemName, error instanceof Error ? error.message : undefined)
        }
      }
      throw error
    }
  }, [asyncOp, saveSuccess, saveError, validationError])

  return {
    ...asyncOp,
    submitForm,
  }
}

export { FeedbackSystem }