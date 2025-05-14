// src/components/SaleForm.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { SoldProduct, Product, PaymentMethod } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { TAX_RATE, PAYMENT_METHODS } from "@/config/constants";
import { suggestProductDetails, type SuggestProductDetailsInput } from '@/ai/flows/suggest-product-details';
import { Lightbulb, PlusSquare, Loader2, PackageSearch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SaleFormProps {
  onRecordSale: (saleData: Omit<SoldProduct, "id" | "timestamp">) => void;
  soldItemsForAISuggestion: Pick<SoldProduct, 'name' | 'price'>[];
  availableProducts: Product[];
  currentStaffId?: string;
  currentStaffName?: string;
}

export function SaleForm({ onRecordSale, soldItemsForAISuggestion, availableProducts, currentStaffId, currentStaffName }: SaleFormProps) {
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState<number | string>(1);
  const [price, setPrice] = useState<number | string>("");
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const calculateTotals = useCallback(() => {
    const numQuantity = Number(quantity);
    const numPrice = Number(price);

    if (numQuantity > 0 && numPrice > 0) {
      const currentSubtotal = numPrice * numQuantity;
      const currentTaxAmount = currentSubtotal * TAX_RATE;
      const currentTotal = currentSubtotal + currentTaxAmount;
      setSubtotal(currentSubtotal);
      setTaxAmount(currentTaxAmount);
      setTotal(currentTotal);
    } else {
      setSubtotal(0);
      setTaxAmount(0);
      setTotal(0);
    }
  }, [quantity, price]);

  useEffect(() => {
    calculateTotals();
  }, [quantity, price, calculateTotals]);

  const handleGetSuggestion = async () => {
    if (!productName.trim() && !selectedProductId) { // Suggestion needs some input
      toast({ title: "Enter Product Name or Select Product", description: "Please enter a product name or select one to get suggestions.", variant: "destructive" });
      return;
    }
    setIsSuggesting(true);
    try {
      const salesHistoryString = soldItemsForAISuggestion
        .map(item => `${item.name} sold at ${formatCurrency(item.price)}`)
        .join('; ');
      
      const currentProductInfo = selectedProductId 
        ? availableProducts.find(p => p.id === selectedProductId)?.name || productName
        : productName;

      const suggestionInput: SuggestProductDetailsInput = {
        userInput: currentProductInfo,
        salesHistory: salesHistoryString || "No recent sales history available.",
      };
      const suggestion = await suggestProductDetails(suggestionInput);
      
      // Apply suggestion only if no product is selected from inventory, or if selected product name matches suggestion
      if (!selectedProductId || (selectedProductId && suggestion.productName.toLowerCase().includes(currentProductInfo.toLowerCase()))) {
         setProductName(suggestion.productName);
      }
      setPrice(suggestion.productPrice);
      toast({ title: "AI Suggestion Applied", description: `Product: ${suggestion.productName}, Price: ${formatCurrency(suggestion.productPrice)}` });
    } catch (error) {
      console.error("Error fetching AI suggestion:", error);
      toast({ title: "Suggestion Error", description: "Could not fetch AI suggestion.", variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleProductSelectionChange = (productId: string) => {
    if (productId === "custom") {
      setSelectedProductId(undefined);
      setProductName(""); // Clear name if switching to custom
      setPrice(""); // Clear price
      return;
    }
    const product = availableProducts.find(p => p.id === productId);
    if (product) {
      setSelectedProductId(product.id);
      setProductName(product.name);
      setPrice(product.price);
      // Optionally, set quantity to 1 or max available stock
      setQuantity(1); 
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numQuantity = Number(quantity);
    const numPrice = Number(price);

    if (!productName.trim() || numQuantity <= 0 || numPrice <= 0) {
      toast({ title: "Invalid Input", description: "Please fill all fields with valid values.", variant: "destructive" });
      return;
    }

    if (selectedProductId) {
      const productInStock = availableProducts.find(p => p.id === selectedProductId);
      if (productInStock && productInStock.stockQuantity < numQuantity) {
        toast({ title: "Insufficient Stock", description: `Only ${productInStock.stockQuantity} of ${productName} available.`, variant: "destructive" });
        return;
      }
    }

    onRecordSale({ 
        name: productName, 
        price: numPrice, 
        quantity: numQuantity, 
        subtotal, 
        taxAmount, 
        total, 
        productId: selectedProductId,
        paymentMethod: paymentMethod,
        staffId: currentStaffId,
        staffName: currentStaffName,
    });

    // Reset form
    setProductName("");
    setQuantity(1);
    setPrice("");
    setSelectedProductId(undefined);
    setPaymentMethod(PAYMENT_METHODS[0]);
    // toast({ title: "Sale Recorded", description: `${productName} (x${numQuantity}) added to history.` }); // Toast handled in parent page
  };
  
  const canSubmit = productName.trim() && Number(quantity) > 0 && Number(price) > 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <PlusSquare className="mr-2 h-6 w-6 text-primary" />
          Add New Sale
        </CardTitle>
        <CardDescription>Enter product details or select an existing product to record a sale.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="productSelection">Select Product (Optional)</Label>
            <Select onValueChange={handleProductSelectionChange} value={selectedProductId || "custom"}>
              <SelectTrigger id="productSelection">
                <SelectValue placeholder="Select product or enter custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">
                  <span className="flex items-center">
                    <PackageSearch className="mr-2 h-4 w-4 text-muted-foreground" />
                    Enter Custom Item
                  </span>
                </SelectItem>
                {availableProducts.filter(p => p.stockQuantity > 0).map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} (Stock: {product.stockQuantity}) - {formatCurrency(product.price)}
                  </SelectItem>
                ))}
                 {availableProducts.filter(p => p.stockQuantity <= 0).map(product => (
                  <SelectItem key={product.id} value={product.id} disabled>
                    {product.name} (Out of Stock) - {formatCurrency(product.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        
          <div className="space-y-2">
            <Label htmlFor="productName">Product Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Organic Apples or AI Suggested"
                required
                disabled={!!selectedProductId} // Disable if product selected from list
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="outline" size="icon" onClick={handleGetSuggestion} disabled={isSuggesting || (!productName.trim() && !selectedProductId)}>
                      {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                      <span className="sr-only">Get AI Suggestion for Name & Price</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get AI Suggestion for Name & Price</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                placeholder="1"
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Unit Price ($)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                disabled={!!selectedProductId} // Disable if product selected from list
              />
            </div>
          </div>

           <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select onValueChange={(value: PaymentMethod) => setPaymentMethod(value)} value={paymentMethod}>
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-md bg-muted/50 p-4 border">
            <h3 className="text-sm font-medium text-muted-foreground">Sale Summary</h3>
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax ({TAX_RATE * 100}%):</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={!canSubmit || isSuggesting}>
            <PlusSquare className="mr-2 h-5 w-5" />
            Record Sale
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
