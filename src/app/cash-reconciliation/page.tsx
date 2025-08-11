// src/app/cash-reconciliation/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Sale, CardTransaction, Location, Reconciliation, PettyCashTransaction, Product, WastageEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/context/LocationContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query as firestoreQuery, where, orderBy, writeBatch, addDoc, updateDoc } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Landmark, Save, AlertCircle, TrendingUp, TrendingDown, Trash2, PlusCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, startOfDay, endOfDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { WastageFormDialog } from '@/components/wastage/WastageFormDialog';


const SALES_COLLECTION = 'sales';
const CARD_TRANSACTIONS_COLLECTION = 'cardTransactions';
const LOCATIONS_COLLECTION = 'locations';
const RECONCILIATIONS_COLLECTION = 'reconciliations';
const PETTY_CASH_COLLECTION = 'pettyCashTransactions';
const WASTAGE_EVENTS_COLLECTION = 'wastageEvents';
const PRODUCTS_COLLECTION = 'products';


const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

const fetchLocations = async (): Promise<Location[]> => {
    if (!db) throw new Error("Firestore not available");
    const snapshot = await getDocs(collection(db, LOCATIONS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
};

const fetchProducts = async (): Promise<Product[]> => {
    if (!db) throw new Error("Firestore not available");
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
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

    const pettyCashQuery = firestoreQuery(
        collection(db, PETTY_CASH_COLLECTION),
        where("locationId", "==", locationId),
        where("timestamp", ">=", start.toISOString()),
        where("timestamp", "<=", end.toISOString())
    );
    
    const wastageQuery = firestoreQuery(
        collection(db, WASTAGE_EVENTS_COLLECTION),
        where("locationId", "==", locationId),
        where("timestamp", ">=", start.toISOString()),
        where("timestamp", "<=", end.toISOString())
    );

    const [salesSnapshot, topUpsSnapshot, pettyCashSnapshot, wastageSnapshot] = await Promise.all([
        getDocs(salesQuery),
        getDocs(topUpsQuery),
        getDocs(pettyCashQuery),
        getDocs(wastageQuery),
    ]);

    const cashSales = salesSnapshot.docs.map(doc => doc.data() as Sale);
    const cashTopUps = topUpsSnapshot.docs.map(doc => doc.data() as CardTransaction);
    const pettyCashTransactions = pettyCashSnapshot.docs.map(doc => doc.data() as PettyCashTransaction);
    const wastageEvents = wastageSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WastageEvent));
    
    return { cashSales, cashTopUps, pettyCashTransactions, wastageEvents };
};

export default function CashReconciliationPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { selectedLocationId } = useLocation();
    
    const [reconciliationDate, setReconciliationDate] = useState<Date | undefined>(new Date());
    const [countedCash, setCountedCash] = useState<string>('');
    const [isWastageFormOpen, setIsWastageFormOpen] = useState(false);
    
    const { data: locations = [], isLoading: isLoadingLocations } = useQuery<Location[], Error>({
        queryKey: [LOCATIONS_COLLECTION],
        queryFn: fetchLocations,
        enabled: !!db,
    });
    
    const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[], Error>({
        queryKey: [PRODUCTS_COLLECTION],
        queryFn: fetchProducts,
        enabled: !!db,
    });

    const { data: transactions, isLoading: isLoadingTransactions, refetch } = useQuery({
        queryKey: ['transactionsForDate', selectedLocationId, reconciliationDate],
        queryFn: () => fetchTransactionsForDate(selectedLocationId!, reconciliationDate!),
        enabled: !!selectedLocationId && !!reconciliationDate && !!db,
    });
    
    useEffect(() => {
        if(selectedLocationId && reconciliationDate) {
            refetch();
        }
    }, [selectedLocationId, reconciliationDate, refetch]);
    
    const totalCashSales = useMemo(() => transactions?.cashSales.reduce((sum, sale) => sum + sale.total, 0) || 0, [transactions]);
    const totalCashTopUps = useMemo(() => transactions?.cashTopUps.reduce((sum, topUp) => sum + topUp.amount, 0) || 0, [transactions]);
    const totalPettyCashIn = useMemo(() => transactions?.pettyCashTransactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.amount, 0) || 0, [transactions]);
    const totalPettyCashOut = useMemo(() => transactions?.pettyCashTransactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0) || 0, [transactions]);
    const totalWastageCost = useMemo(() => transactions?.wastageEvents.reduce((sum, event) => sum + event.totalCost, 0) || 0, [transactions]);

    const expectedCash = (totalCashSales + totalCashTopUps + totalPettyCashIn) - totalPettyCashOut;
    const variance = useMemo(() => {
        if (countedCash === '') return NaN;
        return parseFloat(countedCash) - expectedCash;
    }, [countedCash, expectedCash]);
    
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
            totalPettyCashIn: totalPettyCashIn,
            totalPettyCashOut: totalPettyCashOut,
            totalWastageCost: totalWastageCost,
            createdAt: new Date().toISOString(),
        };
        reconciliationMutation.mutate(reconciliationData);
    };
    
    const wastageMutation = useMutation<void, Error, { event: Omit<WastageEvent, 'id'>; product: Product }>({
        mutationFn: async ({ event, product }) => {
            if (!db) throw new Error("Firestore not available");
            const batch = writeBatch(db);

            // Add wastage event
            const newWastageRef = doc(collection(db, WASTAGE_EVENTS_COLLECTION));
            batch.set(newWastageRef, event);

            // Update product stock
            const productRef = doc(db, PRODUCTS_COLLECTION, event.productId);
            const currentStock = product.stockByLocation[event.locationId] || 0;
            const newStock = Math.max(0, currentStock - event.quantity);
            batch.update(productRef, { [`stockByLocation.${event.locationId}`]: newStock });

            await batch.commit();
        },
        onSuccess: () => {
            toast({ title: "Wastage Recorded", description: "Wastage has been logged and stock updated." });
            queryClient.invalidateQueries({ queryKey: ['transactionsForDate', selectedLocationId, reconciliationDate] });
            queryClient.invalidateQueries({ queryKey: [PRODUCTS_COLLECTION] });
            setIsWastageFormOpen(false);
        },
        onError: (error) => {
            toast({ title: "Error Recording Wastage", description: error.message, variant: "destructive" });
        }
    });

    if (isLoadingLocations || isLoadingProducts) {
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Loading...</p>
          </div>
        );
    }
    
    return (
        <div className="space-y-8">
             <WastageFormDialog
                isOpen={isWastageFormOpen}
                onOpenChange={setIsWastageFormOpen}
                products={products.filter(p => (p.stockByLocation[selectedLocationId || ''] || 0) > 0)}
                locationId={selectedLocationId}
                onSave={(event, product) => wastageMutation.mutate({ event, product })}
                isSaving={wastageMutation.isPending}
            />
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

            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${!selectedLocationId ? 'opacity-50 pointer-events-none' : ''}`}>
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Reconciliation for {selectedLocationName}</CardTitle>
                        <div className="w-full pt-2">
                             <DatePicker date={reconciliationDate} setDate={setReconciliationDate} />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 p-4 border rounded-md bg-muted/30">
                            <h3 className="font-semibold">Cash Summary</h3>
                            <div className="flex justify-between"><span>Total from Sales:</span> <span>{formatCurrency(totalCashSales)}</span></div>
                            <div className="flex justify-between"><span>Total from Top-Ups:</span> <span>{formatCurrency(totalCashTopUps)}</span></div>
                            <div className="flex justify-between text-green-600"><span>Petty Cash In:</span> <span>{formatCurrency(totalPettyCashIn)}</span></div>
                            <div className="flex justify-between text-red-600"><span>Petty Cash Out:</span> <span>- {formatCurrency(totalPettyCashOut)}</span></div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>Expected in Drawer:</span> <span>{formatCurrency(expectedCash)}</span></div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="countedCash">Counted Cash Amount</Label>
                            <Input id="countedCash" type="number" placeholder="Enter total cash counted" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} />
                        </div>
                        
                        {countedCash !== '' && !isNaN(variance) && (
                            <div className={`p-4 rounded-md ${variance === 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                <h3 className="font-semibold flex items-center">
                                    {variance >= 0 ? <TrendingUp className="mr-2 h-5 w-5 text-green-600"/> : <TrendingDown className="mr-2 h-5 w-5 text-red-600"/>}
                                    Variance
                                </h3>
                                <p className={`text-2xl font-bold ${variance === 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                    {formatCurrency(variance)}
                                </p>
                                <p className="text-sm text-muted-foreground">{variance > 0 ? "Over" : variance < 0 ? "Short" : "Balanced"}</p>
                            </div>
                        )}
                        
                        <div className="p-4 border rounded-md bg-muted/30">
                           <h3 className="font-semibold">Non-Cash Summary</h3>
                            <div className="flex justify-between text-red-600">
                                <span>Wastage/Spoilage Cost:</span>
                                <span>- {formatCurrency(totalWastageCost)}</span>
                            </div>
                        </div>

                        <Button onClick={handleSaveReconciliation} disabled={reconciliationMutation.isPending || !selectedLocationId || countedCash === ''}>
                            {reconciliationMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                            Save Reconciliation
                        </Button>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Transaction Details for {reconciliationDate ? format(reconciliationDate, 'MMM dd, yyyy') : 'the selected date'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingTransactions ? (
                             <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                        <ScrollArea className="h-[400px] border rounded-md">
                            <Table>
                                <TableCaption>
                                    {!transactions || (transactions.cashSales.length === 0 && transactions.cashTopUps.length === 0 && transactions.pettyCashTransactions.length === 0) ? "No cash transactions found." : "End of list."}
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
                                            <TableCell className="text-right text-green-600">{formatCurrency(sale.total)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {transactions?.cashTopUps.map(topUp => (
                                        <TableRow key={`topup-${topUp.id}`}>
                                            <TableCell>{format(new Date(topUp.timestamp), 'HH:mm')}</TableCell>
                                            <TableCell>Top-Up</TableCell>
                                            <TableCell>Card: {topUp.cardId}</TableCell>
                                            <TableCell className="text-right text-green-600">{formatCurrency(topUp.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {transactions?.pettyCashTransactions.map(tx => (
                                        <TableRow key={`petty-${tx.id}`}>
                                            <TableCell>{format(new Date(tx.timestamp), 'HH:mm')}</TableCell>
                                            <TableCell>Petty Cash</TableCell>
                                            <TableCell>{tx.reason}</TableCell>
                                            <TableCell className={`text-right ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'in' ? formatCurrency(tx.amount) : `- ${formatCurrency(tx.amount)}`}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        )}
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    Wastage & Spoilage
                                    <Button size="sm" variant="outline" onClick={() => setIsWastageFormOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Log Wastage
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                             <CardContent>
                                <ScrollArea className="h-48 border rounded-md">
                                    <Table>
                                    <TableCaption>{!transactions?.wastageEvents.length ? "No wastage recorded for this day." : "End of list."}</TableCaption>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead>Qty</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead className="text-right">Cost</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions?.wastageEvents.map(event => (
                                                <TableRow key={event.id}>
                                                    <TableCell>{event.productName}</TableCell>
                                                    <TableCell>{event.quantity}</TableCell>
                                                    <TableCell>{event.reason}</TableCell>
                                                    <TableCell className="text-right text-red-600">- {formatCurrency(event.totalCost)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
