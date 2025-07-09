
// src/app/topup-cards/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { TopUpCard, CardTransaction, Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { CreateTopUpCardDialog } from '@/components/topup-cards/CreateTopUpCardDialog';
import { ManageCardDialog } from '@/components/topup-cards/ManageCardDialog';
import QRCodeScannerComponent from '@/components/topup-cards/QRCodeScannerComponent';
import { PlusCircle, CreditCard, Search, Edit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, addDoc, writeBatch, query as firestoreQuery, orderBy, where, limit, serverTimestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


const TOPUP_CARDS_COLLECTION = 'topUpCards';
const CARD_TRANSACTIONS_COLLECTION = 'cardTransactions';
const CUSTOMERS_COLLECTION = 'customers';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatDate = (isoString: string) => format(new Date(isoString), 'MMM dd, yyyy HH:mm');

// Fetcher functions
const fetchTopUpCards = async (): Promise<TopUpCard[]> => {
  if (!db) throw new Error("Firestore not available");
  const cardsCol = collection(db, TOPUP_CARDS_COLLECTION);
  const q = firestoreQuery(cardsCol, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TopUpCard));
};

const fetchCardTransactions = async (cardId?: string): Promise<CardTransaction[]> => {
  if (!db || !cardId) return []; // Or throw error if cardId is essential
  const transCol = collection(db, CARD_TRANSACTIONS_COLLECTION);
  const q = firestoreQuery(transCol, where("cardId", "==", cardId), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CardTransaction));
};

const fetchCustomers = async (): Promise<Customer[]> => {
  if (!db) throw new Error("Firestore not available");
  const customersCol = collection(db, CUSTOMERS_COLLECTION);
  const snapshot = await getDocs(customersCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
};


export default function TopUpCardsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TopUpCard | null>(null);
  
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [manualCardIdInput, setManualCardIdInput] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading: isLoadingCards, isError: isCardsError, error: cardsError } = useQuery<TopUpCard[], Error>({
    queryKey: [TOPUP_CARDS_COLLECTION],
    queryFn: fetchTopUpCards,
    enabled: !!db,
  });

  const { data: customers = [], isLoading: isLoadingCustomers, isError: isCustomersError, error: customersError } = useQuery<Customer[], Error>({
    queryKey: [CUSTOMERS_COLLECTION],
    queryFn: fetchCustomers,
    enabled: !!db,
  });
  
  // For ManageCardDialog - fetch transactions for the selectedCard
  const { data: selectedCardTransactions = [], refetch: refetchSelectedCardTransactions } = useQuery<CardTransaction[], Error>({
    queryKey: [CARD_TRANSACTIONS_COLLECTION, selectedCard?.cardId],
    queryFn: () => fetchCardTransactions(selectedCard?.cardId),
    enabled: !!db && !!selectedCard?.cardId, // Only run if a card is selected
  });

  useEffect(() => {
    if (isCardsError) toast({ title: 'Error Loading Cards', description: cardsError?.message || 'An unexpected error occurred.', variant: 'destructive' });
    if (isCustomersError) toast({ title: 'Error Loading Customers', description: customersError?.message || 'An unexpected error occurred.', variant: 'destructive' });
  }, [isCardsError, cardsError, isCustomersError, customersError, toast]);

  const cardMutation = useMutation<void, Error, { cardData: Omit<TopUpCard, 'id'>; initialTransactionData?: Omit<CardTransaction, 'id'> }>({
    mutationFn: async ({ cardData, initialTransactionData }) => {
      if (!db) throw new Error("Firestore not available");
      const batch = writeBatch(db);
      const newCardRef = doc(collection(db, TOPUP_CARDS_COLLECTION)); // Auto-generate ID
      
      const cardToSave = { ...cardData };
      Object.keys(cardToSave).forEach(keyStr => {
        const key = keyStr as keyof typeof cardToSave;
        if ((cardToSave as any)[key] === undefined) {
          delete (cardToSave as any)[key];
        }
      });
      batch.set(newCardRef, cardToSave);

      if (initialTransactionData) {
        const newTransactionRef = doc(collection(db, CARD_TRANSACTIONS_COLLECTION)); // Auto-generate ID
        batch.set(newTransactionRef, initialTransactionData);
      }
      await batch.commit();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TOPUP_CARDS_COLLECTION] });
      if (variables.initialTransactionData) {
        queryClient.invalidateQueries({ queryKey: [CARD_TRANSACTIONS_COLLECTION, variables.cardData.cardId] });
      }
      toast({ title: 'Card Created', description: `Card ${variables.cardData.cardId} created successfully.` });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Error Creating Card', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
  });
  
  const cardTransactionMutation = useMutation<void, Error, { cardToUpdate: TopUpCard; transactionData: Omit<CardTransaction, 'id'>; newBalance: number; type: 'Top-Up' | 'Deduct'}>({
    mutationFn: async ({ cardToUpdate, transactionData, newBalance }) => {
        if (!db) throw new Error("Firestore not available");
        const batch = writeBatch(db);

        const cardRef = doc(db, TOPUP_CARDS_COLLECTION, cardToUpdate.id); // Use Firestore doc ID
        batch.update(cardRef, { currentBalance: newBalance, lastUpdatedAt: new Date().toISOString() });
        
        const transactionToSave = { ...transactionData };
        Object.keys(transactionToSave).forEach(keyStr => {
            const key = keyStr as keyof typeof transactionToSave;
            if((transactionToSave as any)[key] === undefined) {
                delete (transactionToSave as any)[key];
            }
        });

        const newTransactionRef = doc(collection(db, CARD_TRANSACTIONS_COLLECTION));
        batch.set(newTransactionRef, transactionToSave);
        
        await batch.commit();
    },
    onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: [TOPUP_CARDS_COLLECTION] });
        queryClient.invalidateQueries({ queryKey: [CARD_TRANSACTIONS_COLLECTION, variables.cardToUpdate.cardId] });
        if (selectedCard?.id === variables.cardToUpdate.id) {
            setSelectedCard(prev => prev ? {...prev, currentBalance: variables.newBalance, lastUpdatedAt: new Date().toISOString()} : null);
            refetchSelectedCardTransactions(); // Refetch transactions for the dialog
        }
        const action = variables.type === 'Top-Up' ? 'Top-Up' : 'Deduction';
        toast({ title: `${action} Successful`, description: `${formatCurrency(Math.abs(variables.transactionData.amount))} ${action === 'Top-Up' ? 'added to' : 'deducted from'} card ${variables.cardToUpdate.cardId}.` });
    },
    onError: (error) => {
        toast({ title: 'Transaction Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
  });


  const generateNewCardId = (): string => {
    let newId = '';
    let attempts = 0;
    const existingCardIds = cards.map(c => c.cardId.toUpperCase());
    do {
      newId = `CARD-${Date.now().toString().slice(-4)}${Math.random().toString().slice(2, 6)}`;
      attempts++;
    } while (existingCardIds.includes(newId.toUpperCase()) && attempts < 10);
    if (attempts >= 10) return `CARD-ERR${crypto.randomUUID().slice(0,4)}`;
    return newId.toUpperCase();
  };

  const handleCardCreated = (newCardData: Omit<TopUpCard, 'id'>, initialTransactionData?: Omit<CardTransaction, 'id'>) => {
    cardMutation.mutate({ cardData: newCardData, initialTransactionData });
  };

  const handleManageCard = (cardToManage: TopUpCard) => {
    setSelectedCard(cardToManage);
    setIsManageDialogOpen(true);
    // Transactions for selected card will be fetched by its own useQuery hook
  };

  const handleTopUp = useCallback((cardToUpdate: TopUpCard, amount: number, notes?: string) => {
    if (!cardToUpdate) {
        toast({ title: 'Error', description: 'Card data is missing for top-up.', variant: 'destructive' });
        return;
    }
    const newBalance = cardToUpdate.currentBalance + amount;
    const now = new Date().toISOString();
    const transactionData: Omit<CardTransaction, 'id'> = {
        cardId: cardToUpdate.cardId,
        timestamp: now,
        type: 'Top-Up',
        amount,
        balanceBefore: cardToUpdate.currentBalance,
        balanceAfter: newBalance,
        staffMember: 'Staff User',
        notes,
    };
    cardTransactionMutation.mutate({ cardToUpdate, transactionData, newBalance, type: 'Top-Up' });
  }, [toast, cardTransactionMutation]);

  const handleDeduct = useCallback((cardToUpdate: TopUpCard, amountToDeduct: number, notes?: string): boolean => {
    if (!cardToUpdate) {
      toast({ title: 'Card Not Found', description: `Card data is missing for deduction.`, variant: 'destructive' });
      return false;
    }
    if (cardToUpdate.currentBalance < amountToDeduct) {
      toast({ title: 'Insufficient Balance', description: `Card ${cardToUpdate.cardId} has only ${formatCurrency(cardToUpdate.currentBalance)}. Deduction of ${formatCurrency(amountToDeduct)} failed.`, variant: 'destructive' });
      return false;
    }
    const newBalance = cardToUpdate.currentBalance - amountToDeduct;
    const now = new Date().toISOString();
    const transactionData: Omit<CardTransaction, 'id'> = {
        cardId: cardToUpdate.cardId,
        timestamp: now,
        type: 'Purchase',
        amount: -amountToDeduct,
        balanceBefore: cardToUpdate.currentBalance,
        balanceAfter: newBalance,
        staffMember: 'Staff User',
        notes,
    };
    cardTransactionMutation.mutate({ cardToUpdate, transactionData, newBalance, type: 'Deduct' });
    return true;
  }, [toast, cardTransactionMutation]);


  const onScanSuccess = (decodedText: string) => {
    setIsScannerActive(false);
    // Query Firestore directly for the scanned cardId instead of relying on potentially stale `cards` state
    const findCardByScannedId = async (scannedCardId: string) => {
        if (!db) {
            toast({ title: 'Error', description: 'Firestore not available.', variant: 'destructive'});
            return;
        }
        const q = firestoreQuery(collection(db, TOPUP_CARDS_COLLECTION), where("cardId", "==", scannedCardId.toUpperCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const foundCard = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as TopUpCard;
            toast({ title: 'Card Found', description: `Details for card ${scannedCardId} loaded.` });
            handleManageCard(foundCard);
        } else {
            toast({ title: 'Card Not Found', description: `No card found with ID ${scannedCardId}.`, variant: 'destructive' });
        }
    };
    findCardByScannedId(decodedText);
  };
  
  const handleManualSearch = () => {
    if (!manualCardIdInput.trim()) {
        toast({title: "Input Required", description: "Please enter a Card ID to search.", variant: "destructive"});
        return;
    }
    const cardIdToSearch = manualCardIdInput.trim().toUpperCase();
    // Query Firestore directly
     const findCardByManualId = async (idToSearch: string) => {
        if (!db) {
            toast({ title: 'Error', description: 'Firestore not available.', variant: 'destructive'});
            return;
        }
        const q = firestoreQuery(collection(db, TOPUP_CARDS_COLLECTION), where("cardId", "==", idToSearch));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const foundCard = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as TopUpCard;
            toast({ title: 'Card Found', description: `Details for card ${idToSearch} loaded.` });
            handleManageCard(foundCard);
            setManualCardIdInput('');
        } else {
            toast({ title: 'Card Not Found', description: `No card found with ID ${idToSearch}.`, variant: 'destructive' });
        }
    };
    findCardByManualId(cardIdToSearch);
  };

  const isLoadingAnything = isLoadingCards || isLoadingCustomers || cardMutation.isPending || cardTransactionMutation.isPending;

  if (!db) {
    return (
      <div className="space-y-8">
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Firebase Not Connected</CardTitle></CardHeader>
          <CardContent><p>Cannot load Top-Up Card system. Please check Firebase configuration.</p></CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoadingCards || isLoadingCustomers) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
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
            Create, manage, and scan customer top-up cards. Data stored in Firestore.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} disabled={isLoadingAnything}>
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
          transactions={selectedCardTransactions} // Pass the specific transactions for this card
          onTopUp={handleTopUp}
          onDeduct={handleDeduct}
          onRefreshCardData={() => selectedCard?.cardId && refetchSelectedCardTransactions()}
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
                onScanSuccess={(decodedText) => onScanSuccess(decodedText)}
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
                disabled={isLoadingAnything}
              />
              <Button onClick={handleManualSearch} disabled={isLoadingAnything || !manualCardIdInput.trim()}><Search className="mr-2 h-4 w-4" /> Find</Button>
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
                {cards.map((card) => {
                  const customer = customers.find(c => c.id === card.customerId);
                  return (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono">{card.cardId}</TableCell>
                      <TableCell>{customer ? customer.name : 'N/A'}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(card.currentBalance)}</TableCell>
                      <TableCell>{formatDate(card.createdAt)}</TableCell>
                      <TableCell>{formatDate(card.lastUpdatedAt)}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => handleManageCard(card)} disabled={isLoadingAnything}>
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
            <p className="text-muted-foreground">Top-up card data and transactions are stored in Firebase Firestore.</p>
            <p className="text-muted-foreground mt-2">QR codes encode the human-readable Card ID.</p>
        </CardContent>
       </Card>
    </div>
  );
}
