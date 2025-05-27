// src/app/topup-cards/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { TopUpCard, CardTransaction, Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // For manual ID entry
import { Label } from '@/components/ui/label'; // Added import for Label
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { CreateTopUpCardDialog } from '@/components/topup-cards/CreateTopUpCardDialog';
import { ManageCardDialog } from '@/components/topup-cards/ManageCardDialog';
import QRCodeScannerComponent from '@/components/topup-cards/QRCodeScannerComponent';
import { PlusCircle, CreditCard, Search, Edit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const TOPUP_CARDS_STORAGE_KEY = 'topUpCardsData';
const CARD_TRANSACTIONS_STORAGE_KEY = 'cardTransactionsData';
const CUSTOMERS_STORAGE_KEY = 'customers'; // Assuming customers are stored here

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatDate = (isoString: string) => format(new Date(isoString), 'MMM dd, yyyy HH:mm');

export default function TopUpCardsPage() {
  const [cards, setCards] = useState<TopUpCard[]>([]);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TopUpCard | null>(null);
  const [selectedCardTransactions, setSelectedCardTransactions] = useState<CardTransaction[]>([]);
  
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [manualCardIdInput, setManualCardIdInput] = useState('');

  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(() => {
    const storedCards = localStorage.getItem(TOPUP_CARDS_STORAGE_KEY);
    const storedTransactions = localStorage.getItem(CARD_TRANSACTIONS_STORAGE_KEY);
    const storedCustomers = localStorage.getItem(CUSTOMERS_STORAGE_KEY);

    if (storedCards) setCards(JSON.parse(storedCards));
    if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
  }, []);

  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(TOPUP_CARDS_STORAGE_KEY, JSON.stringify(cards));
    }
  }, [cards, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(CARD_TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions, isMounted]);

  const generateNewCardId = (): string => {
    // Simple unique ID generation
    let newId = '';
    let attempts = 0;
    do {
      newId = `CARD-${Date.now().toString().slice(-4)}${Math.random().toString().slice(2, 6)}`;
      attempts++;
    } while (cards.some(c => c.cardId === newId) && attempts < 10);
    if (attempts >= 10) return `CARD-ERR${crypto.randomUUID().slice(0,4)}`; // fallback
    return newId.toUpperCase();
  };

  const handleCardCreated = (newCard: TopUpCard, initialTransaction?: CardTransaction) => {
    setCards(prev => [newCard, ...prev]);
    if (initialTransaction) {
      setTransactions(prev => [initialTransaction, ...prev]);
    }
  };

  const handleManageCard = (card: TopUpCard) => {
    setSelectedCard(card);
    setSelectedCardTransactions(transactions.filter(tx => tx.cardId === card.cardId));
    setIsManageDialogOpen(true);
  };

  const refreshCardDataForDialog = (cardId: string) => {
      const cardToRefresh = cards.find(c => c.cardId === cardId);
      if (cardToRefresh) {
          setSelectedCard(cardToRefresh);
          setSelectedCardTransactions(transactions.filter(tx => tx.cardId === cardToRefresh.cardId));
      }
  }

  const handleTopUp = (cardId: string, amount: number, notes?: string) => {
    setCards(prevCards => 
      prevCards.map(c => {
        if (c.cardId === cardId) {
          const newBalance = c.currentBalance + amount;
          const newTransaction: CardTransaction = {
            id: crypto.randomUUID(),
            cardId,
            timestamp: new Date().toISOString(),
            type: 'Top-Up',
            amount,
            balanceBefore: c.currentBalance,
            balanceAfter: newBalance,
            staffMember: 'Staff User', // Placeholder
            notes,
          };
          setTransactions(prevTx => [newTransaction, ...prevTx]);
          return { ...c, currentBalance: newBalance, lastUpdatedAt: new Date().toISOString() };
        }
        return c;
      })
    );
    // For dialog refresh
    if (selectedCard?.cardId === cardId) {
        refreshCardDataForDialog(cardId);
    }
  };

  const handleDeduct = (cardId: string, amount: number, notes?: string): boolean => {
    let success = false;
    setCards(prevCards =>
      prevCards.map(c => {
        if (c.cardId === cardId) {
          if (c.currentBalance < amount) {
            toast({ title: 'Insufficient Balance', description: `Card ${cardId} has only ${formatCurrency(c.currentBalance)}.`, variant: 'destructive' });
            success = false;
            return c;
          }
          const newBalance = c.currentBalance - amount;
          const newTransaction: CardTransaction = {
            id: crypto.randomUUID(),
            cardId,
            timestamp: new Date().toISOString(),
            type: 'Purchase',
            amount: -amount, // Store deductions as negative for clarity if needed, or always positive based on type
            balanceBefore: c.currentBalance,
            balanceAfter: newBalance,
            staffMember: 'Staff User', // Placeholder
            notes,
          };
          setTransactions(prevTx => [newTransaction, ...prevTx]);
          success = true;
          return { ...c, currentBalance: newBalance, lastUpdatedAt: new Date().toISOString() };
        }
        return c;
      })
    );
     // For dialog refresh
    if (selectedCard?.cardId === cardId && success) {
       refreshCardDataForDialog(cardId);
    }
    return success;
  };

  const onScanSuccess = (decodedText: string) => {
    setIsScannerActive(false); // Turn off scanner
    const foundCard = cards.find(c => c.cardId.toUpperCase() === decodedText.toUpperCase());
    if (foundCard) {
      toast({ title: 'Card Found', description: `Details for card ${decodedText} loaded.` });
      handleManageCard(foundCard);
    } else {
      toast({ title: 'Card Not Found', description: `No card found with ID ${decodedText}.`, variant: 'destructive' });
    }
  };
  
  const handleManualSearch = () => {
    if (!manualCardIdInput.trim()) {
        toast({title: "Input Required", description: "Please enter a Card ID to search.", variant: "destructive"});
        return;
    }
    const cardIdToSearch = manualCardIdInput.trim().toUpperCase();
    const foundCard = cards.find(c => c.cardId.toUpperCase() === cardIdToSearch);
    if (foundCard) {
      toast({ title: 'Card Found', description: `Details for card ${cardIdToSearch} loaded.` });
      handleManageCard(foundCard);
      setManualCardIdInput('');
    } else {
      toast({ title: 'Card Not Found', description: `No card found with ID ${cardIdToSearch}.`, variant: 'destructive' });
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Top-Up Card System...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <CreditCard className="mr-3 h-8 w-8 text-primary" />
            Customer Top-Up Cards
          </h1>
          <p className="text-muted-foreground text-md">
            Create, manage, and scan customer top-up cards.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Card
        </Button>
      </header>

      <CreateTopUpCardDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCardCreated={handleCardCreated}
        existingCustomers={customers}
        generateNewCardId={generateNewCardId}
      />

      {selectedCard && (
        <ManageCardDialog
          isOpen={isManageDialogOpen}
          onOpenChange={setIsManageDialogOpen}
          card={selectedCard}
          transactions={selectedCardTransactions}
          onTopUp={handleTopUp}
          onDeduct={handleDeduct}
          onRefreshCardData={refreshCardDataForDialog}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Find & Manage Card</CardTitle>
          <CardDescription>Scan a QR code or enter Card ID manually to manage a card.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
             <QRCodeScannerComponent 
                onScanSuccess={onScanSuccess}
                onScanFailure={(err) => console.warn("QR Scan Error:", err)}
                active={isScannerActive}
                setActive={setIsScannerActive}
              />
          </div>
          <div className="space-y-3">
            <Label htmlFor="manualCardId">Manual Card ID Entry</Label>
            <div className="flex gap-2">
              <Input 
                id="manualCardId" 
                placeholder="Enter Card ID (e.g., CARD-123XYZ)" 
                value={manualCardIdInput}
                onChange={(e) => setManualCardIdInput(e.target.value)}
                className="uppercase"
              />
              <Button onClick={handleManualSearch}><Search className="mr-2 h-4 w-4" /> Find</Button>
            </div>
            <p className="text-xs text-muted-foreground">If QR scanning is not available, type the Card ID here.</p>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Existing Top-Up Cards</CardTitle>
          <CardDescription>
            {cards.length > 0 ? `Displaying ${cards.length} card(s).` : 'No top-up cards created yet.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] rounded-md border shadow-inner">
            <Table>
              {cards.length === 0 && <TableCaption>No cards found.</TableCaption>}
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Card ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Current Balance</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((card) => {
                  const customer = customers.find(c => c.id === card.customerId);
                  return (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono">{card.cardId}</TableCell>
                      <TableCell>{customer ? customer.name : 'N/A'}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(card.currentBalance)}</TableCell>
                      <TableCell>{formatDate(card.createdAt)}</TableCell>
                      <TableCell>{formatDate(card.lastUpdatedAt)}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => handleManageCard(card)}>
                          <Edit className="mr-2 h-4 w-4" /> Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
       <Card className="mt-8">
        <CardHeader>
            <CardTitle>System Notes</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Top-up card data and transactions are currently stored in your browser's local storage. For a production environment, this data should be migrated to a persistent database like Firebase Firestore.</p>
            <p className="text-muted-foreground mt-2">QR codes encode the human-readable Card ID.</p>
        </CardContent>
       </Card>
    </div>
  );
}

