// src/app/locations/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { Location } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query as firestoreQuery, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Edit, Trash2, MapPin, Loader2 } from 'lucide-react';

const LOCATIONS_COLLECTION = 'locations';

const LocationForm = ({
  isOpen,
  onOpenChange,
  onSave,
  locationToEdit,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (location: Omit<Location, 'id'> & { id?: string }) => void;
  locationToEdit: Location | null;
}) => {
  const [location, setLocation] = useState({ name: '', address: '' });

  useEffect(() => {
    if (locationToEdit) {
      setLocation({ name: locationToEdit.name, address: locationToEdit.address || '' });
    } else {
      setLocation({ name: '', address: '' });
    }
  }, [locationToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...location, id: locationToEdit?.id });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{locationToEdit ? 'Edit Location' : 'Add New Location'}</DialogTitle>
          <DialogDescription>
            Fill in the details for your store location.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Location Name</Label>
            <Input id="name" value={location.name} onChange={(e) => setLocation(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" value={location.address} onChange={(e) => setLocation(p => ({ ...p, address: e.target.value }))} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">Save Location</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


export default function LocationsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading, isError, error } = useQuery<Location[], Error>({
    queryKey: [LOCATIONS_COLLECTION],
    queryFn: async (): Promise<Location[]> => {
      if (!db) throw new Error("Firestore not available");
      const q = firestoreQuery(collection(db, LOCATIONS_COLLECTION), orderBy("name"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
    },
  });
  
  const mutation = useMutation<void, Error, { location: Omit<Location, 'id'> & { id?: string } }>({
      mutationFn: async ({ location }) => {
          if (!db) throw new Error("Firestore not available");
          const isEditing = !!location.id;
          const id = location.id || crypto.randomUUID();
          const locationRef = doc(db, LOCATIONS_COLLECTION, id);
          await setDoc(locationRef, { name: location.name, address: location.address }, { merge: isEditing });
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [LOCATIONS_COLLECTION] });
          toast({ title: 'Location Saved', description: 'The location has been successfully saved.' });
      },
      onError: (err) => {
          toast({ title: 'Error Saving Location', description: err.message, variant: 'destructive' });
      }
  });

  const deleteMutation = useMutation<void, Error, string>({
      mutationFn: async (locationId) => {
          if (!db) throw new Error("Firestore not available");
          await deleteDoc(doc(db, LOCATIONS_COLLECTION, locationId));
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [LOCATIONS_COLLECTION] });
          toast({ title: 'Location Deleted', variant: 'destructive' });
      },
      onError: (err) => {
          toast({ title: 'Error Deleting Location', description: err.message, variant: 'destructive' });
      }
  });


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Locations...</p>
      </div>
    );
  }

  if (isError) {
    return <p>Error: {error.message}</p>
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <MapPin className="mr-3 h-8 w-8 text-primary" />
            Manage Locations
          </h1>
          <p className="text-muted-foreground text-md">
            Add or edit your business locations.
          </p>
        </div>
        <Button onClick={() => { setLocationToEdit(null); setIsFormOpen(true); }} disabled={mutation.isPending}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </header>
      
      <LocationForm 
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={(data) => mutation.mutate({ location: data })}
        locationToEdit={locationToEdit}
      />

      <Card>
          <CardHeader>
              <CardTitle>Location List</CardTitle>
          </CardHeader>
          <CardContent>
              <Table>
                  {locations.length === 0 && <TableCaption>No locations created yet.</TableCaption>}
                  <TableHeader>
                      <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {locations.map(loc => (
                          <TableRow key={loc.id}>
                              <TableCell className="font-medium">{loc.name}</TableCell>
                              <TableCell>{loc.address}</TableCell>
                              <TableCell className="text-right">
                                  <Button variant="outline" size="sm" className="mr-2" onClick={() => { setLocationToEdit(loc); setIsFormOpen(true); }}>
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(loc.id)}>
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </Button>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
