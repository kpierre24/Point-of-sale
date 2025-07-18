// src/app/stock-take/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Product, Location } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save, PackageCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/context/LocationContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, writeBatch, orderBy, query as firestoreQuery } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PRODUCTS_COLLECTION = 'products';
const LOCATIONS_COLLECTION = 'locations';

type StockLevels = Record<string, number | string>;

// Fetcher functions
const fetchProducts = async (): Promise<Product[]> => {
  if (!db) throw new Error("Firestore not available");
  const productsCol = collection(db, PRODUCTS_COLLECTION);
  const q = firestoreQuery(productsCol, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

const fetchLocations = async (): Promise<Location[]> => {
    if (!db) throw new Error("Firestore not available");
    const snapshot = await getDocs(collection(db, LOCATIONS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
};

export default function StockTakePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedLocationId } = useLocation();
  const [stockLevels, setStockLevels] = useState<StockLevels>({});

  const { data: products = [], isLoading: isLoadingProducts, isError: isProductsError, error: productsError } = useQuery<Product[], Error>({
    queryKey: [PRODUCTS_COLLECTION],
    queryFn: fetchProducts,
    enabled: !!db,
  });

  const { data: locations = [], isLoading: isLoadingLocations, isError: isLocationsError, error: locationsError } = useQuery<Location[], Error>({
    queryKey: [LOCATIONS_COLLECTION],
    queryFn: fetchLocations,
    enabled: !!db,
  });

  useEffect(() => {
    if (isProductsError) toast({ title: 'Error Loading Products', description: productsError?.message, variant: 'destructive' });
    if (isLocationsError) toast({ title: 'Error Loading Locations', description: locationsError?.message, variant: 'destructive' });
  }, [isProductsError, productsError, isLocationsError, locationsError, toast]);
  
  useEffect(() => {
    if (products.length > 0 && selectedLocationId) {
      const initialStock: StockLevels = {};
      products.forEach(p => {
        initialStock[p.id] = p.stockByLocation?.[selectedLocationId] || '';
      });
      setStockLevels(initialStock);
    }
  }, [products, selectedLocationId]);

  const handleStockChange = (productId: string, value: string) => {
    setStockLevels(prev => ({
      ...prev,
      [productId]: value,
    }));
  };

  const stockUpdateMutation = useMutation<void, Error, { locationId: string; updatedStocks: StockLevels }>({
    mutationFn: async ({ locationId, updatedStocks }) => {
      if (!db) throw new Error("Firestore not available");
      const batch = writeBatch(db);

      for (const productId in updatedStocks) {
        const productRef = doc(db, PRODUCTS_COLLECTION, productId);
        const quantity = Number(updatedStocks[productId]);
        if (isNaN(quantity) || quantity < 0) {
            // Silently ignore invalid entries or you could throw an error
            continue;
        }
        batch.update(productRef, {
          [`stockByLocation.${locationId}`]: quantity
        });
      }
      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_COLLECTION] });
      toast({ title: "Stock Updated", description: "All inventory levels have been successfully updated." });
    },
    onError: (error) => {
      toast({ title: "Error Updating Stock", description: error.message, variant: "destructive" });
    }
  });

  const handleSaveAll = () => {
    if (!selectedLocationId) {
      toast({ title: "No Location", description: "Please select a location first.", variant: "destructive" });
      return;
    }
    stockUpdateMutation.mutate({ locationId: selectedLocationId, updatedStocks: stockLevels });
  };
  
  const selectedLocationName = locations.find(l => l.id === selectedLocationId)?.name || "your selected location";

  if (isLoadingProducts || isLoadingLocations) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Stock Take...</p>
      </div>
    );
  }

  if (!selectedLocationId) {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Location Selected</AlertTitle>
            <AlertDescription>
                Please select a location from the sidebar before performing a stock take.
            </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <PackageCheck className="mr-3 h-8 w-8 text-primary" />
            Initial Stock Take
          </h1>
          <p className="text-muted-foreground text-md">
            Enter the current physical stock count for all products at <span className="font-semibold text-primary">{selectedLocationName}</span>.
          </p>
        </div>
        <Button onClick={handleSaveAll} disabled={stockUpdateMutation.isPending}>
          {stockUpdateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Changes
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Product Stock Levels</CardTitle>
          <CardDescription>
            Update the quantity for each product below. All changes will be saved at once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] rounded-md border shadow-inner">
            <Table>
              <TableCaption>
                {products.length === 0 ? "No products found." : "End of product list."}
              </TableCaption>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="w-[150px]">Current Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={stockLevels[product.id] || ''}
                        onChange={(e) => handleStockChange(product.id, e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
