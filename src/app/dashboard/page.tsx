// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, Users, Loader2, ShoppingCart, WifiOff } from "lucide-react";
import type { Product, Customer, SoldProduct, DailySalesData, ProductCategorySalesData } from '@/types';
import { useRouter } from 'next/navigation';
import { DailySalesChart } from '@/components/charts/DailySalesChart';
import { TopCategoriesChart } from '@/components/charts/TopCategoriesChart';
import { subDays, formatISO, parseISO, startOfDay } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, getDocs, query as firestoreQuery, orderBy, limit } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

const fetchSales = async (): Promise<SoldProduct[]> => {
  if (!db) throw new Error("Firestore not available");
  const salesQuery = firestoreQuery(collection(db, SALES_COLLECTION), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(salesQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SoldProduct));
};


export default function DashboardPage() {
  const router = useRouter();
  
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
  const { data: sales = [], isLoading: isLoadingSales, isError: isSalesError, error: salesError } = useQuery<SoldProduct[], Error>({
    queryKey: [SALES_COLLECTION],
    queryFn: fetchSales,
    enabled: !!db,
    retry: false,
  });

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const [productsInStockCount, setProductsInStockCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [dailySalesData, setDailySalesData] = useState<DailySalesData[]>([]);
  const [topCategoriesData, setTopCategoriesData] = useState<ProductCategorySalesData[]>([]);

  useEffect(() => {
    if (isLoadingProducts || isLoadingCustomers || isLoadingSales || isProductsError || isCustomersError || isSalesError) return;

    let revenue = 0;
    sales.forEach(sale => revenue += sale.total);
    setTotalRevenue(revenue);
    setTotalSalesCount(sales.length);

    const stockCount = products.filter(p => p.stockQuantity > 0).length; 
    setProductsInStockCount(stockCount);
    setCustomerCount(customers.length);

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

  }, [products, customers, sales, isLoadingProducts, isLoadingCustomers, isLoadingSales, isProductsError, isCustomersError, isSalesError]);


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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Based on all sales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesCount}</div>
            <p className="text-xs text-muted-foreground">
              Number of transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products In Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsInStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Total unique products available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <DailySalesChart data={dailySalesData} />
        <TopCategoriesChart data={topCategoriesData} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access common tasks quickly.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => router.push('/sales')}>New Sale</Button>
            <Button variant="outline" onClick={() => router.push('/products')}>Add Product</Button>
            <Button variant="outline" onClick={() => router.push('/purchases')}>New Purchase</Button>
            <Button variant="outline" onClick={() => router.push('/customers')}>Add Customer</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle> 
            <CardDescription>Overview of recent sales and stock movements.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Detailed recent activity feed coming soon.</p>
          </CardContent>
        </Card>
      </div>

       <Card className="mt-8">
        <CardHeader>
            <CardTitle>Advanced Analytics</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">More detailed reports and sales forecasting will be available here. Data for dashboard cards is sourced from Firestore.</p>
        </CardContent>
       </Card>
    </div>
  );
}
