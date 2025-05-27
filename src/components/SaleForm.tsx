// src/components/SaleForm.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { SoldProduct, Product, PaymentMethod, TopUpCard, AppSettings, DiscountType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { TAX_RATE as DEFAULT_TAX_RATE, PAYMENT_METHODS } from "@/config/constants";
import { suggestProductDetails, type SuggestProductDetailsInput } from '@/ai/flows/suggest-product-details';
import { Lightbulb, PlusSquare, Loader2, PackageSearch, ScanLine, CreditCard, CheckCircle, XCircle, Percent, MinusCircle, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QRCodeScannerComponent from '@/components/topup-cards/QRCodeScannerComponent';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SaleFormProps {
  onRecordSale: (
    saleData: Omit<SoldProduct, "id" | "timestamp" | "staffId" | "staffName">,
    paymentCardDetails?: { card: TopUpCard; saleTotal: number } // Pass full card object and saleTotal
  ) => void;
  soldItemsForAISuggestion: Pick<SoldProduct, 'name' | 'price'>[];
  availableProducts: Product[];
  findCardByCardId: (cardId: string) => TopUpCard | undefined; // Changed from findCardById to findCardByCardId for clarity
  appSettings: Partial<AppSettings>; // Pass appSettings as a prop
}

export function SaleForm({ 
  onRecordSale, 
  soldItemsForAISuggestion, 
  availableProducts,
  findCardByCardId,
  appSettings
}: SaleFormProps) {
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState<number | string>(1);
  const [price, setPrice] = useState<number | string>("");
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  
  const [subtotalBeforeDiscount, setSubtotalBeforeDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<DiscountType>('none');
  const [discountValue, setDiscountValue] = useState<number | string>(0);
  const [calculatedDiscountAmount, setCalculatedDiscountAmount] = useState(0);
  const [subtotalAfterDiscount, setSubtotalAfterDiscount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentTaxRate, setCurrentTaxRate] = useState(DEFAULT_TAX_RATE);

  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  const [paymentCardIdInput, setPaymentCardIdInput] = useState('');
  const [verifiedPaymentCard, setVerifiedPaymentCard] = useState<TopUpCard | null>(null);
  const [isScanningPaymentCard, setIsScanningPaymentCard] = useState(false);

  useEffect(() => {
    if (appSettings.taxRate !== undefined) {
      const rate = parseFloat(appSettings.taxRate);
      if (!isNaN(rate) && rate >= 0 && rate <= 100) {
        setCurrentTaxRate(rate / 100);
      } else {
        setCurrentTaxRate(DEFAULT_TAX_RATE);
      }
    } else {
      setCurrentTaxRate(DEFAULT_TAX_RATE);
    }
  }, [appSettings.taxRate]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const calculateTotals = useCallback(() => {
    const numQuantity = Number(quantity);
    const numPrice = Number(price);
    const numDiscountValue = Number(discountValue) || 0;

    if (numQuantity > 0 && numPrice > 0) {
      const currentSubtotalBeforeDiscount = numPrice * numQuantity;
      setSubtotalBeforeDiscount(currentSubtotalBeforeDiscount);

      let currentDiscountAmount = 0;
      if (discountType === 'percentage') {
        currentDiscountAmount = currentSubtotalBeforeDiscount * (numDiscountValue / 100);
      } else if (discountType === 'fixed') {
        currentDiscountAmount = numDiscountValue;
      }
      currentDiscountAmount = Math.min(currentDiscountAmount, currentSubtotalBeforeDiscount);
      setCalculatedDiscountAmount(currentDiscountAmount);
      
      const currentSubtotalAfterDiscount = currentSubtotalBeforeDiscount - currentDiscountAmount;
      setSubtotalAfterDiscount(currentSubtotalAfterDiscount);

      const currentTaxAmount = currentSubtotalAfterDiscount * currentTaxRate;
      setTaxAmount(currentTaxAmount);
      
      const currentTotal = currentSubtotalAfterDiscount + currentTaxAmount;
      setTotal(currentTotal);
    } else {
      setSubtotalBeforeDiscount(0);
      setCalculatedDiscountAmount(0);
      setSubtotalAfterDiscount(0);
      setTaxAmount(0);
      setTotal(0);
    }
  }, [quantity, price, currentTaxRate, discountType, discountValue]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]); // calculateTotals includes all its dependencies

  useEffect(() => {
    if (paymentMethod !== 'Top-Up Card') {
      setVerifiedPaymentCard(null);
      setPaymentCardIdInput('');
      setIsScanningPaymentCard(false);
    }
  }, [paymentMethod]);

  const handleGetSuggestion = async () => {
    if (!productName.trim() && !selectedProductId) { 
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
      setProductName(""); 
      setPrice(""); 
      return;
    }
    const product = availableProducts.find(p => p.id === productId);
    if (product) {
      setSelectedProductId(product.id);
      setProductName(product.name);
      setPrice(product.price);
      setQuantity(1); 
    }
  };

  const handleVerifyPaymentCard = (idToVerify: string) => {
    const card = findCardByCardId(idToVerify.toUpperCase()); // Use the passed prop
    if (card) {
      setVerifiedPaymentCard(card);
      setPaymentCardIdInput(card.cardId);
      toast({ title: "Card Verified", description: `Card ${card.cardId} balance: ${formatCurrency(card.currentBalance)}`});
    } else {
      setVerifiedPaymentCard(null);
      toast({ title: "Card Not Found", description: `No card found with ID ${idToVerify}.`, variant: "destructive"});
    }
    setIsScanningPaymentCard(false);
  };

  const onScanSuccessForPaymentCard = (decodedText: string) => {
    handleVerifyPaymentCard(decodedText);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numQuantity = Number(quantity);
    const numPrice = Number(price);

    if (!productName.trim() || numQuantity <= 0 || numPrice <= 0) {
      toast({ title: "Invalid Input", description: "Please fill all fields with valid values.", variant: "destructive" });
      return;
    }

    const productInStock = availableProducts.find(p => p.id === selectedProductId);
    const costOfGoodsSold = productInStock?.costOfGoodsSold;

    if (selectedProductId) {
      if (productInStock && productInStock.stockQuantity < numQuantity) {
        toast({ title: "Insufficient Stock", description: `Only ${productInStock.stockQuantity} of ${productName} available.`, variant: "destructive" });
        return;
      }
    }

    let paymentCardDetails: { card: TopUpCard; saleTotal: number } | undefined = undefined;

    if (paymentMethod === "Top-Up Card") {
      if (!verifiedPaymentCard) {
        toast({ title: "Payment Card Not Verified", description: "Please verify a top-up card for payment.", variant: "destructive" });
        return;
      }
      if (total > verifiedPaymentCard.currentBalance) {
        toast({ 
          title: "Insufficient Card Balance", 
          description: `Sale total ${formatCurrency(total)} exceeds card balance ${formatCurrency(verifiedPaymentCard.currentBalance)}.`,
          variant: "destructive" 
        });
        return;
      }
      paymentCardDetails = { card: verifiedPaymentCard, saleTotal: total };
    }

    onRecordSale({ 
        name: productName, 
        price: numPrice, 
        quantity: numQuantity, 
        subtotalBeforeDiscount: subtotalBeforeDiscount,
        discountType: discountType !== 'none' ? discountType : undefined,
        discountValue: discountType !== 'none' ? Number(discountValue) : undefined,
        discountAmount: calculatedDiscountAmount > 0 ? calculatedDiscountAmount : undefined,
        subtotal: subtotalAfterDiscount, 
        taxAmount, 
        total, 
        productId: selectedProductId,
        costOfGoodsSoldAtTimeOfSale: costOfGoodsSold,
        paymentMethod: paymentMethod,
        cardIdUsed: paymentMethod === "Top-Up Card" && verifiedPaymentCard ? verifiedPaymentCard.cardId : undefined,
    }, paymentCardDetails); // Pass card details here

    // Reset form
    setProductName("");
    setQuantity(1);
    setPrice("");
    setSelectedProductId(undefined);
    setPaymentMethod(PAYMENT_METHODS[0]);
    setPaymentCardIdInput('');
    setVerifiedPaymentCard(null);
    setIsScanningPaymentCard(false);
    setDiscountType('none');
    setDiscountValue(0);
  };
  
  const canSubmit = productName.trim() && Number(quantity) > 0 && Number(price) > 0 && !isScanningPaymentCard && !isSuggesting;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <PlusSquare className="mr-2 h-6 w-6 text-primary" />
          Add New Sale
        </CardTitle>
        <CardDescription>Enter product details or select an existing product to record a sale. Apply discounts if applicable.</CardDescription>
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
                disabled={!!selectedProductId}
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
                disabled={!!selectedProductId}
              />
            </div>
          </div>

          <Card className="p-4 space-y-3 bg-muted/20 border-dashed">
            <div className="flex justify-between items-center">
              <Label className="text-md font-medium flex items-center"><Tag className="mr-2 h-5 w-5 text-primary"/>Discount</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select value={discountType} onValueChange={(value: DiscountType) => {setDiscountType(value); setDiscountValue(0);}}>
                  <SelectTrigger id="discountType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="percentage"><Percent className="inline-block mr-2 h-4 w-4"/>Percentage (%)</SelectItem>
                    <SelectItem value="fixed"><MinusCircle className="inline-block mr-2 h-4 w-4"/>Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">Discount Value</Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  min="0"
                  step={discountType === 'percentage' ? "0.1" : "0.01"}
                  disabled={discountType === 'none'}
                  placeholder="0"
                />
              </div>
            </div>
          </Card>

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

          {paymentMethod === "Top-Up Card" && (
            <Card className="p-4 space-y-3 bg-muted/30 border-dashed">
              <CardTitle className="text-lg flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary" /> Top-Up Card Payment</CardTitle>
              {!isScanningPaymentCard && !verifiedPaymentCard && (
                <div className="space-y-2">
                  <Label htmlFor="paymentCardIdInput">Enter Card ID</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="paymentCardIdInput"
                      value={paymentCardIdInput}
                      onChange={(e) => setPaymentCardIdInput(e.target.value.toUpperCase())}
                      placeholder="e.g., CARD-XXXXXX"
                      className="uppercase"
                    />
                    <Button type="button" variant="secondary" onClick={() => handleVerifyPaymentCard(paymentCardIdInput)}>Verify</Button>
                  </div>
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsScanningPaymentCard(true)}>
                    <ScanLine className="mr-2 h-4 w-4"/> Scan Card QR
                  </Button>
                </div>
              )}
              {isScanningPaymentCard && (
                <QRCodeScannerComponent
                  active={isScanningPaymentCard}
                  setActive={setIsScanningPaymentCard}
                  onScanSuccess={onScanSuccessForPaymentCard}
                  onScanFailure={(err) => toast({title: "Scan Failed", description: `Could not read QR: ${err}`, variant:"destructive"})}
                />
              )}
              {verifiedPaymentCard && (
                <Alert variant={total <= verifiedPaymentCard.currentBalance ? "default" : "destructive"} className="bg-background">
                   {total <= verifiedPaymentCard.currentBalance ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <AlertTitle>
                    Card Verified: {verifiedPaymentCard.cardId}
                  </AlertTitle>
                  <AlertDescription>
                    Balance: {formatCurrency(verifiedPaymentCard.currentBalance)}. 
                    {total > verifiedPaymentCard.currentBalance && ` Sale total ${formatCurrency(total)} exceeds card balance.`}
                  </AlertDescription>
                  <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => { setVerifiedPaymentCard(null); setPaymentCardIdInput('');}}>
                    Use different card
                  </Button>
                </Alert>
              )}
            </Card>
          )}

          <div className="space-y-3 rounded-md bg-muted/50 p-4 border">
            <h3 className="text-sm font-medium text-muted-foreground">Sale Summary</h3>
            <div className="flex justify-between text-sm">
              <span>Subtotal (Before Discount):</span>
              <span className="font-medium">{formatCurrency(subtotalBeforeDiscount)}</span>
            </div>
             {calculatedDiscountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount Applied:</span>
                <span className="font-medium">- {formatCurrency(calculatedDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Subtotal (After Discount):</span>
              <span className="font-medium">{formatCurrency(subtotalAfterDiscount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax ({ (currentTaxRate * 100).toFixed(2) }%):</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={!canSubmit || recordSaleMutation.isPending}>
            {recordSaleMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusSquare className="mr-2 h-5 w-5" />}
            Record Sale
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
