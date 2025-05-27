// src/app/card-lookup/[cardId]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { TopUpCard, CardTransaction, Customer, AppSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { APP_TITLE as DEFAULT_APP_TITLE } from '@/config/constants';
import { AlertTriangle, Info, Loader2, History, UserCircle, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const TOPUP_CARDS_STORAGE_KEY = 'topUpCardsData';
const CARD_TRANSACTIONS_STORAGE_KEY = 'cardTransactionsData';
const CUSTOMERS_STORAGE_KEY = 'customers';
const APP_SETTINGS_KEY = 'appSettings';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatDate = (isoString: string) => format(new Date(isoString), 'MMM dd, yyyy HH:mm');

export default function CardLookupPage() {
  const params = useParams();
  const cardIdParam = params?.cardId as string | undefined;

  const [card, setCard] = useState<TopUpCard | null>(null);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [appTitle, setAppTitle] = useState(DEFAULT_APP_TITLE);

  useEffect(() => {
    setIsMounted(true);
    const storedSettings = localStorage.getItem(APP_SETTINGS_KEY);
    if (storedSettings) {
      try {
        const parsedSettings: AppSettings = JSON.parse(storedSettings);
        if (parsedSettings.storeName) {
          setAppTitle(parsedSettings.storeName);
          document.title = `Card Lookup - ${parsedSettings.storeName}`;
        } else {
           document.title = `Card Lookup - ${DEFAULT_APP_TITLE}`;
        }
      } catch (e) { 
        document.title = `Card Lookup - ${DEFAULT_APP_TITLE}`;
      }
    } else {
      document.title = `Card Lookup - ${DEFAULT_APP_TITLE}`;
    }
  }, []);

  useEffect(() => {
    if (!isMounted || !cardIdParam) {
      if (isMounted && !cardIdParam) {
          setError("Card ID is missing from the URL.");
          setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const storedCards = localStorage.getItem(TOPUP_CARDS_STORAGE_KEY);
      const allCards: TopUpCard[] = storedCards ? JSON.parse(storedCards) : [];
      const foundCard = allCards.find(c => c.cardId.toUpperCase() === cardIdParam.toUpperCase());

      if (foundCard) {
        setCard(foundCard);

        const storedTransactions = localStorage.getItem(CARD_TRANSACTIONS_STORAGE_KEY);
        const allTransactions: CardTransaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
        const cardTransactions = allTransactions
          .filter(tx => tx.cardId.toUpperCase() === foundCard.cardId.toUpperCase())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);
        setTransactions(cardTransactions);

        if (foundCard.customerId) {
          const storedCustomers = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
          const allCustomers: Customer[] = storedCustomers ? JSON.parse(storedCustomers) : [];
          const foundCustomer = allCustomers.find(cust => cust.id === foundCard.customerId);
          setCustomerName(foundCustomer ? foundCustomer.name : 'N/A');
        } else {
          setCustomerName(null);
        }
      } else {
        setError(`Top-Up Card with ID "${cardIdParam}" not found.`);
        setCard(null);
      }
    } catch (e: any) {
      console.error("Error loading card data:", e);
      setError(`Failed to load card information. ${e.message}`);
      setCard(null);
    } finally {
      setIsLoading(false);
    }
  }, [cardIdParam, isMounted]);

  if (!isMounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading card details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-6 w-6" /> Error Loading Card
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{error}</p>
          <Link href="/" passHref>
            <Button variant="outline">Return to {appTitle}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!card) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-muted-foreground">
            <Info className="mr-2 h-6 w-6" /> Card Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>No card information to display. This might happen if the card ID is incorrect or missing.</p>
           <Link href="/" passHref>
            <Button variant="outline" className="mt-4">Return to {appTitle}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">{appTitle}</h1>
        <p className="text-xl text-muted-foreground">Top-Up Card Statement</p>
      </header>

      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-card-foreground/5">
          <CardTitle className="flex items-center text-2xl">
            <Wallet className="mr-3 h-7 w-7 text-primary" />
            Card ID: <span className="font-mono ml-2">{card.cardId}</span>
          </CardTitle>
          {customerName && (
            <CardDescription className="flex items-center pt-1">
              <UserCircle className="mr-2 h-5 w-5 text-muted-foreground" />
              Linked to: {customerName}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Current Balance:</p>
            <p className="text-4xl font-bold text-primary">{formatCurrency(card.currentBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">Last updated: {formatDate(card.lastUpdatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <History className="mr-2 h-6 w-6 text-primary" />
            Recent Transactions (Last 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px] rounded-md border shadow-inner">
            <Table>
              {transactions.length === 0 && (
                <TableCaption>No transactions found for this card.</TableCaption>
              )}
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.timestamp)}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        tx.type === 'Top-Up' || tx.type === 'Creation' ? 'text-green-600' : 
                        tx.type === 'Purchase' ? 'text-red-600' : ''
                      }`}>
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${
                      tx.amount >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(tx.balanceAfter)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={tx.notes}>
                      {tx.notes || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
       <div className="text-center mt-8">
          <Link href="/" passHref>
            <Button variant="outline">Return to {appTitle}</Button>
          </Link>
        </div>
    </div>
  );
}
