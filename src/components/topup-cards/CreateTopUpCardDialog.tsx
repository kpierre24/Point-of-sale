// src/components/topup-cards/CreateTopUpCardDialog.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import type { TopUpCard, CardTransaction, Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import QRCodeStyling from 'qrcode.react'; // Using qrcode.react for generation
import { Download } from 'lucide-react';

interface CreateTopUpCardDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCardCreated: (newCardData: Omit<TopUpCard, 'id'>, initialTransactionData?: Omit<CardTransaction, 'id'>) => void;
  existingCustomers: Customer[];
  generateNewCardId: () => string;
}

export function CreateTopUpCardDialog({
  isOpen,
  onOpenChange,
  onCardCreated,
  existingCustomers,
  generateNewCardId,
}: CreateTopUpCardDialogProps) {
  const [cardId, setCardId] = useState('');
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [initialBalance, setInitialBalance] = useState<string>('0');
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setCardId(generateNewCardId());
      setCustomerId(undefined);
      setInitialBalance('0');
    }
  }, [isOpen, generateNewCardId]);

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `topup-card-${cardId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast({ title: 'QR Code Downloaded', description: `${cardId}.png has been downloaded.` });
    } else {
      toast({ title: 'Error', description: 'Could not find QR code canvas to download.', variant: 'destructive' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardId.trim()) {
      toast({ title: 'Card ID Required', description: 'Card ID cannot be empty.', variant: 'destructive' });
      return;
    }
    const balance = parseFloat(initialBalance) || 0;
    if (balance < 0) {
      toast({ title: 'Invalid Balance', description: 'Initial balance cannot be negative.', variant: 'destructive' });
      return;
    }

    const now = new Date().toISOString();
    const newCardData: Omit<TopUpCard, 'id'> = {
      cardId: cardId.trim().toUpperCase(),
      customerId: customerId,
      currentBalance: balance,
      qrCodeValue: cardId.trim().toUpperCase(),
      createdAt: now,
      lastUpdatedAt: now,
    };

    let initialTransactionData: Omit<CardTransaction, 'id'> | undefined;
    if (balance > 0) {
      initialTransactionData = {
        cardId: newCardData.cardId,
        timestamp: now,
        type: 'Creation',
        amount: balance,
        balanceBefore: 0,
        balanceAfter: balance,
        staffMember: 'System', // Or current staff if available
        notes: 'Initial card balance',
      };
    }

    onCardCreated(newCardData, initialTransactionData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Top-Up Card</DialogTitle>
          <DialogDescription>
            Enter details for the new card. The QR code will encode the Card ID.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[70vh] p-1 pr-6">
            <div className="space-y-4 py-4 pr-1">
              <div>
                <Label htmlFor="cardId">Card ID (Auto-generated)</Label>
                <Input id="cardId" value={cardId} onChange={(e) => setCardId(e.target.value.toUpperCase())} required />
                <p className="text-xs text-muted-foreground mt-1">This ID will be encoded in the QR code.</p>
              </div>

              {cardId && (
                <div className="space-y-2 text-center p-4 border rounded-md bg-muted/50">
                  <Label>QR Code for {cardId}</Label>
                  <div ref={qrRef} className="flex justify-center">
                    <QRCodeStyling value={cardId} size={160} level="H" />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleDownloadQR} className="mt-2">
                    <Download className="mr-2 h-4 w-4" />
                    Download QR
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="customerId">Link to Customer (Optional)</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger id="customerId">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none_selected_placeholder_value_for_optional_field">No Customer</SelectItem>
                    {existingCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="initialBalance">Initial Balance ($)</Label>
                <Input
                  id="initialBalance"
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 mt-2 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Create Card</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
