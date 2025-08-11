"use client"

import * as React from "react"
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useConnectionStatus } from "@/hooks/use-connection-status"

export interface ConnectionStatusProps {
  variant?: "badge" | "indicator" | "full"
  showRetry?: boolean
  className?: string
}

export function ConnectionStatus({ 
  variant = "indicator", 
  showRetry = true,
  className 
}: ConnectionStatusProps) {
  const { 
    isOnline, 
    isConnected, 
    lastConnected, 
    retryCount, 
    isRetrying, 
    canRetry, 
    retryConnection 
  } = useConnectionStatus()

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        status: 'offline',
        icon: WifiOff,
        label: 'Offline',
        description: 'No internet connection',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    }
    
    if (!isConnected) {
      return {
        status: 'disconnected',
        icon: AlertTriangle,
        label: 'Server Disconnected',
        description: 'Cannot reach server',
        color: 'text-amber-500',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200'
      }
    }
    
    return {
      status: 'connected',
      icon: isRetrying ? RefreshCw : CheckCircle,
      label: 'Connected',
      description: 'All systems operational',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  }

  const statusInfo = getStatusInfo()
  const IconComponent = statusInfo.icon

  const formatLastConnected = () => {
    if (!lastConnected) return 'Never'
    
    const now = new Date()
    const diff = now.getTime() - lastConnected.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    return lastConnected.toLocaleDateString()
  }

  if (variant === "badge") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={statusInfo.status === 'connected' ? 'default' : 'destructive'}
              className={cn("flex items-center gap-1", className)}
            >
              <IconComponent className={cn("h-3 w-3", isRetrying && "animate-spin")} />
              {statusInfo.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{statusInfo.description}</div>
              {lastConnected && (
                <div className="text-xs opacity-75">
                  Last connected: {formatLastConnected()}
                </div>
              )}
              {retryCount > 0 && (
                <div className="text-xs opacity-75">
                  Retry attempts: {retryCount}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (variant === "indicator") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-2", className)}>
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full",
                statusInfo.bgColor,
                statusInfo.borderColor,
                "border"
              )}>
                <IconComponent className={cn(
                  "h-3 w-3",
                  statusInfo.color,
                  isRetrying && "animate-spin"
                )} />
              </div>
              {showRetry && !isConnected && canRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={retryConnection}
                  disabled={isRetrying}
                  className="h-6 px-2 text-xs"
                >
                  {isRetrying ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    "Retry"
                  )}
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{statusInfo.description}</div>
              {lastConnected && (
                <div className="text-xs opacity-75">
                  Last connected: {formatLastConnected()}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Full variant
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border",
      statusInfo.bgColor,
      statusInfo.borderColor,
      className
    )}>
      <div className="flex items-center gap-3">
        <IconComponent className={cn(
          "h-5 w-5",
          statusInfo.color,
          isRetrying && "animate-spin"
        )} />
        <div>
          <div className="font-medium text-sm">{statusInfo.label}</div>
          <div className="text-xs text-muted-foreground">
            {statusInfo.description}
          </div>
          {lastConnected && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              Last connected: {formatLastConnected()}
            </div>
          )}
        </div>
      </div>
      
      {showRetry && !isConnected && canRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={retryConnection}
          disabled={isRetrying}
          className="ml-3"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </>
          )}
        </Button>
      )}
      
      {retryCount > 0 && (
        <div className="text-xs text-muted-foreground ml-3">
          Attempts: {retryCount}
        </div>
      )}
    </div>
  )
}

/**
 * Offline banner component for when the app is offline
 */
export function OfflineBanner() {
  const { isOnline, isConnected } = useConnectionStatus()
  
  if (isOnline && isConnected) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="flex items-center justify-center gap-2 text-amber-800">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          {!isOnline ? "You're offline" : "Server connection lost"}
        </span>
        <span className="text-xs">
          Some features may not work properly
        </span>
      </div>
    </div>
  )
}

/**
 * Connection status for the sidebar or header
 */
export function HeaderConnectionStatus() {
  return (
    <div className="flex items-center">
      <ConnectionStatus variant="indicator" showRetry={false} />
    </div>
  )
}
