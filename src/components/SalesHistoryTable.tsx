// src/components/SalesHistoryTable.tsx
"use client";

import type { SoldProduct } from "@/types";
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
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge"; 
import { CreditCard, Tag } from "lucide-react"; 

interface SalesHistoryTableProps {
  soldItems: SoldProduct[];
}

export function SalesHistoryTable({ soldItems }: SalesHistoryTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <ScrollArea className="h-[400px] rounded-md border shadow-sm">
      <Table>
        {soldItems.length === 0 && <TableCaption>No sales recorded yet.</TableCaption>}
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow>
            <TableHead className="w-[150px]">Date</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Discount</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {soldItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}</TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
              <TableCell className="text-right">
                {item.discountAmount && item.discountAmount > 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    <Tag className="mr-1 h-3 w-3"/>
                    {formatCurrency(item.discountAmount)}
                    {item.discountType === 'percentage' && ` (${item.discountValue}%)`}
                  </Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {item.paymentMethod}
                {item.paymentMethod === 'Top-Up Card' && item.cardIdUsed && (
                  <Badge variant="outline" className="ml-2 font-mono text-xs">
                    <CreditCard className="mr-1 h-3 w-3"/> {item.cardIdUsed}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right font-semibold">{formatCurrency(item.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
