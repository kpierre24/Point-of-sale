// src/components/UserForm.tsx
"use client";

import { useState, useEffect } from 'react';
import type { User as AppUser, UserRole } from '@/types'; // Renamed
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
import { KeyRound } from 'lucide-react';

interface UserFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (user: AppUser, password?: string) => void; // Password only for new user creation
  userToEdit?: AppUser | null;
  isEditingCurrentUser?: boolean;
  currentUserRole?: UserRole;
}

// Default excluding id and pin, as pin is auto-generated or handled separately
const defaultUserBase: Omit<AppUser, 'id' | 'pin' > = {
  name: '',
  email: '',
  role: 'Staff', // Sensible default
  isActive: true,
};

export function UserForm({ isOpen, onOpenChange, onSave, userToEdit, isEditingCurrentUser = false, currentUserRole }: UserFormProps) {
  const [user, setUser] = useState<Omit<AppUser, 'id'>>(defaultUserBase);
  const [pin, setPin] = useState(''); // For displaying/editing PIN
  const [password, setPassword] = useState(''); // Only for new user creation
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (userToEdit) {
      setUser({
          name: userToEdit.name,
          email: userToEdit.email,
          role: userToEdit.role,
          isActive: userToEdit.isActive,
          // Pin is handled separately for display
      });
      setPin(userToEdit.pin || ''); // Show existing PIN or empty if none
    } else {
      setUser(defaultUserBase);
      setPin(''); // Clear PIN for new user form (will be auto-generated or set later)
    }
    setPassword(''); // Always clear password fields on form open/change
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

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPin = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    setPin(newPin);
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
      if (password.length < 6) {
        toast({ title: 'Weak Password', description: 'Password must be at least 6 characters.', variant: 'destructive' });
        return;
      }
    } else { // Editing user
      if (password && password !== confirmPassword) { // If password is being changed
        toast({ title: 'Password Mismatch', description: 'New passwords do not match.', variant: 'destructive' });
        return;
      }
      if (password && password.length < 6) {
        toast({ title: 'Weak Password', description: 'New password must be at least 6 characters.', variant: 'destructive' });
        return;
      }
    }
    
    if (isEditingCurrentUser && user.role === 'Admin' && !user.isActive) {
        toast({ title: 'Action Not Allowed', description: 'An Admin cannot deactivate their own account.', variant: 'destructive'});
        return;
    }
    if (isEditingCurrentUser && user.role !== 'Admin' && currentUserRole === 'Admin') {
         toast({ title: 'Action Not Allowed', description: 'An Admin cannot change their own role from Admin.', variant: 'destructive'});
        return;
    }
    
    if (pin && !/^\d{6}$/.test(pin)) {
      toast({ title: 'Invalid PIN', description: 'PIN must be 6 digits if set.', variant: 'destructive' });
      return;
    }

    const finalUserData: AppUser = {
      ...user,
      id: userToEdit?.id || crypto.randomUUID(), // This ID will be Firebase UID on creation
      pin: pin || undefined, // Set PIN or leave undefined if empty
    };

    onSave(finalUserData, password || undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{userToEdit ? 'Edit Staff User' : 'Add New Staff User'}</DialogTitle>
          <DialogDescription>
            {userToEdit ? 'Update the details of this staff member.' : 'Fill in the details to add a new staff member. Password and PIN will be set.'}
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
                <Input id="email" name="email" type="email" value={user.email} onChange={handleChange} required disabled={!!userToEdit} />
                 {!!userToEdit && <p className="text-xs text-muted-foreground mt-1">Email cannot be changed after creation.</p>}
              </div>
              <div>
                <Label htmlFor="role">Role*</Label>
                <Select 
                  value={user.role} 
                  onValueChange={handleRoleChange}
                  disabled={(isEditingCurrentUser && user.role === 'Admin') || currentUserRole !== 'Admin'}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map(roleName => (
                      <SelectItem key={roleName} value={roleName} disabled={currentUserRole !== 'Admin' && roleName === 'Admin' && user.role !== 'Admin'}>
                        {roleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(isEditingCurrentUser && user.role === 'Admin') && (
                    <p className="text-xs text-muted-foreground mt-1">Admins cannot change their own role.</p>
                )}
                 {currentUserRole !== 'Admin' && (
                    <p className="text-xs text-muted-foreground mt-1">Only Admins can change roles.</p>
                )}
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
                    placeholder={userToEdit ? "Leave blank to keep current" : "Auto-generated if blank"}
                    disabled={currentUserRole !== 'Admin' && currentUserRole !== 'Manager' && !isEditingCurrentUser}
                />
                 {(currentUserRole !== 'Admin' && currentUserRole !== 'Manager' && !isEditingCurrentUser) && (
                    <p className="text-xs text-muted-foreground mt-1">Only Admins/Managers can set PINs for others.</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">{userToEdit ? 'New Password (leave blank to keep current)' : 'Password*'}</Label>
                <Input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} 
                 placeholder={userToEdit ? "Enter new password" : "Min. 6 characters"}
                />
              </div>
              {(password || !userToEdit) && ( // Show confirm password only if password is being set/changed
                <div>
                    <Label htmlFor="confirmPassword">{userToEdit && password ? 'Confirm New Password' : 'Confirm Password*'}</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              )}
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                    id="isActive" 
                    checked={user.isActive} 
                    onCheckedChange={handleActiveChange} 
                    disabled={(isEditingCurrentUser && user.role === 'Admin') || currentUserRole !== 'Admin'}
                />
                <Label htmlFor="isActive">User Active</Label>
              </div>
              {(isEditingCurrentUser && user.role === 'Admin' && !user.isActive) && (
                <p className="text-xs text-destructive mt-1">Admins cannot deactivate their own account.</p>
              )}
              {currentUserRole !== 'Admin' && (
                 <p className="text-xs text-muted-foreground mt-1">Only Admins can change active status.</p>
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
