// src/app/analytics/page.tsx
"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package,
  Target,
  Brain,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { useNotifications } from "@/hooks/use-notifications"
import { ProtectedComponent, PERMISSIONS } from "@/hooks/use-permissions"
import { addDays, subDays, format } from "date-fns"

// Dynamically import heavy chart components
const PredictiveAnalyticsChart = dynamic(() => import('@/components/analytics/predictive-analytics-chart').then(mod => mod.PredictiveAnalyticsChart), { ssr: false, loading: () => <p>Loading chart...</p> })
const CustomerSegmentationChart = dynamic(() => import('@/components/analytics/customer-segmentation-chart').then(mod => mod.CustomerSegmentationChart), { ssr: false, loading: () => <p>Loading chart...</p> })
const ProfitMarginAnalysis = dynamic(() => import('@/components/analytics/profit-margin-analysis').then(mod => mod.ProfitMarginAnalysis), { ssr: false, loading: () => <p>Loading chart...</p> })
const SalesForecastChart = dynamic(() => import('@/components/analytics/sales-forecast-chart').then(mod => mod.SalesForecastChart), { ssr: false, loading: () => <p>Loading chart...</p> })


// Mock analytics data - in a real app, this would come from your analytics service
const mockAnalyticsData = {
  predictiveInventory: [
    { product: "Laptop Pro", currentStock: 15, predictedNeed: 25, confidence: 0.85, trend: "increasing" },
    { product: "Wireless Mouse", currentStock: 45, predictedNeed: 30, confidence: 0.92, trend: "stable" },
    { product: "Office Chair", currentStock: 8, predictedNeed: 20, confidence: 0.78, trend: "seasonal" },
    { product: "Desk Lamp", currentStock: 22, predictedNeed: 15, confidence: 0.88, trend: "decreasing" },
  ],
  customerSegments: [
    { segment: "VIP Customers", count: 45, revenue: 125000, avgOrderValue: 2777, color: "#8B5CF6" },
    { segment: "Regular Customers", count: 180, revenue: 89000, avgOrderValue: 494, color: "#06B6D4" },
    { segment: "New Customers", count: 95, revenue: 23000, avgOrderValue: 242, color: "#10B981" },
    { segment: "At-Risk Customers", count: 32, revenue: 8500, avgOrderValue: 266, color: "#F59E0B" },
  ],
  profitMargins: [
    { category: "Electronics", revenue: 85000, cost: 51000, margin: 40, trend: "+5%" },
    { category: "Furniture", revenue: 45000, cost: 31500, margin: 30, trend: "-2%" },
    { category: "Kitchen", revenue: 28000, cost: 16800, margin: 40, trend: "+8%" },
    { category: "Office Supplies", revenue: 15000, cost: 10500, margin: 30, trend: "+3%" },
  ],
  salesForecast: [
    { month: "Jan", actual: 45000, predicted: 48000, confidence: 0.89 },
    { month: "Feb", actual: 52000, predicted: 51000, confidence: 0.91 },
    { month: "Mar", actual: 48000, predicted: 49000, confidence: 0.87 },
    { month: "Apr", actual: null, predicted: 55000, confidence: 0.85 },
    { month: "May", actual: null, predicted: 58000, confidence: 0.82 },
    { month: "Jun", actual: null, predicted: 62000, confidence: 0.79 },
  ]
}

export default function AnalyticsPage() {
  const { addNotification } = useNotifications()
  const [dateRange, setDateRange] = React.useState({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [selectedLocation, setSelectedLocation] = React.useState("all")
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefreshData = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRefreshing(false)
    addNotification({
      title: "Analytics Updated",
      message: "Latest data has been refreshed successfully",
      type: "success",
    })
  }

  const handleExportReport = (reportType: string) => {
    addNotification({
      title: "Export Started",
      message: `${reportType} report is being generated...`,
      type: "info",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Predictive insights and data-driven business intelligence
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <ProtectedComponent requiredPermissions={[PERMISSIONS.REPORTS_EXPORT]}>
            <Button onClick={() => handleExportReport("Analytics")}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </ProtectedComponent>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="main">Main Store</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Prediction Accuracy</p>
                <p className="text-2xl font-bold">87.3%</p>
                <p className="text-xs text-green-600">+2.1% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Customer Segments</p>
                <p className="text-2xl font-bold">4</p>
                <p className="text-xs text-blue-600">VIP: 45 customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Profit Margin</p>
                <p className="text-2xl font-bold">35.2%</p>
                <p className="text-xs text-green-600">+3.5% from last quarter</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Forecast Confidence</p>
                <p className="text-2xl font-bold">82.1%</p>
                <p className="text-xs text-orange-600">Next 3 months</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="predictive" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Predictive Analytics
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Insights
          </TabsTrigger>
          <TabsTrigger value="profits" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Profit Analysis
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Sales Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Predictive Inventory Needs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PredictiveAnalyticsChart data={mockAnalyticsData.predictiveInventory} />
              
              <div className="mt-6 space-y-3">
                <h4 className="font-medium">AI Recommendations</h4>
                {mockAnalyticsData.predictiveInventory.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.product}</p>
                      <p className="text-sm text-muted-foreground">
                        Current: {item.currentStock} | Predicted need: {item.predictedNeed}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.currentStock < item.predictedNeed ? "destructive" : "secondary"}>
                        {item.confidence * 100}% confidence
                      </Badge>
                      {item.currentStock < item.predictedNeed && (
                        <Button size="sm" onClick={() => addNotification({
                          title: "Reorder Suggested",
                          message: `Consider ordering ${item.predictedNeed - item.currentStock} more ${item.product}`,
                          type: "warning",
                          actionLabel: "Create Order",
                          actionUrl: "/purchases"
                        })}>
                          Reorder
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Segmentation Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerSegmentationChart data={mockAnalyticsData.customerSegments} />
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockAnalyticsData.customerSegments.map((segment, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: segment.color }}
                      />
                      <h4 className="font-medium">{segment.segment}</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>Customers: {segment.count}</p>
                      <p>Revenue: ${segment.revenue.toLocaleString()}</p>
                      <p>Avg Order: ${segment.avgOrderValue}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => addNotification({
                        title: "Marketing Campaign",
                        message: `Campaign ideas generated for ${segment.segment}`,
                        type: "info"
                      })}
                    >
                      Create Campaign
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Profit Margin Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProfitMarginAnalysis data={mockAnalyticsData.profitMargins} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sales Forecasting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalesForecastChart data={mockAnalyticsData.salesForecast} />
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Forecast Insights</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Expected 15% growth in Q2 based on seasonal trends</li>
                  <li>• Electronics category showing strongest growth potential</li>
                  <li>• Recommend increasing inventory by 20% for April-May</li>
                  <li>• Customer acquisition rate trending upward</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
