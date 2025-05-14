// src/components/ProductForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Product, BuiltProductRecipe } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { ScrollArea } from './ui/scroll-area'; // Added ScrollArea

interface ProductFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
  availableRecipes?: BuiltProductRecipe[]; // For "Load from Recipe"
}

const defaultProduct: Omit<Product, 'id'> = {
  name: '',
  description: '',
  price: 0,
  costOfGoodsSold: 0,
  stockQuantity: 0,
  category: '',
  imageUrl: '',
  recipeId: undefined,
};

export function ProductForm({ isOpen, onOpenChange, onSave, productToEdit, availableRecipes = [] }: ProductFormProps) {
  const [product, setProduct] = useState<Omit<Product, 'id'>>(defaultProduct);
  const { toast } = useToast();

  useEffect(() => {
    if (productToEdit) {
      setProduct(productToEdit);
    } else {
      setProduct(defaultProduct);
    }
  }, [productToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ 
      ...prev, 
      [name]: (name === 'price' || name === 'stockQuantity' || name === 'costOfGoodsSold') 
               ? parseFloat(value) || 0 
               : value 
    }));
  };
  
  const handleImagePlaceholder = () => {
    const randomImageId = Math.floor(Math.random() * 1000);
    setProduct(prev => ({...prev, imageUrl: `https://picsum.photos/seed/${randomImageId}/400/300`}));
  }

  const handleLoadFromRecipe = (recipeId: string) => {
    const selectedRecipe = availableRecipes.find(r => r.id === recipeId);
    if (selectedRecipe) {
      setProduct(prev => ({
        ...prev,
        name: selectedRecipe.outputProductName || selectedRecipe.name,
        description: selectedRecipe.outputProductDescription || selectedRecipe.notes || '',
        costOfGoodsSold: selectedRecipe.totalCalculatedCost,
        recipeId: selectedRecipe.id,
      }));
      toast({ title: "Recipe Loaded", description: `Details from "${selectedRecipe.name}" applied.` });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.name || product.price <= 0 || product.stockQuantity < 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please provide a valid name, selling price (>0), and stock quantity (>=0).',
        variant: 'destructive',
      });
      return;
    }
    if (product.costOfGoodsSold && product.costOfGoodsSold < 0) {
        toast({
            title: 'Invalid Input',
            description: 'Cost of Goods Sold cannot be negative.',
            variant: 'destructive',
        });
        return;
    }
    const finalProduct: Product = {
      ...product,
      id: productToEdit?.id || crypto.randomUUID(),
    };
    onSave(finalProduct);
    onOpenChange(false); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{productToEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {productToEdit ? 'Update the details of this product.' : 'Fill in the details to add a new product to your inventory.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
        <ScrollArea className="max-h-[70vh] p-1 pr-6">
          <div className="space-y-4 py-4 pr-1"> {/* Added pr-1 for scrollbar spacing */}
            {availableRecipes.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="loadFromRecipe">Load from Recipe (Optional)</Label>
                <Select onValueChange={handleLoadFromRecipe} value={product.recipeId || ""}>
                  <SelectTrigger id="loadFromRecipe">
                    <SelectValue placeholder="Select a recipe to prefill details" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {availableRecipes.map(recipe => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.name} (Cost: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(recipe.totalCalculatedCost)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="name">Product Name*</Label>
              <Input id="name" name="name" value={product.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={product.description || ''} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costOfGoodsSold">Cost of Goods Sold ($)</Label>
                <Input id="costOfGoodsSold" name="costOfGoodsSold" type="number" value={product.costOfGoodsSold || 0} onChange={handleChange} min="0" step="0.01" />
              </div>
              <div>
                <Label htmlFor="price">Selling Price ($)*</Label>
                <Input id="price" name="price" type="number" value={product.price} onChange={handleChange} min="0.01" step="0.01" required />
              </div>
            </div>
             <div>
                <Label htmlFor="stockQuantity">Stock Quantity*</Label>
                <Input id="stockQuantity" name="stockQuantity" type="number" value={product.stockQuantity} onChange={handleChange} min="0" step="1" required />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" value={product.category || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="imageUrl">Image (Placeholder)</Label>
              <div className="flex items-center gap-2">
                  <Input id="imageUrl" name="imageUrl" value={product.imageUrl || ''} onChange={handleChange} placeholder="e.g. /images/product.jpg or URL" />
                  <Button type="button" variant="outline" onClick={handleImagePlaceholder}>Generate</Button>
              </div>
              {product.imageUrl && (
                  <div className="mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-md border">
                  <Image 
                      src={product.imageUrl} 
                      alt={product.name || "Product Image"} 
                      width={400} 
                      height={300} 
                      className="object-cover"
                      data-ai-hint="product item visual"
                  />
                  </div>
              )}
            </div>
          </div>
          </ScrollArea>
          <DialogFooter className="pt-4 mt-2 border-t"> {/* Added mt-2 for spacing */}
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{productToEdit ? 'Save Changes' : 'Add Product'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
