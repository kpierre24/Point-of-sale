"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { NotificationCenter } from "@/components/ui/notification-center"
import { KeyboardShortcutsHelp } from "@/components/ui/keyboard-shortcuts-help"
import { BulkActionsToolbar, commonBulkActions } from "@/components/ui/bulk-actions-toolbar"
import { AdvancedSearch } from "@/components/ui/advanced-search"
import { DataExportDialog } from "@/components/ui/data-export-dialog"
import { TimeTracking } from "@/components/team/time-tracking"
import { ThemeProvider } from "@/hooks/use-theme"
import { NotificationProvider, useNotifications } from "@/hooks/use-notifications"
import { useKeyboardShortcuts, useKeyboardShortcutsHelp, commonShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { useAdvancedSearch } from "@/hooks/use-advanced-search"
import { 
  Palette, 
  Bell, 
  Keyboard, 
  CheckSquare, 
  Search, 
  Download, 
  Users, 
  Clock,
  Zap,
  Shield,
  Database,
  Settings
} from "lucide-react"

// Sample data for demonstrations
const sampleProducts = [
  { id: "1", name: "Laptop Pro", category: "Electronics", price: 1299, stock: 15, brand: "TechCorp" },
  { id: "2", name: "Wireless Mouse", category: "Electronics", price: 29, stock: 45, brand: "TechCorp" },
  { id: "3", name: "Office Chair", category: "Furniture", price: 199, stock: 8, brand: "ComfortCo" },
  { id: "4", name: "Desk Lamp", category: "Furniture", price: 49, stock: 22, brand: "LightCo" },
  { id: "5", name: "Coffee Mug", category: "Kitchen", price: 12, stock: 100, brand: "MugCorp" },
]

const searchFilters = [
  {
    id: "category",
    label: "Category",
    type: "select" as const,
    options: [
      { value: "Electronics", label: "Electronics" },
      { value: "Furniture", label: "Furniture" },
      { value: "Kitchen", label: "Kitchen" },
    ],
    value: "",
  },
  {
    id: "price",
    label: "Max Price",
    type: "number" as const,
    value: "",
  },
  {
    id: "stock",
    label: "Min Stock",
    type: "number" as const,
    value: "",
  },
]

const exportFields = [
  { key: "name", label: "Product Name", type: "string" as const, required: true },
  { key: "category", label: "Category", type: "string" as const },
  { key: "price", label: "Price", type: "number" as const },
  { key: "stock", label: "Stock Level", type: "number" as const },
  { key: "brand", label: "Brand", type: "string" as const },
]

function FeaturesContent() {
  const { addNotification, addRule } = useNotifications()
  const { isOpen: isShortcutsOpen, toggleHelp, closeHelp } = useKeyboardShortcutsHelp()
  
  const {
    selectedItems,
    selectedCount,
    totalCount,
    isSelected,
    toggleItem,
    clearSelection,
  } = useBulkSelection({
    items: sampleProducts,
    getItemId: (item) => item.id,
  })

  const {
    query,
    setQuery,
    filters,
    updateFilter,
    clearFilters,
    filteredItems,
    savedSearches,
    saveSearch,
    loadSearch,
    deleteSearch,
    hasActiveFilters,
    resultCount,
  } = useAdvancedSearch({
    items: sampleProducts,
    searchFields: ["name", "category", "brand"],
    filters: searchFilters,
  })

  // Keyboard shortcuts
  const shortcuts = React.useMemo(() => [
    ...commonShortcuts.map(shortcut => ({
      ...shortcut,
      action: shortcut.key === "?" ? toggleHelp : () => {},
    })),
    {
      key: "n",
      ctrlKey: true,
      action: () => addNotification({
        title: "Keyboard Shortcut",
        message: "You pressed Ctrl+N!",
        type: "info" as const,
      }),
      description: "Test notification",
      category: "Demo",
    },
  ], [toggleHelp, addNotification])

  useKeyboardShortcuts(shortcuts)

  // Demo functions
  const handleTestNotification = (type: "info" | "success" | "warning" | "error") => {
    addNotification({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
      message: `This is a ${type} notification for demonstration purposes.`,
      type,
      persistent: type === "error",
    })
  }

  const handleAddNotificationRule = () => {
    addRule({
      name: "Demo Rule",
      condition: (data) => data.demo === true,
      template: (data) => ({
        title: "Demo Rule Triggered",
        message: "This notification was created by a custom rule!",
        type: "info" as const,
        category: "demo",
      }),
      enabled: true,
      category: "demo",
    })
    
    addNotification({
      title: "Rule Added",
      message: "Demo notification rule has been added successfully!",
      type: "success",
    })
  }

  const bulkActions = [
    commonBulkActions.delete(() => {
      addNotification({
        title: "Bulk Delete",
        message: `${selectedCount} items would be deleted`,
        type: "warning",
      })
      clearSelection()
    }),
    commonBulkActions.export(() => {
      addNotification({
        title: "Bulk Export",
        message: `${selectedCount} items would be exported`,
        type: "info",
      })
    }),
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Features Demo</h1>
          <p className="text-muted-foreground mt-2">
            Showcasing Team Management, UX improvements, Notifications, and Data Security features
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationCenter />
          <Button variant="outline" onClick={toggleHelp}>
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
        </div>
      </div>

      {/* Feature Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold">Team Management</h3>
            <p className="text-sm text-muted-foreground">Role-based permissions & time tracking</p>
          </CardContent>
        </Card>
        
        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-success" />
            <h3 className="font-semibold">Enhanced UX</h3>
            <p className="text-sm text-muted-foreground">Dark mode, shortcuts & bulk operations</p>
          </CardContent>
        </Card>
        
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4 text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-warning" />
            <h3 className="font-semibold">Smart Notifications</h3>
            <p className="text-sm text-muted-foreground">Real-time alerts & custom rules</p>
          </CardContent>
        </Card>
        
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <h3 className="font-semibold">Data Security</h3>
            <p className="text-sm text-muted-foreground">Export/import & audit trails</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced UX Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Enhanced User Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Toggle Demo */}
          <div>
            <h4 className="font-medium mb-2">Dark Mode Support</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Toggle between light, dark, and system themes. The theme preference is saved automatically.
            </p>
            <ThemeToggle />
          </div>

          <Separator />

          {/* Keyboard Shortcuts Demo */}
          <div>
            <h4 className="font-medium mb-2">Keyboard Shortcuts</h4>
            <div className="text-sm text-muted-foreground mb-3">
              Press <Badge variant="outline" className="font-mono">?</Badge> to view all shortcuts, 
              or <Badge variant="outline" className="font-mono">Ctrl+N</Badge> to test a notification.
            </div>
            <Button variant="outline" onClick={toggleHelp}>
              <Keyboard className="h-4 w-4 mr-2" />
              View Shortcuts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Search & Bulk Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search & Bulk Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdvancedSearch
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFilterChange={updateFilter}
            onClearFilters={clearFilters}
            savedSearches={savedSearches}
            onSaveSearch={saveSearch}
            onLoadSearch={loadSearch}
            onDeleteSearch={deleteSearch}
            hasActiveFilters={hasActiveFilters}
            resultCount={resultCount}
            totalCount={sampleProducts.length}
            placeholder="Search products..."
          />

          <BulkActionsToolbar
            selectedCount={selectedCount}
            totalCount={totalCount}
            onClearSelection={clearSelection}
            actions={bulkActions}
          />

          {/* Sample Data Table */}
          <div className="border rounded-md">
            <div className="p-4 space-y-2">
              {filteredItems.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                    isSelected(product) ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected(product)}
                    onChange={() => toggleItem(product)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.category} • ${product.price} • {product.stock} in stock
                    </div>
                  </div>
                  <Badge variant="outline">{product.brand}</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Smart Notifications System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Test different notification types and see how they appear in the notification center.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleTestNotification("info")}>
              Info Notification
            </Button>
            <Button variant="outline" onClick={() => handleTestNotification("success")}>
              Success Notification
            </Button>
            <Button variant="outline" onClick={() => handleTestNotification("warning")}>
              Warning Notification
            </Button>
            <Button variant="outline" onClick={() => handleTestNotification("error")}>
              Error Notification
            </Button>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Custom Notification Rules</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Create custom rules that automatically trigger notifications based on business conditions.
            </p>
            <Button variant="outline" onClick={handleAddNotificationRule}>
              Add Demo Rule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Export Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Export & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export data in multiple formats with field selection and filtering options.
          </p>
          
          <DataExportDialog
            data={filteredItems}
            fields={exportFields}
            title="Export Products"
            defaultFilename="products_export"
            trigger={
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Time Tracking Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Team Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeTracking
            userId="demo-user"
            onClockIn={() => addNotification({
              title: "Clocked In",
              message: "You have successfully clocked in for today",
              type: "success",
            })}
            onClockOut={(notes) => addNotification({
              title: "Clocked Out",
              message: notes ? `Clocked out with notes: ${notes}` : "You have clocked out for today",
              type: "info",
            })}
            onStartBreak={() => addNotification({
              title: "Break Started",
              message: "Enjoy your break!",
              type: "info",
            })}
            onEndBreak={() => addNotification({
              title: "Break Ended",
              message: "Welcome back! Ready to continue working?",
              type: "success",
            })}
          />
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsHelp
        isOpen={isShortcutsOpen}
        onClose={closeHelp}
        shortcuts={shortcuts}
      />
    </div>
  )
}

export default function FeaturesDemoPage() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <FeaturesContent />
      </NotificationProvider>
    </ThemeProvider>
  )
}