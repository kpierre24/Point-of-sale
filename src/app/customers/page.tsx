// src/app/customers/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Customer } from '@/types';
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
import { UserPlus, Edit, Trash2, Search, ShoppingBag } from 'lucide-react';
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    const storedCustomers = localStorage.getItem('customers');
    if (storedCustomers) {
      try {
        setCustomers(JSON.parse(storedCustomers));
      } catch (e) {
        console.error("Failed to parse customers from localStorage", e);
        setCustomers([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('customers', JSON.stringify(customers));
    }
  }, [customers, isMounted]);

  const handleSaveCustomer = (customer: Customer) => {
    setCustomers((prevCustomers) => {
      const existingIndex = prevCustomers.findIndex((c) => c.id === customer.id);
      if (existingIndex > -1) {
        const updatedCustomers = [...prevCustomers];
        updatedCustomers[existingIndex] = customer;
        toast({ title: 'Customer Updated', description: `${customer.name} has been updated.` });
        return updatedCustomers;
      } else {
        toast({ title: 'Customer Added', description: `${customer.name} has been added to your database.` });
        return [customer, ...prevCustomers];
      }
    });
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
    setCustomers((prevCustomers) => prevCustomers.filter((c) => c.id !== customerId));
    toast({ title: 'Customer Deleted', description: `${customerName} has been removed from your database.`, variant: 'destructive' });
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
            View, add, and manage your customer database.
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
        </CardContent>
       </Card>
    </div>
  );
}
