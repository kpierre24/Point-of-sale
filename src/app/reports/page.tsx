
// src/app/reports/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { SoldProduct, User as AppUser, Location, Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, BarChartBig, UserSquare, CalendarDays, Loader2, MapPin, Package, DollarSign } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, getWeek, getYear } from 'date-fns';
import { Label } from "@/components/ui/label";
import { db } from '@/lib/firebase';
import { collection, getDocs, query as firestoreQuery, where, orderBy } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/context/LocationContext';

const SALES_COLLECTION = 'sales';
const USERS_COLLECTION = 'users';
const LOCATIONS_COLLECTION = 'locations';
const PRODUCTS_COLLECTION = 'products'; // Added

type ReportType = 'staff' | 'daily' | 'weekly' | 'monthly' | 'product_performance' | 'profitability' | '';
interface ReportDataItem {
  [key: string]: any;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Fetcher functions
const fetchAllSalesForReport = async (startDate?: Date, endDate?: Date): Promise<SoldProduct[]> => {
  if (!db) throw new Error("Firestore not available");
  const salesCol = collection(db, SALES_COLLECTION);
  let q = firestoreQuery(salesCol, orderBy("timestamp", "desc"));

  if (startDate) {
    q = firestoreQuery(q, where("timestamp", ">=", startDate.toISOString()));
  }
  if (endDate) {
     const endOfDayEndDate = new Date(endDate);
     endOfDayEndDate.setHours(23,59,59,999);
    q = firestoreQuery(q, where("timestamp", "<=", endOfDayEndDate.toISOString()));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SoldProduct));
};


const fetchAllStaff = async (): Promise<AppUser[]> => {
  if (!db) throw new Error("Firestore not available");
  const staffCol = collection(db, USERS_COLLECTION);
  const snapshot = await getDocs(staffCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
};

const fetchLocations = async (): Promise<Location[]> => {
    if (!db) throw new Error("Firestore not available");
    const snapshot = await getDocs(collection(db, LOCATIONS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
};

const fetchProducts = async (): Promise<Product[]> => {
    if (!db) throw new Error("Firestore not available");
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};


export default function ReportsPage() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<ReportType>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [generatedReportData, setGeneratedReportData] = useState<ReportDataItem[]>([]);
  const [reportTitle, setReportTitle] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const { data: allStaff = [], isLoading: isLoadingStaff, isError: isStaffError, error: staffError } = useQuery<AppUser[], Error>({
    queryKey: [USERS_COLLECTION],
    queryFn: fetchAllStaff,
    enabled: !!db,
  });

  const { data: locations = [], isLoading: isLoadingLocations, isError: isLocationsError, error: locationsError } = useQuery<Location[], Error>({
      queryKey: [LOCATIONS_COLLECTION],
      queryFn: fetchLocations,
      enabled: !!db,
  });
  
  const { data: products = [], isLoading: isLoadingProducts, isError: isProductsError, error: productsError } = useQuery<Product[], Error>({
      queryKey: [PRODUCTS_COLLECTION],
      queryFn: fetchProducts,
      enabled: !!db,
  });
  
  useEffect(() => {
    if (isStaffError) toast({ title: 'Error Loading Staff', description: staffError?.message, variant: 'destructive' });
    if (isLocationsError) toast({ title: 'Error Loading Locations', description: locationsError?.message, variant: 'destructive' });
    if (isProductsError) toast({ title: 'Error Loading Products', description: productsError?.message, variant: 'destructive' });
  }, [isStaffError, staffError, isLocationsError, locationsError, isProductsError, productsError, toast]);


  const getStaffName = (staffId?: string): string => {
    if (!staffId) return 'N/A';
    const staffMember = allStaff.find(s => s.id === staffId);
    return staffMember ? staffMember.name : 'Unknown Staff';
  };

  const handleGenerateReport = async () => {
    if (!reportType) {
      setGeneratedReportData([]);
      setReportTitle('');
      return;
    }
    if (!db) {
        toast({title: "Firestore Not Available", description: "Cannot generate report.", variant: "destructive"});
        return;
    }

    setIsGeneratingReport(true);
    setGeneratedReportData([]);
    setReportTitle('Generating report...');

    try {
        const fetchedSales = await fetchAllSalesForReport(startDate, endDate);
        let data: ReportDataItem[] = [];
        let title = '';

        let filteredSales = fetchedSales;
        if (selectedLocationId !== 'all') {
            filteredSales = filteredSales.filter(s => s.locationId === selectedLocationId);
        }

      switch (reportType) {
        case 'staff':
          title = `Sales by Staff Member${selectedStaffId !== 'all' ? ` (${getStaffName(selectedStaffId)})` : ''}`;
          const staffSales: { [key: string]: { totalAmount: number; salesCount: number; items: SoldProduct[] } } = {};
          
          (selectedStaffId === 'all' ? filteredSales : filteredSales.filter(s => s.staffId === selectedStaffId)).forEach(sale => {
            const staffIdKey = sale.staffId || 'unknown';
            if (!staffSales[staffIdKey]) {
              staffSales[staffIdKey] = { totalAmount: 0, salesCount: 0, items: [] };
            }
            staffSales[staffIdKey].totalAmount += sale.total;
            staffSales[staffIdKey].salesCount += 1;
            staffSales[staffIdKey].items.push(sale);
          });
          
          data = Object.entries(staffSales).map(([staffIdVal, aggregates]) => ({
            staffName: getStaffName(staffIdVal),
            totalSalesAmount: aggregates.totalAmount,
            numberOfSales: aggregates.salesCount,
            averageSaleValue: aggregates.salesCount > 0 ? aggregates.totalAmount / aggregates.salesCount : 0,
          })).sort((a,b) => b.totalSalesAmount - a.totalSalesAmount);
          break;
        
        case 'daily':
          title = `Daily Sales Summary (${format(startDate || new Date(), 'MMM dd, yyyy')} - ${format(endDate || new Date(), 'MMM dd, yyyy')})`;
          const dailySales: { [key: string]: { totalAmount: number; salesCount: number } } = {};
          filteredSales.forEach(sale => {
            const day = format(parseISO(sale.timestamp), 'yyyy-MM-dd');
            if (!dailySales[day]) {
              dailySales[day] = { totalAmount: 0, salesCount: 0 };
            }
            dailySales[day].totalAmount += sale.total;
            dailySales[day].salesCount += 1;
          });
          data = Object.entries(dailySales).map(([date, aggregates]) => ({
            date: format(parseISO(date), 'MMM dd, yyyy (EEE)'),
            totalSalesAmount: aggregates.totalAmount,
            numberOfSales: aggregates.salesCount,
          })).sort((a,b) => new Date(parseISO(a.date)).getTime() - new Date(parseISO(b.date)).getTime());
          break;

        case 'weekly':
          title = `Weekly Sales Summary (${format(startDate || new Date(), 'MMM dd')} - ${format(endDate || new Date(), 'MMM dd, yyyy')})`;
          const weeklySales: { [key: string]: { totalAmount: number; salesCount: number } } = {};
          filteredSales.forEach(sale => {
            const saleDate = parseISO(sale.timestamp);
            const weekKey = `${getYear(saleDate)}-W${getWeek(saleDate, { weekStartsOn: 1 })}`;
            if (!weeklySales[weekKey]) {
              weeklySales[weekKey] = { totalAmount: 0, salesCount: 0 };
            }
            weeklySales[weekKey].totalAmount += sale.total;
            weeklySales[weekKey].salesCount += 1;
          });
          data = Object.entries(weeklySales).map(([week, aggregates]) => ({
            week: week,
            totalSalesAmount: aggregates.totalAmount,
            numberOfSales: aggregates.salesCount,
          })).sort((a,b) => a.week.localeCompare(b.week));
          break;

        case 'monthly':
          title = `Monthly Sales Summary (${format(startDate || new Date(), 'MMM yyyy')} - ${format(endDate || new Date(), 'MMM yyyy')})`;
          const monthlySales: { [key: string]: { totalAmount: number; salesCount: number } } = {};
          filteredSales.forEach(sale => {
            const monthKey = format(parseISO(sale.timestamp), 'yyyy-MM');
            if (!monthlySales[monthKey]) {
              monthlySales[monthKey] = { totalAmount: 0, salesCount: 0 };
            }
            monthlySales[monthKey].totalAmount += sale.total;
            monthlySales[monthKey].salesCount += 1;
          });
          data = Object.entries(monthlySales).map(([month, aggregates]) => ({
            month: format(parseISO(month + '-01'), 'MMMM yyyy'),
            totalSalesAmount: aggregates.totalAmount,
            numberOfSales: aggregates.salesCount,
          })).sort((a, b) => new Date(parseISO(a.month)).getTime() - new Date(parseISO(b.month)).getTime());
          break;

        case 'product_performance':
          title = `Product Performance (${format(startDate || new Date(), 'MMM dd')} - ${format(endDate || new Date(), 'MMM dd, yyyy')})`;
          const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
          filteredSales.forEach(sale => {
              if (sale.productId) {
                  if (!productSales[sale.productId]) {
                      productSales[sale.productId] = { name: sale.name, quantity: 0, revenue: 0 };
                  }
                  productSales[sale.productId].quantity += sale.quantity;
                  productSales[sale.productId].revenue += sale.total;
              }
          });
          data = Object.values(productSales).map(p => ({
              ...p,
              avgPrice: p.quantity > 0 ? p.revenue / p.quantity : 0,
          })).sort((a,b) => b.revenue - a.revenue);
          break;

        case 'profitability':
            title = `Product Profitability (${format(startDate || new Date(), 'MMM dd')} - ${format(endDate || new Date(), 'MMM dd, yyyy')})`;
            const productProfit: { [key: string]: { name: string; quantity: number; revenue: number; totalCost: number; } } = {};
            filteredSales.forEach(sale => {
                if (sale.productId && sale.costOfGoodsSoldAtTimeOfSale !== undefined) {
                    if (!productProfit[sale.productId]) {
                        productProfit[sale.productId] = { name: sale.name, quantity: 0, revenue: 0, totalCost: 0 };
                    }
                    productProfit[sale.productId].quantity += sale.quantity;
                    productProfit[sale.productId].revenue += sale.total;
                    productProfit[sale.productId].totalCost += (sale.costOfGoodsSoldAtTimeOfSale * sale.quantity);
                }
            });
            data = Object.values(productProfit).map(p => ({
                ...p,
                profit: p.revenue - p.totalCost,
                profitMargin: p.revenue > 0 ? ((p.revenue - p.totalCost) / p.revenue) * 100 : 0,
            })).sort((a,b) => b.profit - a.profit);
            break;
        }
        setGeneratedReportData(data);
        setReportTitle(title);
    } catch (err: any) {
        toast({title: "Error Generating Report", description: err.message, variant: "destructive"});
        setReportTitle('Error generating report.');
    } finally {
        setIsGeneratingReport(false);
    }
  };
  
  const renderReportTable = () => {
    if (isGeneratingReport) {
        return (
            <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Generating report...</p>
            </div>
        );
    }
    if (generatedReportData.length === 0 && reportTitle && reportTitle !== 'Generating report...') return <p className="text-muted-foreground">No data available for this report.</p>;
    if (generatedReportData.length === 0) return null;

    const headers: { key: string, label: string, type?: 'currency' | 'number' | 'string' | 'percentage' }[] = [];
    switch (reportType) {
      case 'staff':
        headers.push({ key: 'staffName', label: 'Staff Name' });
        headers.push({ key: 'totalSalesAmount', label: 'Total Sales', type: 'currency' });
        headers.push({ key: 'numberOfSales', label: 'No. of Sales', type: 'number' });
        headers.push({ key: 'averageSaleValue', label: 'Avg. Sale Value', type: 'currency' });
        break;
      case 'daily':
        headers.push({ key: 'date', label: 'Date' });
        headers.push({ key: 'totalSalesAmount', label: 'Total Sales', type: 'currency' });
        headers.push({ key: 'numberOfSales', label: 'No. of Sales', type: 'number' });
        break;
      case 'weekly':
        headers.push({ key: 'week', label: 'Week' });
        headers.push({ key: 'totalSalesAmount', label: 'Total Sales', type: 'currency' });
        headers.push({ key: 'numberOfSales', label: 'No. of Sales', type: 'number' });
        break;
      case 'monthly':
        headers.push({ key: 'month', label: 'Month' });
        headers.push({ key: 'totalSalesAmount', label: 'Total Sales', type: 'currency' });
        headers.push({ key: 'numberOfSales', label: 'No. of Sales', type: 'number' });
        break;
      case 'product_performance':
        headers.push({ key: 'name', label: 'Product Name' });
        headers.push({ key: 'quantity', label: 'Units Sold', type: 'number' });
        headers.push({ key: 'avgPrice', label: 'Avg. Price', type: 'currency' });
        headers.push({ key: 'revenue', label: 'Total Revenue', type: 'currency' });
        break;
      case 'profitability':
        headers.push({ key: 'name', label: 'Product Name' });
        headers.push({ key: 'quantity', label: 'Units Sold', type: 'number' });
        headers.push({ key: 'revenue', label: 'Total Revenue', type: 'currency' });
        headers.push({ key: 'totalCost', label: 'Total COGS', type: 'currency' });
        headers.push({ key: 'profit', label: 'Total Profit', type: 'currency' });
        headers.push({ key: 'profitMargin', label: 'Profit Margin', type: 'percentage' });
        break;
    }

    return (
      <ScrollArea className="h-[500px] rounded-md border shadow-inner mt-4">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              {headers.map(header => <TableHead key={header.key} className={['currency', 'number', 'percentage'].includes(header.type || '') ? 'text-right' : ''}>{header.label}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {generatedReportData.map((row, index) => (
              <TableRow key={index}>
                {headers.map(header => (
                  <TableCell key={header.key} className={['currency', 'number', 'percentage'].includes(header.type || '') ? 'text-right' : ''}>
                    {header.type === 'currency' ? formatCurrency(row[header.key]) : header.type === 'percentage' ? `${row[header.key].toFixed(2)}%` : row[header.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };
  
  if (isLoadingStaff || isLoadingLocations || isLoadingProducts) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading report dependencies...</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <BarChartBig className="mr-3 h-8 w-8 text-primary" />
          Business Reports
        </h1>
        <p className="text-muted-foreground text-md">
          Generate and view sales, product, and profitability reports from Firestore.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select report type and filters to generate a report.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={(value: ReportType) => {setReportType(value); setGeneratedReportData([]); setReportTitle('');}}>
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="Select a report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff"><UserSquare className="inline-block mr-2 h-4 w-4" />Sales by Staff</SelectItem>
                  <SelectItem value="daily"><CalendarDays className="inline-block mr-2 h-4 w-4" />Daily Summary</SelectItem>
                  <SelectItem value="weekly"><CalendarDays className="inline-block mr-2 h-4 w-4" />Weekly Summary</SelectItem>
                  <SelectItem value="monthly"><CalendarDays className="inline-block mr-2 h-4 w-4" />Monthly Summary</SelectItem>
                  <SelectItem value="product_performance"><Package className="inline-block mr-2 h-4 w-4" />Product Performance</SelectItem>
                  <SelectItem value="profitability"><DollarSign className="inline-block mr-2 h-4 w-4" />Product Profitability</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
                <Label htmlFor="location">Location</Label>
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                    <SelectTrigger id="location">
                        <SelectValue placeholder="Select location"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all"><MapPin className="inline-block mr-2 h-4 w-4"/>All Locations</SelectItem>
                        {locations.map(loc => (
                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {reportType === 'staff' && (
              <div>
                <Label htmlFor="staffMember">Staff Member</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger id="staffMember">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {allStaff.map(staff => (
                      <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(reportType) && (
              <>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <DatePicker date={startDate} setDate={setStartDate} />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <DatePicker date={endDate} setDate={setEndDate} />
                </div>
              </>
            )}
          </div>
          <Button onClick={handleGenerateReport} disabled={!reportType || isGeneratingReport}>
            {isGeneratingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {reportTitle && (
        <Card>
          <CardHeader>
            <CardTitle>{reportTitle}</CardTitle>
            <CardDescription>
              { !isGeneratingReport && generatedReportData.length > 0 
                ? `Displaying ${generatedReportData.length} record(s).`
                : !isGeneratingReport ? 'No data found for the selected criteria.' : ''
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderReportTable()}
          </CardContent>
        </Card>
      )}
      
      <Card className="mt-8">
        <CardHeader>
            <CardTitle>Other Reports</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
              Inventory reports, customer reports, and more advanced filtering/charting capabilities are planned for future updates.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
