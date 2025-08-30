
// src/components/wastage/WastageFormDialog.tsx
"use client";

import { useState, useEffect } from 'react';
import type { WastageEvent, Product } from '@/types';
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

interface WastageFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  products: Product[];
  locationId: string | null;
  onSave: (event: Omit<WastageEvent, 'id'>, product: Product) => void;
  isSaving: boolean;
}

export function WastageFormDialog({ 
    isOpen, 
    onOpenChange, 
    products, 
    locationId, 
    onSave,
    isSaving,
}: WastageFormDialogProps) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setProductId('');
      setQuantity('');
      setReason('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || !reason || !locationId) {
        toast({ title: "Missing Fields", description: "Please fill out all fields.", variant: "destructive" });
        return;
    }
    const numQuantity = parseInt(quantity, 10);
    const selectedProduct = products.find(p => p.id === productId);

    if (!selectedProduct || isNaN(numQuantity) || numQuantity <= 0) {
        toast({ title: "Invalid Input", description: "Please check your product selection and quantity.", variant: "destructive" });
        return;
    }
    
    if (numQuantity > (selectedProduct.stockByLocation[locationId] || 0)) {
        toast({ title: "Invalid Quantity", description: "Wastage quantity cannot exceed current stock.", variant: "destructive"});
        return;
    }

    const costPerItem = selectedProduct.costOfGoodsSold || 0;
    const totalCost = numQuantity * costPerItem;

    const newWastageEvent: Omit<WastageEvent, 'id'> = {
      locationId,
      productId,
      productName: selectedProduct.name,
      quantity: numQuantity,
      reason,
      costPerItem,
      totalCost,
      timestamp: new Date().toISOString(),
      staffMember: "Admin", // Placeholder
    };

    onSave(newWastageEvent, selectedProduct);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Product Wastage</DialogTitle>
          <DialogDescription>Record items that were spoiled, damaged, or otherwise wasted.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product">Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stockByLocation[locationId || ''] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="quantity">Quantity Wasted</Label>
            <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" required />
          </div>
          <div>
            <Label htmlFor="reason">Reason for Wastage</Label>
            <Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Expired, Damaged in transit" required />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Wastage"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
