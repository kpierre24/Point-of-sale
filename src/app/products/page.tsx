// src/app/products/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Product, BuiltProductRecipe } from '@/types'; // Added BuiltProductRecipe
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
import { PlusCircle, Edit, Trash2, Image as ImageIcon, Download } from 'lucide-react'; // Added Download
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
} from "@/components/ui/alert-dialog"

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [availableRecipes, setAvailableRecipes] = useState<BuiltProductRecipe[]>([]); // For ProductForm
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      try {
        setProducts(JSON.parse(storedProducts));
      } catch (e) {
        console.error("Failed to parse products from localStorage", e);
        setProducts([]);
      }
    }
    const storedRecipes = localStorage.getItem('builtProductRecipes');
    if (storedRecipes) {
        try {
            setAvailableRecipes(JSON.parse(storedRecipes));
        } catch (e) {
            console.error("Failed to parse recipes from localStorage", e);
            setAvailableRecipes([]);
        }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('products', JSON.stringify(products));
    }
  }, [products, isMounted]);

  const handleSaveProduct = (product: Product) => {
    setProducts((prevProducts) => {
      const existingIndex = prevProducts.findIndex((p) => p.id === product.id);
      if (existingIndex > -1) {
        const updatedProducts = [...prevProducts];
        updatedProducts[existingIndex] = product;
        toast({ title: 'Product Updated', description: `${product.name} has been updated.` });
        return updatedProducts;
      } else {
        toast({ title: 'Product Added', description: `${product.name} has been added to your inventory.` });
        return [product, ...prevProducts];
      }
    });
    setProductToEdit(null); 
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
    setProducts((prevProducts) => prevProducts.filter((p) => p.id !== productId));
    toast({ title: 'Product Deleted', description: 'The product has been removed from your inventory.', variant: 'destructive' });
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

    const headers = ["ID", "Name", "Description", "Price", "Cost of Goods Sold", "Stock Quantity", "Category", "Image URL", "Recipe ID"];
    
    const csvRows = [
      headers.join(','),
      ...products.map(product => [
        escapeCsvField(product.id),
        escapeCsvField(product.name),
        escapeCsvField(product.description),
        escapeCsvField(product.price),
        escapeCsvField(product.costOfGoodsSold),
        escapeCsvField(product.stockQuantity),
        escapeCsvField(product.category),
        escapeCsvField(product.imageUrl),
        escapeCsvField(product.recipeId),
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

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
            <p className="text-muted-foreground text-md">
            Add, view, edit, and manage your product inventory.
            </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExportProducts} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Products
          </Button>
          <Button onClick={handleAddNewProduct}>
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
        availableRecipes={availableRecipes} 
      />

      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>
            {products.length > 0 ? `You have ${products.length} product(s) in your inventory.` : 'No products found. Add a new product to get started.'}
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
                  <TableHead className="text-right">Stock</TableHead>
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
                    <TableCell className="text-right">{product.stockQuantity}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditProduct(product)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
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
