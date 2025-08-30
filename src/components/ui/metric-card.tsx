import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'interactive';
}

const variantStyles = {
  default: {
    card: "border-border",
    iconContainer: "bg-primary/10",
    icon: "text-primary",
    trend: {
      positive: "text-emerald-600",
      negative: "text-red-600"
    }
  },
  success: {
    card: "border-emerald-200 bg-emerald-50/50",
    iconContainer: "bg-emerald-100",
    icon: "text-emerald-600",
    trend: {
      positive: "text-emerald-700",
      negative: "text-red-600"
    }
  },
  warning: {
    card: "border-amber-200 bg-amber-50/50",
    iconContainer: "bg-amber-100",
    icon: "text-amber-600",
    trend: {
      positive: "text-emerald-600",
      negative: "text-red-600"
    }
  },
  error: {
    card: "border-red-200 bg-red-50/50",
    iconContainer: "bg-red-100",
    icon: "text-red-600",
    trend: {
      positive: "text-emerald-600",
      negative: "text-red-600"
    }
  },
  interactive: {
    card: "border-border hover:shadow-card-hover cursor-pointer hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] active:translate-y-0",
    iconContainer: "bg-primary/10",
    icon: "text-primary",
    trend: {
      positive: "text-emerald-600",
      negative: "text-red-600"
    }
  }
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  variant = 'default'
}: MetricCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <Card className={cn(
      "transition-all duration-200",
      styles.card,
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
         <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", styles.iconContainer)}>
            <Icon className={cn("h-4 w-4", styles.icon)} />
         </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-bold tracking-tight">
          {value}
        </div>
        <div className="flex items-center space-x-1">
          {trend && (
            <span className={cn(
              "text-xs font-medium",
              trend.isPositive ? styles.trend.positive : styles.trend.negative
            )}>
              {trend.isPositive ? "▲" : "▼"} {trend.value}
            </span>
          )}
          {description && (
             <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
