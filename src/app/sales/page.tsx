// src/app/sales/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SoldProduct, Product, TopUpCard, CardTransaction, AppSettings } from "@/types"; 
import { SaleForm } from "@/components/SaleForm";
import { SalesHistoryTable } from "@/components/SalesHistoryTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History, Printer, Loader2, Download } from "lucide-react"; // Added Download
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
import { APP_TITLE as DEFAULT_APP_TITLE } from "@/config/constants";

const TOPUP_CARDS_STORAGE_KEY = 'topUpCardsData';
const CARD_TRANSACTIONS_STORAGE_KEY = 'cardTransactionsData';
const APP_SETTINGS_KEY = 'appSettings';

const escapeCsvField = (field: any): string => {
  if (field === null || field === undefined) {
    return '';
  }
  const stringField = String(field);
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

export default function SalesPage() {
  const [soldItems, setSoldItems] = useState<SoldProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]); 
  const [topUpCards, setTopUpCards] = useState<TopUpCard[]>([]);
  const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>([]);
  const [appSettings, setAppSettings] = useState<Partial<AppSettings>>({});
  
  const [isMounted, setIsMounted] = useState(false);
  const [receiptData, setReceiptData] = useState<SoldProduct | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const receiptComponentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const loadData = useCallback(() => {
    const savedSoldItems = localStorage.getItem("soldItems");
    if (savedSoldItems) {
      try { setSoldItems(JSON.parse(savedSoldItems)); } 
      catch (e) { console.error("Failed to parse soldItems", e); setSoldItems([]); }
    }
    const savedProducts = localStorage.getItem("products");
    if (savedProducts) {
      try { setProducts(JSON.parse(savedProducts)); }
      catch (e) { console.error("Failed to parse products", e); setProducts([]); }
    }
    const storedCards = localStorage.getItem(TOPUP_CARDS_STORAGE_KEY);
    if (storedCards) {
      try { setTopUpCards(JSON.parse(storedCards)); }
      catch (e) { console.error("Failed to parse topUpCards", e); setTopUpCards([]); }
    }
    const storedCardTransactions = localStorage.getItem(CARD_TRANSACTIONS_STORAGE_KEY);
    if (storedCardTransactions) {
      try { setCardTransactions(JSON.parse(storedCardTransactions)); }
      catch (e) { console.error("Failed to parse cardTransactions", e); setCardTransactions([]);}
    }
    const storedAppSettings = localStorage.getItem(APP_SETTINGS_KEY);
    if (storedAppSettings) {
      try { setAppSettings(JSON.parse(storedAppSettings)); }
      catch(e) { console.error("Failed to parse app settings", e); setAppSettings({}); }
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, [loadData]);

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

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(TOPUP_CARDS_STORAGE_KEY, JSON.stringify(topUpCards));
    }
  }, [topUpCards, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(CARD_TRANSACTIONS_STORAGE_KEY, JSON.stringify(cardTransactions));
    }
  }, [cardTransactions, isMounted]);


  const handleRecordSale = (newSaleData: Omit<SoldProduct, "id" | "timestamp" | "staffId" | "staffName">) => {
    const newSale: SoldProduct = {
      ...newSaleData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      // staffId and staffName would be set here if user authentication was in place
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const findCardById = useCallback((cardId: string): TopUpCard | undefined => {
    return topUpCards.find(c => c.cardId.toUpperCase() === cardId.toUpperCase());
  }, [topUpCards]);

  const deductFromCardBalance = useCallback((cardId: string, amountToDeduct: number, notes: string): boolean => {
    let success = false;
    setTopUpCards(currentCards => {
        const cardIndex = currentCards.findIndex(c => c.cardId.toUpperCase() === cardId.toUpperCase());
        if (cardIndex === -1) {
            toast({ title: 'Card Not Found', description: `Card ${cardId} not found for deduction.`, variant: 'destructive' });
            success = false;
            return currentCards;
        }
        const cardToUpdate = currentCards[cardIndex];
        if (cardToUpdate.currentBalance < amountToDeduct) {
            toast({ title: 'Insufficient Balance', description: `Card ${cardId} has only ${formatCurrency(cardToUpdate.currentBalance)}. Deduction of ${formatCurrency(amountToDeduct)} failed.`, variant: 'destructive' });
            success = false;
            return currentCards;
        }

        const newBalance = cardToUpdate.currentBalance - amountToDeduct;
        const now = new Date().toISOString();
        const updatedCardData: TopUpCard = {
            ...cardToUpdate,
            currentBalance: newBalance,
            lastUpdatedAt: now,
        };
        
        const newTransaction: CardTransaction = {
            id: crypto.randomUUID(),
            cardId: cardToUpdate.cardId,
            timestamp: now,
            type: 'Purchase',
            amount: -amountToDeduct,
            balanceBefore: cardToUpdate.currentBalance,
            balanceAfter: newBalance,
            staffMember: 'Staff User', 
            notes,
        };

        setCardTransactions(prevTx => [newTransaction, ...prevTx]);
        
        const newCards = [...currentCards];
        newCards[cardIndex] = updatedCardData;
        toast({ title: 'Card Payment Processed', description: `${formatCurrency(amountToDeduct)} deducted from card ${cardToUpdate.cardId}.` });
        success = true;
        return newCards;
    });
    return success;
  }, [toast]);


  const handleExportSales = () => {
    if (soldItems.length === 0) {
      toast({ title: "No Data", description: "There are no sales to export.", variant: "destructive" });
      return;
    }

    const headers = [
      "ID", "Timestamp", "Product Name", "Quantity", "Unit Price", 
      "Subtotal Before Discount", "Discount Type", "Discount Value", "Discount Amount",
      "Subtotal After Discount", "Tax Amount", "Total", "Payment Method", 
      "Product ID", "Cost of Goods Sold at Sale", "Customer ID", "Staff ID", "Staff Name", "Card ID Used"
    ];
    
    const csvRows = [
      headers.join(','),
      ...soldItems.map(sale => [
        escapeCsvField(sale.id),
        escapeCsvField(sale.timestamp),
        escapeCsvField(sale.name),
        escapeCsvField(sale.quantity),
        escapeCsvField(sale.price),
        escapeCsvField(sale.subtotalBeforeDiscount),
        escapeCsvField(sale.discountType),
        escapeCsvField(sale.discountValue),
        escapeCsvField(sale.discountAmount),
        escapeCsvField(sale.subtotal),
        escapeCsvField(sale.taxAmount),
        escapeCsvField(sale.total),
        escapeCsvField(sale.paymentMethod),
        escapeCsvField(sale.productId),
        escapeCsvField(sale.costOfGoodsSoldAtTimeOfSale),
        escapeCsvField(sale.customerId),
        escapeCsvField(sale.staffId),
        escapeCsvField(sale.staffName),
        escapeCsvField(sale.cardIdUsed),
      ].join(','))
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Export Successful", description: "Sales data exported to CSV." });
  };


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
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Management</h1>
            <CardDescription className="text-muted-foreground text-md">
              Record new sales and view sales history. Pay using cash, card, or customer top-up cards.
            </CardDescription>
          </div>
          <Button onClick={handleExportSales} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Sales
          </Button>
        </header>

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <SaleForm 
                onRecordSale={handleRecordSale} 
                soldItemsForAISuggestion={isMounted ? recentItemsForAI : []}
                availableProducts={isMounted ? products : []}
                findCardById={findCardById}
                onDeductFromCard={deductFromCardBalance}
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
              
              <Receipt 
                ref={receiptComponentRef} 
                sale={receiptData}
                storeName={appSettings.storeName || DEFAULT_APP_TITLE}
                storeAddress={appSettings.storeAddress}
                storePhone={appSettings.storePhone}
                storeWebsite={appSettings.storeWebsite}
                footerMessage={appSettings.receiptFooter}
              />
              
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
