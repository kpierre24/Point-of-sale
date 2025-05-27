// src/app/users/page.tsx
"use client";

import { useState, useEffect } from 'react';
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
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query as firestoreQuery, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const USERS_COLLECTION = 'users';

// Fetcher function for React Query
const fetchUsers = async (): Promise<AppUser[]> => {
  if (!db) throw new Error("Firestore not available");
  const usersCol = collection(db, USERS_COLLECTION);
  const q = firestoreQuery(usersCol, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
};


export default function UsersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: isLoadingUsers, isError, error } = useQuery<AppUser[], Error>({
    queryKey: [USERS_COLLECTION],
    queryFn: fetchUsers,
    enabled: !!db,
  });

  useEffect(() => {
    if (isError) {
      toast({ title: 'Error Loading Users', description: error?.message, variant: 'destructive' });
    }
  }, [isError, error, toast]);

  const userMutation = useMutation<void, Error, { user: AppUser; isEditing: boolean }>({
    mutationFn: async ({ user, isEditing }) => {
      if (!db) throw new Error("Firestore not available");
      const userToSave: AppUser = {
        ...user,
        id: isEditing ? user.id : crypto.randomUUID(), // Use existing ID if editing, else new UUID
        pin: user.pin || Math.floor(100000 + Math.random() * 900000).toString(),
      };
      const userRef = doc(db, USERS_COLLECTION, userToSave.id);
      await setDoc(userRef, userToSave, { merge: isEditing });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [USERS_COLLECTION] });
      setTimeout(() => {
        toast({ title: variables.isEditing ? 'User Updated' : 'User Added', description: `${variables.user.name} has been saved.` });
      },0);
      setIsFormOpen(false);
      setUserToEdit(null);
    },
    onError: (error) => {
      toast({ title: 'Error Saving User', description: error.message, variant: 'destructive' });
    },
  });

  const deleteUserMutation = useMutation<void, Error, { userId: string; userName: string }>({
    mutationFn: async ({ userId }) => {
      if (!db) throw new Error("Firestore not available");
      await deleteDoc(doc(db, USERS_COLLECTION, userId));
    },
    onSuccess: (_,variables) => {
      queryClient.invalidateQueries({ queryKey: [USERS_COLLECTION] });
      setTimeout(() => {
        toast({ title: 'User Deleted', description: `${variables.userName}'s data has been removed.`, variant: 'destructive' });
      },0);
    },
    onError: (error) => {
      toast({ title: 'Error Deleting User', description: error.message, variant: 'destructive' });
    },
  });

  const updateUserStatusMutation = useMutation<void, Error, AppUser>({
      mutationFn: async (userToUpdate: AppUser) => {
          if (!db) throw new Error("Firestore not available");
          const userRef = doc(db, USERS_COLLECTION, userToUpdate.id);
          await setDoc(userRef, userToUpdate, { merge: true });
      },
      onSuccess: (data, updatedUser) => {
          queryClient.invalidateQueries({ queryKey: [USERS_COLLECTION] });
          setTimeout(() => {
            toast({ title: `User ${updatedUser.isActive ? 'Activated' : 'Deactivated'}`, description: `${updatedUser.name}'s status has been updated.` });
          },0);
      },
      onError: (error) => {
          toast({ title: 'Error Updating User Status', description: error.message, variant: 'destructive' });
      }
  });

  const updateUserPinMutation = useMutation<void, Error, AppUser>({
    mutationFn: async (userWithNewPin: AppUser) => {
      if (!db) throw new Error("Firestore not available");
      const userRef = doc(db, USERS_COLLECTION, userWithNewPin.id);
      await setDoc(userRef, userWithNewPin, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_COLLECTION] });
      setTimeout(() => {
        toast({ title: 'PIN Updated', description: `User's PIN has been changed successfully.` });
      },0);
    },
    onError: (error) => {
      toast({ title: 'Error Updating PIN', description: error.message, variant: 'destructive' });
    }
  });


  const handleSaveUser = (userFormData: AppUser) => {
    const isEditing = !!userToEdit;
    const finalUserData = { ...userFormData, id: userToEdit?.id || userFormData.id || crypto.randomUUID() };
    userMutation.mutate({ user: finalUserData, isEditing });
  };

  const handleAddNewUser = () => {
    setUserToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: AppUser) => {
    setUserToEdit(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    deleteUserMutation.mutate({ userId, userName: userToDelete.name });
  };

  const handleToggleActive = (userId: string) => {
    const userToToggle = users.find(u => u.id === userId);
    if (!userToToggle) return;
    updateUserStatusMutation.mutate({ ...userToToggle, isActive: !userToToggle.isActive });
  };
  
  const handleChangePin = (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    const newPin = prompt(`Enter new 6-digit PIN for ${userToUpdate.name} (leave blank to cancel):`);
    if (newPin === null) return; 
    if (!/^\d{6}$/.test(newPin) && newPin !== "") {
        toast({ title: 'Invalid PIN', description: 'PIN must be 6 digits.', variant: 'destructive' });
        return;
    }
    if (newPin === "") { 
        toast({ title: 'PIN Change Cancelled', description: 'No changes made to user PIN.' });
        return;
    }
    updateUserPinMutation.mutate({ ...userToUpdate, pin: newPin });
  };


  if (!db) {
    return (
      <div className="space-y-8">
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Firebase Not Connected</CardTitle></CardHeader>
          <CardContent><p>Cannot load staff data. Please check Firebase configuration.</p></CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
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
            Add, view, and manage staff accounts and roles. Data is stored in Firestore.
          </p>
        </div>
        <Button onClick={handleAddNewUser} disabled={userMutation.isPending}>
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
                    <TableCell><Badge variant={user.role === 'Administrator' || user.role === 'Owner' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                    <TableCell>{ user.pin ? '****'+ user.pin.slice(-2) : 'Not Set'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.isActive ? 'secondary' : 'outline'} className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center space-x-1">
                        <Button variant="outline" size="icon" onClick={() => handleEditUser(user)} title="Edit User" disabled={userMutation.isPending || deleteUserMutation.isPending || updateUserPinMutation.isPending || updateUserStatusMutation.isPending}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit User</span>
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleToggleActive(user.id)}
                            title={user.isActive ? 'Deactivate User' : 'Activate User'}
                            disabled={userMutation.isPending || deleteUserMutation.isPending || updateUserPinMutation.isPending || updateUserStatusMutation.isPending}
                        >
                          {user.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                          <span className="sr-only">{user.isActive ? 'Deactivate' : 'Activate'} User</span>
                        </Button>
                         <Button variant="outline" size="icon" onClick={() => handleChangePin(user.id)} title="Change PIN" disabled={userMutation.isPending || deleteUserMutation.isPending || updateUserPinMutation.isPending || updateUserStatusMutation.isPending}>
                            <KeyRound className="h-4 w-4" />
                            <span className="sr-only">Change PIN</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" title="Delete User" disabled={userMutation.isPending || deleteUserMutation.isPending || updateUserPinMutation.isPending || updateUserStatusMutation.isPending}>
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
            User data is stored in your Firebase Firestore database. Roles (Front Staff, Manager, Owner, Administrator) are informational and do not restrict access to features in this version.
            </p>
             <p className="text-muted-foreground mt-2">
            PINs are stored in Firestore.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
