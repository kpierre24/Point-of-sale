// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, Users, Loader2, ShoppingCart, WifiOff, PackageCheck, TrendingUp, TrendingDown } from "lucide-react";
import type { Product, Customer, Sale, DailySalesData, ProductCategorySalesData, Location } from '@/types';
import { useRouter } from 'next/navigation';
import { DailySalesChart } from '@/components/charts/DailySalesChart';
import { TopCategoriesChart } from '@/components/charts/TopCategoriesChart';
import { subDays, formatISO, parseISO, startOfDay } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, getDocs, query as firestoreQuery, orderBy, limit } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AskAssistant } from '@/components/AskAssistant';
import { useLocation } from '@/context/LocationContext';
import { LowStockAlert } from '@/components/ui/low-stock-alert';
import { DataExportDialog } from '@/components/ui/data-export-dialog';
import { useNotifications } from '@/hooks/use-notifications';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ProtectedComponent, PERMISSIONS } from '@/hooks/use-permissions';

const PRODUCTS_COLLECTION = 'products';
const CUSTOMERS_COLLECTION = 'customers';
const SALES_COLLECTION = 'sales';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Fetcher functions
const fetchProducts = async (): Promise<Product[]> => {
  if (!db) throw new Error("Firestore not available");
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

const fetchCustomers = async (): Promise<Customer[]> => {
  if (!db) throw new Error("Firestore not available");
  const snapshot = await getDocs(collection(db, CUSTOMERS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
};

const fetchSales = async (): Promise<Sale[]> => {
  if (!db) throw new Error("Firestore not available");
  const salesQuery = firestoreQuery(collection(db, SALES_COLLECTION), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(salesQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
};

const fetchLocations = async (): Promise<Location[]> => {
  if (!db) throw new Error("Firestore not available");
  const snapshot = await getDocs(collection(db, 'locations'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
};


export default function DashboardPage() {
  const router = useRouter();
  const { selectedLocationId } = useLocation();
  const { addNotification, checkRules } = useNotifications();
  
  const { data: products = [], isLoading: isLoadingProducts, isError: isProductsError, error: productsError } = useQuery<Product[], Error>({
    queryKey: [PRODUCTS_COLLECTION],
    queryFn: fetchProducts,
    enabled: !!db,
    retry: false,
  });
  const { data: customers = [], isLoading: isLoadingCustomers, isError: isCustomersError, error: customersError } = useQuery<Customer[], Error>({
    queryKey: [CUSTOMERS_COLLECTION],
    queryFn: fetchCustomers,
    enabled: !!db,
    retry: false,
  });
  const { data: sales = [], isLoading: isLoadingSales, isError: isSalesError, error: salesError } = useQuery<Sale[], Error>({
    queryKey: [SALES_COLLECTION],
    queryFn: fetchSales,
    enabled: !!db,
    retry: false,
  });
  const { data: locations = [], isLoading: isLoadingLocations, isError: isLocationsError, error: locationsError } = useQuery<Location[], Error>({
    queryKey: ['locations'],
    queryFn: fetchLocations,
    enabled: !!db,
    retry: false,
  });

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const [productsInStockCount, setProductsInStockCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [dailySalesData, setDailySalesData] = useState<DailySalesData[]>([]);
  const [topCategoriesData, setTopCategoriesData] = useState<ProductCategorySalesData[]>([]);
  const [showStockTakeAlert, setShowStockTakeAlert] = useState(false);
  
  // Trend data states
  const [revenueTrend, setRevenueTrend] = useState<{ value: string; isPositive: boolean } | undefined>();
  const [salesTrend, setSalesTrend] = useState<{ value: string; isPositive: boolean } | undefined>();
  const [stockTrend, setStockTrend] = useState<{ value: string; isPositive: boolean } | undefined>();
  const [customerTrend, setCustomerTrend] = useState<{ value: string; isPositive: boolean } | undefined>();

  useEffect(() => {
    if (isLoadingProducts || isLoadingCustomers || isLoadingSales || isProductsError || isCustomersError || isSalesError) return;

    let revenue = 0;
    sales.forEach(sale => revenue += sale.total);
    setTotalRevenue(revenue);
    setTotalSalesCount(sales.length);

    const stockCount = products.filter(p => p.stockByLocation && Object.values(p.stockByLocation).some(qty => qty > 0)).length;
    setProductsInStockCount(stockCount);
    setCustomerCount(customers.length);

    // Calculate total stock for the selected location
    if (selectedLocationId && products.length > 0) {
        const totalStockForLocation = products.reduce((sum, product) => {
            return sum + (product.stockByLocation?.[selectedLocationId] || 0);
        }, 0);
        setShowStockTakeAlert(totalStockForLocation === 0);
    } else {
        setShowStockTakeAlert(false);
    }

    const today = startOfDay(new Date());
    const last7DaysData: DailySalesData[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayString = formatISO(day, { representation: 'date' });
      const salesOnDay = sales.filter(s => formatISO(parseISO(s.timestamp), { representation: 'date' }) === dayString);
      last7DaysData.push({
        date: dayString,
        totalSales: salesOnDay.reduce((sum, s) => sum + s.total, 0),
      });
    }
    setDailySalesData(last7DaysData);

    const categorySales: { [key: string]: number } = {};
    sales.forEach(sale => {
      const productDetails = products.find(p => p.id === sale.productId);
      const category = productDetails?.category || 'Uncategorized';
      categorySales[category] = (categorySales[category] || 0) + sale.quantity;
    });
    
    const sortedCategories = Object.entries(categorySales)
      .map(([category, quantitySold]) => ({ category, quantitySold }))
      .sort((a, b) => b.quantitySold - a.quantitySold);
      
    setTopCategoriesData(sortedCategories.slice(0, 5));

    // Calculate trends (comparing last 7 days vs previous 7 days)
    const last14Days = subDays(today, 14);
    const last7Days = subDays(today, 7);
    
    // Revenue trend
    const recentRevenue = sales
      .filter(s => parseISO(s.timestamp) >= last7Days)
      .reduce((sum, s) => sum + s.total, 0);
    const previousRevenue = sales
      .filter(s => parseISO(s.timestamp) >= last14Days && parseISO(s.timestamp) < last7Days)
      .reduce((sum, s) => sum + s.total, 0);
    
    if (previousRevenue > 0) {
      const revenueChange = ((recentRevenue - previousRevenue) / previousRevenue) * 100;
      setRevenueTrend({
        value: `${Math.abs(revenueChange).toFixed(1)}%`,
        isPositive: revenueChange >= 0
      });
    }
    
    // Sales count trend
    const recentSalesCount = sales.filter(s => parseISO(s.timestamp) >= last7Days).length;
    const previousSalesCount = sales.filter(s => parseISO(s.timestamp) >= last14Days && parseISO(s.timestamp) < last7Days).length;
    
    if (previousSalesCount > 0) {
      const salesChange = ((recentSalesCount - previousSalesCount) / previousSalesCount) * 100;
      setSalesTrend({
        value: `${Math.abs(salesChange).toFixed(1)}%`,
        isPositive: salesChange >= 0
      });
    }
    
    // Stock trend (simplified - based on low stock items)
    const lowStockCount = products.filter(p => {
      const totalStock = Object.values(p.stockByLocation || {}).reduce((sum, qty) => sum + qty, 0);
      return totalStock > 0 && totalStock <= 5; // Consider 5 or less as low stock
    }).length;
    
    if (stockCount > 0) {
      const stockHealthPercentage = ((stockCount - lowStockCount) / stockCount) * 100;
      setStockTrend({
        value: `${stockHealthPercentage.toFixed(0)}%`,
        isPositive: stockHealthPercentage >= 80 // 80% or more items with good stock levels
      });
    }
    
    // Customer trend (simplified - show total count as positive indicator)
    if (customerCount > 0) {
      setCustomerTrend({
        value: `${customerCount} total`,
        isPositive: true
      });
    }

    // Check notification rules for business insights
    products.forEach(product => {
      const stockLevel = selectedLocationId ? 
        (product.stockByLocation?.[selectedLocationId] || 0) : 
        Object.values(product.stockByLocation || {}).reduce((sum, qty) => sum + qty, 0);
      
      // Check for low stock
      if (stockLevel <= 10 && stockLevel > 0) {
        checkRules({
          type: "inventory",
          stockLevel,
          lowStockThreshold: 10,
          productName: product.name,
        });
      }
      
      // Check for out of stock
      if (stockLevel <= 0) {
        checkRules({
          type: "inventory",
          stockLevel,
          productName: product.name,
        });
      }
    });

    // Check for high sales volume
    if (previousRevenue > 0 && recentRevenue > previousRevenue * 1.5) {
      checkRules({
        type: "sales",
        dailySales: recentRevenue,
        averageDailySales: previousRevenue / 7,
      });
    }

    // Check for new customers (simplified - based on recent customer count)
    if (customers.length > 0) {
      const recentCustomers = customers.filter(c => {
        // Assuming customers have a createdAt field
        return c.createdAt && parseISO(c.createdAt) >= last7Days;
      });
      
      recentCustomers.forEach(customer => {
        checkRules({
          type: "customer",
          isNewCustomer: true,
          customerName: customer.name,
        });
      });
    }

    // Check for large sales
    sales.forEach(sale => {
      if (sale.total > 500) {
        checkRules({
          type: "sale",
          amount: sale.total,
        });
      }
    });

  }, [products, customers, sales, isLoadingProducts, isLoadingCustomers, isLoadingSales, isProductsError, isCustomersError, isSalesError, selectedLocationId, checkRules]);


  if (!db) { // Check for db initialization first
     return (
      <div className="space-y-8">
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Firebase Not Connected</CardTitle></CardHeader>
          <CardContent><p>Cannot load dashboard data. Please check Firebase configuration.</p></CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoadingProducts || isLoadingCustomers || isLoadingSales) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Dashboard Data...</p>
      </div>
    );
  }

  if (isProductsError || isCustomersError || isSalesError) {
    const combinedError = productsError?.message || customersError?.message || salesError?.message || "An error occurred fetching dashboard data.";
    return (
      <div className="space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </header>
        <Alert variant="destructive">
          <WifiOff className="h-5 w-5" />
          <AlertTitle>Failed to Load Dashboard Data</AlertTitle>
          <AlertDescription>
            Could not connect to the database to load required data. Please check your internet connection and Firebase configuration.
            <p className="mt-2 text-xs">Error: {combinedError}</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-md">
          Welcome! Here's an overview of your business activity from Firestore.
        </p>
      </header>

      {showStockTakeAlert && (
        <Alert>
          <PackageCheck className="h-5 w-5" />
          <AlertTitle>Set Up Your Inventory!</AlertTitle>
          <AlertDescription>
            It looks like this location has no stock recorded. Complete an initial stock take to start tracking your inventory accurately.
            <Button asChild className="ml-4" size="sm">
                <Link href="/stock-take">Start Stock Take</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Low Stock and Out of Stock Alerts */}
      <LowStockAlert
        products={products}
        selectedLocationId={selectedLocationId}
        locations={locations}
        lowStockThreshold={10}
        outOfStockThreshold={0}
      />

      {/* Responsive Metric Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          trend={revenueTrend}
          description="Based on all sales transactions"
          variant="success"
        />
        <MetricCard
          title="Total Sales"
          value={totalSalesCount}
          icon={ShoppingCart}
          trend={salesTrend}
          description="Number of completed transactions"
        />
        <MetricCard
          title="Products In Stock"
          value={productsInStockCount}
          icon={Package}
          trend={stockTrend}
          description="Unique products with available inventory"
          variant={stockTrend?.isPositive ? "default" : "warning"}
        />
        <MetricCard
          title="Customers"
          value={customerCount}
          icon={Users}
          trend={customerTrend}
          description="Registered customer accounts"
        />
      </div>
      
      {/* Responsive Charts Grid */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-2 xl:gap-6">
        <DailySalesChart data={dailySalesData} />
        <TopCategoriesChart data={topCategoriesData} />
      </div>

      {/* Responsive Action Cards Grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:gap-6">
         <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access common tasks quickly.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Button variant="outline" size="lg" onClick={() => router.push('/sales')} className="justify-start">
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Sale
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push('/products')} className="justify-start">
              <Package className="mr-2 h-4 w-4" />
              Add Product
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push('/purchases')} className="justify-start">
              <Package className="mr-2 h-4 w-4" />
              New Purchase
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push('/customers')} className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ask the Assistant</CardTitle> 
            <CardDescription>Get quick answers about your business.</CardDescription>
          </CardHeader>
          <CardContent>
            <AskAssistant />
          </CardContent>
        </Card>
      </div>

       <Card className="mt-8">
        <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Advanced Analytics & Data Export
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Enhanced Features
                </Badge>
                <ProtectedComponent requiredPermissions={[PERMISSIONS.REPORTS_EXPORT]}>
                  <DataExportDialog
                    data={sales}
                    fields={[
                      { key: "id", label: "Sale ID", type: "string", required: true },
                      { key: "productId", label: "Product ID", type: "string" },
                      { key: "quantity", label: "Quantity", type: "number" },
                      { key: "total", label: "Total Amount", type: "number" },
                      { key: "timestamp", label: "Date", type: "date" },
                      { key: "customerId", label: "Customer ID", type: "string" },
                    ]}
                    title="Export Sales Data"
                    defaultFilename="sales_export"
                    trigger={
                      <Button variant="outline" size="sm">
                        Export Sales Data
                      </Button>
                    }
                  />
                </ProtectedComponent>
              </div>
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Enhanced analytics with smart notifications, data export capabilities, and business insights. 
              Data is sourced from Firestore with real-time updates.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Smart Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Automatic alerts for low stock, high sales days, and business milestones.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Data Export</h4>
                <p className="text-sm text-muted-foreground">
                  Export your data in multiple formats (CSV, JSON, Excel) with custom field selection.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Enhanced UX</h4>
                <p className="text-sm text-muted-foreground">
                  Dark mode, keyboard shortcuts (press ?), and improved micro-interactions.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addNotification({
                  title: "Test Notification",
                  message: "This is a demo notification from the dashboard!",
                  type: "info",
                })}
              >
                Test Notification
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addNotification({
                  title: "Sales Milestone!",
                  message: `Congratulations! You've reached ${totalSalesCount} total sales.`,
                  type: "success",
                  persistent: true,
                })}
              >
                Celebrate Milestone
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/features-demo')}
              >
                View All Features
              </Button>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
