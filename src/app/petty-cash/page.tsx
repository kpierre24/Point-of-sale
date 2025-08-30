
// src/app/petty-cash/page.tsx
"use client";

import { useState, useMemo } from 'react';
import type { PettyCashTransaction, Location } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/context/LocationContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, addDoc, query as firestoreQuery, where, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, DollarSign, AlertCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';

const PETTY_CASH_COLLECTION = 'pettyCashTransactions';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatDate = (dateString: string) => format(new Date(dateString), 'MMM dd, yyyy HH:mm');

// Fetcher function
const fetchPettyCashTransactions = async (locationId: string): Promise<PettyCashTransaction[]> => {
    if (!db) throw new Error("Firestore not available");
    const q = firestoreQuery(
        collection(db, PETTY_CASH_COLLECTION),
        where("locationId", "==", locationId),
        orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PettyCashTransaction));
};


export default function PettyCashPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { selectedLocationId } = useLocation();

    const [transactionType, setTransactionType] = useState<'in' | 'out'>('out');
    const [amount, setAmount] = useState<string>('');
    const [reason, setReason] = useState('');

    const { data: transactions = [], isLoading, refetch } = useQuery<PettyCashTransaction[], Error>({
        queryKey: [PETTY_CASH_COLLECTION, selectedLocationId],
        queryFn: () => fetchPettyCashTransactions(selectedLocationId!),
        enabled: !!selectedLocationId && !!db,
    });
    
    const mutation = useMutation<void, Error, Omit<PettyCashTransaction, 'id'>>({
        mutationFn: async (newTransaction) => {
            if (!db) throw new Error("Firestore not available");
            await addDoc(collection(db, PETTY_CASH_COLLECTION), newTransaction);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PETTY_CASH_COLLECTION, selectedLocationId] });
            toast({ title: 'Transaction Recorded', description: 'The petty cash transaction has been saved.' });
            setAmount('');
            setReason('');
        },
        onError: (error) => {
            toast({ title: 'Error Recording Transaction', description: error.message, variant: 'destructive' });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLocationId) {
            toast({ title: 'Location Missing', description: 'Please select a location first.', variant: 'destructive' });
            return;
        }
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast({ title: 'Invalid Amount', description: 'Please enter a valid positive amount.', variant: 'destructive' });
            return;
        }
        if (!reason.trim()) {
            toast({ title: 'Reason Required', description: 'Please provide a reason for the transaction.', variant: 'destructive' });
            return;
        }

        const transactionData: Omit<PettyCashTransaction, 'id'> = {
            locationId: selectedLocationId,
            timestamp: new Date().toISOString(),
            type: transactionType,
            amount: numericAmount,
            reason: reason.trim(),
            staffMember: "Admin", // Placeholder
        };
        mutation.mutate(transactionData);
    };

    if (isLoading) {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Loading Petty Cash Data...</p>
          </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight flex items-center">
                    <DollarSign className="mr-3 h-8 w-8 text-primary" />
                    Petty Cash Management
                </h1>
                <p className="text-muted-foreground text-md">
                    Record cash taken out for expenses or added to the drawer.
                </p>
            </header>

            {!selectedLocationId ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Location Selected</AlertTitle>
                    <AlertDescription>
                        Please select a location from the sidebar to manage petty cash.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>New Transaction</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="type">Transaction Type</Label>
                                    <Select value={transactionType} onValueChange={(value: 'in' | 'out') => setTransactionType(value)}>
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="out"><ArrowDownCircle className="inline-block mr-2 h-4 w-4 text-red-500" />Cash Out (Expense)</SelectItem>
                                            <SelectItem value="in"><ArrowUpCircle className="inline-block mr-2 h-4 w-4 text-green-500" />Cash In (Float)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="amount">Amount ($)</Label>
                                    <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0.01" step="0.01" required placeholder="0.00" />
                                </div>
                                <div>
                                    <Label htmlFor="reason">Reason / Description</Label>
                                    <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="e.g., Office supplies" />
                                </div>
                                <Button type="submit" disabled={mutation.isPending} className="w-full">
                                    {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Record Transaction
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>Recent petty cash movements for the selected location.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px] border rounded-md">
                                <Table>
                                    <TableCaption>{transactions.length === 0 ? "No transactions found." : "End of list."}</TableCaption>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map(tx => (
                                            <TableRow key={tx.id}>
                                                <TableCell>{formatDate(tx.timestamp)}</TableCell>
                                                <TableCell>
                                                    <span className={`font-medium ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {tx.type === 'in' ? 'In' : 'Out'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{tx.reason}</TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(tx.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
