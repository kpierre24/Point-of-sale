// src/app/purchases/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { PurchaseOrder, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { PurchaseOrderForm } from '@/components/PurchaseOrderForm';
import { PurchaseOrderTable } from '@/components/PurchaseOrderTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, PackagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PurchasesPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [purchaseOrderToEdit, setPurchaseOrderToEdit] = useState<PurchaseOrder | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    const storedPurchaseOrders = localStorage.getItem('purchaseOrders');
    if (storedPurchaseOrders) {
      try {
        setPurchaseOrders(JSON.parse(storedPurchaseOrders));
      } catch (e) {
        console.error("Failed to parse purchaseOrders from localStorage", e);
        setPurchaseOrders([]);
      }
    }
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      try {
        setProducts(JSON.parse(storedProducts));
      } catch (e) {
        console.error("Failed to parse products from localStorage", e);
        setProducts([]); // Initialize to empty array on error
      }
    } else {
      setProducts([]); // Initialize if no products in localStorage
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('purchaseOrders', JSON.stringify(purchaseOrders));
    }
  }, [purchaseOrders, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('products', JSON.stringify(products));
    }
  }, [products, isMounted]);

  const updateProductStock = (orderForStockUpdate: PurchaseOrder, isReverting: boolean = false) => {
    if (orderForStockUpdate.status !== 'Received' && !isReverting) return; // Only update stock for 'Received' orders or when reverting a 'Received' order
    
    setProducts(currentProducts => {
      const updatedProducts = currentProducts.map(p => ({ ...p })); // Deep copy to ensure re-render

      orderForStockUpdate.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex > -1) {
          const operation = isReverting ? -1 : 1;
          updatedProducts[productIndex].stockQuantity += (item.quantity * operation);
          if (updatedProducts[productIndex].stockQuantity < 0) {
            updatedProducts[productIndex].stockQuantity = 0; // Prevent negative stock
          }
        }
      });
      return updatedProducts;
    });
  };

  const handleSavePurchaseOrder = (orderData: PurchaseOrder) => {
    const originalOrder = purchaseOrders.find(po => po.id === orderData.id);

    setPurchaseOrders(prevOrders => {
      const existingIndex = prevOrders.findIndex(po => po.id === orderData.id);
      let updatedOrders;
      if (existingIndex > -1) {
        updatedOrders = [...prevOrders];
        updatedOrders[existingIndex] = orderData;
        toast({ title: 'Purchase Order Updated', description: `Order from ${orderData.supplierName} has been updated.` });
      } else {
        updatedOrders = [orderData, ...prevOrders];
        toast({ title: 'Purchase Order Added', description: `New order from ${orderData.supplierName} has been recorded.` });
      }
      return updatedOrders;
    });

    // Stock update logic: Revert old stock if applicable, then apply new stock if applicable.
    if (originalOrder && originalOrder.status === 'Received') {
      // Revert stock from the original state of the order if it was 'Received'
      updateProductStock(originalOrder, true);
    }
    if (orderData.status === 'Received') {
      // Apply stock from the new state of the order if it's 'Received'
      updateProductStock(orderData, false);
       toast({ title: 'Stock Updated', description: `Product quantities updated based on received order.` });
    }
    
    setPurchaseOrderToEdit(null);
  };

  const handleAddNewPurchaseOrder = () => {
    setPurchaseOrderToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditPurchaseOrder = (order: PurchaseOrder) => {
    setPurchaseOrderToEdit(order);
    setIsFormOpen(true);
  };

  const handleDeletePurchaseOrder = (orderId: string) => {
    const orderToDelete = purchaseOrders.find(po => po.id === orderId);
    if (orderToDelete && orderToDelete.status === 'Received') {
      // Revert stock if deleting a 'Received' order
      updateProductStock(orderToDelete, true);
      toast({ title: 'Stock Reverted', description: 'Stock quantities adjusted for deleted received order.' });
    }
    setPurchaseOrders(prevOrders => prevOrders.filter(po => po.id !== orderId));
    toast({ title: 'Purchase Order Deleted', description: 'The purchase order has been removed.', variant: 'destructive' });
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <PackagePlus className="mr-3 h-8 w-8 text-primary" />
            Purchase Orders
          </h1>
          <p className="text-muted-foreground text-md">
            Manage your inventory purchases and suppliers.
          </p>
        </div>
        <Button onClick={handleAddNewPurchaseOrder}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Purchase Order
        </Button>
      </header>

      <PurchaseOrderForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSavePurchaseOrder}
        purchaseOrderToEdit={purchaseOrderToEdit}
        availableProducts={products}
      />

      <Card>
        <CardHeader>
          <CardTitle>Purchase Order History</CardTitle>
          <CardDescription>
            {purchaseOrders.length > 0 ? `You have ${purchaseOrders.length} purchase order(s).` : 'No purchase orders found. Add one to get started.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PurchaseOrderTable 
            purchaseOrders={purchaseOrders} 
            onEdit={handleEditPurchaseOrder}
            onDelete={handleDeletePurchaseOrder}
          />
        </CardContent>
      </Card>
    </div>
  );
}
