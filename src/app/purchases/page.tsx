
// src/app/purchases/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { PurchaseOrder, Product, SoldProduct, Location } from '@/types';
import { Button } from '@/components/ui/button';
import { PurchaseOrderForm } from '@/components/PurchaseOrderForm';
import { PurchaseOrderTable } from '@/components/PurchaseOrderTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, PackagePlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, query as firestoreQuery, orderBy, where } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from '@/context/LocationContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const PURCHASE_ORDERS_COLLECTION = 'purchaseOrders';
const PRODUCTS_COLLECTION = 'products';
const SALES_COLLECTION = 'sales';
const LOCATIONS_COLLECTION = 'locations';

// Fetcher functions
const fetchPurchaseOrders = async (activeSessionId?: string | null): Promise<PurchaseOrder[]> => {
  if (!db) throw new Error("Firestore not available");
  const poCol = collection(db, PURCHASE_ORDERS_COLLECTION);
  let q = firestoreQuery(poCol, orderBy("orderDate", "desc"));

  if (activeSessionId) {
    q = firestoreQuery(q, where("sessionId", "==", activeSessionId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
};

const fetchProducts = async (): Promise<Product[]> => {
  if (!db) throw new Error("Firestore not available");
  const productsCol = collection(db, PRODUCTS_COLLECTION);
  const snapshot = await getDocs(productsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

const fetchSales = async (activeSessionId?: string | null): Promise<SoldProduct[]> => {
  if (!db) throw new Error("Firestore not available");
  const salesCol = collection(db, SALES_COLLECTION);
  let q = firestoreQuery(salesCol, orderBy("timestamp", "desc"));
  
  if (activeSessionId) {
    q = firestoreQuery(q, where("sessionId", "==", activeSessionId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SoldProduct));
};

const fetchLocations = async (): Promise<Location[]> => {
    if (!db) throw new Error("Firestore not available");
    const snapshot = await getDocs(collection(db, LOCATIONS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
};


export default function PurchasesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [purchaseOrderToEdit, setPurchaseOrderToEdit] = useState<PurchaseOrder | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedLocationId, activeSessionId } = useLocation();

  const { data: purchaseOrders = [], isLoading: isLoadingPOs, isError: isPOsError, error: posError } = useQuery<PurchaseOrder[], Error>({
    queryKey: [PURCHASE_ORDERS_COLLECTION, activeSessionId],
    queryFn: () => fetchPurchaseOrders(activeSessionId),
    enabled: !!db && !!activeSessionId,
  });

  const { data: products = [], isLoading: isLoadingProducts, isError: isProductsError, error: productsError } = useQuery<Product[], Error>({
    queryKey: [PRODUCTS_COLLECTION],
    queryFn: fetchProducts,
    enabled: !!db,
  });

  const { data: sales = [], isLoading: isLoadingSales, isError: isSalesError, error: salesError } = useQuery<SoldProduct[], Error>({
    queryKey: [SALES_COLLECTION, activeSessionId],
    queryFn: () => fetchSales(activeSessionId),
    enabled: !!db && !!activeSessionId,
  });
  
  const { data: locations = [], isLoading: isLoadingLocations, isError: isLocationsError, error: locationsError } = useQuery<Location[], Error>({
    queryKey: [LOCATIONS_COLLECTION],
    queryFn: fetchLocations,
    enabled: !!db,
  });

  useEffect(() => {
    if (isPOsError) toast({ title: 'Error Loading Purchase Orders', description: posError?.message, variant: 'destructive' });
    if (isProductsError) toast({ title: 'Error Loading Products', description: productsError?.message, variant: 'destructive' });
    if (isSalesError) toast({ title: 'Error Loading Sales', description: salesError?.message, variant: 'destructive' });
    if (isLocationsError) toast({ title: 'Error Loading Locations', description: locationsError?.message, variant: 'destructive' });
  }, [isPOsError, posError, isProductsError, productsError, isSalesError, salesError, isLocationsError, locationsError, toast]);


  const updateProductStockMutation = useMutation<void, Error, { orderForStockUpdate: PurchaseOrder; isReverting: boolean }>({
    mutationFn: async ({ orderForStockUpdate, isReverting }) => {
      if (!db) throw new Error("Firestore not available");
      if ((orderForStockUpdate.status !== 'Received' && !isReverting) || !orderForStockUpdate.locationId) return;

      const batch = writeBatch(db);
      
      for (const item of orderForStockUpdate.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
          const operation = isReverting ? -1 : 1;
          const currentStock = product.stockByLocation?.[orderForStockUpdate.locationId] || 0;
          const newStockQuantity = Math.max(0, currentStock + (item.quantity * operation));
          
          batch.update(productRef, {
              [`stockByLocation.${orderForStockUpdate.locationId}`]: newStockQuantity
          });
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
      toast({ title: 'Error Updating Stock', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
    }
  });

  const purchaseOrderMutation = useMutation<void, Error, { orderData: PurchaseOrder; isEditing: boolean; originalOrder?: PurchaseOrder }>({
    mutationFn: async ({ orderData, isEditing, originalOrder }) => {
      if (!db) throw new Error("Firestore not available");
      
      const orderToSave: Partial<PurchaseOrder> = { 
        ...orderData,
        sessionId: activeSessionId || undefined,
      };
      Object.keys(orderToSave).forEach(keyStr => {
        const key = keyStr as keyof typeof orderToSave;
        if ((orderToSave as any)[key] === undefined) {
          delete (orderToSave as any)[key];
        }
      });

      const poRef = doc(db, PURCHASE_ORDERS_COLLECTION, orderToSave.id!);
      await setDoc(poRef, orderToSave, { merge: isEditing });

      // Stock update logic
      if (originalOrder && originalOrder.status === 'Received') {
        await updateProductStockMutation.mutateAsync({ orderForStockUpdate: originalOrder, isReverting: true });
      }
      if (orderToSave.status === 'Received') {
        await updateProductStockMutation.mutateAsync({ orderForStockUpdate: orderToSave as PurchaseOrder, isReverting: false });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PURCHASE_ORDERS_COLLECTION, activeSessionId] });
      toast({ title: variables.isEditing ? 'Purchase Order Updated' : 'Purchase Order Added', description: `Order from ${variables.orderData.supplierName} has been saved.` });
      setIsFormOpen(false);
      setPurchaseOrderToEdit(null);
    },
    onError: (error) => {
      toast({ title: 'Error Saving Purchase Order', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
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
      queryClient.invalidateQueries({ queryKey: [PURCHASE_ORDERS_COLLECTION, activeSessionId] });
      toast({ title: 'Purchase Order Deleted', description: 'The purchase order has been removed.', variant: 'destructive' });
    },
    onError: (error) => {
      toast({ title: 'Error Deleting Purchase Order', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    },
  });


  const handleSavePurchaseOrder = (orderData: PurchaseOrder) => {
    const originalOrder = purchaseOrders.find(po => po.id === orderData.id);
    purchaseOrderMutation.mutate({ orderData, isEditing: !!originalOrder, originalOrder });
  };

  const handleAddNewPurchaseOrder = () => {
    if (!selectedLocationId) {
        toast({ title: "No Location Selected", description: "Please select a location from the sidebar before adding a purchase order.", variant: "destructive" });
        return;
    }
    if (!activeSessionId) {
        toast({ title: "No Active Session", description: "There is no active session for this location. Please start one in Settings.", variant: "destructive" });
        return;
    }
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

  const filteredPurchaseOrders = selectedLocationId
    ? purchaseOrders.filter(po => po.locationId === selectedLocationId)
    : purchaseOrders;

  const displayLocationName = selectedLocationId && locations ? locations.find(l => l.id === selectedLocationId)?.name : 'All Locations';

  if (isLoadingPOs || isLoadingProducts || isLoadingSales || isLoadingLocations) {
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
            Manage inventory purchases for your locations. Data is stored in Firestore.
          </p>
        </div>
        <Button onClick={handleAddNewPurchaseOrder} disabled={purchaseOrderMutation.isPending || !activeSessionId}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Purchase Order
        </Button>
      </header>
       {!activeSessionId && selectedLocationId && (
          <Alert variant="default" className="mt-4">
            <AlertTitle>No Active Session</AlertTitle>
            <AlertDescription>
              There is no active session for this location. Please start a new session in the Settings to manage purchase orders.
            </AlertDescription>
          </Alert>
        )}

      <PurchaseOrderForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSavePurchaseOrder}
        purchaseOrderToEdit={purchaseOrderToEdit}
        availableProducts={products}
        allSales={sales}
        locations={locations}
        selectedLocationId={selectedLocationId}
      />

      <Card>
        <CardHeader>
          <CardTitle>Purchase Order History</CardTitle>
          <CardDescription>
            {`Displaying orders for: ${displayLocationName}. You have ${filteredPurchaseOrders.length} order(s) for this view.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PurchaseOrderTable 
            purchaseOrders={filteredPurchaseOrders} 
            onEdit={handleEditPurchaseOrder}
            onDelete={handleDeletePurchaseOrder}
            isLoading={deletePurchaseOrderMutation.isPending || purchaseOrderMutation.isPending || updateProductStockMutation.isPending}
            locations={locations || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
