"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Star, 
  Mail, 
  Phone, 
  Calendar,
  DollarSign,
  ShoppingBag,
  Gift,
  MessageSquare,
  Search,
  Filter,
  Plus,
  TrendingUp,
  Heart,
  Award
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CustomerProfileDialog } from "@/components/crm/customer-profile-dialog"
import { LoyaltyProgramCard } from "@/components/crm/loyalty-program-card"
import { MarketingCampaignCard } from "@/components/crm/marketing-campaign-card"
import { CustomerSupportTickets } from "@/components/crm/customer-support-tickets"
import { useNotifications } from "@/hooks/use-notifications"
import { ProtectedComponent, PERMISSIONS } from "@/hooks/use-permissions"
import { format, subDays } from "date-fns"

// Mock CRM data - in a real app, this would come from your CRM service
const mockCustomers = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    segment: "VIP",
    totalSpent: 15420,
    totalOrders: 28,
    avgOrderValue: 551,
    lastPurchase: subDays(new Date(), 3),
    loyaltyPoints: 1542,
    loyaltyTier: "Gold",
    preferences: ["Electronics", "Premium Products"],
    communicationPrefs: ["Email", "SMS"],
    birthday: new Date(1985, 5, 15),
    joinDate: new Date(2022, 1, 10),
    notes: "Prefers premium products, responds well to exclusive offers",
    status: "Active"
  },
  {
    id: "2", 
    name: "Michael Chen",
    email: "m.chen@email.com",
    phone: "+1 (555) 987-6543",
    segment: "Regular",
    totalSpent: 3240,
    totalOrders: 12,
    avgOrderValue: 270,
    lastPurchase: subDays(new Date(), 7),
    loyaltyPoints: 324,
    loyaltyTier: "Silver",
    preferences: ["Office Supplies", "Tech Gadgets"],
    communicationPrefs: ["Email"],
    birthday: new Date(1990, 8, 22),
    joinDate: new Date(2023, 3, 5),
    notes: "Price-conscious, likes bulk purchases",
    status: "Active"
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.r@email.com", 
    phone: "+1 (555) 456-7890",
    segment: "At-Risk",
    totalSpent: 890,
    totalOrders: 4,
    avgOrderValue: 223,
    lastPurchase: subDays(new Date(), 45),
    loyaltyPoints: 89,
    loyaltyTier: "Bronze",
    preferences: ["Home & Garden"],
    communicationPrefs: ["Email"],
    birthday: new Date(1992, 11, 3),
    joinDate: new Date(2023, 8, 20),
    notes: "New customer, needs engagement",
    status: "At-Risk"
  }
]

const mockLoyaltyProgram = {
  totalMembers: 1247,
  activeMembers: 892,
  pointsIssued: 45230,
  pointsRedeemed: 23150,
  tiers: [
    { name: "Bronze", members: 623, minSpend: 0, benefits: ["5% discount", "Birthday reward"] },
    { name: "Silver", members: 398, minSpend: 1000, benefits: ["10% discount", "Free shipping", "Early access"] },
    { name: "Gold", members: 189, minSpend: 5000, benefits: ["15% discount", "Priority support", "Exclusive events"] },
    { name: "Platinum", members: 37, minSpend: 15000, benefits: ["20% discount", "Personal shopper", "VIP events"] }
  ]
}

const mockCampaigns = [
  {
    id: "1",
    name: "Summer Sale 2024",
    type: "Promotional",
    status: "Active",
    targetSegment: "All Customers",
    sentTo: 1247,
    openRate: 24.5,
    clickRate: 3.2,
    conversions: 89,
    revenue: 12450,
    startDate: subDays(new Date(), 5),
    endDate: new Date(2024, 6, 31)
  },
  {
    id: "2",
    name: "VIP Exclusive Preview",
    type: "Exclusive",
    status: "Completed",
    targetSegment: "VIP Customers",
    sentTo: 156,
    openRate: 68.2,
    clickRate: 15.4,
    conversions: 34,
    revenue: 8920,
    startDate: subDays(new Date(), 14),
    endDate: subDays(new Date(), 7)
  }
]

export default function CRMPage() {
  const { addNotification } = useNotifications()
  const [selectedCustomer, setSelectedCustomer] = React.useState(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedSegment, setSelectedSegment] = React.useState("all")

  const filteredCustomers = React.useMemo(() => {
    return mockCustomers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSegment = selectedSegment === "all" || customer.segment.toLowerCase() === selectedSegment.toLowerCase()
      return matchesSearch && matchesSegment
    })
  }, [searchQuery, selectedSegment])

  const handleCreateCampaign = (segment: string) => {
    addNotification({
      title: "Campaign Created",
      message: `New marketing campaign created for ${segment} customers`,
      type: "success",
    })
  }

  const handleSendMessage = (customerId: string) => {
    const customer = mockCustomers.find(c => c.id === customerId)
    addNotification({
      title: "Message Sent",
      message: `Message sent to ${customer?.name}`,
      type: "success",
    })
  }

  const getSegmentColor = (segment: string) => {
    switch (segment.toLowerCase()) {
      case "vip": return "bg-purple-100 text-purple-800 border-purple-200"
      case "regular": return "bg-blue-100 text-blue-800 border-blue-200"
      case "new": return "bg-green-100 text-green-800 border-green-200"
      case "at-risk": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Relationship Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage customer relationships, loyalty programs, and marketing campaigns
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <ProtectedComponent requiredPermissions={[PERMISSIONS.CUSTOMERS_CREATE]}>
            <Button onClick={() => setSelectedCustomer({})}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </ProtectedComponent>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{mockCustomers.length}</p>
                <p className="text-xs text-green-600">+12% this month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Customer Value</p>
                <p className="text-2xl font-bold">$6,517</p>
                <p className="text-xs text-green-600">+8.3% from last quarter</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Loyalty Members</p>
                <p className="text-2xl font-bold">{mockLoyaltyProgram.activeMembers}</p>
                <p className="text-xs text-blue-600">{((mockLoyaltyProgram.activeMembers / mockLoyaltyProgram.totalMembers) * 100).toFixed(1)}% active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Retention Rate</p>
                <p className="text-2xl font-bold">87.3%</p>
                <p className="text-xs text-green-600">+2.1% improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CRM Tabs */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Loyalty Program
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Marketing
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          {/* Customer Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search customers by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <select 
                    value={selectedSegment}
                    onChange={(e) => setSelectedSegment(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Segments</option>
                    <option value="vip">VIP</option>
                    <option value="regular">Regular</option>
                    <option value="new">New</option>
                    <option value="at-risk">At-Risk</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer List */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Loyalty Tier</TableHead>
                    <TableHead>Last Purchase</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSegmentColor(customer.segment)}>
                          {customer.segment}
                        </Badge>
                      </TableCell>
                      <TableCell>${customer.totalSpent.toLocaleString()}</TableCell>
                      <TableCell>{customer.totalOrders}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {customer.loyaltyTier}
                        </div>
                      </TableCell>
                      <TableCell>{format(customer.lastPurchase, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            View Profile
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleSendMessage(customer.id)}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-4">
          <LoyaltyProgramCard program={mockLoyaltyProgram} />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <MarketingCampaignCard 
            campaigns={mockCampaigns}
            onCreateCampaign={handleCreateCampaign}
          />
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <CustomerSupportTickets />
        </TabsContent>
      </Tabs>

      {/* Customer Profile Dialog */}
      {selectedCustomer && (
        <CustomerProfileDialog
          customer={selectedCustomer}
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onSave={(updatedCustomer) => {
            addNotification({
              title: "Customer Updated",
              message: `${updatedCustomer.name}'s profile has been updated`,
              type: "success",
            })
            setSelectedCustomer(null)
          }}
        />
      )}
    </div>
  )
}