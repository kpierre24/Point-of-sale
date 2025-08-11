"use client"

import { useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { 
  createUserFriendlyError, 
  extractErrorInfo, 
  BUSINESS_ERRORS,
  type UserFriendlyError,
  type ErrorContext 
} from '@/lib/error-messages'

export interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  context?: ErrorContext
}

export function useErrorHandler() {
  const { toast } = useToast()

  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ): UserFriendlyError => {
    const { showToast = true, logError = true, context } = options

    // Extract error information
    const errorInfo = extractErrorInfo(error)
    
    // Create user-friendly error
    const userFriendlyError = createUserFriendlyError(errorInfo.code, {
      ...context,
      details: context?.details || errorInfo.details || errorInfo.message
    })

    // Log error for debugging (in development or with proper error tracking)
    if (logError) {
      console.error('Error handled:', {
        original: error,
        extracted: errorInfo,
        userFriendly: userFriendlyError,
        context
      })
    }

    // Show toast notification
    if (showToast) {
      toast({
        title: userFriendlyError.title,
        description: userFriendlyError.message,
        variant: "destructive",
      })
    }

    return userFriendlyError
  }, [toast])

  // Specific error handlers for common business scenarios
  const handleNetworkError = useCallback((error: unknown, action?: string) => {
    return handleError(error, {
      context: { action, code: 'NETWORK_ERROR' }
    })
  }, [handleError])

  const handleValidationError = useCallback((message: string, field?: string) => {
    return handleError(new Error(message), {
      context: { 
        code: 'VALIDATION_ERROR',
        resource: field,
        details: message 
      }
    })
  }, [handleError])

  const handleSaveError = useCallback((resource: string, error: unknown) => {
    return handleError(error, {
      context: { 
        code: 'SAVE_FAILED',
        resource,
        action: `save ${resource.toLowerCase()}`
      }
    })
  }, [handleError])

  const handleLoadError = useCallback((resource: string, error: unknown) => {
    return handleError(error, {
      context: { 
        code: 'LOAD_FAILED',
        resource,
        action: `load ${resource.toLowerCase()}`
      }
    })
  }, [handleError])

  const handlePermissionError = useCallback((action: string) => {
    return handleError(new Error('Permission denied'), {
      context: { 
        code: 'PERMISSION_DENIED',
        action 
      }
    })
  }, [handleError])

  // Business-specific error handlers
  const handleStockError = useCallback((available: number, requested: number, product: string) => {
    const error = BUSINESS_ERRORS.INSUFFICIENT_STOCK(available, requested, product)
    toast({
      title: error.title,
      description: error.message,
      variant: "destructive",
    })
    return error
  }, [toast])

  const handlePaymentError = useCallback((error: unknown, paymentMethod?: string) => {
    return handleError(error, {
      context: { 
        code: 'PAYMENT_FAILED',
        resource: 'Payment',
        details: paymentMethod ? `Payment method: ${paymentMethod}` : undefined
      }
    })
  }, [handleError])

  const handleCardError = useCallback((cardId: string) => {
    const error = BUSINESS_ERRORS.PAYMENT_CARD_ERROR(cardId)
    toast({
      title: error.title,
      description: error.message,
      variant: "destructive",
    })
    return error
  }, [toast])

  const handleInsufficientBalanceError = useCallback((balance: number, required: number) => {
    const error = BUSINESS_ERRORS.INSUFFICIENT_CARD_BALANCE(balance, required)
    toast({
      title: error.title,
      description: error.message,
      variant: "destructive",
    })
    return error
  }, [toast])

  // Success handlers for positive feedback
  const handleSuccess = useCallback((title: string, message?: string) => {
    toast({
      title,
      description: message,
      variant: "default",
    })
  }, [toast])

  const handleSaveSuccess = useCallback((resource: string) => {
    toast({
      title: `${resource} Saved`,
      description: `${resource} has been successfully saved.`,
      variant: "default",
    })
  }, [toast])

  const handleDeleteSuccess = useCallback((resource: string) => {
    toast({
      title: `${resource} Deleted`,
      description: `${resource} has been successfully deleted.`,
      variant: "default",
    })
  }, [toast])

  // Async operation wrapper with error handling
  const withErrorHandling = useCallback(<T>(
    operation: () => Promise<T>,
    options?: ErrorHandlerOptions & {
      successMessage?: string
      loadingMessage?: string
    }
  ) => {
    return async (): Promise<T | null> => {
      try {
        if (options?.loadingMessage) {
          toast({
            title: options.loadingMessage,
            description: "Please wait while we process your request.",
            variant: "default",
          })
        }

        const result = await operation()

        if (options?.successMessage) {
          toast({
            title: "Success",
            description: options.successMessage,
            variant: "default",
          })
        }

        return result
      } catch (error) {
        handleError(error, options)
        return null
      }
    }
  }, [handleError, toast])

  return {
    handleError,
    handleNetworkError,
    handleValidationError,
    handleSaveError,
    handleLoadError,
    handlePermissionError,
    handleStockError,
    handlePaymentError,
    handleCardError,
    handleInsufficientBalanceError,
    handleSuccess,
    handleSaveSuccess,
    handleDeleteSuccess,
    withErrorHandling,
  }
}
