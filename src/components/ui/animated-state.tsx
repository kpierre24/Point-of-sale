"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertCircle, XCircle, Info, Loader2 } from "lucide-react"

export interface AnimatedStateProps {
  state: "idle" | "loading" | "success" | "error" | "warning" | "info"
  children?: React.ReactNode
  message?: string
  className?: string
  showIcon?: boolean
  autoReset?: boolean
  resetDelay?: number
  onStateChange?: (state: string) => void
}

const AnimatedState = React.forwardRef<HTMLDivElement, AnimatedStateProps>(
  ({ 
    state, 
    children, 
    message, 
    className, 
    showIcon = true, 
    autoReset = false, 
    resetDelay = 3000,
    onStateChange,
    ...props 
  }, ref) => {
    const [currentState, setCurrentState] = React.useState(state)
    const [isTransitioning, setIsTransitioning] = React.useState(false)

    React.useEffect(() => {
      if (state !== currentState) {
        setIsTransitioning(true)
        
        // Brief transition delay for smooth animation
        setTimeout(() => {
          setCurrentState(state)
          setIsTransitioning(false)
          onStateChange?.(state)
        }, 150)
      }
    }, [state, currentState, onStateChange])

    React.useEffect(() => {
      if (autoReset && (currentState === "success" || currentState === "error" || currentState === "warning")) {
        const timer = setTimeout(() => {
          setCurrentState("idle")
          onStateChange?.("idle")
        }, resetDelay)
        
        return () => clearTimeout(timer)
      }
    }, [currentState, autoReset, resetDelay, onStateChange])

    const getStateConfig = () => {
      switch (currentState) {
        case "loading":
          return {
            icon: Loader2,
            color: "text-primary",
            bgColor: "bg-primary/10",
            borderColor: "border-primary/20",
            animation: "animate-spin"
          }
        case "success":
          return {
            icon: CheckCircle,
            color: "text-success",
            bgColor: "bg-success/10",
            borderColor: "border-success/20",
            animation: "animate-gentle-bounce"
          }
        case "error":
          return {
            icon: XCircle,
            color: "text-destructive",
            bgColor: "bg-destructive/10",
            borderColor: "border-destructive/20",
            animation: "animate-subtle-pulse"
          }
        case "warning":
          return {
            icon: AlertCircle,
            color: "text-warning",
            bgColor: "bg-warning/10",
            borderColor: "border-warning/20",
            animation: "animate-subtle-pulse"
          }
        case "info":
          return {
            icon: Info,
            color: "text-primary",
            bgColor: "bg-primary/10",
            borderColor: "border-primary/20",
            animation: ""
          }
        default:
          return {
            icon: null,
            color: "text-muted-foreground",
            bgColor: "bg-muted",
            borderColor: "border-border",
            animation: ""
          }
      }
    }

    const config = getStateConfig()
    const Icon = config.icon

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-md border p-4 transition-all duration-300 ease-in-out transform-gpu",
          config.bgColor,
          config.borderColor,
          isTransitioning && "scale-95 opacity-50",
          !isTransitioning && "scale-100 opacity-100",
          currentState !== "idle" && "animate-fade-in",
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          {showIcon && Icon && (
            <div className={cn("flex-shrink-0 mt-0.5", config.color)}>
              <Icon className={cn("h-5 w-5", config.animation)} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {message && (
              <p className={cn("text-sm font-medium", config.color)}>
                {message}
              </p>
            )}
            {children && (
              <div className="mt-1">
                {children}
              </div>
            )}
          </div>
        </div>

        {/* Animated background effect for loading state */}
        {currentState === "loading" && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}
      </div>
    )
  }
)
AnimatedState.displayName = "AnimatedState"

// Notification toast with micro-interactions
export interface AnimatedNotificationProps {
  type: "success" | "error" | "warning" | "info"
  title: string
  description?: string
  isVisible: boolean
  onClose?: () => void
  autoClose?: boolean
  duration?: number
  className?: string
}

const AnimatedNotification = React.forwardRef<HTMLDivElement, AnimatedNotificationProps>(
  ({ 
    type, 
    title, 
    description, 
    isVisible, 
    onClose, 
    autoClose = true, 
    duration = 5000,
    className,
    ...props 
  }, ref) => {
    const [shouldRender, setShouldRender] = React.useState(isVisible)

    React.useEffect(() => {
      if (isVisible) {
        setShouldRender(true)
        
        if (autoClose) {
          const timer = setTimeout(() => {
            onClose?.()
          }, duration)
          
          return () => clearTimeout(timer)
        }
      } else {
        // Delay unmounting to allow exit animation
        const timer = setTimeout(() => {
          setShouldRender(false)
        }, 300)
        
        return () => clearTimeout(timer)
      }
    }, [isVisible, autoClose, duration, onClose])

    const getTypeConfig = () => {
      switch (type) {
        case "success":
          return {
            icon: CheckCircle,
            color: "text-success",
            bgColor: "bg-success/10",
            borderColor: "border-success/20"
          }
        case "error":
          return {
            icon: XCircle,
            color: "text-destructive",
            bgColor: "bg-destructive/10",
            borderColor: "border-destructive/20"
          }
        case "warning":
          return {
            icon: AlertCircle,
            color: "text-warning",
            bgColor: "bg-warning/10",
            borderColor: "border-warning/20"
          }
        default:
          return {
            icon: Info,
            color: "text-primary",
            bgColor: "bg-primary/10",
            borderColor: "border-primary/20"
          }
      }
    }

    if (!shouldRender) return null

    const config = getTypeConfig()
    const Icon = config.icon

    return (
      <div
        ref={ref}
        className={cn(
          "fixed top-4 right-4 z-50 max-w-sm w-full bg-background border rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out transform-gpu",
          config.borderColor,
          isVisible 
            ? "translate-x-0 opacity-100 scale-100" 
            : "translate-x-full opacity-0 scale-95",
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className={cn("flex-shrink-0", config.color)}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground">
              {title}
            </h4>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors duration-200 hover:scale-110 transform-gpu"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
AnimatedNotification.displayName = "AnimatedNotification"

// Progress indicator with smooth animations
export interface AnimatedProgressProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  label?: string
  color?: "primary" | "success" | "warning" | "destructive"
  size?: "sm" | "default" | "lg"
}

const AnimatedProgress = React.forwardRef<HTMLDivElement, AnimatedProgressProps>(
  ({ 
    value, 
    max = 100, 
    className, 
    showLabel = false, 
    label, 
    color = "primary",
    size = "default",
    ...props 
  }, ref) => {
    const [animatedValue, setAnimatedValue] = React.useState(0)
    
    React.useEffect(() => {
      const timer = setTimeout(() => {
        setAnimatedValue(value)
      }, 100)
      
      return () => clearTimeout(timer)
    }, [value])

    const percentage = Math.min((animatedValue / max) * 100, 100)

    const getColorClasses = () => {
      switch (color) {
        case "success":
          return "bg-success"
        case "warning":
          return "bg-warning"
        case "destructive":
          return "bg-destructive"
        default:
          return "bg-primary"
      }
    }

    const getSizeClasses = () => {
      switch (size) {
        case "sm":
          return "h-1"
        case "lg":
          return "h-3"
        default:
          return "h-2"
      }
    }

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {showLabel && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">
              {label || "Progress"}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        
        <div className={cn(
          "w-full bg-muted rounded-full overflow-hidden",
          getSizeClasses()
        )}>
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out transform-gpu",
              getColorClasses()
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)
AnimatedProgress.displayName = "AnimatedProgress"

export { AnimatedState, AnimatedNotification, AnimatedProgress }