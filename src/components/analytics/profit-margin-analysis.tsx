"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

interface ProfitMarginAnalysisProps {
  data: Array<{
    category: string
    revenue: number
    cost: number
    margin: number
    trend: string
  }>
}

export function ProfitMarginAnalysis({ data }: ProfitMarginAnalysisProps) {
  const chartData = data.map(item => ({
    ...item,
    profit: item.revenue - item.cost,
    marginPercentage: item.margin
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Revenue vs Cost Chart */}
      <div>
        <h4 className="font-medium mb-4">Revenue vs Cost by Category</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip 
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                labelFormatter={(label) => `Category: ${label}`}
              />
              <Bar dataKey="revenue" name="Revenue" fill="#10B981" />
              <Bar dataKey="cost" name="Cost" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profit Margin Percentage */}
      <div>
        <h4 className="font-medium mb-4">Profit Margin by Category</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, "Profit Margin"]}
                labelFormatter={(label) => `Category: ${label}`}
              />
              <Bar dataKey="marginPercentage" name="Profit Margin %" fill="#8B5CF6">
                {chartData.map((entry, index) => (
                  <Bar 
                    key={`cell-${index}`}
                    fill={entry.marginPercentage >= 35 ? "#10B981" : entry.marginPercentage >= 25 ? "#F59E0B" : "#EF4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{item.category}</h4>
              <div className="flex items-center gap-1 text-sm">
                {item.trend.startsWith('+') ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={item.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {item.trend}
                </span>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue:</span>
                <span className="font-medium">{formatCurrency(item.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost:</span>
                <span className="font-medium">{formatCurrency(item.cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit:</span>
                <span className="font-medium text-green-600">{formatCurrency(item.revenue - item.cost)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Margin:</span>
                <span className={`font-bold ${
                  item.margin >= 35 ? 'text-green-600' : 
                  item.margin >= 25 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {item.margin}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Profit Optimization Insights</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Electronics category has the highest profit margin at 40%</li>
          <li>• Kitchen category showing strong growth trend (+8%)</li>
          <li>• Consider reviewing Furniture pricing strategy (margin declining)</li>
          <li>• Overall profit margin is healthy at 35.2% average</li>
        </ul>
      </div>
    </div>
  )
}