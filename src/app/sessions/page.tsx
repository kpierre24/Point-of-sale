
// src/app/sessions/page.tsx
"use client";

import { useState } from 'react';
import type { Location, Session, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, writeBatch, query, where, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, PlayCircle, Archive, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProtectedComponent, PERMISSIONS } from '@/hooks/use-permissions';

const LOCATIONS_COLLECTION = 'locations';
const SESSIONS_COLLECTION = 'sessions';
const PRODUCTS_COLLECTION = 'products';

interface SessionPageData {
    locations: Location[];
    sessions: Session[];
    products: Product[];
}

// Combined fetcher function
const fetchSessionData = async (): Promise<SessionPageData> => {
    if (!db) throw new Error("Firestore not available");

    const locationsQuery = collection(db, LOCATIONS_COLLECTION);
    const sessionsQuery = query(collection(db, SESSIONS_COLLECTION), orderBy("startDate", "desc"));
    const productsQuery = collection(db, PRODUCTS_COLLECTION);

    const [locationsSnapshot, sessionsSnapshot, productsSnapshot] = await Promise.all([
        getDocs(locationsQuery),
        getDocs(sessionsQuery),
        getDocs(productsQuery)
    ]);

    return {
        locations: locationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location)),
        sessions: sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session)),
        products: productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)),
    };
};

export default function SessionsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading, isError, error } = useQuery<SessionPageData, Error>({
        queryKey: ['sessionData'],
        queryFn: fetchSessionData
    });
    
    const { locations = [], sessions = [], products = [] } = data || {};

    const newSessionMutation = useMutation<void, Error, { location: Location }>({
        mutationFn: async ({ location }) => {
            if (!db) throw new Error("Firestore not available");
            
            const batch = writeBatch(db);

            // 1. Archive the old active session for this location, if it exists
            if (location.activeSessionId) {
                const oldSessionRef = doc(db, SESSIONS_COLLECTION, location.activeSessionId);
                batch.update(oldSessionRef, { status: 'archived', endDate: new Date().toISOString() });
            }

            // 2. Create the new session
            const newSessionId = crypto.randomUUID();
            const now = new Date();
            const newSession: Session = {
                id: newSessionId,
                locationId: location.id,
                startDate: startOfMonth(now).toISOString(),
                name: `${location.name} - ${format(now, 'MMMM yyyy')}`,
                status: 'active',
                startedBy: "Admin", // Placeholder
            };
            const newSessionRef = doc(db, SESSIONS_COLLECTION, newSessionId);
            batch.set(newSessionRef, newSession);

            // 3. Update the location to point to the new active session
            const locationRef = doc(db, LOCATIONS_COLLECTION, location.id);
            batch.update(locationRef, { activeSessionId: newSessionId });
            
            // 4. Reset stock for all products at this location to zero
            products.forEach(product => {
                const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
                batch.update(productRef, { [`stockByLocation.${location.id}`]: 0 });
            });
            
            await batch.commit();
        },
        onSuccess: (_, { location }) => {
            queryClient.invalidateQueries({ queryKey: ['sessionData'] });
            toast({
                title: "New Session Started",
                description: `A new session has been started for ${location.name}. Stock has been reset.`,
            });
        },
        onError: (error) => {
            toast({
                title: "Error Starting Session",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (isError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Data</AlertTitle>
                <AlertDescription>
                    Could not load session management data. Please try again later.
                    <p className="text-xs mt-2">{error?.message}</p>
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <ProtectedComponent requiredPermissions={[PERMISSIONS.SETTINGS_EDIT]}>
            <div className="space-y-8">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center">
                        <Calendar className="mr-3 h-8 w-8 text-primary" />
                        Session Management
                    </h1>
                    <p className="text-muted-foreground text-md">
                        Start new monthly sessions for each location to reset sales and inventory counts.
                    </p>
                </header>

                <Alert>
                    <AlertTitle className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        How Sessions Work
                    </AlertTitle>
                    <AlertDescription>
                        Starting a new session archives the previous one, resets the stock count for that location to zero, and begins a new tracking period for sales and purchases. Products themselves are not deleted.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locations.map(location => {
                        const activeSession = sessions.find(s => s.id === location.activeSessionId);
                        return (
                            <Card key={location.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <MapPin className="mr-2 h-5 w-5" />
                                        {location.name}
                                    </CardTitle>
                                    <CardDescription>
                                        Manage operational sessions for this location.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {activeSession ? (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                            <p className="font-semibold text-green-800">Active Session</p>
                                            <p className="text-sm text-green-700">{activeSession.name}</p>
                                            <p className="text-xs text-green-600">
                                                Started: {format(new Date(activeSession.startDate), 'MMM dd, yyyy')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                             <p className="font-semibold text-amber-800">No Active Session</p>
                                             <p className="text-sm text-amber-700">Ready to start a new session.</p>
                                        </div>
                                    )}
                                    <Button
                                        onClick={() => newSessionMutation.mutate({ location })}
                                        disabled={newSessionMutation.isPending}
                                        className="w-full"
                                    >
                                        {newSessionMutation.isPending && newSessionMutation.variables?.location.id === location.id ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <PlayCircle className="mr-2 h-4 w-4" />
                                        )}
                                        Start New Session for {format(new Date(), 'MMMM')}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Archive className="mr-2 h-5 w-5"/>Archived Sessions</CardTitle>
                        <CardDescription>View past sessions. Data from archived sessions is read-only.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                          {sessions.filter(s => s.status === 'archived').map(session => (
                            <li key={session.id} className="p-2 border rounded-md text-sm">
                                {session.name} (Ended: {session.endDate ? format(new Date(session.endDate), 'MMM dd, yyyy') : 'N/A'})
                            </li>
                          ))}
                        </ul>
                    </CardContent>
                 </Card>
            </div>
        </ProtectedComponent>
    );
}