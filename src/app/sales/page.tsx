// src/app/sales/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SoldProduct, Product, TopUpCard, CardTransaction, AppSettings } from "@/types"; 
import { SaleForm } from "@/components/SaleForm";
import { SalesHistoryTable } from "@/components/SalesHistoryTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History, Printer, Loader2, Download } from "lucide-react";
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
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, addDoc, writeBatch, query as firestoreQuery, orderBy, where } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SALES_COLLECTION = 'sales';
const PRODUCTS_COLLECTION = 'products';
const TOPUP_CARDS_COLLECTION = 'topUpCards';
const CARD_TRANSACTIONS_COLLECTION = 'cardTransactions';
const APP_SETTINGS_DOC_ID = 'current';

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

// Fetcher functions
const fetchSales = async (): Promise<SoldProduct[]> => {
  if (!db) throw new Error("Firestore not available");
  const salesCol = collection(db, SALES_COLLECTION);
  const q = firestoreQuery(salesCol, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SoldProduct));
};

const fetchProducts = async (): Promise<Product[]> => {
  if (!db) throw new Error("Firestore not available");
  const productsCol = collection(db, PRODUCTS_COLLECTION);
  const snapshot = await getDocs(productsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

const fetchTopUpCards = async (): Promise<TopUpCard[]> => {
  if (!db) throw new Error("Firestore not available");
  const cardsCol = collection(db, TOPUP_CARDS_COLLECTION);
  const snapshot = await getDocs(cardsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TopUpCard));
};

const fetchAppSettings = async (): Promise<Partial<AppSettings>> => {
    if (!db) { console.warn("Firestore not available for app settings."); return {}; }
    const settingsDocRef = doc(db, 'appSettings', APP_SETTINGS_DOC_ID);
    const docSnap = await getDoc(settingsDocRef);
    return docSnap.exists() ? docSnap.data() as AppSettings : {};
};


export default function SalesPage() {
  const [receiptData, setReceiptData] = useState<SoldProduct | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const receiptComponentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: soldItems = [], isLoading: isLoadingSales, isError: isSalesError, error: salesError } = useQuery<SoldProduct[], Error>({
    queryKey: [SALES_COLLECTION],
    queryFn: fetchSales,
    enabled: !!db,
  });

  const { data: products = [], isLoading: isLoadingProducts, isError: isProductsError, error: productsError } = useQuery<Product[], Error>({
    queryKey: [PRODUCTS_COLLECTION],
    queryFn: fetchProducts,
    enabled: !!db,
  });

  const { data: topUpCards = [], isLoading: isLoadingTopUpCards, isError: isTopUpCardsError, error: topUpCardsError } = useQuery<TopUpCard[], Error>({
    queryKey: [TOPUP_CARDS_COLLECTION],
    queryFn: fetchTopUpCards,
    enabled: !!db,
  });
  
  const { data: appSettings = {}, isLoading: isLoadingAppSettings } = useQuery<Partial<AppSettings>, Error>({
    queryKey: ['appSettings', APP_SETTINGS_DOC_ID],
    queryFn: fetchAppSettings,
    enabled: !!db,
  });

  useEffect(() => {
    if (isSalesError) toast({ title: 'Error Loading Sales', description: salesError?.message, variant: 'destructive' });
    if (isProductsError) toast({ title: 'Error Loading Products', description: productsError?.message, variant: 'destructive' });
    if (isTopUpCardsError) toast({ title: 'Error Loading Top-Up Cards', description: topUpCardsError?.message, variant: 'destructive' });
  }, [isSalesError, salesError, isProductsError, productsError, isTopUpCardsError, topUpCardsError, toast]);

  const recordSaleMutation = useMutation<void, Error, { newSaleData: Omit<SoldProduct, "id" | "timestamp" | "staffId" | "staffName">; paymentCardToUpdate?: TopUpCard; saleTotal?: number }>({
    mutationFn: async ({ newSaleData, paymentCardToUpdate, saleTotal }) => {
      if (!db) throw new Error("Firestore not available");
      const batch = writeBatch(db);

      const newSale: SoldProduct = {
        ...newSaleData,
        id: crypto.randomUUID(), // Still using client-generated ID for the sale itself
        timestamp: new Date().toISOString(),
      };

      // Add sale document
      const saleRef = doc(db, SALES_COLLECTION, newSale.id);
      batch.set(saleRef, newSale);

      // Update product stock if productId is present
      if (newSale.productId) {
        const productRef = doc(db, PRODUCTS_COLLECTION, newSale.productId);
        const product = products.find(p => p.id === newSale.productId);
        if (product) {
          const newStock = Math.max(0, product.stockQuantity - newSale.quantity);
          batch.update(productRef, { stockQuantity: newStock });
        }
      }
      
      // Update Top-Up Card balance and add transaction if applicable
      if (paymentCardToUpdate && saleTotal !== undefined) {
        const cardRef = doc(db, TOPUP_CARDS_COLLECTION, paymentCardToUpdate.id); // Use Firestore document ID (paymentCardToUpdate.id)
        const newBalance = paymentCardToUpdate.currentBalance - saleTotal;
        const now = new Date().toISOString();
        
        batch.update(cardRef, { 
            currentBalance: newBalance,
            lastUpdatedAt: now,
        });

        const newTransaction: Omit<CardTransaction, 'id'> = { // Firestore will generate ID
            cardId: paymentCardToUpdate.cardId, // The user-facing card ID
            timestamp: now,
            type: 'Purchase',
            amount: -saleTotal,
            balanceBefore: paymentCardToUpdate.currentBalance,
            balanceAfter: newBalance,
            staffMember: 'Staff User', // Placeholder
            notes: `Sale: ${newSale.name} x${newSale.quantity}`,
        };
        const transactionRef = doc(collection(db, CARD_TRANSACTIONS_COLLECTION)); // Auto-generate ID
        batch.set(transactionRef, newTransaction);
      }

      await batch.commit();
      return newSale as any; // To pass to onSuccess for receiptData
    },
    onSuccess: (newSaleResult: any) => { // newSaleResult is actually the newSale object from mutationFn
      queryClient.invalidateQueries({ queryKey: [SALES_COLLECTION] });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_COLLECTION] });
      queryClient.invalidateQueries({ queryKey: [TOPUP_CARDS_COLLECTION] });
      queryClient.invalidateQueries({ queryKey: [CARD_TRANSACTIONS_COLLECTION] });
      
      const actualNewSale = newSaleResult as SoldProduct;
      setReceiptData(actualNewSale);
      setIsReceiptModalOpen(true);
      toast({ title: "Sale Recorded", description: `${actualNewSale.name} (x${actualNewSale.quantity}) added to history.` });
    },
    onError: (error) => {
      toast({ title: 'Error Recording Sale', description: error.message, variant: 'destructive' });
    }
  });


  const handleRecordSale = (saleData: Omit<SoldProduct, "id" | "timestamp" | "staffId" | "staffName">, paymentCardDetails?: { card: TopUpCard; saleTotal: number}) => {
     recordSaleMutation.mutate({ 
        newSaleData: saleData, 
        paymentCardToUpdate: paymentCardDetails?.card,
        saleTotal: paymentCardDetails?.saleTotal 
    });
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

  // This function finds a card by its user-facing cardId from the already fetched topUpCards data
  const findCardByCardId = useCallback((cardId: string): TopUpCard | undefined => {
    return topUpCards.find(c => c.cardId.toUpperCase() === cardId.toUpperCase());
  }, [topUpCards]);


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
        escapeCsvField(sale.id), escapeCsvField(sale.timestamp), escapeCsvField(sale.name),
        escapeCsvField(sale.quantity), escapeCsvField(sale.price), escapeCsvField(sale.subtotalBeforeDiscount),
        escapeCsvField(sale.discountType), escapeCsvField(sale.discountValue), escapeCsvField(sale.discountAmount),
        escapeCsvField(sale.subtotal), escapeCsvField(sale.taxAmount), escapeCsvField(sale.total),
        escapeCsvField(sale.paymentMethod), escapeCsvField(sale.productId), escapeCsvField(sale.costOfGoodsSoldAtTimeOfSale),
        escapeCsvField(sale.customerId), escapeCsvField(sale.staffId), escapeCsvField(sale.staffName),
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

  if (!db) {
    return (
      <div className="space-y-8">
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Firebase Not Connected</CardTitle></CardHeader>
          <CardContent><p>Cannot load sales data. Please check Firebase configuration.</p></CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingSales || isLoadingProducts || isLoadingTopUpCards || isLoadingAppSettings) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Sales Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Management</h1>
            <CardDescription className="text-muted-foreground text-md">
              Record new sales and view sales history. Data stored in Firestore.
            </CardDescription>
          </div>
          <Button onClick={handleExportSales} variant="outline" disabled={soldItems.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export Sales
          </Button>
        </header>

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <SaleForm 
                onRecordSale={handleRecordSale} 
                soldItemsForAISuggestion={soldItems.slice(0, 10).map(item => ({ name: item.name, price: item.price }))}
                availableProducts={products}
                findCardByCardId={findCardByCardId}
                // onDeductFromCard is effectively handled by recordSaleMutation now
                // So it's no longer passed directly. The form will pass card details to onRecordSale.
                appSettings={appSettings}
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
