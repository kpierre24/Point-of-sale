// src/app/sales/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import type { SoldProduct, Product, User } from "@/types"; // Added Product and User type
import { SaleForm } from "@/components/SaleForm";
import { SalesHistoryTable } from "@/components/SalesHistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Printer } from "lucide-react";
import { Receipt } from "@/components/Receipt"; // Import Receipt component
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { useReactToPrint } from 'react-to-print';
import { useToast } from "@/hooks/use-toast";
import { DUMMY_CURRENT_USER_ID_FOR_SALES } from "@/config/constants"; // Placeholder for current user ID

export default function SalesPage() {
  const [soldItems, setSoldItems] = useState<SoldProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // State for products
  const [currentStaff, setCurrentStaff] = useState<User | null>(null); // State for current staff
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
    const storedUsers = localStorage.getItem('staffUsers');
    if (storedUsers) {
      try {
        const users: User[] = JSON.parse(storedUsers);
        // Attempt to find a "current" user for sales attribution.
        // This is a placeholder. In a real app, this would come from an auth context.
        const currentUser = users.find(u => u.id === DUMMY_CURRENT_USER_ID_FOR_SALES && u.isActive);
        if (currentUser) {
            setCurrentStaff(currentUser);
        } else {
            // Fallback: if no specific dummy user, or dummy is inactive, pick first active admin or first active user.
             const firstActiveAdmin = users.find(u => u.role === 'Admin' && u.isActive);
             if(firstActiveAdmin) setCurrentStaff(firstActiveAdmin);
             else setCurrentStaff(users.find(u => u.isActive) || null);
        }
      } catch (e) {
        console.error("Failed to parse staffUsers from localStorage", e);
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

  const handleRecordSale = (newSaleData: Omit<SoldProduct, "id" | "timestamp">) => {
    const newSale: SoldProduct = {
      ...newSaleData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      staffId: currentStaff?.id, // Add staffId
      staffName: currentStaff?.name, // Add staffName
    };
    setSoldItems((prevItems) => [newSale, ...prevItems]);

    // If a product was sold from inventory, update its stock
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
    toast({ title: "Sale Recorded", description: `${newSale.name} (x${newSale.quantity}) by ${currentStaff?.name || 'Staff'} added to history.` });
  };
  
  const recentItemsForAI = soldItems.slice(0, 10).map(item => ({ name: item.name, price: item.price }));

  const handlePrintReceipt = useReactToPrint({
    content: () => receiptComponentRef.current,
    documentTitle: `Receipt-${receiptData?.id.substring(0,8) || 'sale'}`,
    onAfterPrint: () => toast({title: "Print Complete", description: "Receipt has been sent to printer."}),
    onPrintError: () => toast({title: "Print Error", description: "Could not print receipt.", variant: "destructive"}),
  });

  return (
    <div className="space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Sales Management</h1>
          <p className="text-muted-foreground text-md">
            Record new sales and view sales history. Current User: {currentStaff?.name || "Not Logged In"}
          </p>
        </header>

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <SaleForm 
                onRecordSale={handleRecordSale} 
                soldItemsForAISuggestion={isMounted ? recentItemsForAI : []}
                availableProducts={isMounted ? products : []}
                currentStaffId={currentStaff?.id}
                currentStaffName={currentStaff?.name}
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
                <DialogDescription className="no-print">
                  Review the details of the sale. Click print to get a hard copy.
                </DialogDescription>
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
