// src/app/customers/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Customer, TopUpCard } from '@/types'; // Added TopUpCard
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
import { UserPlus, Edit, Trash2, Search, ShoppingBag, CreditCard } from 'lucide-react'; // Added CreditCard
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

const CUSTOMERS_STORAGE_KEY = 'customers';
const TOPUP_CARDS_STORAGE_KEY = 'topUpCardsData';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [topUpCards, setTopUpCards] = useState<TopUpCard[]>([]); // Added state for top-up cards
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    const storedCustomers = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (storedCustomers) {
      try {
        setCustomers(JSON.parse(storedCustomers));
      } catch (e) {
        console.error("Failed to parse customers from localStorage", e);
        setCustomers([]);
      }
    }
    const storedTopUpCards = localStorage.getItem(TOPUP_CARDS_STORAGE_KEY);
    if (storedTopUpCards) {
      try {
        setTopUpCards(JSON.parse(storedTopUpCards));
      } catch (e) {
        console.error("Failed to parse top-up cards from localStorage", e);
        setTopUpCards([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
    }
  }, [customers, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(TOPUP_CARDS_STORAGE_KEY, JSON.stringify(topUpCards));
    }
  }, [topUpCards, isMounted]);

  const generateNewCardId = (): string => {
    let newId = '';
    let attempts = 0;
    const existingCardIds = topUpCards.map(c => c.cardId.toUpperCase());
    do {
      newId = `CARD-${Date.now().toString().slice(-4)}${Math.random().toString().slice(2, 6)}`;
      attempts++;
    } while (existingCardIds.includes(newId.toUpperCase()) && attempts < 10);
    if (attempts >= 10) return `CARD-ERR${crypto.randomUUID().slice(0,4)}`; // fallback
    return newId.toUpperCase();
  };

  const handleSaveCustomer = (customer: Customer) => {
    let isNewCustomer = false;
    setCustomers((prevCustomers) => {
      const existingIndex = prevCustomers.findIndex((c) => c.id === customer.id);
      if (existingIndex > -1) {
        const updatedCustomers = [...prevCustomers];
        updatedCustomers[existingIndex] = customer;
        setTimeout(() => {
          toast({ title: 'Customer Updated', description: `${customer.name} has been updated.` });
        }, 0);
        return updatedCustomers;
      } else {
        isNewCustomer = true;
        setTimeout(() => {
          toast({ title: 'Customer Added', description: `${customer.name} has been added to your database.` });
        }, 0);
        return [customer, ...prevCustomers];
      }
    });

    if (isNewCustomer) {
      const newCardId = generateNewCardId();
      const now = new Date().toISOString();
      const newTopUpCard: TopUpCard = {
        id: crypto.randomUUID(),
        cardId: newCardId,
        customerId: customer.id,
        currentBalance: 0,
        qrCodeValue: newCardId,
        createdAt: now,
        lastUpdatedAt: now,
      };
      setTopUpCards(prevCards => [newTopUpCard, ...prevCards]);
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
      }, 0);
    }
    setCustomerToEdit(null);
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
    // Consider what to do with linked top-up cards upon customer deletion (e.g., deactivate, orphan, or delete)
    // For now, cards are not deleted with customers.
    setCustomers((prevCustomers) => prevCustomers.filter((c) => c.id !== customerId));
    setTimeout(() => {
      toast({ title: 'Customer Deleted', description: `${customerName} has been removed from your database.`, variant: 'destructive' });
    }, 0);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground text-md">
            View, add, and manage your customer database. New customers automatically get a Top-Up Card.
          </p>
        </div>
        <Button onClick={handleAddNewCustomer}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-center w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email || 'N/A'}</TableCell>
                    <TableCell>{customer.phone || 'N/A'}</TableCell>
                    <TableCell className="whitespace-pre-wrap max-w-xs truncate" title={customer.address}>{customer.address || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditCustomer(customer)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Customer</span>
                        </Button>
                        <Button variant="outline" size="icon" disabled> {/* Placeholder for purchase history */}
                          <ShoppingBag className="h-4 w-4" />
                          <span className="sr-only">View Purchase History</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
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
