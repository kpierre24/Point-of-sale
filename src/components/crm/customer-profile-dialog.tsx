"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  DollarSign,
  ShoppingBag,
  Star,
  Gift,
  MessageSquare,
  Edit
} from "lucide-react"
import { format } from "date-fns"

interface CustomerProfileDialogProps {
  customer: any
  isOpen: boolean
  onClose: () => void
  onSave: (customer: any) => void
}

export function CustomerProfileDialog({ customer, isOpen, onClose, onSave }: CustomerProfileDialogProps) {
  const [editedCustomer, setEditedCustomer] = React.useState(customer)
  const [isEditing, setIsEditing] = React.useState(!customer.id) // New customer if no ID

  const handleSave = () => {
    onSave(editedCustomer)
    setIsEditing(false)
  }

  const mockPurchaseHistory = [
    { id: "1", date: new Date(2024, 2, 15), items: "Laptop Pro, Wireless Mouse", total: 1329, status: "Completed" },
    { id: "2", date: new Date(2024, 1, 28), items: "Office Chair", total: 199, status: "Completed" },
    { id: "3", date: new Date(2024, 1, 10), items: "Desk Lamp, Coffee Mug", total: 61, status: "Completed" },
  ]

  const mockInteractionHistory = [
    { id: "1", date: new Date(2024, 2, 20), type: "Email", subject: "Thank you for your purchase", status: "Sent" },
    { id: "2", date: new Date(2024, 2, 10), type: "Support", subject: "Product inquiry", status: "Resolved" },
    { id: "3", date: new Date(2024, 1, 25), type: "SMS", subject: "Order shipped notification", status: "Delivered" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {customer.id ? `${customer.name} - Customer Profile` : "New Customer"}
            </DialogTitle>
            {customer.id && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="purchases">Purchase History</TabsTrigger>
            <TabsTrigger value="loyalty">Loyalty & Rewards</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={editedCustomer.name || ""}
                    onChange={(e) => setEditedCustomer({...editedCustomer, name: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedCustomer.email || ""}
                    onChange={(e) => setEditedCustomer({...editedCustomer, email: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editedCustomer.phone || ""}
                    onChange={(e) => setEditedCustomer({...editedCustomer, phone: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="segment">Customer Segment</Label>
                  <select
                    id="segment"
                    value={editedCustomer.segment || "Regular"}
                    onChange={(e) => setEditedCustomer({...editedCustomer, segment: e.target.value})}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="New">New</option>
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="At-Risk">At-Risk</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editedCustomer.notes || ""}
                    onChange={(e) => setEditedCustomer({...editedCustomer, notes: e.target.value})}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </div>

              {/* Customer Stats */}
              <div className="space-y-4">
                <h3 className="font-medium">Customer Statistics</h3>
                
                {customer.id && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">Total Spent</span>
                      </div>
                      <p className="text-xl font-bold">${customer.totalSpent?.toLocaleString()}</p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <ShoppingBag className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">Total Orders</span>
                      </div>
                      <p className="text-xl font-bold">{customer.totalOrders}</p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">Avg Order Value</span>
                      </div>
                      <p className="text-xl font-bold">${customer.avgOrderValue}</p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-muted-foreground">Last Purchase</span>
                      </div>
                      <p className="text-sm font-medium">
                        {customer.lastPurchase ? format(customer.lastPurchase, 'MMM dd, yyyy') : 'Never'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Preferences */}
                <div>
                  <h4 className="font-medium mb-2">Preferences</h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm">Product Categories</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {customer.preferences?.map((pref: string, index: number) => (
                          <Badge key={index} variant="secondary">{pref}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Communication</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {customer.communicationPrefs?.map((pref: string, index: number) => (
                          <Badge key={index} variant="outline">{pref}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-medium">Purchase History</h3>
              {mockPurchaseHistory.map((purchase) => (
                <div key={purchase.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      <span className="font-medium">Order #{purchase.id}</span>
                      <Badge variant="secondary">{purchase.status}</Badge>
                    </div>
                    <span className="font-bold">${purchase.total}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{purchase.items}</p>
                  <p className="text-xs text-muted-foreground">{format(purchase.date, 'MMM dd, yyyy')}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="loyalty" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-medium">Loyalty & Rewards</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <Gift className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{customer.loyaltyPoints || 0}</p>
                  <p className="text-sm text-muted-foreground">Loyalty Points</p>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <Star className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-xl font-bold">{customer.loyaltyTier || 'Bronze'}</p>
                  <p className="text-sm text-muted-foreground">Current Tier</p>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-xl font-bold">$50</p>
                  <p className="text-sm text-muted-foreground">Available Rewards</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Tier Benefits</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• 10% discount on all purchases</li>
                  <li>• Free shipping on orders over $50</li>
                  <li>• Early access to sales</li>
                  <li>• Birthday month special offer</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-medium">Communication History</h3>
              {mockInteractionHistory.map((interaction) => (
                <div key={interaction.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium">{interaction.type}</span>
                      <Badge variant="outline">{interaction.status}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(interaction.date, 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm">{interaction.subject}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {isEditing && (
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}