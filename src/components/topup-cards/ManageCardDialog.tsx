// src/components/topup-cards/ManageCardDialog.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import type { TopUpCard, CardTransaction, PaymentMethod, Customer } from '@/types';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import QRCodeStyling from 'qrcode.react';
import { Download, DollarSign, ArrowDownCircle, ArrowUpCircle, Printer, User } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_METHODS } from '@/config/constants';
import { useLocation } from '@/context/LocationContext';
import html2canvas from 'html2canvas';


interface ManageCardDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  card: TopUpCard | null;
  customer?: Customer | null;
  transactions: CardTransaction[];
  onTopUp: (cardToUpdate: TopUpCard, amount: number, notes?: string, paymentMethod?: PaymentMethod, locationId?: string) => void;
  onDeduct: (cardToUpdate: TopUpCard, amount: number, notes?: string) => boolean; // Returns true if successful
  onRefreshCardData?: (cardId: string) => void; // To refresh card data if needed
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatDate = (isoString: string) => format(new Date(isoString), 'MMM dd, yyyy HH:mm');

export function ManageCardDialog({
  isOpen,
  onOpenChange,
  card,
  customer,
  transactions,
  onTopUp,
  onDeduct,
  onRefreshCardData, 
}: ManageCardDialogProps) {
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpNotes, setTopUpNotes] = useState('');
  const [topUpPaymentMethod, setTopUpPaymentMethod] = useState<PaymentMethod>('Cash');
  const [deductAmount, setDeductAmount] = useState('');
  const [deductNotes, setDeductNotes] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);
  const cardPrintRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { selectedLocationId } = useLocation();

  useEffect(() => {
    if (isOpen) {
      setTopUpAmount('');
      setTopUpNotes('');
      setTopUpPaymentMethod('Cash');
      setDeductAmount('');
      setDeductNotes('');
    }
  }, [isOpen, card?.id]);

  if (!card) return null;

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Top-up amount must be positive.', variant: 'destructive' });
      return;
    }
     if (!selectedLocationId) {
      toast({ title: "No Location", description: "A location must be selected to process a top-up.", variant: "destructive" });
      return;
    }
    onTopUp(card, amount, topUpNotes, topUpPaymentMethod, selectedLocationId);
    setTopUpAmount('');
    setTopUpNotes('');
    setTopUpPaymentMethod('Cash');
  };

  const handleDeductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(deductAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Deduction amount must be positive.', variant: 'destructive' });
      return;
    }
    const success = onDeduct(card, amount, deductNotes);
    if (success) {
      setDeductAmount('');
      setDeductNotes('');
    }
  };
  
  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `topup-card-${card.cardId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast({ title: 'QR Code Downloaded', description: `${card.cardId}.png has been downloaded.` });
    } else {
      toast({ title: 'Error', description: 'Could not find QR code canvas to download.', variant: 'destructive' });
    }
  };

  const handlePrintCard = async () => {
    const cardElement = cardPrintRef.current;
    if (!cardElement) {
        toast({ title: 'Error', description: 'Cannot find card element to print.', variant: 'destructive' });
        return;
    }
    try {
        const canvas = await html2canvas(cardElement, { 
            scale: 4, // Increase scale for higher resolution
            backgroundColor: '#ffffff', // Use solid white background
        });
        
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `printable-card-${card.cardId}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        toast({ title: 'PNG Generated', description: 'Your card PNG has been downloaded.' });
    } catch (error) {
        console.error("Error generating PNG:", error);
        toast({ title: 'PNG Generation Error', description: 'Could not generate PNG for the card.', variant: 'destructive' });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl dialog-content-class">
          <DialogHeader>
            <DialogTitle>Manage Card: {card.cardId}</DialogTitle>
            <DialogDescription>
              View balance, top-up, deduct funds, and see transaction history.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] p-1 pr-6">
            <div className="space-y-6 py-4 pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-md">
                  <h3 className="text-lg font-semibold mb-2">Card Details</h3>
                  <p><strong>Card ID:</strong> {card.cardId}</p>
                   {customer && (
                    <>
                      <p><strong>Customer:</strong> {customer.name}</p>
                      {customer.parentName && <p><strong>Parent:</strong> {customer.parentName}</p>}
                    </>
                  )}
                  <p className="text-2xl font-bold text-primary my-2">
                    Balance: {formatCurrency(card.currentBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground">Created: {formatDate(card.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">Last Updated: {formatDate(card.lastUpdatedAt)}</p>
                   <div className="mt-4 space-y-2 text-center p-4 border rounded-md bg-muted/50">
                    <Label>QR Code</Label>
                    <div ref={qrRef} className="flex justify-center">
                      <QRCodeStyling value={card.cardId} size={128} level="H" />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleDownloadQR} className="mt-2">
                      <Download className="mr-2 h-4 w-4" />
                      Download QR
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <form onSubmit={handleTopUpSubmit} className="p-4 border rounded-md">
                    <h4 className="font-semibold mb-2 flex items-center"><ArrowUpCircle className="mr-2 h-5 w-5 text-green-500" />Top-Up Funds</h4>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="topUpAmount">Amount ($)</Label>
                        <Input id="topUpAmount" type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} min="0.01" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="topUpPaymentMethod">Payment Method</Label>
                        <Select value={topUpPaymentMethod} onValueChange={(value: PaymentMethod) => setTopUpPaymentMethod(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method"/>
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_METHODS.filter(m => m !== 'Top-Up Card').map(method => (
                                    <SelectItem key={method} value={method}>{method}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="topUpNotes">Notes (Optional)</Label>
                        <Textarea id="topUpNotes" value={topUpNotes} onChange={e => setTopUpNotes(e.target.value)} placeholder="e.g., Cash deposit" />
                      </div>
                      <Button type="submit" className="w-full">Add Funds</Button>
                    </div>
                  </form>

                  <form onSubmit={handleDeductSubmit} className="p-4 border rounded-md">
                    <h4 className="font-semibold mb-2 flex items-center"><ArrowDownCircle className="mr-2 h-5 w-5 text-red-500" />Deduct Funds / Purchase</h4>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="deductAmount">Amount ($)</Label>
                        <Input id="deductAmount" type="number" value={deductAmount} onChange={e => setDeductAmount(e.target.value)} min="0.01" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="deductNotes">Notes (Optional)</Label>
                        <Textarea id="deductNotes" value={deductNotes} onChange={e => setDeductNotes(e.target.value)} placeholder="e.g., Coffee and cake" />
                      </div>
                      <Button type="submit" variant="destructive" className="w-full">Deduct Funds</Button>
                    </div>
                  </form>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2 mt-4">Transaction History</h3>
                <ScrollArea className="h-[300px] border rounded-md">
                  <Table>
                    {transactions.length === 0 && <TableCaption>No transactions yet for this card.</TableCaption>}
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">New Balance</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell>{formatDate(tx.timestamp)}</TableCell>
                          <TableCell>{tx.type}</TableCell>
                          <TableCell>{tx.paymentMethod || 'N/A'}</TableCell>
                          <TableCell className={`text-right ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(tx.amount)}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(tx.balanceAfter)}</TableCell>
                          <TableCell>{tx.notes || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 mt-2 border-t">
            <Button variant="outline" onClick={handlePrintCard}><Printer className="mr-2 h-4 w-4"/> Download as PNG</Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* This element is only for rendering the printable card off-screen */}
      <div className="fixed" style={{ left: '-9999px', top: '-9999px' }}>
          <div ref={cardPrintRef} className="card-design-print">
              <div className="card-body-print">
                <div className="card-details-print">
                  <h3 className="card-title-print">Top-Up Card</h3>
                  <p>Customer: {customer?.name || 'N/A'}</p>
                  {customer?.parentName && <p>Parent: {customer.parentName}</p>}
                  <p>ID: {card.cardId}</p>
                  <p>Current Balance: {formatCurrency(card.currentBalance)}</p>
                </div>
                <div className="card-qr-print">
                  <QRCodeStyling value={card.cardId} size={80} level="H" />
                </div>
              </div>
              <p className="card-footer-print">Scan QR to check balance or top-up</p>
          </div>
      </div>
    </>
  );
}
