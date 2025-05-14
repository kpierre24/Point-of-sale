// src/app/sales/page.tsx
"use client";

import { useState, useEffect } from "react";
import type { SoldProduct, Product } from "@/types"; // Added Product type
import { SaleForm } from "@/components/SaleForm";
import { SalesHistoryTable } from "@/components/SalesHistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

export default function SalesPage() {
  const [soldItems, setSoldItems] = useState<SoldProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // State for products
  const [isMounted, setIsMounted] = useState(false);

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

  const handleRecordSale = (newSaleData: Omit<SoldProduct, "id" | "timestamp">) => {
    const newSale: SoldProduct = {
      ...newSaleData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
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
  };
  
  const recentItemsForAI = soldItems.slice(0, 10).map(item => ({ name: item.name, price: item.price }));

  return (
    <div className="space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Sales Management</h1>
          <p className="text-muted-foreground text-md">
            Record new sales and view sales history.
          </p>
        </header>

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <SaleForm 
                onRecordSale={handleRecordSale} 
                soldItemsForAISuggestion={isMounted ? recentItemsForAI : []}
                availableProducts={isMounted ? products : []}
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
      </div>
  );
}
