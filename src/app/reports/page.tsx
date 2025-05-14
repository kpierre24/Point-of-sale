// src/app/reports/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { SoldProduct, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, BarChartBig, UserSquare, CalendarDays } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, getWeek, getMonth, getYear } from 'date-fns';
import { Label } from "@/components/ui/label"; // Added import for Label

type ReportType = 'staff' | 'daily' | 'weekly' | 'monthly' | '';
interface ReportDataItem {
  [key: string]: any;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export default function ReportsPage() {
  const [allSales, setAllSales] = useState<SoldProduct[]>([]);
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const [reportType, setReportType] = useState<ReportType>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [generatedReportData, setGeneratedReportData] = useState<ReportDataItem[]>([]);
  const [reportTitle, setReportTitle] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);
    const storedSales = localStorage.getItem('soldItems');
    if (storedSales) {
      try {
        setAllSales(JSON.parse(storedSales));
      } catch (e) {
        console.error("Failed to parse sales from localStorage", e);
        setAllSales([]);
      }
    }
    const storedStaff = localStorage.getItem('staffUsers');
    if (storedStaff) {
      try {
        setAllStaff(JSON.parse(storedStaff));
      } catch (e) {
        console.error("Failed to parse staff from localStorage", e);
        setAllStaff([]);
      }
    }
  }, []);
  
  const getStaffName = (staffId?: string): string => {
    if (!staffId) return 'N/A';
    const staffMember = allStaff.find(s => s.id === staffId);
    return staffMember ? staffMember.name : 'Unknown Staff';
  };

  const handleGenerateReport = () => {
    if (!reportType) {
      setGeneratedReportData([]);
      setReportTitle('');
      return;
    }

    let filteredSales = allSales;
    if (startDate && endDate && (reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly')) {
      const rangeEnd = new Date(endDate);
      rangeEnd.setHours(23, 59, 59, 999); // Ensure end of day for endDate
      filteredSales = allSales.filter(sale => 
        isWithinInterval(parseISO(sale.timestamp), { start: startDate, end: rangeEnd })
      );
    }
    
    let data: ReportDataItem[] = [];
    let title = '';

    switch (reportType) {
      case 'staff':
        title = `Sales by Staff Member${selectedStaffId !== 'all' ? ` (${getStaffName(selectedStaffId)})` : ''}`;
        const staffSales: { [key: string]: { totalAmount: number; salesCount: number; items: SoldProduct[] } } = {};
        
        (selectedStaffId === 'all' ? filteredSales : filteredSales.filter(s => s.staffId === selectedStaffId)).forEach(sale => {
          const staffId = sale.staffId || 'unknown';
          if (!staffSales[staffId]) {
            staffSales[staffId] = { totalAmount: 0, salesCount: 0, items: [] };
          }
          staffSales[staffId].totalAmount += sale.total;
          staffSales[staffId].salesCount += 1;
          staffSales[staffId].items.push(sale);
        });
        
        data = Object.entries(staffSales).map(([staffId, aggregates]) => ({
          staffName: getStaffName(staffId),
          totalSalesAmount: aggregates.totalAmount,
          numberOfSales: aggregates.salesCount,
          averageSaleValue: aggregates.salesCount > 0 ? aggregates.totalAmount / aggregates.salesCount : 0,
          // topProduct: aggregates.items.sort((a,b) => b.quantity - a.quantity)[0]?.name || 'N/A' // Example advanced metric
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
        })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;

      case 'weekly':
        title = `Weekly Sales Summary (${format(startDate || new Date(), 'MMM dd')} - ${format(endDate || new Date(), 'MMM dd, yyyy')})`;
        const weeklySales: { [key: string]: { totalAmount: number; salesCount: number } } = {};
        filteredSales.forEach(sale => {
          const saleDate = parseISO(sale.timestamp);
          const weekKey = `${getYear(saleDate)}-W${getWeek(saleDate, { weekStartsOn: 1 })}`; // ISO week
          if (!weeklySales[weekKey]) {
            weeklySales[weekKey] = { totalAmount: 0, salesCount: 0 };
          }
          weeklySales[weekKey].totalAmount += sale.total;
          weeklySales[weekKey].salesCount += 1;
        });
        data = Object.entries(weeklySales).map(([week, aggregates]) => ({
          week: week, // e.g. "2023-W42"
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
          month: format(parseISO(month + '-01'), 'MMMM yyyy'), // Format for display
          totalSalesAmount: aggregates.totalAmount,
          numberOfSales: aggregates.salesCount,
        })).sort((a,b) => a.month.localeCompare(b.month)); // This might need date-based sort if format changes
        break;
    }
    setGeneratedReportData(data);
    setReportTitle(title);
  };
  
  const renderReportTable = () => {
    if (generatedReportData.length === 0 && reportTitle) return <p className="text-muted-foreground">No data available for this report.</p>;
    if (generatedReportData.length === 0) return null;

    const headers: { key: string, label: string, type?: 'currency' | 'number' | 'string' }[] = [];
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
    }

    return (
      <ScrollArea className="h-[500px] rounded-md border shadow-inner mt-4">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              {headers.map(header => <TableHead key={header.key} className={header.type === 'currency' || header.type === 'number' ? 'text-right' : ''}>{header.label}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {generatedReportData.map((row, index) => (
              <TableRow key={index}>
                {headers.map(header => (
                  <TableCell key={header.key} className={header.type === 'currency' || header.type === 'number' ? 'text-right' : ''}>
                    {header.type === 'currency' ? formatCurrency(row[header.key]) : row[header.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><FileText className="h-8 w-8 animate-pulse" /> <span className="ml-2">Loading reports...</span></div>;
  }

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <BarChartBig className="mr-3 h-8 w-8 text-primary" />
          Sales Reports
        </h1>
        <p className="text-muted-foreground text-md">
          Generate and view sales reports by staff, or daily, weekly, and monthly summaries.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select report type and filters to generate a sales report.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
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

            {(reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly') && (
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
          <Button onClick={handleGenerateReport} disabled={!reportType}>Generate Report</Button>
        </CardContent>
      </Card>

      {reportTitle && (
        <Card>
          <CardHeader>
            <CardTitle>{reportTitle}</CardTitle>
            <CardDescription>
              { generatedReportData.length > 0 
                ? `Displaying ${generatedReportData.length} record(s).`
                : 'No data found for the selected criteria.'
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

