// src/context/LocationContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Location } from '@/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';


interface LocationContextType {
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;
  activeSessionId: string | null; // Added active session ID
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    // This prevents a mismatch between server and client HTML.
    const storedLocationId = sessionStorage.getItem('selectedLocationId');
    if (storedLocationId) {
      setSelectedLocationId(storedLocationId);
    }
    setIsInitialized(true);
  }, []);

  const handleSetSelectedLocationId = useCallback((id: string | null) => {
    if (isInitialized) {
        if (id) {
            sessionStorage.setItem('selectedLocationId', id);
        } else {
            sessionStorage.removeItem('selectedLocationId');
        }
        setSelectedLocationId(id);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!db) return;

    const unsub = onSnapshot(collection(db, 'locations'), (snapshot) => {
        const fetchedLocations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
        setLocations(fetchedLocations);

        // If no location is selected yet, or if the selected one no longer exists, select the first one.
        const currentSelectedId = sessionStorage.getItem('selectedLocationId');
        const isValidSelection = fetchedLocations.some(l => l.id === currentSelectedId);

        if ((!currentSelectedId || !isValidSelection) && fetchedLocations.length > 0) {
            handleSetSelectedLocationId(fetchedLocations[0].id);
        }
    });

    return () => unsub();
  }, [handleSetSelectedLocationId]); // Use the stable callback here
  
  const activeSessionId = locations.find(loc => loc.id === selectedLocationId)?.activeSessionId || null;

  return (
    <LocationContext.Provider value={{ selectedLocationId, setSelectedLocationId: handleSetSelectedLocationId, activeSessionId }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
