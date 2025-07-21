// src/components/charts/DailySalesChart.tsx
"use client"

import type { DailySalesData } from "@/types";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface DailySalesChartProps {
  data: DailySalesData[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatCurrencyForAxis = (value: number) => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value}`;
};

export function DailySalesChart({ data }: DailySalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold">Daily Sales Revenue</CardTitle>
          </div>
          <CardDescription>No sales data available for this period.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Awaiting sales data...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend
  const totalRevenue = data.reduce((sum, day) => sum + day.totalSales, 0);
  const averageDaily = totalRevenue / data.length;

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold">Daily Sales Revenue</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">7-day total</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
        <CardDescription>
          Revenue trends over the last 7 days • Avg: {formatCurrency(averageDaily)}/day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            barCategoryGap="20%"
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'numeric', 
                day: 'numeric' 
              })}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              tickFormatter={formatCurrencyForAxis}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                border: '1px solid hsl(var(--border))',
                padding: '12px'
              }}
              labelStyle={{ 
                color: 'hsl(var(--foreground))',
                fontWeight: '600',
                marginBottom: '4px'
              }}
              itemStyle={{ 
                color: '#1e40af',
                fontWeight: '500'
              }}
              formatter={(value: number) => [formatCurrency(value), "Revenue"]}
              labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long', 
                day: 'numeric' 
              })}
            />
            <Bar 
              dataKey="totalSales" 
              fill="#1e40af"
              radius={[6, 6, 0, 0]}
              className="transition-all duration-200 hover:opacity-80"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}