// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, DollarSign, Package, Users, UserCircle, Loader2 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import type { Product, Customer, SoldProduct } from '@/types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function DashboardPage() {
  const { currentUser, currentUserProfile, loading: authLoading } = useAuth();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const [productsInStock, setProductsInStock] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to resolve

    setIsDataLoading(true);
    // Fetch data from localStorage (or ideally Firestore/backend in a real app)
    const storedSales = localStorage.getItem('soldItems');
    const storedProducts = localStorage.getItem('products');
    const storedCustomers = localStorage.getItem('customers');

    let revenue = 0;
    let salesCount = 0;
    if (storedSales) {
      try {
        const sales: SoldProduct[] = JSON.parse(storedSales);
        sales.forEach(sale => {
          revenue += sale.total;
          salesCount += 1; // Assuming each SoldProduct entry is one transaction unit for this count
        });
      } catch (e) { console.error("Failed to parse sales for dashboard", e); }
    }
    setTotalRevenue(revenue);
    setTotalSalesCount(salesCount);

    let stockCount = 0;
    if (storedProducts) {
      try {
        const products: Product[] = JSON.parse(storedProducts);
        // Sum of stock quantities for all products or count of unique products
        // For "Products in Stock" card, it usually means count of unique product types available
        stockCount = products.filter(p => p.stockQuantity > 0).length; 
      } catch (e) { console.error("Failed to parse products for dashboard", e); }
    }
    setProductsInStock(stockCount);

    let custCount = 0;
    if (storedCustomers) {
      try {
        const customers: Customer[] = JSON.parse(storedCustomers);
        custCount = customers.length;
      } catch (e) { console.error("Failed to parse customers for dashboard", e); }
    }
    setCustomerCount(custCount);
    setIsDataLoading(false);
  }, [authLoading]);

  if (authLoading || isDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Dashboard Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-md">
          Welcome, {currentUserProfile?.name || currentUser?.email || 'User'}! Here's an overview of your business activity.
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
            <BarChart className="h-4 w-4 text-muted-foreground" />
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
            <div className="text-2xl font-bold">{productsInStock}</div>
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
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Overview of recent sales and stock movements.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent activity feed or chart */}
            <p className="text-muted-foreground">Recent activity feed coming soon.</p>
          </CardContent>
        </Card>
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
      </div>

       <Card className="mt-8">
        <CardHeader>
            <CardTitle>Advanced Analytics</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">More detailed reports, charts, and sales forecasting will be available here. Data for dashboard cards is currently sourced from local storage for demonstration and will be integrated with a backend/database in a full application.</p>
        </CardContent>
       </Card>
    </div>
  );
}
