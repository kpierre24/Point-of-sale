/**
 * Network utilities for handling offline scenarios and connection issues
 */

export interface NetworkRequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
  fallbackData?: any
  showOfflineMessage?: boolean
}

export interface NetworkResponse<T = any> {
  data: T | null
  error: string | null
  isFromCache: boolean
  isOffline: boolean
  status: number | null
}

/**
 * Enhanced fetch wrapper with offline handling and retry logic
 */
export async function networkRequest<T = any>(
  url: string,
  options: NetworkRequestOptions = {}
): Promise<NetworkResponse<T>> {
  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    fallbackData = null,
    showOfflineMessage = true,
    ...fetchOptions
  } = options

  // Check if we're offline
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine

  if (isOffline) {
    // Try to get cached data first
    const cachedData = await getCachedData<T>(url)
    if (cachedData) {
      return {
        data: cachedData,
        error: null,
        isFromCache: true,
        isOffline: true,
        status: 200
      }
    }

    // Return fallback data if available
    if (fallbackData !== null) {
      return {
        data: fallbackData,
        error: null,
        isFromCache: false,
        isOffline: true,
        status: 200
      }
    }

    return {
      data: null,
      error: 'You are currently offline. Please check your internet connection.',
      isFromCache: false,
      isOffline: true,
      status: null
    }
  }

  // Attempt the request with retries
  let lastError: string | null = null
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Cache successful responses
      await setCachedData(url, data)

      return {
        data,
        error: null,
        isFromCache: false,
        isOffline: false,
        status: response.status
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network request failed'
      lastError = errorMessage

      // If this isn't the last attempt, wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        continue
      }

      // On final failure, try to return cached data
      const cachedData = await getCachedData<T>(url)
      if (cachedData) {
        return {
          data: cachedData,
          error: `Using cached data due to network error: ${errorMessage}`,
          isFromCache: true,
          isOffline: false,
          status: null
        }
      }

      // Return fallback data if available
      if (fallbackData !== null) {
        return {
          data: fallbackData,
          error: `Using fallback data due to network error: ${errorMessage}`,
          isFromCache: false,
          isOffline: false,
          status: null
        }
      }
    }
  }

  return {
    data: null,
    error: lastError || 'Network request failed after multiple attempts',
    isFromCache: false,
    isOffline: false,
    status: null
  }
}

/**
 * Simple cache implementation using localStorage
 */
const CACHE_PREFIX = 'network_cache_'
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
  data: T
  timestamp: number
  url: string
}

async function getCachedData<T>(url: string): Promise<T | null> {
  try {
    const cacheKey = CACHE_PREFIX + btoa(url)
    const cached = localStorage.getItem(cacheKey)
    
    if (!cached) return null

    const entry: CacheEntry<T> = JSON.parse(cached)
    const now = Date.now()

    // Check if cache is expired
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(cacheKey)
      return null
    }

    return entry.data
  } catch (error) {
    console.warn('Failed to get cached data:', error)
    return null
  }
}

async function setCachedData<T>(url: string, data: T): Promise<void> {
  try {
    const cacheKey = CACHE_PREFIX + btoa(url)
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      url
    }

    localStorage.setItem(cacheKey, JSON.stringify(entry))
  } catch (error) {
    console.warn('Failed to cache data:', error)
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  try {
    const now = Date.now()
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const entry = JSON.parse(cached)
            if (now - entry.timestamp > CACHE_EXPIRY) {
              keysToRemove.push(key)
            }
          }
        } catch (error) {
          // Invalid cache entry, mark for removal
          keysToRemove.push(key)
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
  } catch (error) {
    console.warn('Failed to clear expired cache:', error)
  }
}

/**
 * Get network quality indicator
 */
export function getNetworkQuality(): 'fast' | 'slow' | 'offline' {
  if (typeof navigator === 'undefined') return 'fast'
  
  if (!navigator.onLine) return 'offline'

  // Use Network Information API if available
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

  if (connection) {
    const { effectiveType, downlink } = connection
    
    if (effectiveType === '4g' && downlink > 1.5) return 'fast'
    if (effectiveType === '3g' || downlink < 0.5) return 'slow'
  }

  return 'fast'
}

/**
 * Preload critical data when connection is restored
 */
export async function preloadCriticalData(endpoints: string[]): Promise<void> {
  if (!navigator.onLine) return

  const promises = endpoints.map(endpoint => 
    networkRequest(endpoint, { 
      retries: 1, 
      timeout: 5000,
      showOfflineMessage: false 
    })
  )

  try {
    await Promise.allSettled(promises)
  } catch (error) {
    console.warn('Failed to preload some critical data:', error)
  }
}