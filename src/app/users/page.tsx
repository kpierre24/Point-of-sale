// src/app/users/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User as AppUser } from '@/types'; // Renamed to AppUser
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
import { UserCog, Edit, Trash2, ToggleLeft, ToggleRight, ShieldAlert, KeyRound } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Firestore instance
// Firebase Admin SDK functions for user deletion/creation are backend operations.
// For client-side, we rely on AuthContext for signup, and manual Firestore management.
// True user deletion (including Auth record) needs a backend function. For now, we'll just delete from Firestore.

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const { currentUser, currentUserProfile, signupWithEmail, updateUserPinInContext } = useAuth(); // Use from AuthContext

  const fetchUsers = useCallback(async () => {
    if (!currentUserProfile || currentUserProfile.role !== 'Admin') {
        setUsers([]); // Non-admins should not see the user list
        return;
    }
    try {
      const usersCollectionRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollectionRef);
      const fetchedUsers: AppUser[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as AppUser);
      });
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: 'Error', description: 'Could not fetch user data.', variant: 'destructive' });
      setUsers([]);
    }
  }, [currentUserProfile, toast]);

  useEffect(() => {
    setIsMounted(true);
    fetchUsers();
  }, [fetchUsers]);

  const handleSaveUser = async (userFormData: AppUser, newPassword?: string) => {
    if (!currentUserProfile || currentUserProfile.role !== 'Admin') {
      toast({ title: 'Permission Denied', description: 'You do not have permission to save users.', variant: 'destructive' });
      return;
    }
    
    const userToSave: Omit<AppUser, 'id' | 'password'> = { // password field not part of AppUser type for Firestore
        name: userFormData.name,
        email: userFormData.email,
        role: userFormData.role,
        isActive: userFormData.isActive,
        pin: userFormData.pin || Math.floor(100000 + Math.random() * 900000).toString(), // Generate PIN if not present
    };

    if (userToEdit) { // Editing existing user
      try {
        const userDocRef = doc(db, 'users', userToEdit.id);
        await updateDoc(userDocRef, userToSave);
        // Password changes for existing users require backend or specific Firebase SDK handling (e.g. re-authentication)
        // For this client-side example, we cannot directly change passwords for other users.
        // PIN can be updated.
        if (userFormData.pin && userToEdit.id === currentUser?.uid) {
            updateUserPinInContext(userFormData.pin);
        }
        toast({ title: 'User Updated', description: `${userFormData.name} has been updated.` });
      } catch (error) {
        console.error("Error updating user:", error);
        toast({ title: 'Update Failed', description: 'Could not update user.', variant: 'destructive' });
      }
    } else { // Adding new user
      try {
        // Use AuthContext's signup which handles Firebase Auth and Firestore profile creation
        const firebaseUser = await signupWithEmail(userFormData.name, userFormData.email, newPassword || "defaultPassword123", userFormData.role); // Provide a strong default or ensure password is set
        if (firebaseUser) {
             // signupWithEmail in AuthContext already creates the Firestore doc with a PIN.
             // If we need to update the pin here again if it was part of userFormData, do so.
            if(userFormData.pin) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                await updateDoc(userDocRef, { pin: userFormData.pin });
            }
            toast({ title: 'User Added', description: `${userFormData.name} has been added.` });
        } else {
             toast({ title: 'Creation Failed', description: 'Could not create Firebase user.', variant: 'destructive' });
        }
      } catch (error: any) {
        console.error("Error adding user:", error);
        toast({ title: 'Creation Failed', description: error.message || 'Could not create user.', variant: 'destructive' });
      }
    }
    setUserToEdit(null);
    fetchUsers(); // Refresh list
    setIsFormOpen(false);
  };

  const handleAddNewUser = () => {
    if (currentUserProfile?.role !== 'Admin') {
        toast({title: "Permission Denied", description: "Only Admins can add new users.", variant: "destructive"});
        return;
    }
    setUserToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: AppUser) => {
     if (currentUserProfile?.role !== 'Admin' && currentUser?.uid !== user.id) {
        toast({title: "Permission Denied", description: "You can only edit your own profile or Admins can edit others.", variant: "destructive"});
        return;
    }
    setUserToEdit(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
     if (currentUserProfile?.role !== 'Admin') {
        toast({title: "Permission Denied", description: "Only Admins can delete users.", variant: "destructive"});
        return;
    }
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (userToDelete.role === 'Admin') {
      const adminUsers = users.filter(u => u.role === 'Admin');
      if (adminUsers.length <= 1) {
        toast({ title: 'Action Restricted', description: 'Cannot delete the last Admin user.', variant: 'destructive' });
        return;
      }
    }
    if (currentUser?.uid === userId) {
        toast({ title: 'Action Restricted', description: 'Cannot delete your own account.', variant: 'destructive' });
        return;
    }

    try {
      // Deleting Firebase Auth user record requires Admin SDK (backend) or re-authentication.
      // For client-side, we'll just delete the Firestore profile.
      await deleteDoc(doc(db, 'users', userId));
      toast({ title: 'User Profile Deleted', description: `${userToDelete.name}'s profile data has been removed from Firestore. Auth record may persist.`, variant: 'destructive' });
      fetchUsers();
    } catch (error) {
        console.error("Error deleting user profile:", error);
        toast({ title: 'Deletion Failed', description: 'Could not delete user profile.', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (userId: string) => {
     if (currentUserProfile?.role !== 'Admin') {
        toast({title: "Permission Denied", description: "Only Admins can change user status.", variant: "destructive"});
        return;
    }
    const userToToggle = users.find(u => u.id === userId);
    if (!userToToggle) return;

    if (userToToggle.role === 'Admin' && userToToggle.isActive) {
        const activeAdminUsers = users.filter(u => u.role === 'Admin' && u.isActive);
        if (activeAdminUsers.length <= 1 && userToToggle.id === currentUser?.uid) { // Check if it's the current admin
            toast({ title: 'Action Restricted', description: 'Cannot deactivate the last active Admin if it is yourself.', variant: 'destructive'});
            return;
        }
    }
    if (currentUser?.uid === userId && userToToggle.isActive) {
         toast({ title: 'Action Restricted', description: 'Cannot deactivate your own account via this toggle.', variant: 'destructive'});
        return;
    }

    try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, { isActive: !userToToggle.isActive });
        toast({ title: `User ${userToToggle.isActive ? 'Deactivated' : 'Activated'}`, description: `${userToToggle.name}'s status has been updated.` });
        fetchUsers();
    } catch (error) {
        console.error("Error toggling user active status:", error);
        toast({ title: 'Update Failed', description: 'Could not update user status.', variant: 'destructive' });
    }
  };
  
  const handleChangePin = async (userId: string) => {
    if (currentUserProfile?.role !== 'Admin' && currentUserProfile?.role !== 'Manager' && currentUser?.uid !== userId) {
        toast({title: "Permission Denied", description: "Only Admins/Managers can change PINs for others, or you for yourself.", variant: "destructive"});
        return;
    }
    const newPin = prompt("Enter new 6-digit PIN for the user (leave blank to cancel):");
    if (newPin === null) return; // User cancelled
    if (!/^\d{6}$/.test(newPin) && newPin !== "") {
        toast({ title: 'Invalid PIN', description: 'PIN must be 6 digits.', variant: 'destructive' });
        return;
    }
    if (newPin === "") { // Allow clearing if needed or treat as cancel
        toast({ title: 'PIN Change Cancelled', description: 'No changes made to user PIN.' });
        return;
    }

    try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, { pin: newPin });
        if (userId === currentUser?.uid) { // If current user changes their own PIN
            updateUserPinInContext(newPin);
        }
        toast({ title: 'PIN Updated', description: `User's PIN has been changed successfully.` });
        fetchUsers();
    } catch (error) {
        console.error("Error updating PIN:", error);
        toast({ title: 'PIN Update Failed', description: 'Could not update user PIN.', variant: 'destructive' });
    }
  };


  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><UserCog className="h-8 w-8 animate-pulse" /> <span className="ml-2">Loading users...</span></div>;
  }
  
  if (!currentUserProfile) {
      return (
          <Card className="border-destructive bg-destructive/10">
              <CardHeader className="flex flex-row items-center space-x-3">
                <ShieldAlert className="h-6 w-6 text-destructive"/>
                <CardTitle className="text-destructive">Access Restricted</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive">You must be logged in to view this page. Redirecting to login...</p>
              </CardContent>
          </Card>
      );
  }

  if (currentUserProfile.role !== 'Admin') {
      return (
          <Card className="border-destructive bg-destructive/10">
              <CardHeader className="flex flex-row items-center space-x-3">
                <ShieldAlert className="h-6 w-6 text-destructive"/>
                <CardTitle className="text-destructive">Permission Denied</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive">You do not have permission to manage users. Contact an administrator.</p>
                 {/* Allow user to edit their own PIN */}
                <Button onClick={() => handleChangePin(currentUserProfile.id)} variant="outline" className="mt-4">
                    <KeyRound className="mr-2 h-4 w-4" /> Change My PIN
                </Button>
              </CardContent>
          </Card>
      );
  }


  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground text-md">
            Add, view, and manage staff accounts and roles. Current User: {currentUserProfile.name} ({currentUserProfile.role})
          </p>
        </div>
        <Button onClick={handleAddNewUser} disabled={currentUserProfile.role !== 'Admin'}>
          <UserCog className="mr-2 h-4 w-4" />
          Add Staff User
        </Button>
      </header>
      
      <UserForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleSaveUser}
            userToEdit={userToEdit}
            isEditingCurrentUser={!!currentUser && !!userToEdit && currentUser.uid === userToEdit.id}
            currentUserRole={currentUserProfile.role}
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
                        <Button variant="outline" size="icon" onClick={() => handleEditUser(user)} disabled={currentUserProfile.role !== 'Admin' && currentUser?.uid !== user.id} title="Edit User">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit User</span>
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleToggleActive(user.id)}
                            disabled={currentUserProfile.role !== 'Admin' || (currentUser?.uid === user.id && user.role === 'Admin')}
                            title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                          <span className="sr-only">{user.isActive ? 'Deactivate' : 'Activate'} User</span>
                        </Button>
                         <Button variant="outline" size="icon" onClick={() => handleChangePin(user.id)} disabled={currentUserProfile.role !== 'Admin' && currentUserProfile.role !== 'Manager' && currentUser?.uid !== user.id} title="Change PIN">
                            <KeyRound className="h-4 w-4" />
                            <span className="sr-only">Change PIN</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" disabled={currentUserProfile.role !== 'Admin' || (currentUser?.uid === user.id)} title="Delete User">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete User</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user "{user.name}" from Firestore. The Firebase Auth record may persist.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                Delete User Profile
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
            <CardTitle>Role-Based Access Control (RBAC) & Security</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
            User roles (Admin, Manager, Cashier, Staff) determine access to various features.
            'Admin' has full control, including user management.
            'Manager' can manage products, purchases, and some reports.
            'Cashier' and 'Staff' have access primarily to the Sales page.
            </p>
            <p className="text-muted-foreground mt-2">
            User authentication is handled by Firebase. PINs are stored in Firestore.
            </p>
             <p className="text-muted-foreground mt-2">
            <strong>Note:</strong> Full enforcement of permissions across all app features is an ongoing process.
            For true security, especially for sensitive operations like deleting Firebase Auth users, backend functions (e.g., Firebase Functions) are recommended.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
