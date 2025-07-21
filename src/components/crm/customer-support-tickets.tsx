"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  MessageSquare, 
  Clock, 
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Search,
  Plus,
  Filter
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format, subDays, subHours } from "date-fns"

// Mock support ticket data
const mockTickets = [
  {
    id: "T001",
    customerId: "1",
    customerName: "Sarah Johnson",
    subject: "Product return inquiry",
    description: "I would like to return the laptop I purchased last week. It's not meeting my performance expectations.",
    status: "Open",
    priority: "Medium",
    category: "Returns",
    createdAt: subHours(new Date(), 2),
    updatedAt: subHours(new Date(), 1),
    assignedTo: "Support Team",
    responses: [
      {
        id: "1",
        author: "Support Agent",
        message: "Hi Sarah, I understand you'd like to return your laptop. Can you please provide the order number?",
        timestamp: subHours(new Date(), 1),
        isCustomer: false
      }
    ]
  },
  {
    id: "T002",
    customerId: "2",
    customerName: "Michael Chen",
    subject: "Shipping delay question",
    description: "My order was supposed to arrive yesterday but I haven't received any updates.",
    status: "In Progress",
    priority: "High",
    category: "Shipping",
    createdAt: subDays(new Date(), 1),
    updatedAt: subHours(new Date(), 3),
    assignedTo: "Logistics Team",
    responses: [
      {
        id: "1",
        author: "Logistics Agent",
        message: "Hi Michael, I've checked your order status. There was a delay at the shipping facility. Your order is now out for delivery.",
        timestamp: subHours(new Date(), 3),
        isCustomer: false
      },
      {
        id: "2",
        author: "Michael Chen",
        message: "Thank you for the update. When can I expect delivery?",
        timestamp: subHours(new Date(), 2),
        isCustomer: true
      }
    ]
  },
  {
    id: "T003",
    customerId: "3",
    customerName: "Emily Rodriguez",
    subject: "Product information request",
    description: "I need more details about the warranty coverage for the office chair I'm considering.",
    status: "Resolved",
    priority: "Low",
    category: "Product Info",
    createdAt: subDays(new Date(), 3),
    updatedAt: subDays(new Date(), 2),
    assignedTo: "Sales Team",
    responses: [
      {
        id: "1",
        author: "Sales Agent",
        message: "Hi Emily, our office chairs come with a 5-year warranty covering manufacturing defects and normal wear. Would you like me to send you the detailed warranty document?",
        timestamp: subDays(new Date(), 2),
        isCustomer: false
      },
      {
        id: "2",
        author: "Emily Rodriguez",
        message: "Yes, please send the warranty details. Thank you!",
        timestamp: subDays(new Date(), 2),
        isCustomer: true
      }
    ]
  }
]

export function CustomerSupportTickets() {
  const [selectedTicket, setSelectedTicket] = React.useState<any>(null)
  const [newResponse, setNewResponse] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")

  const filteredTickets = React.useMemo(() => {
    return mockTickets.filter(ticket => {
      const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || ticket.status.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open": return "bg-red-100 text-red-800 border-red-200"
      case "in progress": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "resolved": return "bg-green-100 text-green-800 border-green-200"
      case "closed": return "bg-gray-100 text-gray-800 border-gray-200"
      default: return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-100 text-red-800 border-red-200"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "open": return <AlertCircle className="h-4 w-4 text-red-500" />
      case "in progress": return <Clock className="h-4 w-4 text-yellow-500" />
      case "resolved": return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const handleSendResponse = () => {
    if (newResponse.trim() && selectedTicket) {
      // In a real app, this would send the response to your backend
      console.log("Sending response:", newResponse)
      setNewResponse("")
    }
  }

  const openTickets = mockTickets.filter(t => t.status === "Open").length
  const inProgressTickets = mockTickets.filter(t => t.status === "In Progress").length
  const resolvedTickets = mockTickets.filter(t => t.status === "Resolved").length
  const avgResponseTime = "2.3 hours" // This would be calculated from actual data

  return (
    <div className="space-y-6">
      {/* Support Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
                <p className="text-2xl font-bold">{openTickets}</p>
                <p className="text-xs text-red-600">Needs attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressTickets}</p>
                <p className="text-xs text-yellow-600">Being handled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold">{resolvedTickets}</p>
                <p className="text-xs text-green-600">This week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{avgResponseTime}</p>
                <p className="text-xs text-blue-600">Response time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search tickets by ID, customer, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Support Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Customer</label>
                    <Input placeholder="Search customer..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input placeholder="Brief description of the issue..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select className="w-full px-3 py-2 border rounded-md">
                      <option>Product Info</option>
                      <option>Returns</option>
                      <option>Shipping</option>
                      <option>Technical Support</option>
                      <option>Billing</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <select className="w-full px-3 py-2 border rounded-md">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea placeholder="Detailed description of the issue..." rows={4} />
                  </div>
                  <Button className="w-full">Create Ticket</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono">{ticket.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {ticket.customerName}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusIcon(ticket.status)}
                      <span className="ml-1">{ticket.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{ticket.category}</TableCell>
                  <TableCell>{format(ticket.createdAt, 'MMM dd, HH:mm')}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {getStatusIcon(ticket.status)}
                            Ticket {ticket.id} - {ticket.subject}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          {/* Ticket Details */}
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">Customer</p>
                              <p className="text-sm">{ticket.customerName}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Status</p>
                              <Badge className={getStatusColor(ticket.status)}>
                                {ticket.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Priority</p>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Category</p>
                              <p className="text-sm">{ticket.category}</p>
                            </div>
                          </div>

                          {/* Original Message */}
                          <div className="p-4 border rounded-lg">
                            <p className="text-sm font-medium mb-2">Original Request</p>
                            <p className="text-sm">{ticket.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(ticket.createdAt, 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>

                          {/* Conversation History */}
                          <div className="space-y-3">
                            <p className="text-sm font-medium">Conversation</p>
                            {ticket.responses.map((response) => (
                              <div 
                                key={response.id} 
                                className={`p-3 rounded-lg ${
                                  response.isCustomer 
                                    ? 'bg-blue-50 ml-8' 
                                    : 'bg-gray-50 mr-8'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">{response.author}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(response.timestamp, 'MMM dd, HH:mm')}
                                  </span>
                                </div>
                                <p className="text-sm">{response.message}</p>
                              </div>
                            ))}
                          </div>

                          {/* Response Form */}
                          {ticket.status !== "Resolved" && (
                            <div className="space-y-3 pt-4 border-t">
                              <p className="text-sm font-medium">Add Response</p>
                              <Textarea
                                value={newResponse}
                                onChange={(e) => setNewResponse(e.target.value)}
                                placeholder="Type your response..."
                                rows={3}
                              />
                              <div className="flex items-center gap-2">
                                <Button onClick={handleSendResponse}>
                                  Send Response
                                </Button>
                                <Button variant="outline">
                                  Mark as Resolved
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}