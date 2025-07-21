import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { LucideIcon, Circle, AlertCircle, CheckCircle, XCircle, Clock, Package, TrendingUp, TrendingDown } from "lucide-react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transform-gpu hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        outline: "text-foreground border-border",
        "outline-success": "text-success border-success/20 bg-success/10",
        "outline-warning": "text-warning border-warning/20 bg-warning/10",
        "outline-destructive": "text-destructive border-destructive/20 bg-destructive/10",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

// Status Badge Component for inventory and order status
export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: "success" | "warning" | "error" | "info" | "pending"
  size?: "sm" | "default" | "lg"
  withIcon?: boolean
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, variant, size = "default", withIcon = true, children, ...props }, ref) => {
    const getVariantMapping = () => {
      switch (variant) {
        case "success":
          return "success"
        case "warning":
          return "warning"
        case "error":
          return "destructive"
        case "pending":
          return "secondary"
        default:
          return "default"
      }
    }

    const getIcon = () => {
      if (!withIcon) return null
      
      switch (variant) {
        case "success":
          return <CheckCircle className="w-3 h-3 mr-1" />
        case "warning":
          return <AlertCircle className="w-3 h-3 mr-1" />
        case "error":
          return <XCircle className="w-3 h-3 mr-1" />
        case "pending":
          return <Clock className="w-3 h-3 mr-1" />
        default:
          return <Circle className="w-3 h-3 mr-1" />
      }
    }

    return (
      <Badge
        ref={ref}
        variant={getVariantMapping() as any}
        size={size}
        className={cn("", className)}
        {...props}
      >
        {getIcon()}
        {children}
      </Badge>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

// Inventory Status Indicator
export interface InventoryStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  stockLevel: number
  lowStockThreshold?: number
  outOfStockThreshold?: number
  showLabel?: boolean
}

const InventoryStatus = React.forwardRef<HTMLDivElement, InventoryStatusProps>(
  ({ 
    className, 
    stockLevel, 
    lowStockThreshold = 10, 
    outOfStockThreshold = 0,
    showLabel = true,
    ...props 
  }, ref) => {
    const getStatus = () => {
      if (stockLevel <= outOfStockThreshold) {
        return { variant: "error" as const, label: "Out of Stock", icon: XCircle }
      } else if (stockLevel <= lowStockThreshold) {
        return { variant: "warning" as const, label: "Low Stock", icon: AlertCircle }
      } else {
        return { variant: "success" as const, label: "In Stock", icon: CheckCircle }
      }
    }

    const status = getStatus()
    const Icon = status.icon

    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)} {...props}>
        <StatusBadge variant={status.variant} withIcon={false}>
          <Icon className="w-3 h-3 mr-1" />
          {showLabel ? status.label : stockLevel}
        </StatusBadge>
        {showLabel && (
          <span className="text-sm text-muted-foreground">
            ({stockLevel} units)
          </span>
        )}
      </div>
    )
  }
)
InventoryStatus.displayName = "InventoryStatus"

// Order Status Indicator
export interface OrderStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "pending" | "processing" | "completed" | "cancelled" | "refunded"
  showIcon?: boolean
}

const OrderStatus = React.forwardRef<HTMLDivElement, OrderStatusProps>(
  ({ className, status, showIcon = true, ...props }, ref) => {
    const getStatusConfig = () => {
      switch (status) {
        case "pending":
          return { variant: "pending" as const, label: "Pending", icon: Clock }
        case "processing":
          return { variant: "info" as const, label: "Processing", icon: Package }
        case "completed":
          return { variant: "success" as const, label: "Completed", icon: CheckCircle }
        case "cancelled":
          return { variant: "error" as const, label: "Cancelled", icon: XCircle }
        case "refunded":
          return { variant: "warning" as const, label: "Refunded", icon: AlertCircle }
        default:
          return { variant: "info" as const, label: "Unknown", icon: Circle }
      }
    }

    const config = getStatusConfig()

    return (
      <StatusBadge
        ref={ref}
        variant={config.variant}
        withIcon={showIcon}
        className={className}
        {...props}
      >
        {config.label}
      </StatusBadge>
    )
  }
)
OrderStatus.displayName = "OrderStatus"

// Trend Indicator Component
export interface TrendIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  direction: "up" | "down" | "neutral"
  value?: string
  size?: "sm" | "default" | "lg"
}

const TrendIndicator = React.forwardRef<HTMLDivElement, TrendIndicatorProps>(
  ({ className, direction, value, size = "default", ...props }, ref) => {
    const getTrendConfig = () => {
      switch (direction) {
        case "up":
          return { 
            variant: "outline-success" as const, 
            icon: TrendingUp, 
            color: "text-success" 
          }
        case "down":
          return { 
            variant: "outline-destructive" as const, 
            icon: TrendingDown, 
            color: "text-destructive" 
          }
        default:
          return { 
            variant: "outline" as const, 
            icon: Circle, 
            color: "text-muted-foreground" 
          }
      }
    }

    const config = getTrendConfig()
    const Icon = config.icon

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        size={size}
        className={cn("", className)}
        {...props}
      >
        <Icon className="w-3 h-3 mr-1" />
        {value}
      </Badge>
    )
  }
)
TrendIndicator.displayName = "TrendIndicator"

export { 
  Badge, 
  badgeVariants, 
  StatusBadge, 
  InventoryStatus, 
  OrderStatus, 
  TrendIndicator 
}
