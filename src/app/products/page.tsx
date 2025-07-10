// src/app/products/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Product, BuiltProductRecipe } from '@/types';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/ProductForm';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Image as ImageIcon, Download, Loader2, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, orderBy, query as firestoreQuery } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PRODUCTS_COLLECTION = 'products';
const RECIPES_COLLECTION = 'recipes';
const LOCATIONS_COLLECTION = 'locations';

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

// Fetcher functions for React Query
const fetchProducts = async (): Promise<Product[]> => {
  if (!db) throw new Error("Firestore not available");
  const productsCol = collection(db, PRODUCTS_COLLECTION);
  const q = firestoreQuery(productsCol, orderBy("name")); 
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

const fetchRecipes = async (): Promise<BuiltProductRecipe[]> => {
    if (!db) throw new Error("Firestore not available");
    const recipesCol = collection(db, RECIPES_COLLECTION);
    const q = firestoreQuery(recipesCol, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BuiltProductRecipe));
};

const fetchLocations = async () => {
    if (!db) throw new Error("Firestore not available");
    const snapshot = await getDocs(collection(db, LOCATIONS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export default function ProductsPage({ selectedLocationId }: { selectedLocationId: string | null }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: isLoadingProducts, isError: isProductsError, error: productsError } = useQuery<Product[], Error>({
    queryKey: [PRODUCTS_COLLECTION],
    queryFn: fetchProducts,
    enabled: !!db,
    retry: false,
  });

  const { data: availableRecipes = [], isLoading: isLoadingRecipes, isError: isRecipesError, error: recipesError } = useQuery<BuiltProductRecipe[], Error>({
    queryKey: [RECIPES_COLLECTION],
    queryFn: fetchRecipes,
    enabled: !!db,
    retry: false,
  });

  const { data: locations = [], isLoading: isLoadingLocations, isError: isLocationsError, error: locationsError } = useQuery({
    queryKey: [LOCATIONS_COLLECTION],
    queryFn: fetchLocations,
    enabled: !!db,
  });
  
  useEffect(() => {
    if (isProductsError && productsError) {
      toast({ title: 'Error Loading Products', description: productsError?.message || 'Could not fetch products.', variant: 'destructive' });
    }
    if (isRecipesError && recipesError) {
      toast({ title: 'Error Loading Recipes', description: recipesError?.message || 'Could not fetch recipes.', variant: 'destructive' });
    }
    if (isLocationsError && locationsError) {
        toast({ title: 'Error Loading Locations', description: (locationsError as Error)?.message || 'Could not fetch locations.', variant: 'destructive' });
    }
  }, [isProductsError, productsError, isRecipesError, recipesError, isLocationsError, locationsError, toast]);


  const productMutation = useMutation<void, Error, { product: Product; isEditing: boolean }>({
    mutationFn: async ({ product, isEditing }) => {
      if (!db) throw new Error("Firestore not available");

      const productToSave: Partial<Product> = { ...product };
      delete (productToSave as any).stockQuantity; // Remove obsolete field if it exists
      
      Object.keys(productToSave).forEach(key => {
        if (productToSave[key as keyof Product] === undefined) {
          delete productToSave[key as keyof Product];
        }
      });

      const productRef = doc(db, PRODUCTS_COLLECTION, productToSave.id!);
      await setDoc(productRef, productToSave, { merge: isEditing }); 
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_COLLECTION] });
      toast({ title: variables.isEditing ? 'Product Updated' : 'Product Added', description: `${variables.product.name} has been saved.` });
      setIsFormOpen(false);
      setProductToEdit(null);
    },
    onError: (error) => {
      toast({ title: 'Error Saving Product', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    },
  });

  const deleteProductMutation = useMutation<void, Error, string>({
    mutationFn: async (productId: string) => {
      if (!db) throw new Error("Firestore not available");
      const productRef = doc(db, PRODUCTS_COLLECTION, productId);
      await deleteDoc(productRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_COLLECTION] });
      toast({ title: 'Product Deleted', description: 'The product has been removed.', variant: 'destructive' });
    },
    onError: (error) => {
      toast({ title: 'Error Deleting Product', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    },
  });

  const handleSaveProduct = (product: Product) => {
    productMutation.mutate({ product, isEditing: !!productToEdit });
  };

  const handleAddNewProduct = () => {
    setProductToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProductMutation.mutate(productId);
  };
  
  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleExportProducts = () => {
    if (products.length === 0) {
      toast({ title: "No Data", description: "There are no products to export.", variant: "destructive" });
      return;
    }
    const headers = ["ID", "Name", "Description", "Price", "Cost of Goods Sold", "Category", "Image URL", "Recipe ID", ...locations.map(l => `Stock: ${l.name}`)];
    const csvRows = [
      headers.join(','),
      ...products.map(product => [
        escapeCsvField(product.id), escapeCsvField(product.name), escapeCsvField(product.description),
        escapeCsvField(product.price), escapeCsvField(product.costOfGoodsSold),
        escapeCsvField(product.category), escapeCsvField(product.imageUrl), escapeCsvField(product.recipeId),
        ...locations.map(l => escapeCsvField(product.stockByLocation?.[l.id] || 0))
      ].join(','))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Export Successful", description: "Product data exported to CSV." });
  };

  if (!db) {
    return (
      <div className="space-y-8">
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Firebase Not Connected</CardTitle></CardHeader>
          <CardContent><p>Cannot load products. Please check Firebase configuration.</p></CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingProducts || isLoadingRecipes || isLoadingLocations) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading product data...</p>
      </div>
    );
  }

  const getStockForDisplay = (product: Product) => {
      if (selectedLocationId) {
          return product.stockByLocation?.[selectedLocationId] ?? 0;
      }
      return Object.values(product.stockByLocation || {}).reduce((sum, current) => sum + current, 0);
  };

  const displayLocationName = selectedLocationId ? locations.find(l => l.id === selectedLocationId)?.name : 'All Locations';


  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
            <p className="text-muted-foreground text-md">
            Add, view, edit, and manage your product inventory using Firestore.
            </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExportProducts} variant="outline" disabled={products.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export Products
          </Button>
          <Button onClick={handleAddNewProduct} disabled={productMutation.isPending}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </header>

      <ProductForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        availableRecipes={availableRecipes || []}
        locations={locations}
      />

      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>
            {`Displaying stock for: ${displayLocationName}. You have ${products.length} total product(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] rounded-md border shadow-inner">
            <Table>
              {products.length === 0 && <TableCaption>No products available.</TableCaption>}
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-right">{selectedLocationId ? 'Stock' : 'Total Stock'}</TableHead>
                  <TableHead className="text-center w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={50}
                          height={50}
                          className="rounded-md object-cover aspect-square"
                          data-ai-hint="product item"
                        />
                      ) : (
                        <div className="w-[50px] h-[50px] bg-muted rounded-md flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category || 'N/A'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.costOfGoodsSold)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-right">{getStockForDisplay(product)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditProduct(product)} disabled={productMutation.isPending || deleteProductMutation.isPending}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" disabled={productMutation.isPending || deleteProductMutation.isPending}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the product "{product.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
