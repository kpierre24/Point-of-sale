// src/app/reports/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, TrendingUp, Archive, Users2 } from "lucide-react"; 

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <FileText className="mr-3 h-8 w-8 text-primary" />
          Reports
        </h1>
        <p className="text-muted-foreground text-md">
          Analyze your business performance with detailed reports.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Sales Reports</CardTitle>
            <TrendingUp className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              Detailed insights into your sales performance, product trends, and revenue streams.
            </CardDescription>
            <ul className="mt-3 list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Daily/Weekly/Monthly Summaries</li>
              <li>Top Selling Products</li>
              <li>Sales by Staff Member</li>
              <li>Payment Method Analysis</li>
            </ul>
            <p className="mt-4 text-xs text-accent-foreground/80"> (Coming Soon)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Inventory Reports</CardTitle>
            <Archive className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
                Track your stock levels, inventory movements, and identify reordering needs.
            </CardDescription>
             <ul className="mt-3 list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Current Stock Levels</li>
              <li>Low Stock Alerts</li>
              <li>Inventory Valuation</li>
              <li>Stock Movement History</li>
            </ul>
            <p className="mt-4 text-xs text-accent-foreground/80"> (Coming Soon)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Customer Reports</CardTitle>
            <Users2 className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              Understand your customer base, their purchasing habits, and identify key segments.
            </CardDescription>
            <ul className="mt-3 list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Customer Purchase History</li>
              <li>New vs. Returning Customers</li>
              <li>Top Spending Customers</li>
            </ul>
            <p className="mt-4 text-xs text-accent-foreground/80"> (Coming Soon)</p>
          </CardContent>
        </Card>
      </div>

       <Card className="mt-8">
        <CardHeader>
            <CardTitle>Advanced Reporting Features</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
              Future updates will include customizable report generation, data export options (CSV, PDF),
              and visual dashboards with charts and graphs for easier data interpretation.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
