// src/app/(splash)/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShoppingCart } from 'lucide-react'; 
import { APP_TITLE as DEFAULT_APP_TITLE } from '@/config/constants';
import type { AppSettings } from '@/types';
import { db } from '@/lib/firebase'; // Added
import { doc, getDoc } from 'firebase/firestore'; // Added

const APP_SETTINGS_DOC_ID = 'current'; // Document ID for app settings in Firestore

export default function SplashPage() {
  const router = useRouter();
  const [appTitle, setAppTitle] = useState(DEFAULT_APP_TITLE);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchAppSettingsAndRedirect = async () => {
      setIsLoadingSettings(true);
      if (db) {
        try {
          const settingsDocRef = doc(db, 'appSettings', APP_SETTINGS_DOC_ID);
          const docSnap = await getDoc(settingsDocRef);
          if (docSnap.exists()) {
            const parsedSettings = docSnap.data() as AppSettings;
            if (parsedSettings.storeName) {
              setAppTitle(parsedSettings.storeName);
              document.title = `${parsedSettings.storeName} - Loading`;
            } else {
              document.title = `${DEFAULT_APP_TITLE} - Loading`;
            }
          } else {
             document.title = `${DEFAULT_APP_TITLE} - Loading`;
          }
        } catch (e) {
          console.error("Failed to fetch settings for splash title from Firestore", e);
          document.title = `${DEFAULT_APP_TITLE} - Loading`;
        }
      } else {
        console.warn("Firestore not available on splash page. Using default title.");
        document.title = `${DEFAULT_APP_TITLE} - Loading`;
      }
      setIsLoadingSettings(false);

      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, 1500); 
      return () => clearTimeout(timer);
    };
    
    fetchAppSettingsAndRedirect();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <div className="text-center p-8 rounded-lg shadow-2xl bg-background/10 backdrop-blur-sm">
        <ShoppingCart className="h-24 w-24 mx-auto mb-6 text-primary-foreground drop-shadow-lg" />
        <h1 className="text-5xl font-bold mb-3 tracking-tight drop-shadow-md">
          {isLoadingSettings ? DEFAULT_APP_TITLE : appTitle}
        </h1>
        <p className="text-xl text-primary-foreground/90 mb-8 drop-shadow-sm">
          Your Modern Point of Sale Solution
        </p>
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
          <p className="ml-3 text-lg">Loading Application...</p>
        </div>
      </div>
      <footer className="absolute bottom-4 text-center w-full text-sm text-primary-foreground/70">
        &copy; {new Date().getFullYear()} {isLoadingSettings ? DEFAULT_APP_TITLE : appTitle}. All rights reserved.
      </footer>
    </div>
  );
}
