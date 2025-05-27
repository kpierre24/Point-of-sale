// src/components/PurchaseOrderTable.tsx
"use client";

import type { PurchaseOrder } from '@/types';
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
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrder[];
  onEdit: (order: PurchaseOrder) => void;
  onDelete: (orderId: string) => void;
  isLoading?: boolean; // Added isLoading prop
}

export function PurchaseOrderTable({ purchaseOrders, onEdit, onDelete, isLoading = false }: PurchaseOrderTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      // Assuming dateString is 'yyyy-MM-dd' or a full ISO string
      return format(new Date(dateString  + (dateString.length === 10 ? 'T00:00:00' : '')), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  const getStatusBadgeVariant = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'Pending':
        return 'secondary';
      case 'Received':
        return 'default'; 
      case 'Cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };


  return (
    <ScrollArea className="h-[500px] rounded-md border shadow-inner">
      <Table>
        {purchaseOrders.length === 0 && <TableCaption>No purchase orders available.</TableCaption>}
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow>
            <TableHead className="w-[120px]">Order ID</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Received Date</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Items</TableHead>
            <TableHead className="text-right">Grand Total</TableHead>
            <TableHead className="text-center w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseOrders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs truncate" title={order.id}>
                {order.id.substring(0, 8)}...
              </TableCell>
              <TableCell className="font-medium">{order.supplierName}</TableCell>
              <TableCell>{formatDate(order.orderDate)}</TableCell>
              <TableCell>{formatDate(order.receivedDate)}</TableCell>
              <TableCell className="text-center">
                 <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
              </TableCell>
              <TableCell className="text-right">{order.items.length}</TableCell>
              <TableCell className="text-right font-semibold">{formatCurrency(order.grandTotal)}</TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center items-center space-x-2">
                  <Button variant="outline" size="icon" onClick={() => onEdit(order)} disabled={isLoading}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit Order</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" disabled={isLoading}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Order</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the purchase order
                          from "{order.supplierName}" (ID: {order.id.substring(0,8)}...).
                          If the order was 'Received', stock levels will be adjusted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(order.id)}>
                          Yes, delete order
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
