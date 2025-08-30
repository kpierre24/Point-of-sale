// src/components/SalesHistoryTable.tsx
"use client";
import React, { useState, useMemo } from "react";
import type { Sale } from "@/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge"; 
import { CreditCard, Tag, ArrowUpDown, ArrowUp, ArrowDown, Eye, Download, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast"; 

type SortField = 'timestamp' | 'name' | 'quantity' | 'price' | 'total';
type SortDirection = 'asc' | 'desc';

interface SalesHistoryTableProps {
  soldItems: Sale[];
}

function SalesHistoryTableComponent({ soldItems }: SalesHistoryTableProps) {
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-slate-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4 text-blue-600" />
      : <ArrowDown className="ml-2 h-4 w-4 text-blue-600" />;
  };

  const sortedItems = useMemo(() => {
    return [...soldItems].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [soldItems, sortField, sortDirection]);

  return (
    <div className="space-y-4">
      {/* Enhanced Table Header with Summary */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Transaction History</h3>
          <p className="text-sm text-slate-600">
            {soldItems.length} transactions • Total: {formatCurrency(soldItems.reduce((sum, item) => sum + item.total, 0))}
          </p>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Enhanced Table with Sorting and Better Styling */}
      <ScrollArea className="h-[450px] rounded-lg border-2 border-slate-200 shadow-sm">
        <Table>
          {soldItems.length === 0 && (
            <TableCaption className="py-8 text-slate-500">
              No sales recorded yet. Start by adding your first sale above.
            </TableCaption>
          )}
          
          {/* Enhanced Sortable Headers */}
          <TableHeader className="sticky top-0 bg-gradient-to-r from-slate-100 to-slate-200 z-10 border-b-2 border-slate-300">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[160px] font-semibold text-slate-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-slate-700 hover:text-blue-600"
                  onClick={() => handleSort('timestamp')}
                >
                  Date & Time
                  {getSortIcon('timestamp')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-slate-700 hover:text-blue-600"
                  onClick={() => handleSort('name')}
                >
                  Product Name
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-slate-700 hover:text-blue-600"
                  onClick={() => handleSort('quantity')}
                >
                  Qty
                  {getSortIcon('quantity')}
                </Button>
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-slate-700 hover:text-blue-600"
                  onClick={() => handleSort('price')}
                >
                  Unit Price
                  {getSortIcon('price')}
                </Button>
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Discount</TableHead>
              <TableHead className="font-semibold text-slate-700">Payment</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-slate-700 hover:text-blue-600"
                  onClick={() => handleSort('total')}
                >
                  Total
                  {getSortIcon('total')}
                </Button>
              </TableHead>
              <TableHead className="w-[80px] font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          {/* Enhanced Table Body with Alternating Colors */}
          <TableBody>
            {sortedItems.map((item, index) => (
                <TableRow 
                  key={item.id}
                  className={`
                    ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                    hover:bg-blue-50 transition-colors duration-150 border-b border-slate-200
                    touch-manipulation select-none
                  `}
                >
                <TableCell className="py-4 font-medium text-slate-700">
                  <div>
                    <div className="font-semibold">{format(new Date(item.timestamp), 'MMM dd, yyyy')}</div>
                    <div className="text-xs text-slate-500">{format(new Date(item.timestamp), 'HH:mm:ss')}</div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="font-semibold text-slate-800">{item.name}</div>
                  {item.productId && (
                    <div className="text-xs text-slate-500 font-mono">ID: {item.productId.substring(0, 8)}...</div>
                  )}
                </TableCell>
                <TableCell className="text-right py-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {item.quantity}
                  </span>
                </TableCell>
                <TableCell className="text-right py-4 font-semibold text-slate-700">
                  {formatCurrency(item.price)}
                </TableCell>
                <TableCell className="text-right py-4">
                  {item.discountAmount && item.discountAmount > 0 ? (
                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 border-red-200">
                      <Tag className="mr-1 h-3 w-3"/>
                      -{formatCurrency(item.discountAmount)}
                      {item.discountType === 'percentage' && ` (${item.discountValue}%)`}
                    </Badge>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <div className="space-y-1">
                    <Badge 
                      variant={item.paymentMethod === 'Cash' ? 'default' : 'outline'}
                      className={`text-xs ${
                        item.paymentMethod === 'Cash' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {item.paymentMethod}
                    </Badge>
                    {item.paymentMethod === 'Top-Up Card' && item.cardIdUsed && (
                      <div className="text-xs text-slate-500 font-mono">
                        <CreditCard className="inline mr-1 h-3 w-3"/> {item.cardIdUsed}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right py-4">
                  <div className="font-bold text-lg text-slate-800">{formatCurrency(item.total)}</div>
                  {item.taxAmount && item.taxAmount > 0 && (
                    <div className="text-xs text-slate-500">Tax: {formatCurrency(item.taxAmount)}</div>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-200">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export Receipt
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

export const SalesHistoryTable = React.memo(SalesHistoryTableComponent);
