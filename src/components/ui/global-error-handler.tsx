"use client"

import * as React from "react"
import { ErrorDisplay } from "@/components/ui/error-display"
import { useErrorHandler } from "@/hooks/use-error-handler"
import { type UserFriendlyError } from "@/lib/error-messages"

interface GlobalErrorContextType {
  showError: (error: UserFriendlyError) => void
  clearError: () => void
  currentError: UserFriendlyError | null
}

const GlobalErrorContext = React.createContext<GlobalErrorContextType | null>(null)

export function useGlobalError() {
  const context = React.useContext(GlobalErrorContext)
  if (!context) {
    throw new Error('useGlobalError must be used within a GlobalErrorProvider')
  }
  return context
}

interface GlobalErrorProviderProps {
  children: React.ReactNode
}

export function GlobalErrorProvider({ children }: GlobalErrorProviderProps) {
  const [currentError, setCurrentError] = React.useState<UserFriendlyError | null>(null)
  const { handleError } = useErrorHandler()

  const showError = React.useCallback((error: UserFriendlyError) => {
    setCurrentError(error)
  }, [])

  const clearError = React.useCallback(() => {
    setCurrentError(null)
  }, [])

  // Handle unhandled promise rejections
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = handleError(event.reason, { showToast: false })
      showError(error)
      event.preventDefault()
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [handleError, showError])

  const contextValue = React.useMemo(() => ({
    showError,
    clearError,
    currentError,
  }), [showError, clearError, currentError])

  return (
    <GlobalErrorContext.Provider value={contextValue}>
      {children}
      {currentError && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <ErrorDisplay
            error={currentError}
            showDismiss
            onDismiss={clearError}
            onRetry={() => {
              clearError()
              // Optionally trigger a retry action
            }}
          />
        </div>
      )}
    </GlobalErrorContext.Provider>
  )
}

/**
 * Component to display persistent errors in a specific location
 */
interface ErrorDisplayContainerProps {
  error?: UserFriendlyError | null
  onDismiss?: () => void
  onRetry?: () => void
  className?: string
}

export function ErrorDisplayContainer({ 
  error, 
  onDismiss, 
  onRetry, 
  className 
}: ErrorDisplayContainerProps) {
  if (!error) return null

  return (
    <div className={className}>
      <ErrorDisplay
        error={error}
        showDismiss={!!onDismiss}
        onDismiss={onDismiss}
        onRetry={onRetry}
      />
    </div>
  )
}