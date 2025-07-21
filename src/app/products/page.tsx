// src/app/products/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Product, BuiltProductRecipe, Location } from '@/types';
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
import { StockIndicator, CompactStockIndicator } from '@/components/ui/stock-indicator';
import { CategoryBadge } from '@/components/ui/category-badge';
import { ProductImage } from '@/components/ui/product-image';
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
import { useLocation } from '@/context/LocationContext';
import { AdvancedSearch } from '@/components/ui/advanced-search';
import { BulkActionsToolbar, commonBulkActions } from '@/components/ui/bulk-actions-toolbar';
import { DataExportDialog } from '@/components/ui/data-export-dialog';
import { useAdvancedSearch } from '@/hooks/use-advanced-search';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { useNotifications } from '@/hooks/use-notifications';
import { Checkbox } from '@/components/ui/checkbox';
import { ProtectedComponent, PERMISSIONS } from '@/hooks/use-permissions';

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

const fetchLocations = async (): Promise<Location[]> => {
    if (!db) throw new Error("Firestore not available");
    const snapshot = await getDocs(collection(db, LOCATIONS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
};

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedLocationId } = useLocation();
  const { addNotification } = useNotifications();

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

  const { data: locations = [], isLoading: isLoadingLocations, isError: isLocationsError, error: locationsError } = useQuery<Location[], Error>({
    queryKey: [LOCATIONS_COLLECTION],
    queryFn: fetchLocations,
    enabled: !!db,
    retry: false,
  });

  // Advanced search and filtering
  const searchFilters = [
    {
      id: "category",
      label: "Category",
      type: "select" as const,
      options: [
        ...Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => ({
          value: cat!,
          label: cat!
        }))
      ],
      value: "",
    },
    {
      id: "price",
      label: "Max Price",
      type: "number" as const,
      value: "",
    },
  ];

  const {
    query,
    setQuery,
    filters,
    updateFilter,
    clearFilters,
    filteredItems: filteredProducts,
    savedSearches,
    saveSearch,
    loadSearch,
    deleteSearch,
    hasActiveFilters,
    resultCount,
  } = useAdvancedSearch({
    items: products,
    searchFields: ["name", "category", "description"],
    filters: searchFilters,
  });

  // Bulk selection
  const {
    selectedItems,
    selectedCount,
    totalCount,
    isSelected,
    toggleItem,
    clearSelection,
    toggleAll,
    isAllSelected,
    isPartiallySelected,
  } = useBulkSelection({
    items: filteredProducts,
    getItemId: (item) => item.id,
  });

  // Bulk actions
  const bulkActions = [
    commonBulkActions.delete(() => {
      addNotification({
        title: "Bulk Delete",
        message: `${selectedCount} products would be deleted`,
        type: "warning",
      });
      // Here you would implement actual bulk delete
      clearSelection();
    }),
    commonBulkActions.export(() => {
      addNotification({
        title: "Bulk Export",
        message: `Exporting ${selectedCount} selected products`,
        type: "info",
      });
      // Here you would implement bulk export of selected items
    }),
  ];

  // Export fields for DataExportDialog
  const exportFields = [
    { key: "id", label: "Product ID", type: "string" as const, required: true },
    { key: "name", label: "Product Name", type: "string" as const, required: true },
    { key: "description", label: "Description", type: "string" as const },
    { key: "price", label: "Price", type: "number" as const },
    { key: "costOfGoodsSold", label: "Cost of Goods Sold", type: "number" as const },
    { key: "category", label: "Category", type: "string" as const },
    { key: "imageUrl", label: "Image URL", type: "string" as const },
  ];
  
  useEffect(() => {
    if (isProductsError && productsError) {
      toast({ title: 'Error Loading Products', description: productsError?.message || 'Could not fetch products.', variant: 'destructive' });
    }
    if (isRecipesError && recipesError) {
      toast({ title: 'Error Loading Recipes', description: recipesError?.message || 'Could not fetch recipes.', variant: 'destructive' });
    }
    if (isLocationsError && locationsError) {
        toast({ title: 'Error Loading Locations', description: locationsError?.message || 'Could not fetch locations.', variant: 'destructive' });
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

  const displayLocationName = selectedLocationId && locations ? locations.find(l => l.id === selectedLocationId)?.name : 'All Locations';


  return (
    <div className="space-y-8">
      {/* Responsive Header */}
      <header className="mb-8">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Product Management</h1>
              <p className="text-muted-foreground text-sm sm:text-md">
              Add, view, edit, and manage your product inventory using Firestore.
              </p>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
            <ProtectedComponent requiredPermissions={[PERMISSIONS.REPORTS_EXPORT]}>
              <Button onClick={handleExportProducts} variant="outline" disabled={products.length === 0} size="lg" className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export Products
              </Button>
            </ProtectedComponent>
            <ProtectedComponent requiredPermissions={[PERMISSIONS.PRODUCTS_CREATE]}>
              <Button onClick={handleAddNewProduct} disabled={productMutation.isPending} size="lg" className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </ProtectedComponent>
          </div>
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

      {/* Enhanced Search and Filtering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Advanced Product Search
            <DataExportDialog
              data={filteredProducts}
              fields={exportFields}
              title="Export Products"
              defaultFilename="products_export"
              trigger={
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Filtered
                </Button>
              }
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedSearch
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFilterChange={updateFilter}
            onClearFilters={clearFilters}
            savedSearches={savedSearches}
            onSaveSearch={saveSearch}
            onLoadSearch={loadSearch}
            onDeleteSearch={deleteSearch}
            hasActiveFilters={hasActiveFilters}
            resultCount={resultCount}
            totalCount={products.length}
            placeholder="Search products by name, category, or description..."
          />
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedCount}
        totalCount={totalCount}
        onClearSelection={clearSelection}
        actions={bulkActions}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Product List
            <div className="text-sm text-muted-foreground">
              {`Displaying stock for: ${displayLocationName}`}
            </div>
          </CardTitle>
          <CardDescription>
            {`Showing ${resultCount} of ${products.length} products`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] rounded-md border shadow-inner">
            <Table>
              {filteredProducts.length === 0 && <TableCaption>No products match your search criteria.</TableCaption>}
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all products"
                    />
                  </TableHead>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-left">{selectedLocationId ? 'Stock Status' : 'Total Stock Status'}</TableHead>
                  <TableHead className="text-center w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockLevel = getStockForDisplay(product);
                  return (
                    <TableRow 
                      key={product.id}
                      className={isSelected(product) ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected(product)}
                          onCheckedChange={() => toggleItem(product)}
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          size="md"
                          showBorder={true}
                          rounded={true}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <CategoryBadge 
                          category={product.category || ""} 
                          size="sm" 
                          showIcon={true}
                        />
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(product.costOfGoodsSold)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                      <TableCell className="text-left">
                        <CompactStockIndicator
                          stockLevel={stockLevel}
                          lowStockThreshold={10}
                          outOfStockThreshold={0}
                        />
                      </TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
