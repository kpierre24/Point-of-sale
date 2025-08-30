
// src/app/customers/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Customer, TopUpCard } from '@/types';
import { Button } from '@/components/ui/button';
import { CustomerForm } from '@/components/CustomerForm';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, Edit, Trash2, Search, ShoppingBag, CreditCard, Download, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, query as firestoreQuery, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const CUSTOMERS_COLLECTION = 'customers';
const TOPUP_CARDS_COLLECTION = 'topUpCards';

const escapeCsvField = (field: any): string => {
  if (field === null || field === undefined) {
    return '';
  }
  const stringField = String(field);
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

// Fetcher functions
const fetchCustomers = async (): Promise<Customer[]> => {
  if (!db) throw new Error("Firestore not available");
  const customersCol = collection(db, CUSTOMERS_COLLECTION);
  const q = firestoreQuery(customersCol, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
};

const fetchTopUpCards = async (): Promise<TopUpCard[]> => {
    if (!db) throw new Error("Firestore not available");
    const cardsCol = collection(db, TOPUP_CARDS_COLLECTION);
    const snapshot = await getDocs(cardsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TopUpCard));
};


export default function CustomersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading: isLoadingCustomers, isError: isCustomersError, error: customersError } = useQuery<Customer[], Error>({
    queryKey: [CUSTOMERS_COLLECTION],
    queryFn: fetchCustomers,
    enabled: !!db,
  });
  
  const { data: topUpCards = [], isLoading: isLoadingTopUpCards, isError: isTopUpCardsError, error: topUpCardsError } = useQuery<TopUpCard[], Error>({
    queryKey: [TOPUP_CARDS_COLLECTION],
    queryFn: fetchTopUpCards,
    enabled: !!db,
  });

  useEffect(() => {
    if (isCustomersError) {
      toast({ title: 'Error Loading Customers', description: customersError?.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
    if (isTopUpCardsError) {
      toast({ title: 'Error Loading Top-Up Cards', description: topUpCardsError?.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
  }, [isCustomersError, customersError, isTopUpCardsError, topUpCardsError, toast]);


  const generateNewCardId = (): string => {
    let newId = '';
    let attempts = 0;
    const existingCardIds = topUpCards.map(c => c.cardId.toUpperCase());
    do {
      newId = `CARD-${Date.now().toString().slice(-4)}${Math.random().toString().slice(2, 6)}`;
      attempts++;
    } while (existingCardIds.includes(newId.toUpperCase()) && attempts < 10);
    if (attempts >= 10) return `CARD-ERR${crypto.randomUUID().slice(0,4)}`;
    return newId.toUpperCase();
  };

  const customerMutation = useMutation<void, Error, { customer: Customer; isNew: boolean }>({
    mutationFn: async ({ customer, isNew }) => {
      if (!db) throw new Error("Firestore not available");
      
      const customerToSave = { ...customer };
      Object.keys(customerToSave).forEach(keyStr => {
        const key = keyStr as keyof typeof customerToSave;
        if (customerToSave[key] === undefined) {
          delete customerToSave[key];
        }
      });

      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerToSave.id);
      await setDoc(customerRef, customerToSave, { merge: !isNew });

      if (isNew) {
        const newCardId = generateNewCardId();
        const now = new Date().toISOString();
        const newTopUpCard: Omit<TopUpCard, 'id'> = { // Firestore will generate ID for new card
          cardId: newCardId,
          customerId: customer.id,
          currentBalance: 0,
          qrCodeValue: newCardId,
          createdAt: now,
          lastUpdatedAt: now,
        };
        // Add new top-up card with an auto-generated ID
        await addDoc(collection(db, TOPUP_CARDS_COLLECTION), newTopUpCard);
        setTimeout(() => {
          toast({
            title: 'Top-Up Card Created',
            description: (
              <div className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Top-Up Card {newTopUpCard.cardId} created for {customer.name}.</span>
              </div>
            ),
          });
        }, 100); // Slight delay for separate toast
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_COLLECTION] });
      if (variables.isNew) {
          queryClient.invalidateQueries({ queryKey: [TOPUP_CARDS_COLLECTION] });
      }
      setTimeout(() => {
        toast({ title: variables.isNew ? 'Customer Added' : 'Customer Updated', description: `${variables.customer.name} has been saved.` });
      }, 0);
      setIsFormOpen(false);
      setCustomerToEdit(null);
    },
    onError: (error) => {
      toast({ title: 'Error Saving Customer', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    },
  });

  const deleteCustomerMutation = useMutation<void, Error, { customerId: string; customerName: string }>({
    mutationFn: async ({ customerId }) => {
      if (!db) throw new Error("Firestore not available");
      await deleteDoc(doc(db, CUSTOMERS_COLLECTION, customerId));
      // Note: Associated TopUpCard is not deleted here, only unlinked.
      // Further logic could be added to find and optionally delete/archive the card.
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_COLLECTION] });
      setTimeout(() => {
        toast({ title: 'Customer Deleted', description: `${variables.customerName} has been removed.`, variant: 'destructive' });
      }, 0);
    },
    onError: (error) => {
      toast({ title: 'Error Deleting Customer', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    },
  });


  const handleSaveCustomer = (customerData: Customer) => {
    const isNew = !customers.some(c => c.id === customerData.id);
    customerMutation.mutate({ customer: customerData, isNew });
  };

  const handleAddNewCustomer = () => {
    setCustomerToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const customerName = customers.find(c => c.id === customerId)?.name || "The customer";
    deleteCustomerMutation.mutate({ customerId, customerName });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  const handleExportCustomers = () => {
    if (customers.length === 0) {
      toast({ title: "No Data", description: "There are no customers to export.", variant: "destructive" });
      return;
    }
    const headers = ["ID", "Name", "Email", "Phone", "Address", "Parent Name", "Parent Email", "Allergies", "Dietary Constraints"];
    const csvRows = [
      headers.join(','),
      ...customers.map(customer => [
        escapeCsvField(customer.id), escapeCsvField(customer.name), escapeCsvField(customer.email),
        escapeCsvField(customer.phone), escapeCsvField(customer.address), escapeCsvField(customer.parentName),
        escapeCsvField(customer.parentEmail), escapeCsvField(customer.allergies), escapeCsvField(customer.dietaryConstraints)
      ].join(','))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Export Successful", description: "Customer data exported to CSV." });
  };
  
  if (!db) {
    return (
      <div className="space-y-8">
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Firebase Not Connected</CardTitle></CardHeader>
          <CardContent><p>Cannot load customer data. Please check Firebase configuration.</p></CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingCustomers || isLoadingTopUpCards) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading customer data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground text-md">
            View, add, and manage your customer database. New customers automatically get a Top-Up Card.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExportCustomers} variant="outline" disabled={customers.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export Customers
          </Button>
          <Button onClick={handleAddNewCustomer} disabled={customerMutation.isPending}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </header>

      <CustomerForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveCustomer}
        customerToEdit={customerToEdit}
      />

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            {filteredCustomers.length > 0 ? `Displaying ${filteredCustomers.length} of ${customers.length} customer(s).` : (customers.length > 0 && searchTerm ? 'No customers match your search.' : 'No customers found. Add a new customer to get started.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-1/2 lg:w-1/3"
              />
            </div>
          </div>
          <ScrollArea className="h-[500px] rounded-md border shadow-inner">
            <Table>
              {filteredCustomers.length === 0 && <TableCaption>{customers.length > 0 && searchTerm ? 'No customers match your search.' : 'No customers available.'}</TableCaption>}
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Parent/Guardian</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-center w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      {customer.email && <div>{customer.email}</div>}
                      {customer.phone && <div>{customer.phone}</div>}
                    </TableCell>
                    <TableCell>
                      {customer.parentName && <div>{customer.parentName}</div>}
                      {customer.parentEmail && <div className="text-sm text-muted-foreground">{customer.parentEmail}</div>}
                    </TableCell>
                    <TableCell>
                      {(customer.allergies || customer.dietaryConstraints) && (
                        <div className="flex items-start text-red-600" title={`Allergies: ${customer.allergies || 'N/A'}\nConstraints: ${customer.dietaryConstraints || 'N/A'}`}>
                          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            {customer.allergies && <p className="text-xs font-semibold">Allergies: {customer.allergies}</p>}
                            {customer.dietaryConstraints && <p className="text-xs font-semibold">Constraints: {customer.dietaryConstraints}</p>}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditCustomer(customer)} disabled={customerMutation.isPending || deleteCustomerMutation.isPending}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Customer</span>
                        </Button>
                        <Button variant="outline" size="icon" disabled> 
                          <ShoppingBag className="h-4 w-4" />
                          <span className="sr-only">View Purchase History</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" disabled={customerMutation.isPending || deleteCustomerMutation.isPending}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete Customer</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the customer "{customer.name}". 
                                Any associated Top-Up Card will remain but will be unlinked.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
       <Card className="mt-8">
        <CardHeader>
            <CardTitle>Purchase History & Advanced Features</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Viewing detailed customer purchase history and advanced filtering options are planned for future updates.</p>
            <p className="text-muted-foreground mt-2">Note: Deleting a customer does not automatically delete their Top-Up Card for data retention reasons, but it will be unlinked.</p>
        </CardContent>
       </Card>
    </div>
  );
}
