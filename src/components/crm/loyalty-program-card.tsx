"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Star, 
  Gift, 
  Users, 
  TrendingUp,
  Award,
  Crown,
  Gem,
  Zap
} from "lucide-react"

interface LoyaltyProgramCardProps {
  program: {
    totalMembers: number
    activeMembers: number
    pointsIssued: number
    pointsRedeemed: number
    tiers: Array<{
      name: string
      members: number
      minSpend: number
      benefits: string[]
    }>
  }
}

export function LoyaltyProgramCard({ program }: LoyaltyProgramCardProps) {
  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case "bronze": return <Award className="h-4 w-4 text-amber-600" />
      case "silver": return <Star className="h-4 w-4 text-gray-500" />
      case "gold": return <Crown className="h-4 w-4 text-yellow-500" />
      case "platinum": return <Gem className="h-4 w-4 text-purple-500" />
      default: return <Gift className="h-4 w-4" />
    }
  }

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case "bronze": return "bg-amber-100 text-amber-800 border-amber-200"
      case "silver": return "bg-gray-100 text-gray-800 border-gray-200"
      case "gold": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "platinum": return "bg-purple-100 text-purple-800 border-purple-200"
      default: return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const pointsRedemptionRate = (program.pointsRedeemed / program.pointsIssued) * 100

  return (
    <div className="space-y-6">
      {/* Program Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{program.totalMembers.toLocaleString()}</p>
                <p className="text-xs text-green-600">+15% this quarter</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold">{program.activeMembers.toLocaleString()}</p>
                <p className="text-xs text-blue-600">{((program.activeMembers / program.totalMembers) * 100).toFixed(1)}% active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Points Issued</p>
                <p className="text-2xl font-bold">{program.pointsIssued.toLocaleString()}</p>
                <p className="text-xs text-purple-600">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Redemption Rate</p>
                <p className="text-2xl font-bold">{pointsRedemptionRate.toFixed(1)}%</p>
                <p className="text-xs text-orange-600">Points redeemed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Loyalty Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {program.tiers.map((tier, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  {getTierIcon(tier.name)}
                  <Badge className={getTierColor(tier.name)}>
                    {tier.name}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Members:</span>
                    <span className="font-medium">{tier.members}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Min Spend:</span>
                    <span className="font-medium">${tier.minSpend.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Benefits:</p>
                  <ul className="text-xs space-y-1">
                    {tier.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="text-muted-foreground">
                        • {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <Progress 
                  value={(tier.members / program.totalMembers) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {((tier.members / program.totalMembers) * 100).toFixed(1)}% of members
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Program Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Points Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Points Issued</span>
                <span className="font-bold text-green-600">+{program.pointsIssued.toLocaleString()}</span>
              </div>
              <Progress value={75} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Points Redeemed</span>
                <span className="font-bold text-blue-600">-{program.pointsRedeemed.toLocaleString()}</span>
              </div>
              <Progress value={pointsRedemptionRate} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Net Points</span>
                <span className="font-bold text-purple-600">
                  {(program.pointsIssued - program.pointsRedeemed).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Program Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900">High Engagement</p>
                <p className="text-xs text-green-700">
                  {pointsRedemptionRate.toFixed(1)}% redemption rate is above industry average
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Tier Distribution</p>
                <p className="text-xs text-blue-700">
                  Good balance across tiers with {program.tiers[0].members} Bronze members
                </p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900">Growth Opportunity</p>
                <p className="text-xs text-purple-700">
                  Focus on converting Silver to Gold tier members
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Program Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Gift className="h-4 w-4 mr-2" />
              Issue Bonus Points
            </Button>
            <Button variant="outline">
              <Star className="h-4 w-4 mr-2" />
              Create Tier Promotion
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Member Engagement Campaign
            </Button>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}