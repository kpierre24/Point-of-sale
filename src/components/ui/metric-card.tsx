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
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const variantStyles = {
  default: {
    card: "border-border",
    icon: "text-primary",
    trend: {
      positive: "text-emerald-600",
      negative: "text-red-600"
    }
  },
  success: {
    card: "border-emerald-200 bg-emerald-50/50",
    icon: "text-emerald-600",
    trend: {
      positive: "text-emerald-700",
      negative: "text-red-600"
    }
  },
  warning: {
    card: "border-amber-200 bg-amber-50/50",
    icon: "text-amber-600",
    trend: {
      positive: "text-emerald-600",
      negative: "text-red-600"
    }
  },
  error: {
    card: "border-red-200 bg-red-50/50",
    icon: "text-red-600",
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
      "transition-all duration-200 hover:shadow-md",
      styles.card,
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-5 w-5", styles.icon)} />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col space-y-2">
          <div className="text-3xl font-bold tracking-tight">
            {value}
          </div>
          
          {trend && (
            <div className="flex items-center space-x-1">
              <span className={cn(
                "text-sm font-medium",
                trend.isPositive ? styles.trend.positive : styles.trend.negative
              )}>
                {trend.isPositive ? "+" : ""}{trend.value}
              </span>
              <span className="text-xs text-muted-foreground">
                vs last period
              </span>
            </div>
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