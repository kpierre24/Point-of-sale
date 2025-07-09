
// src/app/purchases/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { PurchaseOrder, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { PurchaseOrderForm } from '@/components/PurchaseOrderForm';
import { PurchaseOrderTable } from '@/components/PurchaseOrderTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, PackagePlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, query as firestoreQuery, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PURCHASE_ORDERS_COLLECTION = 'purchaseOrders';
const PRODUCTS_COLLECTION = 'products';

// Fetcher functions
const fetchPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  if (!db) throw new Error("Firestore not available");
  const poCol = collection(db, PURCHASE_ORDERS_COLLECTION);
  // Example: Order by orderDate descending
  const q = firestoreQuery(poCol, orderBy("orderDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
};

const fetchProducts = async (): Promise<Product[]> => {
  if (!db) throw new Error("Firestore not available");
  const productsCol = collection(db, PRODUCTS_COLLECTION);
  const snapshot = await getDocs(productsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};


export default function PurchasesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [purchaseOrderToEdit, setPurchaseOrderToEdit] = useState<PurchaseOrder | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchaseOrders = [], isLoading: isLoadingPOs, isError: isPOsError, error: posError } = useQuery<PurchaseOrder[], Error>({
    queryKey: [PURCHASE_ORDERS_COLLECTION],
    queryFn: fetchPurchaseOrders,
    enabled: !!db,
  });

  const { data: products = [], isLoading: isLoadingProducts, isError: isProductsError, error: productsError } = useQuery<Product[], Error>({
    queryKey: [PRODUCTS_COLLECTION],
    queryFn: fetchProducts,
    enabled: !!db,
  });

  useEffect(() => {
    if (isPOsError) toast({ title: 'Error Loading Purchase Orders', description: posError?.message, variant: 'destructive' });
    if (isProductsError) toast({ title: 'Error Loading Products', description: productsError?.message, variant: 'destructive' });
  }, [isPOsError, posError, isProductsError, productsError, toast]);


  const updateProductStockMutation = useMutation<void, Error, { orderForStockUpdate: PurchaseOrder; isReverting: boolean }>({
    mutationFn: async ({ orderForStockUpdate, isReverting }) => {
      if (!db) throw new Error("Firestore not available");
      if (orderForStockUpdate.status !== 'Received' && !isReverting) return;

      const batch = writeBatch(db);
      const productsToUpdateLocally = [...products]; // Use a local copy of products from query data

      for (const item of orderForStockUpdate.items) {
        const product = productsToUpdateLocally.find(p => p.id === item.productId);
        if (product) {
          const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
          const operation = isReverting ? -1 : 1;
          const newStockQuantity = Math.max(0, product.stockQuantity + (item.quantity * operation));
          batch.update(productRef, { stockQuantity: newStockQuantity });
        }
      }
      await batch.commit();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_COLLECTION] });
      if (variables.orderForStockUpdate.status === 'Received' && !variables.isReverting) {
        toast({ title: 'Stock Updated', description: `Product quantities updated based on received order.` });
      } else if (variables.isReverting){
         toast({ title: 'Stock Reverted', description: 'Stock quantities adjusted.' });
      }
    },
    onError: (error) => {
      toast({ title: 'Error Updating Stock', description: error.message, variant: 'destructive' });
    }
  });

  const purchaseOrderMutation = useMutation<void, Error, { orderData: PurchaseOrder; isEditing: boolean; originalOrder?: PurchaseOrder }>({
    mutationFn: async ({ orderData, isEditing, originalOrder }) => {
      if (!db) throw new Error("Firestore not available");
      
      const orderToSave = { ...orderData };
      Object.keys(orderToSave).forEach(keyStr => {
        const key = keyStr as keyof typeof orderToSave;
        if (orderToSave[key] === undefined) {
          delete orderToSave[key];
        }
      });

      const poRef = doc(db, PURCHASE_ORDERS_COLLECTION, orderToSave.id);
      await setDoc(poRef, orderToSave, { merge: isEditing });

      // Stock update logic
      if (originalOrder && originalOrder.status === 'Received') {
        await updateProductStockMutation.mutateAsync({ orderForStockUpdate: originalOrder, isReverting: true });
      }
      if (orderToSave.status === 'Received') {
        await updateProductStockMutation.mutateAsync({ orderForStockUpdate: orderToSave, isReverting: false });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PURCHASE_ORDERS_COLLECTION] });
      toast({ title: variables.isEditing ? 'Purchase Order Updated' : 'Purchase Order Added', description: `Order from ${variables.orderData.supplierName} has been saved.` });
      setIsFormOpen(false);
      setPurchaseOrderToEdit(null);
    },
    onError: (error) => {
      toast({ title: 'Error Saving Purchase Order', description: error.message, variant: 'destructive' });
    },
  });

  const deletePurchaseOrderMutation = useMutation<void, Error, string>({
    mutationFn: async (orderId: string) => {
      if (!db) throw new Error("Firestore not available");
      const orderToDelete = purchaseOrders.find(po => po.id === orderId);
      if (orderToDelete && orderToDelete.status === 'Received') {
        await updateProductStockMutation.mutateAsync({ orderForStockUpdate: orderToDelete, isReverting: true });
      }
      await deleteDoc(doc(db, PURCHASE_ORDERS_COLLECTION, orderId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PURCHASE_ORDERS_COLLECTION] });
      toast({ title: 'Purchase Order Deleted', description: 'The purchase order has been removed.', variant: 'destructive' });
    },
    onError: (error) => {
      toast({ title: 'Error Deleting Purchase Order', description: error.message, variant: 'destructive' });
    },
  });


  const handleSavePurchaseOrder = (orderData: PurchaseOrder) => {
    const originalOrder = purchaseOrders.find(po => po.id === orderData.id);
    purchaseOrderMutation.mutate({ orderData, isEditing: !!originalOrder, originalOrder });
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
    deletePurchaseOrderMutation.mutate(orderId);
  };

  if (!db) {
    return (
      <div className="space-y-8">
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Firebase Not Connected</CardTitle></CardHeader>
          <CardContent><p>Cannot load purchase orders. Please check Firebase configuration.</p></CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingPOs || isLoadingProducts) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading purchase data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <PackagePlus className="mr-3 h-8 w-8 text-primary" />
            Purchase Orders
          </h1>
          <p className="text-muted-foreground text-md">
            Manage your inventory purchases and suppliers. Data stored in Firestore.
          </p>
        </div>
        <Button onClick={handleAddNewPurchaseOrder} disabled={purchaseOrderMutation.isPending}>
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
            isLoading={deletePurchaseOrderMutation.isPending || purchaseOrderMutation.isPending || updateProductStockMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
