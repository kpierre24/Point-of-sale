// src/app/users/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { User } from '@/types';
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
import { UserCog, Edit, Trash2, ToggleLeft, ToggleRight, ShieldAlert } from 'lucide-react';
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

// A placeholder for the "current logged-in user". In a real app, this would come from an auth context.
// For now, we'll assume the first Admin user is the "current user" for testing restrictions.
// This is highly simplified and NOT secure.
const DUMMY_CURRENT_USER_ID = "default-admin-id"; // Will be set if default admin created

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  
  // Simulate current user for UI restrictions (e.g. admin cannot demote/deactivate self)
  // In a real app, this would come from an authentication context.
  const [currentUser, setCurrentUser] = useState<User | null>(null);


  useEffect(() => {
    setIsMounted(true);
    const storedUsers = localStorage.getItem('staffUsers');
    let loadedUsers: User[] = [];
    if (storedUsers) {
      try {
        loadedUsers = JSON.parse(storedUsers);
      } catch (e) {
        console.error("Failed to parse staffUsers from localStorage", e);
        loadedUsers = [];
      }
    }

    if (loadedUsers.length === 0) {
      const defaultAdmin: User = {
        id: DUMMY_CURRENT_USER_ID, // Consistent ID for the default admin
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'Admin',
        isActive: true,
        password: 'adminpassword', // UNSAFE: For demo only
      };
      loadedUsers.push(defaultAdmin);
      toast({ title: 'Default Admin Created', description: 'An administrator account has been set up.' });
    }
    setUsers(loadedUsers);
    
    // Simulate setting current user - typically the first admin or based on a login.
    // For this demo, if a user with DUMMY_CURRENT_USER_ID exists and is Admin, set them as current.
    const potentialCurrentUser = loadedUsers.find(u => u.id === DUMMY_CURRENT_USER_ID && u.role === 'Admin');
    if (potentialCurrentUser) {
        setCurrentUser(potentialCurrentUser);
    } else {
        // Fallback: if no specific dummy admin, pick first admin found.
        setCurrentUser(loadedUsers.find(u => u.role === 'Admin') || null);
    }

  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('staffUsers', JSON.stringify(users));
       // Update currentUser if the list changes and the current user might have been modified/deleted
       if (currentUser) {
        const updatedCurrentUser = users.find(u => u.id === currentUser.id);
        if (updatedCurrentUser) {
            setCurrentUser(updatedCurrentUser);
        } else {
            // Current user was deleted, attempt to find another admin
            setCurrentUser(users.find(u => u.role === 'Admin') || null);
        }
      } else {
         setCurrentUser(users.find(u => u.role === 'Admin') || null);
      }
    }
  }, [users, isMounted, currentUser]);

  const handleSaveUser = (user: User, newPassword?: string) => {
    setUsers((prevUsers) => {
      const existingIndex = prevUsers.findIndex((u) => u.id === user.id);
      // Ensure there's always at least one active Admin
      if(user.role !== 'Admin' || !user.isActive) {
        const adminUsers = prevUsers.filter(u => u.role === 'Admin' && u.isActive);
        if(adminUsers.length === 1 && adminUsers[0].id === user.id) {
            toast({title: "Action Restricted", description: "Cannot demote or deactivate the last active Admin.", variant: "destructive"});
            setIsFormOpen(true); // Keep form open
            return prevUsers; 
        }
      }

      let userToSave = { ...user };
      if (newPassword) {
        userToSave.password = newPassword; // UNSAFE: For demo only
      } else if (existingIndex > -1 && !newPassword) {
        // Keep existing password if not changing
        userToSave.password = prevUsers[existingIndex].password;
      }


      if (existingIndex > -1) {
        const updatedUsers = [...prevUsers];
        updatedUsers[existingIndex] = userToSave;
        toast({ title: 'User Updated', description: `${user.name} has been updated.` });
        return updatedUsers;
      } else {
        toast({ title: 'User Added', description: `${user.name} has been added.` });
        return [userToSave, ...prevUsers];
      }
    });
    setUserToEdit(null);
  };

  const handleAddNewUser = () => {
    setUserToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (userToDelete.role === 'Admin') {
      const adminUsers = users.filter(u => u.role === 'Admin');
      if (adminUsers.length <= 1) {
        toast({ title: 'Action Restricted', description: 'Cannot delete the last Admin user.', variant: 'destructive' });
        return;
      }
    }
    
    setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
    toast({ title: 'User Deleted', description: `${userToDelete.name} has been removed.`, variant: 'destructive' });
  };

  const handleToggleActive = (userId: string) => {
    const userToToggle = users.find(u => u.id === userId);
    if (!userToToggle) return;

    if (userToToggle.role === 'Admin' && userToToggle.isActive) {
        const activeAdminUsers = users.filter(u => u.role === 'Admin' && u.isActive);
        if (activeAdminUsers.length <= 1) {
            toast({ title: 'Action Restricted', description: 'Cannot deactivate the last active Admin.', variant: 'destructive'});
            return;
        }
    }

    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      )
    );
    toast({ title: `User ${userToToggle.isActive ? 'Deactivated' : 'Activated'}`, description: `${userToToggle.name}'s status has been updated.` });
  };
  
  // Basic check if current user is an admin - for UI logic, not real security
  const isCurrentUserAdmin = currentUser?.role === 'Admin';

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground text-md">
            Add, view, and manage staff accounts and roles.
          </p>
        </div>
        <Button onClick={handleAddNewUser} disabled={!isCurrentUserAdmin && isMounted}>
          <UserCog className="mr-2 h-4 w-4" />
          Add Staff User
        </Button>
      </header>

      {!isMounted && <p>Loading user data...</p>}
      
      {isMounted && !isCurrentUserAdmin && users.length > 0 && (
          <Card className="border-destructive bg-destructive/10">
              <CardHeader className="flex flex-row items-center space-x-3">
                <ShieldAlert className="h-6 w-6 text-destructive"/>
                <CardTitle className="text-destructive">Access Restricted</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive">You do not have permission to manage users. Please contact an administrator.</p>
              </CardContent>
          </Card>
      )}

      {isMounted && (
        <UserForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleSaveUser}
            userToEdit={userToEdit}
            isEditingCurrentUser={!!currentUser && !!userToEdit && currentUser.id === userToEdit.id}
            currentUserRole={currentUser?.role}
        />
      )}


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
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.isActive ? 'secondary' : 'outline'} className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditUser(user)} disabled={!isCurrentUserAdmin}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit User</span>
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleToggleActive(user.id)}
                            disabled={!isCurrentUserAdmin || (currentUser?.id === user.id && user.role === 'Admin')}
                        >
                          {user.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                          <span className="sr-only">{user.isActive ? 'Deactivate' : 'Activate'} User</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" disabled={!isCurrentUserAdmin || (currentUser?.id === user.id && user.role === 'Admin')}>
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
            <CardTitle>Role-Based Access Control (RBAC)</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
            Currently, user roles can be assigned (Admin, Manager, Cashier, Staff). The 'Admin' role has privileges to manage users on this page. 
            </p>
            <p className="text-muted-foreground mt-2">
            Full enforcement of permissions based on these roles across all application features (e.g., restricting access to sales, products, or settings pages) is planned for future updates.
            </p>
            <p className="text-muted-foreground mt-2">
            <strong>Note:</strong> User authentication and password management are implemented in a simplified manner for this client-side demonstration and are not secure for production use. A backend system is required for secure user management.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}