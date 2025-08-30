
// src/components/CustomerForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

interface CustomerFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (customer: Customer) => void;
  customerToEdit?: Customer | null;
}

const defaultCustomer: Omit<Customer, 'id'> = {
  name: '',
  email: '',
  phone: '',
  address: '',
  parentName: '',
  parentEmail: '',
  allergies: '',
  dietaryConstraints: '',
};

export function CustomerForm({ isOpen, onOpenChange, onSave, customerToEdit }: CustomerFormProps) {
  const [customer, setCustomer] = useState<Omit<Customer, 'id'>>(defaultCustomer);
  const { toast } = useToast();

  useEffect(() => {
    if (customerToEdit) {
      setCustomer(customerToEdit);
    } else {
      setCustomer(defaultCustomer);
    }
  }, [customerToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name.trim()) {
      toast({
        title: 'Invalid Input',
        description: 'Customer name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    // Basic email validation
    if (customer.email && !/\S+@\S+\.\S+/.test(customer.email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    if (customer.parentEmail && !/\S+@\S+\.\S+/.test(customer.parentEmail)) {
        toast({
          title: 'Invalid Parent Email',
          description: 'Please enter a valid email address for the parent.',
        });
        return;
      }

    const finalCustomer: Customer = {
      ...customer,
      id: customerToEdit?.id || crypto.randomUUID(),
    };
    onSave(finalCustomer);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{customerToEdit ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          <DialogDescription>
            {customerToEdit ? 'Update the details of this customer.' : 'Fill in the details to add a new customer.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[70vh] p-1 pr-6">
            <div className="space-y-4 py-4 pr-1">
              <h3 className="text-md font-medium text-muted-foreground">Customer Details</h3>
              <div>
                <Label htmlFor="name">Full Name*</Label>
                <Input id="name" name="name" value={customer.name} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" value={customer.email || ''} onChange={handleChange} placeholder="e.g., user@example.com" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" value={customer.phone || ''} onChange={handleChange} placeholder="e.g., (555) 123-4567" />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={customer.address || ''}
                  onChange={handleChange}
                  placeholder="Street, City, State, Postal Code"
                  rows={3}
                />
              </div>

              <Separator className="my-4" />
              <h3 className="text-md font-medium text-muted-foreground">Parent/Guardian Details (Optional)</h3>
              
              <div>
                <Label htmlFor="parentName">Parent's Full Name</Label>
                <Input id="parentName" name="parentName" value={customer.parentName || ''} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="parentEmail">Parent's Email Address</Label>
                <Input id="parentEmail" name="parentEmail" type="email" value={customer.parentEmail || ''} onChange={handleChange} placeholder="e.g., parent@example.com" />
              </div>

              <Separator className="my-4" />
              <h3 className="text-md font-medium text-muted-foreground">Health Information (Optional)</h3>
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea id="allergies" name="allergies" value={customer.allergies || ''} onChange={handleChange} placeholder="e.g., Peanuts, Dairy" />
              </div>
              <div>
                <Label htmlFor="dietaryConstraints">Dietary Constraints</Label>
                <Textarea id="dietaryConstraints" name="dietaryConstraints" value={customer.dietaryConstraints || ''} onChange={handleChange} placeholder="e.g., Gluten-free, Vegan" />
              </div>

            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 mt-2 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{customerToEdit ? 'Save Changes' : 'Add Customer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
