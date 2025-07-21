"use client"

import * as React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface CustomerSegmentationChartProps {
  data: Array<{
    segment: string
    count: number
    revenue: number
    avgOrderValue: number
    color: string
  }>
}

export function CustomerSegmentationChart({ data }: CustomerSegmentationChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Customer Count Pie Chart */}
      <div>
        <h4 className="font-medium mb-4">Customer Distribution</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={activeIndex === index ? "#000" : "none"}
                    strokeWidth={activeIndex === index ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">{data.segment}</p>
                        <p className="text-sm">Customers: {data.count}</p>
                        <p className="text-sm">Revenue: ${data.revenue.toLocaleString()}</p>
                        <p className="text-sm">Avg Order: ${data.avgOrderValue}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Pie Chart */}
      <div>
        <h4 className="font-medium mb-4">Revenue Distribution</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="revenue"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={activeIndex === index ? "#000" : "none"}
                    strokeWidth={activeIndex === index ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    const percentage = ((data.revenue / data.reduce((sum: number, item: any) => sum + item.revenue, 0)) * 100).toFixed(1)
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium">{data.segment}</p>
                        <p className="text-sm">Revenue: ${data.revenue.toLocaleString()} ({percentage}%)</p>
                        <p className="text-sm">Customers: {data.count}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}