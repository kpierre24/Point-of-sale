import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground transition-all duration-300 ease-in-out transform-gpu",
  {
    variants: {
      variant: {
        default: "shadow-card hover:shadow-card-hover hover:-translate-y-0.5",
        elevated: "shadow-elevated hover:shadow-elevated border-0 hover:-translate-y-1",
        flat: "shadow-none border-border hover:border-ring/30",
        interactive: "shadow-card hover:shadow-card-hover cursor-pointer hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] active:translate-y-0",
      },
      padding: {
        default: "p-card-padding",
        sm: "p-4",
        lg: "p-8",
        none: "p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-card-padding pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-card-title font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-card-padding pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-card-padding pt-4 border-t border-border", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Specialized Metric Card Component
export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: string
  trendDirection?: "up" | "down" | "neutral"
  description?: string
  variant?: "default" | "elevated"
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ 
    className, 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendDirection = "neutral", 
    description, 
    variant = "default",
    ...props 
  }, ref) => {
    const getTrendColor = () => {
      switch (trendDirection) {
        case "up":
          return "text-success"
        case "down":
          return "text-destructive"
        default:
          return "text-muted-foreground"
      }
    }

    return (
      <Card ref={ref} variant={variant} className={cn("", className)} {...props}>
        <CardContent className="p-card-padding">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {title}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-metric font-bold text-foreground tabular-nums">
                  {value}
                </p>
                {trend && (
                  <span className={cn("text-sm font-medium", getTrendColor())}>
                    {trend}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            {Icon && (
              <div className="flex-shrink-0 ml-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
MetricCard.displayName = "MetricCard"

// Status Indicator Card Component
export interface StatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  status: "success" | "warning" | "error" | "info"
  message: string
  action?: React.ReactNode
}

const StatusCard = React.forwardRef<HTMLDivElement, StatusCardProps>(
  ({ className, title, status, message, action, ...props }, ref) => {
    const getStatusStyles = () => {
      switch (status) {
        case "success":
          return "border-success/20 bg-success/5"
        case "warning":
          return "border-warning/20 bg-warning/5"
        case "error":
          return "border-destructive/20 bg-destructive/5"
        default:
          return "border-primary/20 bg-primary/5"
      }
    }

    const getStatusTextColor = () => {
      switch (status) {
        case "success":
          return "text-success"
        case "warning":
          return "text-warning"
        case "error":
          return "text-destructive"
        default:
          return "text-primary"
      }
    }

    return (
      <Card 
        ref={ref} 
        className={cn(
          "border-2",
          getStatusStyles(),
          className
        )} 
        {...props}
      >
        <CardContent className="p-card-padding">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={cn("font-medium mb-1", getStatusTextColor())}>
                {title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            </div>
            {action && (
              <div className="flex-shrink-0 ml-4">
                {action}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
StatusCard.displayName = "StatusCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  MetricCard,
  StatusCard
}
