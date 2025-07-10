// src/components/PurchaseOrderForm.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { PurchaseOrder, PurchaseOrderItem, Product, SoldProduct, Location } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
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
import { DatePicker } from '@/components/ui/date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, XCircle, Wand2, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { suggestPurchaseOrderItems, type SuggestPurchaseOrderItemsInput } from '@/ai/flows/suggest-purchase-order-items';

interface PurchaseOrderFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (order: PurchaseOrder) => void;
  purchaseOrderToEdit?: PurchaseOrder | null;
  availableProducts: Product[];
  allSales: SoldProduct[];
  locations: Location[];
  selectedLocationId: string | null;
}

type FormLineItem = {
  tempId: string;
  productId: string;
  quantity: string;
  costPerItem: string;
  suggestionReason?: string;
};

const defaultOrderBase: Omit<PurchaseOrder, 'id' | 'items' | 'grandTotal' | 'orderDate' | 'locationId'> = {
  supplierName: '',
  status: 'Pending',
  notes: '',
};

export function PurchaseOrderForm({
  isOpen,
  onOpenChange,
  onSave,
  purchaseOrderToEdit,
  availableProducts,
  allSales,
  locations,
  selectedLocationId
}: PurchaseOrderFormProps) {
  const [supplierName, setSupplierName] = useState(defaultOrderBase.supplierName);
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date());
  const [status, setStatus] = useState<PurchaseOrder['status']>(defaultOrderBase.status);
  const [notes, setNotes] = useState(defaultOrderBase.notes);
  const [lineItems, setLineItems] = useState<FormLineItem[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  useEffect(() => {
    if (purchaseOrderToEdit) {
      setSupplierName(purchaseOrderToEdit.supplierName);
      setOrderDate(new Date(purchaseOrderToEdit.orderDate));
      setStatus(purchaseOrderToEdit.status);
      setNotes(purchaseOrderToEdit.notes || '');
      setLocationId(purchaseOrderToEdit.locationId);
      setLineItems(
        purchaseOrderToEdit.items.map(item => ({
          tempId: item.id || crypto.randomUUID(),
          productId: item.productId,
          quantity: String(item.quantity),
          costPerItem: String(item.costPerItem),
          suggestionReason: item.suggestionReason,
        }))
      );
    } else {
      setSupplierName(defaultOrderBase.supplierName);
      setOrderDate(new Date());
      setStatus(defaultOrderBase.status);
      setNotes(defaultOrderBase.notes);
      setLineItems([]);
      setLocationId(selectedLocationId || '');
    }
  }, [purchaseOrderToEdit, isOpen, selectedLocationId]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { tempId: crypto.randomUUID(), productId: '', quantity: '1', costPerItem: '0' }]);
  };

  const handleRemoveLineItem = (tempId: string) => {
    setLineItems(lineItems.filter(item => item.tempId !== tempId));
  };

  const handleLineItemChange = (tempId: string, field: keyof Omit<FormLineItem, 'tempId'>, value: string) => {
    setLineItems(
      lineItems.map(item => (item.tempId === tempId ? { ...item, [field]: value } : item))
    );
  };

  const getProductById = (productId: string) => availableProducts.find(p => p.id === productId);

  const grandTotal = useMemo(() => {
    return lineItems.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.costPerItem) || 0;
      return total + quantity * cost;
    }, 0);
  }, [lineItems]);
  
  const handleSuggestItems = async () => {
    setIsSuggesting(true);
    try {
        const productInfo = availableProducts.map(p => ({
            id: p.id,
            name: p.name,
            stockQuantity: p.stockByLocation[locationId] ?? 0,
            costOfGoodsSold: p.costOfGoodsSold
        }));
        const salesInfo = allSales.filter(s => s.locationId === locationId).map(s => ({
            productId: s.productId || "unknown",
            quantity: s.quantity,
            timestamp: s.timestamp
        })).filter(s => s.productId !== "unknown");

        const input: SuggestPurchaseOrderItemsInput = {
            products: productInfo,
            salesHistory: salesInfo,
        };
        const result = await suggestPurchaseOrderItems(input);
        
        if (result.suggestedItems && result.suggestedItems.length > 0) {
            const newItems: FormLineItem[] = result.suggestedItems.map(item => ({
                tempId: crypto.randomUUID(),
                productId: item.productId,
                quantity: String(item.quantity),
                costPerItem: String(item.costPerItem || getProductById(item.productId)?.costOfGoodsSold || 0),
                suggestionReason: item.suggestionReason,
            }));
            setLineItems(newItems);
            toast({ title: "AI Suggestions Added", description: `${newItems.length} items suggested for reorder.` });
        } else {
            toast({ title: "No Suggestions", description: "AI found no items that urgently need restocking for this location." });
        }

    } catch (error) {
        console.error("Error suggesting PO items:", error);
        toast({ title: "Suggestion Error", description: "Could not get AI suggestions for purchase order.", variant: "destructive" });
    } finally {
        setIsSuggesting(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !locationId) {
      toast({ title: 'Required Fields Missing', description: 'Please enter a supplier name and select a location.', variant: 'destructive' });
      return;
    }
    if (!orderDate) {
      toast({ title: 'Order Date Required', description: 'Please select an order date.', variant: 'destructive' });
      return;
    }
    if (lineItems.length === 0) {
      toast({ title: 'No Items', description: 'Please add at least one item to the purchase order.', variant: 'destructive' });
      return;
    }

    try {
      const processedItems: PurchaseOrderItem[] = lineItems.map(item => {
        const product = getProductById(item.productId);
        const quantity = parseFloat(item.quantity);
        const costPerItem = parseFloat(item.costPerItem);
        if (!product || isNaN(quantity) || quantity <= 0 || isNaN(costPerItem) || costPerItem < 0) {
          throw new Error(`Invalid data for item: ${product?.name || 'Unknown Product'}. Please check quantity and cost.`);
        }
        return {
          id: item.tempId,
          productId: item.productId,
          productName: product.name,
          quantity: quantity,
          costPerItem: costPerItem,
          totalCost: quantity * costPerItem,
          suggestionReason: item.suggestionReason,
        };
      });

      const finalOrder: PurchaseOrder = {
        id: purchaseOrderToEdit?.id || crypto.randomUUID(),
        supplierName,
        orderDate: format(orderDate, 'yyyy-MM-dd'),
        status,
        notes: notes || undefined,
        items: processedItems,
        grandTotal,
        locationId,
        receivedDate: status === 'Received' ? (purchaseOrderToEdit?.receivedDate || format(new Date(), 'yyyy-MM-dd')) : undefined,
      };
      onSave(finalOrder);
      onOpenChange(false);
    } catch (error: any) {
        toast({ title: 'Error Processing Items', description: error.message, variant: 'destructive'});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{purchaseOrderToEdit ? 'Edit Purchase Order' : 'Add New Purchase Order'}</DialogTitle>
          <DialogDescription>
            {purchaseOrderToEdit ? 'Update details of this purchase order.' : 'Fill in details for a new purchase order.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[70vh] p-1 pr-6">
            <div className="space-y-4 py-4 pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplierName">Supplier Name*</Label>
                  <Input id="supplierName" value={supplierName} onChange={e => setSupplierName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="orderDate">Order Date*</Label>
                  <DatePicker date={orderDate} setDate={setOrderDate} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="location">Location*</Label>
                    <Select value={locationId} onValueChange={setLocationId} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                            {locations.map(loc => (
                                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="status">Status*</Label>
                    <Select value={status} onValueChange={(value: PurchaseOrder['status']) => setStatus(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Received">Received</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between items-center">
                    <h3 className="text-md font-semibold">Items</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={handleSuggestItems} disabled={isSuggesting || !locationId}>
                        {isSuggesting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Wand2 className="mr-2 h-4 w-4" />
                        )}
                        Suggest Items
                    </Button>
                </div>
                {lineItems.map((item, index) => (
                  <Card key={item.tempId} className="p-4 space-y-3 relative">
                     <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveLineItem(item.tempId)}
                      >
                        <XCircle className="h-4 w-4" />
                        <span className="sr-only">Remove Item</span>
                      </Button>
                    
                    {item.suggestionReason && (
                        <div className="text-xs text-muted-foreground flex items-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                           <Info className="h-4 w-4 mr-2 shrink-0 text-blue-500" />
                           AI Suggestion: {item.suggestionReason}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <Label htmlFor={`product-${item.tempId}`}>Product*</Label>
                        <Select
                          value={item.productId}
                          onValueChange={value => handleLineItemChange(item.tempId, 'productId', value)}
                        >
                          <SelectTrigger id={`product-${item.tempId}`}>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProducts.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} (Stock: {p.stockByLocation[locationId] ?? 0})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                     
                    </div>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                       <div>
                        <Label htmlFor={`quantity-${item.tempId}`}>Quantity*</Label>
                        <Input
                          id={`quantity-${item.tempId}`}
                          type="number"
                          value={item.quantity}
                          onChange={e => handleLineItemChange(item.tempId, 'quantity', e.target.value)}
                          min="1"
                          step="1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`cost-${item.tempId}`}>Cost/Item*</Label>
                        <Input
                          id={`cost-${item.tempId}`}
                          type="number"
                          value={item.costPerItem}
                          onChange={e => handleLineItemChange(item.tempId, 'costPerItem', e.target.value)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <Label>Item Total</Label>
                        <p className="font-medium h-10 flex items-center">
                          {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.costPerItem) || 0))}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={handleAddLineItem} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Item Manually
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes about the order..." />
              </div>

              <div className="pt-4 border-t text-right">
                <p className="text-lg font-semibold">Grand Total: {formatCurrency(grandTotal)}</p>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 mt-2 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{purchaseOrderToEdit ? 'Save Changes' : 'Add Purchase Order'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
