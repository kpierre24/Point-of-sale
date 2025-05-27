// src/components/UserForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { User as AppUser, UserRole } from '@/types'; 
import { USER_ROLES } from '@/types'; // Ensure USER_ROLES is imported from types
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { KeyRound } from 'lucide-react';

interface UserFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (user: AppUser) => void; 
  userToEdit?: AppUser | null;
}

const defaultUserBase: Omit<AppUser, 'id' | 'pin' > = {
  name: '',
  email: '',
  role: USER_ROLES[0], // Default to the first role in the list
  isActive: true,
};

export function UserForm({ isOpen, onOpenChange, onSave, userToEdit }: UserFormProps) {
  const [user, setUser] = useState<Omit<AppUser, 'id'>>(defaultUserBase);
  const [pin, setPin] = useState(''); 
  const { toast } = useToast();

  useEffect(() => {
    if (userToEdit) {
      setUser({
          name: userToEdit.name,
          email: userToEdit.email,
          role: userToEdit.role,
          isActive: userToEdit.isActive,
      });
      setPin(userToEdit.pin || ''); 
    } else {
      setUser(defaultUserBase);
      setPin(''); 
    }
  }, [userToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: UserRole) => {
    setUser((prev) => ({ ...prev, role: value }));
  };

  const handleActiveChange = (checked: boolean) => {
    setUser((prev) => ({ ...prev, isActive: checked }));
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPin = e.target.value.replace(/\D/g, '').slice(0, 6); 
    setPin(newPin);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.name.trim() || !user.email.trim()) {
      setTimeout(() => {
        toast({ title: 'Invalid Input', description: 'Name and email cannot be empty.', variant: 'destructive' });
      }, 0);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(user.email)) {
      setTimeout(() => {
        toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      }, 0);
      return;
    }
    
    if (pin && !/^\d{6}$/.test(pin)) {
      setTimeout(() => {
        toast({ title: 'Invalid PIN', description: 'PIN must be 6 digits if set.', variant: 'destructive' });
      }, 0);
      return;
    }

    const finalUserData: AppUser = {
      ...user,
      id: userToEdit?.id || crypto.randomUUID(),
      pin: pin || undefined, 
    };

    onSave(finalUserData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{userToEdit ? 'Edit Staff User' : 'Add New Staff User'}</DialogTitle>
          <DialogDescription>
            {userToEdit ? 'Update the details of this staff member.' : 'Fill in the details to add a new staff member. PIN will be set or auto-generated if left blank.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[70vh] p-1 pr-6">
            <div className="space-y-4 py-4 pr-1">
              <div>
                <Label htmlFor="name">Full Name*</Label>
                <Input id="name" name="name" value={user.name} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="email">Email Address*</Label>
                <Input id="email" name="email" type="email" value={user.email} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="role">Role*</Label>
                <Select 
                  value={user.role} 
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map(roleName => (
                      <SelectItem key={roleName} value={roleName}>
                        {roleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">
                  <KeyRound className="inline-block mr-1 h-4 w-4" />
                  User PIN (6 digits)
                </Label>
                <Input 
                    id="pin" 
                    name="pin" 
                    type="text" 
                    value={pin} 
                    onChange={handlePinChange} 
                    maxLength={6} 
                    placeholder={userToEdit && userToEdit.pin ? "Leave blank to keep current" : "Auto-generated if blank"}
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                    id="isActive" 
                    checked={user.isActive} 
                    onCheckedChange={handleActiveChange} 
                />
                <Label htmlFor="isActive">User Active</Label>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 mt-2 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{userToEdit ? 'Save Changes' : 'Add User'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
