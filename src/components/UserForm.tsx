// src/components/UserForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { User, UserRole } from '@/types';
import { USER_ROLES } from '@/types';
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

interface UserFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (user: User, password?: string) => void;
  userToEdit?: User | null;
  isEditingCurrentUser?: boolean;
  currentUserRole?: UserRole;
}

const defaultUser: Omit<User, 'id' | 'password'> = {
  name: '',
  email: '',
  role: 'Staff',
  isActive: true,
};

export function UserForm({ isOpen, onOpenChange, onSave, userToEdit, isEditingCurrentUser = false, currentUserRole }: UserFormProps) {
  const [user, setUser] = useState<Omit<User, 'id' | 'password'>>(defaultUser);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (userToEdit) {
      const { password: _p, ...editableUser } = userToEdit; // Don't populate password field from existing
      setUser(editableUser);
    } else {
      setUser(defaultUser);
    }
    setPassword('');
    setConfirmPassword('');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.name.trim() || !user.email.trim()) {
      toast({ title: 'Invalid Input', description: 'Name and email cannot be empty.', variant: 'destructive' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(user.email)) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    if (!userToEdit) { // New user
      if (!password) {
        toast({ title: 'Password Required', description: 'Password is required for new users.', variant: 'destructive' });
        return;
      }
      if (password !== confirmPassword) {
        toast({ title: 'Password Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
        return;
      }
    } else { // Editing user
      if (password && password !== confirmPassword) {
        toast({ title: 'Password Mismatch', description: 'Passwords do not match if changing.', variant: 'destructive' });
        return;
      }
    }
    
    // Prevent admin from deactivating themselves if they are editing their own profile
    if (isEditingCurrentUser && user.role === 'Admin' && !user.isActive) {
        toast({ title: 'Action Not Allowed', description: 'An Admin cannot deactivate their own account.', variant: 'destructive'});
        return;
    }
    // Prevent admin from demoting themselves if they are editing their own profile
    if (isEditingCurrentUser && user.role !== 'Admin' && currentUserRole === 'Admin') {
         toast({ title: 'Action Not Allowed', description: 'An Admin cannot change their own role from Admin.', variant: 'destructive'});
        return;
    }


    const finalUser: User = {
      ...user,
      id: userToEdit?.id || crypto.randomUUID(),
    };

    onSave(finalUser, password || undefined); // Pass password only if set
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{userToEdit ? 'Edit Staff User' : 'Add New Staff User'}</DialogTitle>
          <DialogDescription>
            {userToEdit ? 'Update the details of this staff member.' : 'Fill in the details to add a new staff member.'}
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
                  disabled={isEditingCurrentUser && user.role === 'Admin'}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map(roleName => (
                      <SelectItem key={roleName} value={roleName}>{roleName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditingCurrentUser && user.role === 'Admin' && (
                    <p className="text-xs text-muted-foreground mt-1">Admins cannot change their own role.</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">{userToEdit ? 'New Password (leave blank to keep current)' : 'Password*'}</Label>
                <Input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="confirmPassword">{userToEdit ? 'Confirm New Password' : 'Confirm Password*'}</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                    id="isActive" 
                    checked={user.isActive} 
                    onCheckedChange={handleActiveChange} 
                    disabled={isEditingCurrentUser && user.role === 'Admin'}
                />
                <Label htmlFor="isActive">User Active</Label>
              </div>
              {isEditingCurrentUser && user.role === 'Admin' && !user.isActive && (
                <p className="text-xs text-destructive mt-1">Admins cannot deactivate their own account.</p>
              )}
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