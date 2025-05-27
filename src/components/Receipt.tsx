// src/components/Receipt.tsx
"use client";

import React from 'react';
import type { SoldProduct } from '@/types';
import { APP_TITLE as DEFAULT_APP_TITLE } from '@/config/constants';
import { format } from 'date-fns';

interface ReceiptProps {
  sale: SoldProduct;
  storeName?: string;
  footerMessage?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, storeName = DEFAULT_APP_TITLE, footerMessage = "Thank you for your purchase!" }, ref) => {
  return (
    <div ref={ref} className="p-6 bg-background text-foreground font-mono text-sm printable-receipt-content">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold">{storeName}</h1>
        {/* Add store address/phone here if available in future */}
        <p className="text-xs">Date: {format(new Date(sale.timestamp), 'MMM dd, yyyy HH:mm:ss')}</p>
        <p className="text-xs">Receipt ID: {sale.id.substring(0, 8)}...</p>
        {sale.staffName && <p className="text-xs">Served by: {sale.staffName}</p>}
      </header>

      <section className="mb-4">
        <h2 className="font-semibold border-b border-dashed border-foreground pb-1 mb-2">Items Sold</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-dashed border-foreground">
              <th className="text-left pb-1">Qty</th>
              <th className="text-left pb-1">Item</th>
              <th className="text-right pb-1">Price</th>
              <th className="text-right pb-1">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr key={sale.id}>
              <td className="pt-1">{sale.quantity}</td>
              <td className="pt-1">{sale.name}</td>
              <td className="text-right pt-1">{formatCurrency(sale.price)}</td>
              <td className="text-right pt-1">{formatCurrency(sale.price * sale.quantity)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mb-6 pt-2 border-t border-dashed border-foreground">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>{formatCurrency(sale.taxAmount)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-1">
          <span>Total:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
        <div className="flex justify-between mt-2">
          <span>Payment Method:</span>
          <span>{sale.paymentMethod}</span>
        </div>
         {sale.cardIdUsed && (
          <div className="flex justify-between text-xs">
            <span>Card ID Used:</span>
            <span>{sale.cardIdUsed}</span>
          </div>
        )}
      </section>

      <footer className="text-center">
        <p>{footerMessage}</p>
        {/* Add return policy or other messages here */}
      </footer>
    </div>
  );
});

Receipt.displayName = 'Receipt';
