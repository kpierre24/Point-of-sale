"use client"

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface ConnectionStatus {
  isOnline: boolean
  isConnected: boolean
  lastConnected: Date | null
  retryCount: number
}

export interface ConnectionOptions {
  checkInterval?: number
  maxRetries?: number
  retryDelay?: number
  endpoints?: string[]
  showToasts?: boolean
}

const DEFAULT_OPTIONS: Required<ConnectionOptions> = {
  checkInterval: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  endpoints: ['/api/health'],
  showToasts: true,
}

export function useConnectionStatus(options: ConnectionOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const { toast } = useToast()
  
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnected: true,
    lastConnected: new Date(),
    retryCount: 0,
  })

  const [isRetrying, setIsRetrying] = useState(false)

  // Check server connectivity
  const checkServerConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Try multiple endpoints to ensure connectivity
      const promises = config.endpoints.map(endpoint => 
        fetch(endpoint, { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
      )

      const results = await Promise.allSettled(promises)
      
      // Consider connected if at least one endpoint responds successfully
      return results.some(result => 
        result.status === 'fulfilled' && 
        result.value.ok
      )
    } catch (error) {
      console.warn('Server connectivity check failed:', error)
      return false
    }
  }, [config.endpoints])

  // Update connection status
  const updateConnectionStatus = useCallback(async () => {
    const isOnline = navigator.onLine
    const isConnected = isOnline ? await checkServerConnection() : false

    setStatus(prev => ({
      ...prev,
      isOnline,
      isConnected,
      lastConnected: isConnected ? new Date() : prev.lastConnected,
      retryCount: isConnected ? 0 : prev.retryCount,
    }))

    return { isOnline, isConnected }
  }, [checkServerConnection])

  // Retry connection with exponential backoff
  const retryConnection = useCallback(async () => {
    if (isRetrying || status.retryCount >= config.maxRetries) {
      return false
    }

    setIsRetrying(true)
    
    try {
      // Exponential backoff delay
      const delay = config.retryDelay * Math.pow(2, status.retryCount)
      await new Promise(resolve => setTimeout(resolve, delay))

      const { isConnected } = await updateConnectionStatus()
      
      setStatus(prev => ({
        ...prev,
        retryCount: isConnected ? 0 : prev.retryCount + 1,
      }))

      if (isConnected && config.showToasts) {
        toast({
          title: "Connection Restored",
          description: "Successfully reconnected to the server.",
          variant: "success",
        })
      }

      return isConnected
    } catch (error) {
      console.error('Retry connection failed:', error)
      setStatus(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
      }))
      return false
    } finally {
      setIsRetrying(false)
    }
  }, [isRetrying, status.retryCount, config.maxRetries, config.retryDelay, config.showToasts, updateConnectionStatus, toast])

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      updateConnectionStatus().then(({ isConnected }) => {
        if (isConnected && config.showToasts) {
          toast({
            title: "Back Online",
            description: "Internet connection restored.",
            variant: "success",
          })
        }
      })
    }

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnected: false,
      }))
      
      if (config.showToasts) {
        toast({
          title: "Connection Lost",
          description: "You're currently offline. Some features may not work.",
          variant: "warning",
        })
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [updateConnectionStatus, config.showToasts, toast])

  // Periodic connection check
  useEffect(() => {
    const interval = setInterval(async () => {
      const { isOnline, isConnected } = await updateConnectionStatus()
      
      // Show warning if connection is lost
      if (isOnline && !isConnected && config.showToasts) {
        toast({
          title: "Server Connection Lost",
          description: "Unable to reach the server. Retrying...",
          variant: "warning",
        })
      }
    }, config.checkInterval)

    return () => clearInterval(interval)
  }, [updateConnectionStatus, config.checkInterval, config.showToasts, toast])

  // Initial connection check
  useEffect(() => {
    updateConnectionStatus()
  }, [updateConnectionStatus])

  return {
    ...status,
    isRetrying,
    canRetry: status.retryCount < config.maxRetries && !isRetrying,
    retryConnection,
    checkConnection: updateConnectionStatus,
  }
}
