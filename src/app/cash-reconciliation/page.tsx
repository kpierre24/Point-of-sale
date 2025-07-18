// src/app/cash-reconciliation/page.tsx
"use client";

import { useState, useMemo } from 'react';
import type { Sale, CardTransaction, Location, Reconciliation } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/context/LocationContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query as firestoreQuery, where, orderBy, writeBatch } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Landmark, Save, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, startOfDay, endOfDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';

const SALES_COLLECTION = 'sales';
const CARD_TRANSACTIONS_COLLECTION = 'cardTransactions';
const LOCATIONS_COLLECTION = 'locations';
const RECONCILIATIONS_COLLECTION = 'reconciliations';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

const fetchLocations = async (): Promise<Location[]> => {
    if (!db) throw new Error("Firestore not available");
    const snapshot = await getDocs(collection(db, LOCATIONS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
};

const fetchTransactionsForDate = async (locationId: string, date: Date) => {
    if (!db) throw new Error("Firestore not available");

    const start = startOfDay(date);
    const end = endOfDay(date);

    const salesQuery = firestoreQuery(
        collection(db, SALES_COLLECTION),
        where("locationId", "==", locationId),
        where("paymentMethod", "==", "Cash"),
        where("timestamp", ">=", start.toISOString()),
        where("timestamp", "<=", end.toISOString())
    );
    
    const topUpsQuery = firestoreQuery(
        collection(db, CARD_TRANSACTIONS_COLLECTION),
        where("locationId", "==", locationId),
        where("paymentMethod", "==", "Cash"),
        where("type", "in", ["Top-Up", "Creation"]),
        where("timestamp", ">=", start.toISOString()),
        where("timestamp", "<=", end.toISOString())
    );

    const [salesSnapshot, topUpsSnapshot] = await Promise.all([
        getDocs(salesQuery),
        getDocs(topUpsQuery)
    ]);

    const cashSales = salesSnapshot.docs.map(doc => doc.data() as Sale);
    const cashTopUps = topUpsSnapshot.docs.map(doc => doc.data() as CardTransaction);
    
    return { cashSales, cashTopUps };
};

export default function CashReconciliationPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { selectedLocationId } = useLocation();
    
    const [reconciliationDate, setReconciliationDate] = useState<Date | undefined>(new Date());
    const [countedCash, setCountedCash] = useState<string>('');
    
    const { data: locations = [], isLoading: isLoadingLocations } = useQuery<Location[], Error>({
        queryKey: [LOCATIONS_COLLECTION],
        queryFn: fetchLocations,
        enabled: !!db,
    });

    const { data: transactions, isLoading: isLoadingTransactions, refetch } = useQuery({
        queryKey: ['cashTransactions', selectedLocationId, reconciliationDate],
        queryFn: () => fetchTransactionsForDate(selectedLocationId!, reconciliationDate!),
        enabled: !!selectedLocationId && !!reconciliationDate && !!db,
    });
    
    const totalCashSales = useMemo(() => transactions?.cashSales.reduce((sum, sale) => sum + sale.total, 0) || 0, [transactions]);
    const totalCashTopUps = useMemo(() => transactions?.cashTopUps.reduce((sum, topUp) => sum + topUp.amount, 0) || 0, [transactions]);
    const expectedCash = totalCashSales + totalCashTopUps;
    const variance = parseFloat(countedCash) - expectedCash;
    
    const selectedLocationName = locations.find(l => l.id === selectedLocationId)?.name || "your selected location";

    const reconciliationMutation = useMutation<void, Error, Omit<Reconciliation, 'id'>>({
        mutationFn: async (reconciliationData) => {
            if (!db) throw new Error("Firestore not available");
            const id = `${reconciliationData.locationId}-${reconciliationData.date}`;
            const docRef = doc(db, RECONCILIATIONS_COLLECTION, id);
            await setDoc(docRef, { ...reconciliationData, id }, { merge: true });
        },
        onSuccess: () => {
            toast({ title: "Reconciliation Saved", description: "The end-of-day cash reconciliation has been saved." });
        },
        onError: (error) => {
            toast({ title: "Error Saving Reconciliation", description: error.message, variant: "destructive" });
        }
    });

    const handleSaveReconciliation = () => {
        if (!selectedLocationId || !reconciliationDate) {
            toast({ title: "Missing Information", description: "Please select a location and date.", variant: "destructive" });
            return;
        }
        if (countedCash === '' || isNaN(parseFloat(countedCash))) {
            toast({ title: "Invalid Input", description: "Please enter a valid counted cash amount.", variant: "destructive" });
            return;
        }
        
        const reconciliationData: Omit<Reconciliation, 'id'> = {
            date: formatDate(reconciliationDate),
            locationId: selectedLocationId,
            expectedCash: expectedCash,
            countedCash: parseFloat(countedCash),
            variance: variance,
            totalCashSales: totalCashSales,
            totalCashTopUps: totalCashTopUps,
            createdAt: new Date().toISOString(),
        };
        reconciliationMutation.mutate(reconciliationData);
    };

    if (isLoadingLocations) {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Loading...</p>
          </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <Landmark className="mr-3 h-8 w-8 text-primary" />
                        Cash Reconciliation
                    </h1>
                    <p className="text-muted-foreground text-md">
                        Balance your cash drawer for a selected location and date.
                    </p>
                </div>
            </header>

            {!selectedLocationId && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Location Selected</AlertTitle>
                    <AlertDescription>
                        Please select a location from the sidebar to perform a reconciliation.
                    </AlertDescription>
                </Alert>
            )}

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${!selectedLocationId ? 'opacity-50 pointer-events-none' : ''}`}>
                <Card>
                    <CardHeader>
                        <CardTitle>Reconciliation for {selectedLocationName}</CardTitle>
                        <div className="w-full md:w-1/2 pt-2">
                             <DatePicker date={reconciliationDate} setDate={setReconciliationDate} />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 p-4 border rounded-md bg-muted/30">
                            <h3 className="font-semibold">Cash Summary</h3>
                            <div className="flex justify-between"><span>Total from Sales:</span> <span>{formatCurrency(totalCashSales)}</span></div>
                            <div className="flex justify-between"><span>Total from Top-Ups:</span> <span>{formatCurrency(totalCashTopUps)}</span></div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>Expected in Drawer:</span> <span>{formatCurrency(expectedCash)}</span></div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="countedCash">Counted Cash Amount</Label>
                            <Input id="countedCash" type="number" placeholder="Enter total cash counted" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} />
                        </div>
                        
                        {countedCash !== '' && (
                            <div className={`p-4 rounded-md ${variance === 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                <h3 className="font-semibold flex items-center">
                                    {variance > 0 ? <TrendingUp className="mr-2 h-5 w-5 text-green-600"/> : <TrendingDown className="mr-2 h-5 w-5 text-red-600"/>}
                                    Variance
                                </h3>
                                <p className={`text-2xl font-bold ${variance === 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                    {formatCurrency(variance)}
                                </p>
                                <p className="text-sm text-muted-foreground">{variance > 0 ? "Over" : "Short"}</p>
                            </div>
                        )}

                        <Button onClick={handleSaveReconciliation} disabled={reconciliationMutation.isPending || !selectedLocationId || countedCash === ''}>
                            {reconciliationMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                            Save Reconciliation
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cash Transaction Details</CardTitle>
                        <CardDescription>All cash transactions for {reconciliationDate ? format(reconciliationDate, 'MMM dd, yyyy') : 'the selected date'}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingTransactions ? (
                             <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                        <ScrollArea className="h-[400px] border rounded-md">
                            <Table>
                                <TableCaption>
                                    {!transactions || (transactions.cashSales.length === 0 && transactions.cashTopUps.length === 0) ? "No cash transactions found." : "End of list."}
                                </TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions?.cashSales.map(sale => (
                                        <TableRow key={`sale-${sale.id}`}>
                                            <TableCell>{format(new Date(sale.timestamp), 'HH:mm')}</TableCell>
                                            <TableCell>Sale</TableCell>
                                            <TableCell>{sale.name} (x{sale.quantity})</TableCell>
                                            <TableCell className="text-right">{formatCurrency(sale.total)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {transactions?.cashTopUps.map(topUp => (
                                        <TableRow key={`topup-${topUp.id}`}>
                                            <TableCell>{format(new Date(topUp.timestamp), 'HH:mm')}</TableCell>
                                            <TableCell>Top-Up</TableCell>
                                            <TableCell>Card: {topUp.cardId}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(topUp.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
