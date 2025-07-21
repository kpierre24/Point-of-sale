// src/components/ui/stock-indicator.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockIndicatorProps {
  stockLevel: number;
  lowStockThreshold?: number;
  outOfStockThreshold?: number;
  showIcon?: boolean;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StockIndicator({
  stockLevel,
  lowStockThreshold = 10,
  outOfStockThreshold = 0,
  showIcon = true,
  showText = true,
  size = "md",
  className,
}: StockIndicatorProps) {
  const getStockStatus = () => {
    if (stockLevel <= outOfStockThreshold) {
      return {
        status: "out-of-stock" as const,
        variant: "destructive" as const,
        icon: XCircle,
        text: "Out of Stock",
        color: "text-red-600",
        bgColor: "bg-red-50 border-red-200",
      };
    } else if (stockLevel <= lowStockThreshold) {
      return {
        status: "low-stock" as const,
        variant: "secondary" as const,
        icon: AlertTriangle,
        text: "Low Stock",
        color: "text-amber-600",
        bgColor: "bg-amber-50 border-amber-200",
      };
    } else {
      return {
        status: "in-stock" as const,
        variant: "default" as const,
        icon: CheckCircle,
        text: "In Stock",
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200",
      };
    }
  };

  const stockInfo = getStockStatus();
  const Icon = stockInfo.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge
        variant={stockInfo.variant}
        className={cn(
          sizeClasses[size],
          stockInfo.bgColor,
          stockInfo.color,
          "border font-medium"
        )}
      >
        {showIcon && <Icon className={cn(iconSizes[size], "mr-1")} />}
        {showText && stockInfo.text}
      </Badge>
      <span className={cn("font-semibold", stockInfo.color, size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm")}>
        {stockLevel} units
      </span>
    </div>
  );
}

// Compact version for use in tables and lists
export function CompactStockIndicator({
  stockLevel,
  lowStockThreshold = 10,
  outOfStockThreshold = 0,
  className,
}: Omit<StockIndicatorProps, "showIcon" | "showText" | "size">) {
  const getStockStatus = () => {
    if (stockLevel <= outOfStockThreshold) {
      return {
        color: "text-red-600",
        bgColor: "bg-red-100",
        dotColor: "bg-red-500",
      };
    } else if (stockLevel <= lowStockThreshold) {
      return {
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        dotColor: "bg-amber-500",
      };
    } else {
      return {
        color: "text-green-600",
        bgColor: "bg-green-100",
        dotColor: "bg-green-500",
      };
    }
  };

  const stockInfo = getStockStatus();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("w-2 h-2 rounded-full", stockInfo.dotColor)} />
      <span className={cn("font-medium text-sm", stockInfo.color)}>
        {stockLevel}
      </span>
    </div>
  );
}