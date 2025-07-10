// src/context/LocationContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationContextType {
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
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

  return (
    <LocationContext.Provider value={{ selectedLocationId, setSelectedLocationId }}>
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
