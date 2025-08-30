// src/app/topup-cards/bulk-create/page.tsx
"use client";

import { useState, useRef } from 'react';
import type { TopUpCard, CardTransaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Printer, Users } from 'lucide-react';
import Link from 'next/link';
import QRCode from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const TOPUP_CARDS_COLLECTION = 'topUpCards';
const CARD_TRANSACTIONS_COLLECTION = 'cardTransactions';

interface GeneratedCard extends Omit<TopUpCard, 'id' | 'customerId' | 'createdAt' | 'lastUpdatedAt'> {
  // We only need cardId, qrCodeValue and currentBalance for display
}

export default function BulkCreateTopUpCardsPage() {
  const [numberOfCards, setNumberOfCards] = useState<number | string>(10);
  const [initialBalance, setInitialBalance] = useState<number | string>(0);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const printableAreaRef = useRef<HTMLDivElement>(null);

  const bulkCreateMutation = useMutation<GeneratedCard[], Error, { count: number; balance: number }>({
    mutationFn: async ({ count, balance }) => {
      if (!db) throw new Error("Firestore not available");
      if (count <= 0) throw new Error("Number of cards must be greater than zero.");
      if (count > 500) throw new Error("Cannot create more than 500 cards at once.");

      const batch = writeBatch(db);
      const newCardsForDisplay: GeneratedCard[] = [];
      const now = new Date().toISOString();

      const existingCardIds = new Set<string>(); // To prevent duplicates within the same batch

      for (let i = 0; i < count; i++) {
        let newCardId = '';
        let attempts = 0;
        // Simple unique ID generation for the batch
        do {
          newCardId = `CARD-${Date.now().toString().slice(-5)}${Math.random().toString().slice(2, 7)}`.toUpperCase();
          attempts++;
        } while (existingCardIds.has(newCardId) && attempts < 10);
        
        if (attempts >= 10) throw new Error(`Failed to generate a unique Card ID after ${attempts} attempts.`);

        existingCardIds.add(newCardId);

        const newCardRef = doc(collection(db, TOPUP_CARDS_COLLECTION));
        const newCardData: Omit<TopUpCard, 'id'> = {
          cardId: newCardId,
          currentBalance: balance,
          qrCodeValue: newCardId,
          createdAt: now,
          lastUpdatedAt: now,
        };
        batch.set(newCardRef, newCardData);

        if (balance > 0) {
          const newTransactionRef = doc(collection(db, CARD_TRANSACTIONS_COLLECTION));
          const initialTransactionData: Omit<CardTransaction, 'id'> = {
            cardId: newCardId,
            timestamp: now,
            type: 'Creation',
            amount: balance,
            balanceBefore: 0,
            balanceAfter: balance,
            staffMember: 'System (Bulk)',
            notes: 'Initial balance from bulk creation',
          };
          batch.set(newTransactionRef, initialTransactionData);
        }
        
        newCardsForDisplay.push({
            cardId: newCardData.cardId,
            qrCodeValue: newCardData.qrCodeValue,
            currentBalance: newCardData.currentBalance,
        });
      }

      await batch.commit();
      return newCardsForDisplay;
    },
    onSuccess: (newCards) => {
      queryClient.invalidateQueries({ queryKey: [TOPUP_CARDS_COLLECTION] });
      queryClient.invalidateQueries({ queryKey: [CARD_TRANSACTIONS_COLLECTION] });
      setGeneratedCards(newCards);
      toast({
        title: 'Bulk Creation Successful',
        description: `${newCards.length} cards have been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Bulk Creation Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratedCards([]);
    const count = Number(numberOfCards);
    const balance = Number(initialBalance);
    bulkCreateMutation.mutate({ count, balance });
  };
  
  const handlePrint = async () => {
    const printableElement = printableAreaRef.current;
    if (!printableElement) {
        toast({ title: "Error", description: "Printable area not found.", variant: "destructive" });
        return;
    }

    try {
        const canvas = await html2canvas(printableElement, { scale: 3 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        const newImgWidth = pdfWidth;
        const newImgHeight = newImgWidth / ratio;

        pdf.addImage(imgData, 'PNG', 0, 0, newImgWidth, newImgHeight);
        pdf.save(`bulk-cards-${Date.now()}.pdf`);
        toast({ title: "PDF Generated", description: "Your PDF with all cards has been downloaded." });

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({ title: "PDF Generation Failed", description: "Could not generate PDF.", variant: "destructive" });
    }
  };


  return (
    <div className="space-y-8">
      <div className="no-print">
        <Button asChild variant="outline" className="mb-8">
            <Link href="/topup-cards">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Top-Up Cards
            </Link>
        </Button>
        <header>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" />
            Bulk Create Top-Up Cards
          </h1>
          <p className="text-muted-foreground text-md">
            Generate multiple anonymous cards with a default balance.
          </p>
        </header>
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Generation Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <Label htmlFor="numberOfCards">Number of Cards (Max 500)</Label>
              <Input
                id="numberOfCards"
                type="number"
                value={numberOfCards}
                onChange={(e) => setNumberOfCards(e.target.value)}
                min="1"
                max="500"
                required
              />
            </div>
            <div className="flex-1 w-full">
              <Label htmlFor="initialBalance">Initial Balance ($)</Label>
              <Input
                id="initialBalance"
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                min="0"
                step="0.01"
                required
              />
            </div>
            <Button type="submit" disabled={bulkCreateMutation.isPending} className="w-full sm:w-auto">
              {bulkCreateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Generate Cards
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {generatedCards.length > 0 && (
        <>
            <div className="flex justify-between items-center no-print">
                <h2 className="text-2xl font-bold">Generated Cards</h2>
                <Button onClick={handlePrint} variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Print All as PDF
                </Button>
            </div>
            <div ref={printableAreaRef} className="printable-area grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 bg-white">
                {generatedCards.map((card) => (
                    <div key={card.cardId} className="p-4 flex flex-col items-center justify-center text-center break-all border-2 border-dashed aspect-video">
                       <QRCode value={card.qrCodeValue} size={128} level="H" renderAs="svg" />
                       <p className="mt-2 font-mono text-sm tracking-tighter">{card.cardId}</p>
                    </div>
                ))}
            </div>
        </>
      )}
    </div>
  );
}
