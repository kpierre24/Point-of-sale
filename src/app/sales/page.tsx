// src/app/sales/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import type { SoldProduct, Product } from "@/types"; 
import { SaleForm } from "@/components/SaleForm";
import { SalesHistoryTable } from "@/components/SalesHistoryTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History, Printer, Loader2 } from "lucide-react";
import { Receipt } from "@/components/Receipt"; 
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription as ReceiptDialogDescription,
} from "@/components/ui/dialog";
import { useReactToPrint } from 'react-to-print';
import { useToast } from "@/hooks/use-toast";

export default function SalesPage() {
  const [soldItems, setSoldItems] = useState<SoldProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]); 
  const [isMounted, setIsMounted] = useState(false);
  const [receiptData, setReceiptData] = useState<SoldProduct | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const receiptComponentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    const savedSoldItems = localStorage.getItem("soldItems");
    if (savedSoldItems) {
      try {
        setSoldItems(JSON.parse(savedSoldItems));
      } catch (e) {
        console.error("Failed to parse soldItems from localStorage", e);
        setSoldItems([]);
      }
    }
    const savedProducts = localStorage.getItem("products");
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error("Failed to parse products from localStorage", e);
        setProducts([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("soldItems", JSON.stringify(soldItems));
    }
  }, [soldItems, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("products", JSON.stringify(products));
    }
  }, [products, isMounted]);

  const handleRecordSale = (newSaleData: Omit<SoldProduct, "id" | "timestamp" | "staffId" | "staffName">) => {
    const newSale: SoldProduct = {
      ...newSaleData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      // staffId and staffName removed as auth is removed
    };
    setSoldItems((prevItems) => [newSale, ...prevItems]);

    if (newSale.productId) {
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === newSale.productId 
          ? { ...p, stockQuantity: p.stockQuantity - newSale.quantity }
          : p
        )
      );
    }
    setReceiptData(newSale);
    setIsReceiptModalOpen(true);
    toast({ title: "Sale Recorded", description: `${newSale.name} (x${newSale.quantity}) added to history.` });
  };
  
  const recentItemsForAI = soldItems.slice(0, 10).map(item => ({ name: item.name, price: item.price }));

  const handlePrintReceipt = useReactToPrint({
    content: () => receiptComponentRef.current,
    documentTitle: `Receipt-${receiptData?.id.substring(0,8) || 'sale'}`,
    onAfterPrint: () => toast({title: "Print Complete", description: "Receipt has been sent to printer."}),
    onPrintError: () => toast({title: "Print Error", description: "Could not print receipt.", variant: "destructive"}),
  });

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Sales...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Sales Management</h1>
          <CardDescription className="text-muted-foreground text-md">
            Record new sales and view sales history.
          </CardDescription>
        </header>

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <SaleForm 
                onRecordSale={handleRecordSale} 
                soldItemsForAISuggestion={isMounted ? recentItemsForAI : []}
                availableProducts={isMounted ? products : []}
                // currentStaffId and currentStaffName props removed
              />
            </div>
            <div className="lg:col-span-3">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <History className="mr-2 h-6 w-6 text-primary" /> 
                    Sales History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SalesHistoryTable soldItems={soldItems} />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {receiptData && (
          <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
            <DialogContent className="sm:max-w-md printable-receipt">
              <DialogHeader>
                <DialogTitle>Sale Receipt</DialogTitle>
                <ReceiptDialogDescription className="no-print">
                  Review the details of the sale. Click print to get a hard copy.
                </ReceiptDialogDescription>
              </DialogHeader>
              
              <Receipt ref={receiptComponentRef} sale={receiptData} />
              
              <DialogFooter className="pt-4 mt-2 border-t no-print">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Close</Button>
                </DialogClose>
                <Button onClick={handlePrintReceipt}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
  );
}
