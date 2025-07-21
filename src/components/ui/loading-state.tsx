"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton"
import { CircularProgress, Progress } from "@/components/ui/progress"

const loadingStateVariants = cva(
  "flex items-center justify-center",
  {
    variants: {
      variant: {
        spinner: "flex-col space-y-2",
        skeleton: "",
        progress: "flex-col space-y-4",
        overlay: "absolute inset-0 bg-background/80 backdrop-blur-sm z-50",
      },
      size: {
        sm: "p-2",
        default: "p-4",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "spinner",
      size: "default",
    },
  }
)

export interface LoadingStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingStateVariants> {
  message?: string
  progress?: number
  showProgress?: boolean
  type?: "spinner" | "skeleton" | "progress" | "overlay"
  skeletonType?: "text" | "card" | "table"
  skeletonLines?: number
  skeletonRows?: number
  skeletonColumns?: number
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({
    className,
    variant,
    size,
    message,
    progress,
    showProgress,
    type = "spinner",
    skeletonType = "text",
    skeletonLines = 3,
    skeletonRows = 5,
    skeletonColumns = 4,
    ...props
  }, ref) => {
    const renderContent = () => {
      switch (type) {
        case "spinner":
          return (
            <>
              <CircularProgress size="lg" />
              {message && (
                <p className="text-sm text-muted-foreground text-center">
                  {message}
                </p>
              )}
            </>
          )

        case "progress":
          return (
            <div className="w-full max-w-sm space-y-4">
              {message && (
                <p className="text-sm font-medium text-center">{message}</p>
              )}
              <Progress
                value={progress}
                showValue={showProgress}
                className="w-full"
              />
            </div>
          )

        case "skeleton":
          switch (skeletonType) {
            case "card":
              return <SkeletonCard className="w-full max-w-md" />
            case "table":
              return (
                <SkeletonTable
                  rows={skeletonRows}
                  columns={skeletonColumns}
                  className="w-full"
                />
              )
            case "text":
            default:
              return <SkeletonText lines={skeletonLines} className="w-full max-w-md" />
          }

        case "overlay":
          return (
            <div className="flex flex-col items-center space-y-4">
              <CircularProgress size="lg" />
              {message && (
                <p className="text-sm font-medium text-center">{message}</p>
              )}
            </div>
          )

        default:
          return null
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          loadingStateVariants({ variant: type, size }),
          className
        )}
        {...props}
      >
        {renderContent()}
      </div>
    )
  }
)
LoadingState.displayName = "LoadingState"

// Specialized loading components for common use cases
const ButtonLoading = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "default" | "lg"
  }
>(({ className, size = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    default: "w-4 h-4",
    lg: "w-5 h-5",
  }

  return (
    <CircularProgress
      ref={ref}
      size={size}
      className={cn("mr-2", sizeClasses[size], className)}
      {...props}
    />
  )
})
ButtonLoading.displayName = "ButtonLoading"

const PageLoading = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    message?: string
  }
>(({ className, message = "Loading...", ...props }, ref) => (
  <LoadingState
    ref={ref}
    type="overlay"
    message={message}
    className={cn("min-h-[200px]", className)}
    {...props}
  />
))
PageLoading.displayName = "PageLoading"

const TableLoading = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    rows?: number
    columns?: number
  }
>(({ className, rows = 5, columns = 4, ...props }, ref) => (
  <LoadingState
    ref={ref}
    type="skeleton"
    skeletonType="table"
    skeletonRows={rows}
    skeletonColumns={columns}
    className={className}
    {...props}
  />
))
TableLoading.displayName = "TableLoading"

const CardLoading = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <LoadingState
    ref={ref}
    type="skeleton"
    skeletonType="card"
    className={className}
    {...props}
  />
))
CardLoading.displayName = "CardLoading"

export {
  LoadingState,
  ButtonLoading,
  PageLoading,
  TableLoading,
  CardLoading,
}