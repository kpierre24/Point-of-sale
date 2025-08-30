// src/components/charts/TopCategoriesChart.tsx
"use client"
import React from 'react';
import type { ProductCategorySalesData } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package } from "lucide-react";

interface TopCategoriesChartProps {
  data: ProductCategorySalesData[];
}

// Professional business color palette
const BUSINESS_COLORS = [
  "#1e40af", // Primary business blue
  "#059669", // Success green
  "#d97706", // Warning amber
  "#dc2626", // Error red
  "#7c3aed", // Purple
  "#0891b2", // Cyan
  "#be185d", // Pink
  "#65a30d", // Lime
]; 

function TopCategoriesChartComponent({ data }: TopCategoriesChartProps) {
   if (!data || data.length === 0) {
    return (
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg font-semibold">Top Product Categories</CardTitle>
          </div>
          <CardDescription>By quantity sold. No category data available.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Awaiting sales data...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate total units sold
  const totalUnits = data.reduce((sum, category) => sum + category.quantitySold, 0);

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg font-semibold">Top Product Categories</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total units</p>
            <p className="text-lg font-bold text-emerald-600">{totalUnits.toLocaleString()}</p>
          </div>
        </div>
        <CardDescription>
          Sales distribution by product category • Top {data.length} categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={90}
              innerRadius={40}
              fill="#1e40af"
              dataKey="quantitySold"
              nameKey="category"
              stroke="#ffffff"
              strokeWidth={2}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, category }) => {
                // Only show label if percentage is significant enough
                if (percent < 0.05) return null;
                
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text 
                    x={x} 
                    y={y} 
                    fill="white" 
                    textAnchor={x > cx ? 'start' : 'end'} 
                    dominantBaseline="central" 
                    fontSize={12}
                    fontWeight="600"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
                  >
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={BUSINESS_COLORS[index % BUSINESS_COLORS.length]}
                  className="transition-all duration-200 hover:opacity-80"
                />
              ))}
            </Pie>
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
                color: 'hsl(var(--foreground))',
                fontWeight: '500'
              }}
              formatter={(value: number, name: string, props: any) => {
                const percentage = ((value / totalUnits) * 100).toFixed(1);
                return [
                  `${value.toLocaleString()} units (${percentage}%)`, 
                  props.payload.category
                ];
              }}
            />
            <Legend 
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px'
              }}
              formatter={(value, entry) => (
                <span style={{ 
                  color: 'hsl(var(--foreground))',
                  fontWeight: '500'
                }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export const TopCategoriesChart = React.memo(TopCategoriesChartComponent);
