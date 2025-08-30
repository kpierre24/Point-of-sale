// src/context/LocationContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    if (!db) return;

    const unsub = onSnapshot(collection(db, 'locations'), (snapshot) => {
        const fetchedLocations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
        setLocations(fetchedLocations);

        // If no location is selected yet, select the first one
        if (!sessionStorage.getItem('selectedLocationId') && fetchedLocations.length > 0) {
            setSelectedLocationId(fetchedLocations[0].id);
        }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    // This effect saves the location ID to sessionStorage whenever it changes,
    // but only after the initial state has been loaded from storage.
    if (isInitialized) {
        if (selectedLocationId) {
          sessionStorage.setItem('selectedLocationId', selectedLocationId);
        } else {
          sessionStorage.removeItem('selectedLocationId');
        }
    }
  }, [selectedLocationId, isInitialized]);
  
  const activeSessionId = locations.find(loc => loc.id === selectedLocationId)?.activeSessionId || null;

  return (
    <LocationContext.Provider value={{ selectedLocationId, setSelectedLocationId, activeSessionId }}>
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
