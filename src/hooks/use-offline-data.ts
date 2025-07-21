"use client"

import { useState, useEffect, useCallback } from 'react'
import { networkRequest, type NetworkRequestOptions, type NetworkResponse } from '@/lib/network-utils'
import { useConnectionStatus } from '@/hooks/use-connection-status'
import { useToast } from '@/hooks/use-toast'

export interface OfflineDataOptions extends NetworkRequestOptions {
  refreshInterval?: number
  refreshOnReconnect?: boolean
  showCacheNotifications?: boolean
}

export interface OfflineDataState<T> {
  data: T | null
  loading: boolean
  error: string | null
  isFromCache: boolean
  isStale: boolean
  lastUpdated: Date | null
}

export function useOfflineData<T = any>(
  url: string | null,
  options: OfflineDataOptions = {}
) {
  const {
    refreshInterval,
    refreshOnReconnect = true,
    showCacheNotifications = true,
    ...networkOptions
  } = options

  const { toast } = useToast()
  const { isConnected, isOnline } = useConnectionStatus()
  
  const [state, setState] = useState<OfflineDataState<T>>({
    data: null,
    loading: false,
    error: null,
    isFromCache: false,
    isStale: false,
    lastUpdated: null,
  })

  const fetchData = useCallback(async (showLoading = true) => {
    if (!url) return

    if (showLoading) {
      setState(prev => ({ ...prev, loading: true, error: null }))
    }

    try {
      const response: NetworkResponse<T> = await networkRequest(url, networkOptions)
      
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: false,
        error: response.error,
        isFromCache: response.isFromCache,
        isStale: response.isFromCache && !response.isOffline,
        lastUpdated: response.data ? new Date() : prev.lastUpdated,
      }))

      // Show notification if using cached data
      if (response.isFromCache && showCacheNotifications && response.data) {
        toast({
          title: "Using Cached Data",
          description: "Showing previously saved data while offline.",
          variant: "info",
        })
      }

      // Show error notification if request failed and no cached data
      if (response.error && !response.data) {
        toast({
          title: "Failed to Load Data",
          description: response.error,
          variant: "destructive",
        })
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data'
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))

      toast({
        title: "Data Loading Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [url, networkOptions, showCacheNotifications, toast])

  // Refresh data when connection is restored
  useEffect(() => {
    if (refreshOnReconnect && isConnected && state.isFromCache) {
      fetchData(false)
    }
  }, [isConnected, refreshOnReconnect, state.isFromCache, fetchData])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Periodic refresh when online
  useEffect(() => {
    if (!refreshInterval || !isOnline) return

    const interval = setInterval(() => {
      if (isConnected) {
        fetchData(false)
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, isOnline, isConnected, fetchData])

  const refetch = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    refetch,
    clearError,
    isOffline: !isOnline,
    canRefresh: isConnected,
  }
}

/**
 * Hook for managing offline-aware mutations (POST, PUT, DELETE)
 */
export function useOfflineMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: Error, variables: TVariables) => void
    showSuccessToast?: boolean
    showErrorToast?: boolean
  } = {}
) {
  const { toast } = useToast()
  const { isConnected } = useConnectionStatus()
  
  const [state, setState] = useState({
    loading: false,
    error: null as Error | null,
    data: null as TData | null,
  })

  const mutate = useCallback(async (variables: TVariables) => {
    if (!isConnected) {
      const error = new Error('Cannot perform this action while offline')
      setState(prev => ({ ...prev, error }))
      
      if (options.showErrorToast !== false) {
        toast({
          title: "Offline",
          description: "This action requires an internet connection.",
          variant: "warning",
        })
      }
      
      options.onError?.(error, variables)
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const data = await mutationFn(variables)
      
      setState(prev => ({ ...prev, loading: false, data, error: null }))
      
      if (options.showSuccessToast) {
        toast({
          title: "Success",
          description: "Operation completed successfully.",
          variant: "success",
        })
      }
      
      options.onSuccess?.(data, variables)
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Mutation failed')
      
      setState(prev => ({ ...prev, loading: false, error: err }))
      
      if (options.showErrorToast !== false) {
        toast({
          title: "Operation Failed",
          description: err.message,
          variant: "destructive",
        })
      }
      
      options.onError?.(err, variables)
    }
  }, [isConnected, mutationFn, options, toast])

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null })
  }, [])

  return {
    ...state,
    mutate,
    reset,
    isOffline: !isConnected,
  }
}