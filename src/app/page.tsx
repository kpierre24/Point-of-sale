"use client";

import { useState, useEffect } from "react";
import type { SoldProduct } from "@/types";
import { SaleForm } from "@/components/SaleForm";
import { SalesHistoryTable } from "@/components/SalesHistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE } from "@/config/constants";
import { History, ShoppingCart } from "lucide-react"; // Import History icon

export default function HomePage() {
  const [soldItems, setSoldItems] = useState<SoldProduct[]>([]);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsMounted(true);
    setCurrentYear(new Date().getFullYear());

    const savedItems = localStorage.getItem("soldItems");
    if (savedItems) {
      try {
        setSoldItems(JSON.parse(savedItems));
      } catch (e) {
        console.error("Failed to parse soldItems from localStorage", e);
        setSoldItems([]); // Fallback to empty if parsing fails
      }
    }
  }, []); // Empty dependency array: runs once after initial mount

  useEffect(() => {
    // This effect saves to localStorage.
    // It runs only on the client (due to isMounted check) and when soldItems changes.
    if (isMounted) {
      localStorage.setItem("soldItems", JSON.stringify(soldItems));
    }
  }, [soldItems, isMounted]);

  const handleRecordSale = (newSaleData: Omit<SoldProduct, "id" | "timestamp">) => {
    const newSale: SoldProduct = {
      ...newSaleData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setSoldItems((prevItems) => [newSale, ...prevItems]);
  };
  
  const recentItemsForAI = soldItems.slice(0, 10).map(item => ({ name: item.name, price: item.price }));

  return (
    <>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center mb-2">
            <ShoppingCart className="h-10 w-10 text-primary mr-3" />
            <h1 className="text-4xl font-bold tracking-tight">{APP_TITLE}</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Efficiently track your product sales with AI-powered suggestions.
          </p>
        </header>

        <main className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <SaleForm 
                onRecordSale={handleRecordSale} 
                soldItemsForAISuggestion={isMounted ? recentItemsForAI : []} 
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
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          {isMounted && currentYear ? (
            <p>&copy; {currentYear} {APP_TITLE}. All rights reserved.</p>
          ) : (
            <p>&copy; {APP_TITLE}. All rights reserved.</p> 
          )}
        </footer>
      </div>
    </>
  );
}
