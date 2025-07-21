"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Mail, 
  Users, 
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  Calendar,
  Target,
  Plus,
  BarChart3
} from "lucide-react"
import { format } from "date-fns"

interface MarketingCampaignCardProps {
  campaigns: Array<{
    id: string
    name: string
    type: string
    status: string
    targetSegment: string
    sentTo: number
    openRate: number
    clickRate: number
    conversions: number
    revenue: number
    startDate: Date
    endDate: Date
  }>
  onCreateCampaign: (segment: string) => void
}

export function MarketingCampaignCard({ campaigns, onCreateCampaign }: MarketingCampaignCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800 border-green-200"
      case "completed": return "bg-blue-100 text-blue-800 border-blue-200"
      case "draft": return "bg-gray-100 text-gray-800 border-gray-200"
      case "scheduled": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "promotional": return "bg-orange-100 text-orange-800 border-orange-200"
      case "exclusive": return "bg-purple-100 text-purple-800 border-purple-200"
      case "newsletter": return "bg-blue-100 text-blue-800 border-blue-200"
      case "welcome": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.sentTo, 0)
  const totalRevenue = campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0)
  const avgOpenRate = campaigns.reduce((sum, campaign) => sum + campaign.openRate, 0) / campaigns.length
  const avgClickRate = campaigns.reduce((sum, campaign) => sum + campaign.clickRate, 0) / campaigns.length

  return (
    <div className="space-y-6">
      {/* Campaign Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{totalSent.toLocaleString()}</p>
                <p className="text-xs text-blue-600">Across all campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Open Rate</p>
                <p className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</p>
                <p className="text-xs text-green-600">Industry avg: 21.3%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Click Rate</p>
                <p className="text-2xl font-bold">{avgClickRate.toFixed(1)}%</p>
                <p className="text-xs text-purple-600">Industry avg: 2.6%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-orange-600">From campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Marketing Campaigns
            </CardTitle>
            <Button onClick={() => onCreateCampaign("All Customers")}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Badge className={getTypeColor(campaign.type)}>
                        {campaign.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Target: {campaign.targetSegment} • Sent to {campaign.sentTo.toLocaleString()} customers
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(campaign.startDate, 'MMM dd')} - {format(campaign.endDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      ${campaign.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Eye className="h-3 w-3 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Open Rate</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600">{campaign.openRate}%</p>
                    <Progress value={campaign.openRate} className="h-1 mt-1" />
                  </div>
                  
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <MousePointer className="h-3 w-3 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Click Rate</span>
                    </div>
                    <p className="text-xl font-bold text-purple-600">{campaign.clickRate}%</p>
                    <Progress value={campaign.clickRate * 10} className="h-1 mt-1" />
                  </div>
                  
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Conversions</span>
                    </div>
                    <p className="text-xl font-bold text-green-600">{campaign.conversions}</p>
                    <Progress value={(campaign.conversions / campaign.sentTo) * 100 * 10} className="h-1 mt-1" />
                  </div>
                  
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">ROI</span>
                    </div>
                    <p className="text-xl font-bold text-orange-600">
                      {((campaign.revenue / (campaign.sentTo * 0.1)) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Button size="sm" variant="outline">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  <Button size="sm" variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    View Audience
                  </Button>
                  {campaign.status === "Active" && (
                    <Button size="sm" variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule Follow-up
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Campaign Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                 onClick={() => onCreateCampaign("VIP Customers")}>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="font-medium">VIP Exclusive</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Special offers for your most valuable customers
              </p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                 onClick={() => onCreateCampaign("At-Risk Customers")}>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-red-500" />
                <span className="font-medium">Win-Back</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Re-engage customers who haven't purchased recently
              </p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                 onClick={() => onCreateCampaign("New Customers")}>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-green-500" />
                <span className="font-medium">Welcome Series</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Onboard new customers with helpful content
              </p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                 onClick={() => onCreateCampaign("All Customers")}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Seasonal Sale</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Promote seasonal products and offers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Best Performing</h4>
              <p className="text-sm text-green-800">
                VIP Exclusive campaigns have 3x higher conversion rates
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Optimal Timing</h4>
              <p className="text-sm text-blue-800">
                Tuesday 10 AM shows highest open rates (32.4%)
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Recommendation</h4>
              <p className="text-sm text-purple-800">
                Focus on personalized subject lines to improve engagement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}