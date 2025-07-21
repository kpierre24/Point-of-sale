"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageTransitionProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "fade"
}

const PageTransition = React.forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children, className, delay = 0, direction = "up", ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, delay)

      return () => clearTimeout(timer)
    }, [delay])

    const getTransitionClasses = () => {
      const baseClasses = "transition-all duration-500 ease-out transform-gpu"
      
      if (!isVisible) {
        switch (direction) {
          case "up":
            return `${baseClasses} opacity-0 translate-y-8`
          case "down":
            return `${baseClasses} opacity-0 -translate-y-8`
          case "left":
            return `${baseClasses} opacity-0 translate-x-8`
          case "right":
            return `${baseClasses} opacity-0 -translate-x-8`
          case "fade":
            return `${baseClasses} opacity-0`
          default:
            return `${baseClasses} opacity-0 translate-y-8`
        }
      }
      
      return `${baseClasses} opacity-100 translate-x-0 translate-y-0`
    }

    return (
      <div
        ref={ref}
        className={cn(getTransitionClasses(), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PageTransition.displayName = "PageTransition"

// Staggered list animation component
export interface StaggeredListProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  direction?: "up" | "down" | "left" | "right" | "fade"
}

const StaggeredList = React.forwardRef<HTMLDivElement, StaggeredListProps>(
  ({ children, className, staggerDelay = 100, direction = "up", ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {React.Children.map(children, (child, index) => (
          <PageTransition
            key={index}
            delay={index * staggerDelay}
            direction={direction}
            className="stagger-animation"
          >
            {child}
          </PageTransition>
        ))}
      </div>
    )
  }
)
StaggeredList.displayName = "StaggeredList"

// Loading state transition component
export interface LoadingTransitionProps {
  isLoading: boolean
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  className?: string
}

const LoadingTransition = React.forwardRef<HTMLDivElement, LoadingTransitionProps>(
  ({ isLoading, children, loadingComponent, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <div
          className={cn(
            "transition-all duration-300 ease-in-out transform-gpu",
            isLoading ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
          )}
        >
          {children}
        </div>
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-scale-in">
              {loadingComponent || (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)
LoadingTransition.displayName = "LoadingTransition"

// Hover card component with micro-interactions
export interface HoverCardProps {
  children: React.ReactNode
  className?: string
  hoverScale?: number
  hoverShadow?: boolean
}

const HoverCard = React.forwardRef<HTMLDivElement, HoverCardProps>(
  ({ children, className, hoverScale = 1.02, hoverShadow = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "transition-all duration-200 ease-in-out transform-gpu cursor-pointer",
          hoverShadow && "hover:shadow-lg",
          className
        )}
        style={{
          '--hover-scale': hoverScale,
        } as React.CSSProperties}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = `scale(${hoverScale})`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
HoverCard.displayName = "HoverCard"

export { PageTransition, StaggeredList, LoadingTransition, HoverCard }