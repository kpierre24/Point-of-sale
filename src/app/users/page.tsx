// src/app/users/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User as AppUser } from '@/types'; 
import { Button } from '@/components/ui/button';
import { UserForm } from '@/components/UserForm';
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
import { UserCog, Edit, Trash2, ToggleLeft, ToggleRight, KeyRound, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
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

const STAFF_USERS_STORAGE_KEY = 'staffUsers';

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  const fetchUsers = useCallback(() => {
    const storedUsers = localStorage.getItem(STAFF_USERS_STORAGE_KEY);
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch (error) {
        console.error("Error fetching users from localStorage:", error);
        toast({ title: 'Error', description: 'Could not fetch user data.', variant: 'destructive' });
        setUsers([]);
      }
    } else {
      setUsers([]); // No users stored yet
    }
  }, [toast]);

  useEffect(() => {
    setIsMounted(true);
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(STAFF_USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users, isMounted]);

  const handleSaveUser = async (userFormData: AppUser) => {
    const userToSave: AppUser = {
        ...userFormData,
        id: userToEdit?.id || crypto.randomUUID(), // Use existing ID if editing, else new UUID
        pin: userFormData.pin || Math.floor(100000 + Math.random() * 900000).toString(),
    };

    setUsers(prevUsers => {
        const existingIndex = prevUsers.findIndex(u => u.id === userToSave.id);
        if (existingIndex > -1) {
            const updatedUsers = [...prevUsers];
            updatedUsers[existingIndex] = userToSave;
            toast({ title: 'User Updated', description: `${userToSave.name} has been updated.` });
            return updatedUsers;
        } else {
            toast({ title: 'User Added', description: `${userToSave.name} has been added.` });
            return [userToSave, ...prevUsers];
        }
    });
    
    setUserToEdit(null);
    setIsFormOpen(false);
  };

  const handleAddNewUser = () => {
    setUserToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: AppUser) => {
    setUserToEdit(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    toast({ title: 'User Deleted', description: `${userToDelete.name}'s data has been removed.`, variant: 'destructive' });
  };

  const handleToggleActive = async (userId: string) => {
    const userToToggle = users.find(u => u.id === userId);
    if (!userToToggle) return;

    const updatedUser = { ...userToToggle, isActive: !userToToggle.isActive };
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? updatedUser : u));
    toast({ title: `User ${updatedUser.isActive ? 'Activated' : 'Deactivated'}`, description: `${updatedUser.name}'s status has been updated.` });
  };
  
  const handleChangePin = async (userId: string) => {
    const newPin = prompt("Enter new 6-digit PIN for the user (leave blank to cancel):");
    if (newPin === null) return; 
    if (!/^\d{6}$/.test(newPin) && newPin !== "") {
        toast({ title: 'Invalid PIN', description: 'PIN must be 6 digits.', variant: 'destructive' });
        return;
    }
    if (newPin === "") { 
        toast({ title: 'PIN Change Cancelled', description: 'No changes made to user PIN.' });
        return;
    }

    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    const updatedUser = { ...userToUpdate, pin: newPin };
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? updatedUser : u));
    toast({ title: 'PIN Updated', description: `User's PIN has been changed successfully.` });
  };


  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Staff Management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground text-md">
            Add, view, and manage staff accounts and roles.
          </p>
        </div>
        <Button onClick={handleAddNewUser}>
          <UserCog className="mr-2 h-4 w-4" />
          Add Staff User
        </Button>
      </header>
      
      <UserForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleSaveUser}
            userToEdit={userToEdit}
      />

      <Card>
        <CardHeader>
          <CardTitle>Staff List</CardTitle>
          <CardDescription>
            {users.length > 0 ? `Displaying ${users.length} staff member(s).` : 'No staff members found.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] rounded-md border shadow-inner">
            <Table>
              {users.length === 0 && <TableCaption>No staff users available.</TableCaption>}
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>PIN</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                    <TableCell>{ user.pin ? '****'+ user.pin.slice(-2) : 'Not Set'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.isActive ? 'secondary' : 'outline'} className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center space-x-1">
                        <Button variant="outline" size="icon" onClick={() => handleEditUser(user)} title="Edit User">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit User</span>
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleToggleActive(user.id)}
                            title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                          <span className="sr-only">{user.isActive ? 'Deactivate' : 'Activate'} User</span>
                        </Button>
                         <Button variant="outline" size="icon" onClick={() => handleChangePin(user.id)} title="Change PIN">
                            <KeyRound className="h-4 w-4" />
                            <span className="sr-only">Change PIN</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" title="Delete User">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete User</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user "{user.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                Delete User
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
            <CardTitle>User Management Notes</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
            User data is now stored in your browser's local storage. Roles (Admin, Manager, Cashier, Staff) are informational and do not restrict access to features in this version.
            </p>
             <p className="text-muted-foreground mt-2">
            PINs are stored locally. There is no central authentication server.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
