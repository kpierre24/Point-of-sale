// src/components/SaleForm.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sale, Product, PaymentMethod, TopUpCard, AppSettings, DiscountType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { TAX_RATE as DEFAULT_TAX_RATE, PAYMENT_METHODS } from "@/config/constants";
import { suggestProductDetails, type SuggestProductDetailsInput } from '@/ai/flows/suggest-product-details';
import { Lightbulb, PlusSquare, Loader2, PackageSearch, ScanLine, CreditCard, CheckCircle, XCircle, Percent, MinusCircle, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { ErrorDisplay } from "@/components/ui/error-display";
import { FormFieldWrapper } from "@/components/ui/form-field";
import { CompactStockIndicator } from "@/components/ui/stock-indicator";
import { CategoryBadge } from "@/components/ui/category-badge";
import { ProductImage } from "@/components/ui/product-image";
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
    saleData: Omit<Sale, "id" | "timestamp" | "staffId" | "staffName">,
    paymentCardDetails?: { card: TopUpCard; saleTotal: number }
  ) => void;
  soldItemsForAISuggestion: Pick<Sale, 'name' | 'price'>[];
  availableProducts: Product[];
  findCardByCardId: (cardId: string) => TopUpCard | undefined;
  appSettings: Partial<AppSettings>;
  isSubmittingSale?: boolean;
  selectedLocationId: string | null;
}

export function SaleForm({ 
  onRecordSale, 
  soldItemsForAISuggestion, 
  availableProducts,
  findCardByCardId,
  appSettings,
  isSubmittingSale = false,
  selectedLocationId,
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
  const { 
    handleValidationError, 
    handleStockError, 
    handleCardError, 
    handleInsufficientBalanceError,
    handleNetworkError,
    handleSuccess 
  } = useErrorHandler();

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
  }, [calculateTotals]);

  useEffect(() => {
    if (paymentMethod !== 'Top-Up Card') {
      setVerifiedPaymentCard(null);
      setPaymentCardIdInput('');
      setIsScanningPaymentCard(false);
    }
  }, [paymentMethod]);

  const handleGetSuggestion = async () => {
    if (!productName.trim() && !selectedProductId) { 
      handleValidationError("Please enter a product name or select one to get suggestions.", "Product Name");
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
      handleSuccess("AI Suggestion Applied", `Product: ${suggestion.productName}, Price: ${formatCurrency(suggestion.productPrice)}`);
    } catch (error) {
      handleNetworkError(error, "get AI suggestion");
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
    const card = findCardByCardId(idToVerify.toUpperCase());
    if (card) {
      setVerifiedPaymentCard(card);
      setPaymentCardIdInput(card.cardId);
      handleSuccess("Card Verified", `Card ${card.cardId} balance: ${formatCurrency(card.currentBalance)}`);
    } else {
      setVerifiedPaymentCard(null);
      handleCardError(idToVerify);
    }
    setIsScanningPaymentCard(false);
  };

  const onScanSuccessForPaymentCard = (decodedText: string) => {
    handleVerifyPaymentCard(decodedText);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocationId) {
        handleValidationError("Please select a location before recording a sale.", "Location");
        return;
    }

    const numQuantity = Number(quantity);
    const numPrice = Number(price);

    if (!productName.trim()) {
      handleValidationError("Product name is required.", "Product Name");
      return;
    }
    
    if (numQuantity <= 0) {
      handleValidationError("Quantity must be greater than 0.", "Quantity");
      return;
    }
    
    if (numPrice <= 0) {
      handleValidationError("Price must be greater than 0.", "Price");
      return;
    }

    const productInStock = availableProducts.find(p => p.id === selectedProductId);
    const costOfGoodsSold = productInStock?.costOfGoodsSold;

    if (selectedProductId) {
      const stockInLocation = productInStock?.stockByLocation?.[selectedLocationId] || 0;
      if (stockInLocation < numQuantity) {
        handleStockError(stockInLocation, numQuantity, productName);
        return;
      }
    }

    let paymentCardDetails: { card: TopUpCard; saleTotal: number } | undefined = undefined;

    if (paymentMethod === "Top-Up Card") {
      if (!verifiedPaymentCard) {
        handleValidationError("Please verify a top-up card for payment.", "Payment Card");
        return;
      }
      if (total > verifiedPaymentCard.currentBalance) {
        handleInsufficientBalanceError(verifiedPaymentCard.currentBalance, total);
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
        locationId: selectedLocationId,
    }, paymentCardDetails);

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

  const productsForLocation = availableProducts.map(p => ({
      ...p,
      stockForDisplay: p.stockByLocation?.[selectedLocationId || ''] ?? 0,
  }));

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-slate-800">
          <PlusSquare className="mr-3 h-7 w-7 text-blue-600" />
          New Sale
        </CardTitle>
        <CardDescription className="text-slate-600">
          Select products and process payment with our streamlined interface
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Enhanced Product Selection Section */}
          <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Label htmlFor="productSelection" className="text-base font-semibold text-blue-900 flex items-center">
              <PackageSearch className="mr-2 h-5 w-5 text-blue-600" />
              Product Selection
            </Label>
            <Select onValueChange={handleProductSelectionChange} value={selectedProductId || "custom"}>
              <SelectTrigger id="productSelection" className="h-12 text-base border-blue-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Choose from inventory or enter custom item" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="custom" className="py-3">
                  <span className="flex items-center">
                    <PackageSearch className="mr-3 h-4 w-4 text-slate-500" />
                    <div>
                      <div className="font-medium">Custom Item</div>
                      <div className="text-xs text-slate-500">Enter product details manually</div>
                    </div>
                  </span>
                </SelectItem>
                {productsForLocation.filter(p => p.stockForDisplay > 0).length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100">IN STOCK</div>
                    {productsForLocation.filter(p => p.stockForDisplay > 0).map(product => (
                      <SelectItem key={product.id} value={product.id} className="py-4">
                        <div className="flex items-center gap-3 w-full">
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                            size="sm"
                            showBorder={false}
                            rounded={true}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <CategoryBadge 
                                category={product.category || ""} 
                                size="sm" 
                                showIcon={false}
                              />
                              <CompactStockIndicator
                                stockLevel={product.stockForDisplay}
                                lowStockThreshold={10}
                                outOfStockThreshold={0}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">{formatCurrency(product.price)}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                {productsForLocation.filter(p => p.stockForDisplay <= 0).length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100">OUT OF STOCK</div>
                    {productsForLocation.filter(p => p.stockForDisplay <= 0).map(product => (
                      <SelectItem key={product.id} value={product.id} disabled className="py-4 opacity-50">
                        <div className="flex items-center gap-3 w-full">
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                            size="sm"
                            showBorder={false}
                            rounded={true}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <CategoryBadge 
                                category={product.category || ""} 
                                size="sm" 
                                showIcon={false}
                              />
                              <CompactStockIndicator
                                stockLevel={product.stockForDisplay}
                                lowStockThreshold={10}
                                outOfStockThreshold={0}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-slate-400">{formatCurrency(product.price)}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        
          {/* Enhanced Product Details Section */}
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <Label htmlFor="productName" className="text-base font-semibold text-slate-800">Product Details</Label>
            <div className="flex items-center gap-3">
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name or use AI suggestion"
                required
                disabled={!!selectedProductId}
                className="h-11 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="lg"
                      onClick={handleGetSuggestion} 
                      disabled={isSuggesting || (!productName.trim() && !selectedProductId)}
                      className="h-11 px-4 border-amber-300 hover:bg-amber-50 hover:border-amber-400"
                    >
                      {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4 text-amber-600" />}
                      <span className="sr-only">Get AI Suggestion</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get AI suggestion for name & price</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Enhanced Quantity and Price Section - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <Label htmlFor="quantity" className="text-base font-semibold text-green-900">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                placeholder="1"
                min="1"
                required
                className="h-12 text-lg font-semibold text-center border-green-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="space-y-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <Label htmlFor="price" className="text-base font-semibold text-emerald-900">Unit Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-emerald-700">$</span>
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
                  className="h-12 text-lg font-semibold pl-8 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Responsive Discount Section */}
          <Card className="p-4 space-y-3 bg-muted/20 border-dashed">
            <div className="flex justify-between items-center">
              <Label className="text-md font-medium flex items-center"><Tag className="mr-2 h-5 w-5 text-primary"/>Discount</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select value={discountType} onValueChange={(value: DiscountType) => {setDiscountType(value); setDiscountValue(0);}}>
                  <SelectTrigger id="discountType" className="h-11">
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
                  className="h-11"
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

          {/* Enhanced Sale Summary with Prominent Total */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-blue-900 flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Sale Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal (Before Discount):</span>
                  <span className="font-semibold">{formatCurrency(subtotalBeforeDiscount)}</span>
                </div>
                
                {calculatedDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                    <span className="flex items-center">
                      <Tag className="mr-1 h-3 w-3" />
                      Discount Applied:
                    </span>
                    <span className="font-semibold">- {formatCurrency(calculatedDiscountAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal (After Discount):</span>
                  <span className="font-semibold">{formatCurrency(subtotalAfterDiscount)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax ({(currentTaxRate * 100).toFixed(2)}%):</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
                
                <div className="border-t-2 border-blue-300 pt-3 mt-4">
                  <div className="flex justify-between items-center bg-blue-600 text-white px-4 py-3 rounded-lg">
                    <span className="text-lg font-bold">TOTAL:</span>
                    <span className="text-2xl font-bold">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Prominent Primary Action Button */}
          <div className="pt-4 border-t-2 border-slate-200">
            <Button 
              type="submit" 
              size="lg"
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
              disabled={!canSubmit || isSubmittingSale}
            >
              {isSubmittingSale ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Processing Sale...
                </>
              ) : (
                <>
                  <CreditCard className="mr-3 h-6 w-6" />
                  Process Payment • {formatCurrency(total)}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
