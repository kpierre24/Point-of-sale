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
            <TableHead className="text-right">Subtotal</TableHead>
            <TableHead className="text-right">Tax</TableHead>
            <TableHead>Payment</TableHead> {/* Added Payment Method Column */}
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
              <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.taxAmount)}</TableCell>
              <TableCell>{item.paymentMethod}</TableCell> {/* Display Payment Method */}
              <TableCell className="text-right font-semibold">{formatCurrency(item.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
