"use client"

import * as React from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

interface SalesForecastChartProps {
  data: Array<{
    month: string
    actual: number | null
    predicted: number
    confidence: number
  }>
}

export function SalesForecastChart({ data }: SalesForecastChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const chartData = data.map(item => ({
    ...item,
    confidenceRange: item.predicted * (1 - item.confidence),
    upperBound: item.predicted * (1 + (1 - item.confidence) * 0.5),
    lowerBound: item.predicted * (1 - (1 - item.confidence) * 0.5)
  }))

  return (
    <div className="space-y-6">
      {/* Main Forecast Chart */}
      <div>
        <h4 className="font-medium mb-4">Sales Forecast vs Actual</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">{label}</p>
                        {data.actual && (
                          <p className="text-sm">Actual: {formatCurrency(data.actual)}</p>
                        )}
                        <p className="text-sm">Predicted: {formatCurrency(data.predicted)}</p>
                        <p className="text-sm">Confidence: {(data.confidence * 100).toFixed(1)}%</p>
                        {!data.actual && (
                          <p className="text-sm text-blue-600">Forecast</p>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                connectNulls={false}
                name="Actual Sales"
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
                name="Predicted Sales"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confidence Intervals */}
      <div>
        <h4 className="font-medium mb-4">Forecast Confidence Intervals</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip 
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="upperBound"
                stackId="1"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.1}
                name="Upper Bound"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stackId="1"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.1}
                name="Lower Bound"
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                name="Predicted"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Accuracy Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Forecast Accuracy</h4>
          <div className="text-2xl font-bold text-green-600">94.2%</div>
          <p className="text-sm text-muted-foreground">Last 6 months average</p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Mean Absolute Error</h4>
          <div className="text-2xl font-bold text-blue-600">$2,847</div>
          <p className="text-sm text-muted-foreground">Average prediction error</p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Trend Direction</h4>
          <div className="text-2xl font-bold text-purple-600">↗ Upward</div>
          <p className="text-sm text-muted-foreground">15% growth expected</p>
        </div>
      </div>

      {/* Key Insights */}
      <div className="p-4 bg-purple-50 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-2">Forecast Key Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
          <div>
            <h5 className="font-medium mb-1">Growth Drivers</h5>
            <ul className="space-y-1">
              <li>• Seasonal uptick in Q2</li>
              <li>• New product launches</li>
              <li>• Marketing campaign impact</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-1">Risk Factors</h5>
            <ul className="space-y-1">
              <li>• Economic uncertainty</li>
              <li>• Supply chain delays</li>
              <li>• Competitive pressure</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}