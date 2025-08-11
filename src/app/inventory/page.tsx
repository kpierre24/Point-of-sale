"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  Package, 
  Scan, 
  Truck, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  QrCode,
  Camera,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Settings
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BarcodeScanner } from "@/components/inventory/barcode-scanner"
import { useNotifications } from "@/hooks/use-notifications"
import { ProtectedComponent, PERMISSIONS } from "@/hooks/use-permissions"
import { format, subDays } from "date-fns"

// Mock inventory data - in a real app, this would come from your inventory service
const mockInventoryItems = [
  {
    id: "1",
    sku: "LAP-001",
    name: "Laptop Pro",
    category: "Electronics",
    currentStock: 15,
    reorderPoint: 10,
    maxStock: 50,
    unitCost: 800,
    supplier: "TechCorp",
    lastRestocked: subDays(new Date(), 5),
    batchNumber: "BATCH-2024-001",
    expiryDate: null,
    serialNumbers: ["SN001", "SN002", "SN003"],
    location: "A1-B2",
    status: "In Stock",
    barcode: "1234567890123"
  },
  {
    id: "2",
    sku: "MOU-001", 
    name: "Wireless Mouse",
    category: "Electronics",
    currentStock: 45,
    reorderPoint: 20,
    maxStock: 100,
    unitCost: 25,
    supplier: "TechCorp",
    lastRestocked: subDays(new Date(), 12),
    batchNumber: "BATCH-2024-002",
    expiryDate: null,
    serialNumbers: [],
    location: "A2-C1",
    status: "In Stock",
    barcode: "2345678901234"
  },
  {
    id: "3",
    sku: "CHA-001",
    name: "Office Chair",
    category: "Furniture", 
    currentStock: 8,
    reorderPoint: 15,
    maxStock: 30,
    unitCost: 150,
    supplier: "ComfortCo",
    lastRestocked: subDays(new Date(), 20),
    batchNumber: "BATCH-2024-003",
    expiryDate: null,
    serialNumbers: [],
    location: "B1-A1",
    status: "Low Stock",
    barcode: "3456789012345"
  }
]

export default function InventoryPage() {
  const { addNotification } = useNotifications()
  const [selectedTab, setSelectedTab] = React.useState("overview")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [isScannerOpen, setIsScannerOpen] = React.useState(false)

  const filteredItems = React.useMemo(() => {
    return mockInventoryItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "low" && item.currentStock <= item.reorderPoint) ||
                           (statusFilter === "in-stock" && item.currentStock > item.reorderPoint)
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  const handleBarcodeScanned = (barcode: string) => {
    const item = mockInventoryItems.find(i => i.barcode === barcode)
    if (item) {
      addNotification({
        title: "Item Scanned",
        message: `Found: ${item.name} (${item.sku})`,
        type: "success",
      })
    } else {
      addNotification({
        title: "Item Not Found",
        message: `No item found with barcode: ${barcode}`,
        type: "warning",
      })
    }
    setIsScannerOpen(false)
  }

  const handleQuickRestock = (itemId: string) => {
    const item = mockInventoryItems.find(i => i.id === itemId)
    addNotification({
      title: "Restock Initiated",
      message: `Reorder request created for ${item?.name}`,
      type: "info",
      actionLabel: "View Order",
      actionUrl: "/purchases"
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in stock": return "bg-green-100 text-green-800 border-green-200"
      case "low stock": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "out of stock": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const lowStockItems = mockInventoryItems.filter(item => item.currentStock <= item.reorderPoint)
  const totalValue = mockInventoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0)
  const avgTurnover = 12.5 // This would be calculated from actual data

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Inventory Management</h1>
          <p className="text-muted-foreground mt-2">
            Barcode scanning, supplier management, batch tracking, and automated reordering
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsScannerOpen(true)}
          >
            <Scan className="h-4 w-4 mr-2" />
            Scan Barcode
          </Button>
          <ProtectedComponent requiredPermissions={[PERMISSIONS.PRODUCTS_CREATE]}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </ProtectedComponent>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{mockInventoryItems.length}</p>
                <p className="text-xs text-blue-600">Unique SKUs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold">{lowStockItems.length}</p>
                <p className="text-xs text-yellow-600">Need reordering</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                <p className="text-xs text-green-600">Current stock value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Turnover</p>
                <p className="text-2xl font-bold">{avgTurnover}x</p>
                <p className="text-xs text-purple-600">Per year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search by name or SKU..."
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
                    <option value="all">All Items</option>
                    <option value="in-stock">In Stock</option>
                    <option value="low">Low Stock</option>
                  </select>
                </div>

                <Button 
                  variant="outline"
                  onClick={() => setIsScannerOpen(true)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Quick Scan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Inventory Items
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Reorder Point</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.sku}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Supplier: {item.supplier}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.currentStock}</span>
                          <span className="text-sm text-muted-foreground">
                            / {item.maxStock}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{item.reorderPoint}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.location}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleQuickRestock(item.id)}
                            disabled={item.currentStock > item.reorderPoint}
                          >
                            Restock
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Settings className="h-3 w-3" />
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
      </Tabs>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </div>
  )
}
