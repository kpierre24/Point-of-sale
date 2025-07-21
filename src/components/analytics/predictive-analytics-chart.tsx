"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface PredictiveAnalyticsChartProps {
  data: Array<{
    product: string
    currentStock: number
    predictedNeed: number
    confidence: number
    trend: string
  }>
}

export function PredictiveAnalyticsChart({ data }: PredictiveAnalyticsChartProps) {
  const chartData = data.map(item => ({
    ...item,
    stockGap: item.predictedNeed - item.currentStock,
    needsReorder: item.currentStock < item.predictedNeed
  }))

  const getBarColor = (item: any) => {
    if (item.needsReorder) return "#EF4444" // Red for needs reorder
    if (item.stockGap < 0) return "#10B981" // Green for overstocked
    return "#6B7280" // Gray for adequate
  }

  return (
    <div className="space-y-4">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="product" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="font-medium">{label}</p>
                      <p className="text-sm">Current Stock: {data.currentStock}</p>
                      <p className="text-sm">Predicted Need: {data.predictedNeed}</p>
                      <p className="text-sm">Confidence: {(data.confidence * 100).toFixed(1)}%</p>
                      <p className="text-sm">Trend: {data.trend}</p>
                      {data.needsReorder && (
                        <p className="text-sm text-red-600 font-medium">⚠️ Reorder needed</p>
                      )}
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="currentStock" name="Current Stock" fill="#3B82F6" />
            <Bar dataKey="predictedNeed" name="Predicted Need" fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Current Stock</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span>Predicted Need</span>
        </div>
      </div>
    </div>
  )
}