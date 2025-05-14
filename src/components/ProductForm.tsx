// src/components/ProductForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Product } from '@/types';
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
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image'; // Using next/image for placeholders

interface ProductFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
}

const defaultProduct: Omit<Product, 'id'> = {
  name: '',
  description: '',
  price: 0,
  stockQuantity: 0,
  category: '',
  imageUrl: '',
};

export function ProductForm({ isOpen, onOpenChange, onSave, productToEdit }: ProductFormProps) {
  const [product, setProduct] = useState<Omit<Product, 'id'>>(defaultProduct);
  const { toast } = useToast();

  useEffect(() => {
    if (productToEdit) {
      setProduct(productToEdit);
    } else {
      setProduct(defaultProduct);
    }
  }, [productToEdit, isOpen]); // Reset form when dialog opens or productToEdit changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: name === 'price' || name === 'stockQuantity' ? parseFloat(value) || 0 : value }));
  };
  
  const handleImagePlaceholder = () => {
    // For simplicity, generate a random picsum image URL.
    // In a real app, this would involve file upload or URL input.
    const randomImageId = Math.floor(Math.random() * 1000);
    setProduct(prev => ({...prev, imageUrl: `https://picsum.photos/seed/${randomImageId}/400/300`}));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.name || product.price <= 0 || product.stockQuantity < 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please provide a valid name, price (>0), and stock quantity (>=0).',
        variant: 'destructive',
      });
      return;
    }
    const finalProduct: Product = {
      ...product,
      id: productToEdit?.id || crypto.randomUUID(), // Use existing id if editing
    };
    onSave(finalProduct);
    onOpenChange(false); // Close dialog on save
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
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" name="name" value={product.name} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={product.description || ''} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" name="price" type="number" value={product.price} onChange={handleChange} min="0.01" step="0.01" required />
            </div>
            <div>
              <Label htmlFor="stockQuantity">Stock Quantity</Label>
              <Input id="stockQuantity" name="stockQuantity" type="number" value={product.stockQuantity} onChange={handleChange} min="0" step="1" required />
            </div>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" value={product.category || ''} onChange={handleChange} />
          </div>
           <div>
            <Label htmlFor="imageUrl">Image URL (Placeholder)</Label>
            <div className="flex items-center gap-2">
                <Input id="imageUrl" name="imageUrl" value={product.imageUrl || ''} onChange={handleChange} placeholder="https://example.com/image.jpg or leave empty" />
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
                    data-ai-hint="product visual"
                />
                </div>
            )}
          </div>
          <DialogFooter>
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
