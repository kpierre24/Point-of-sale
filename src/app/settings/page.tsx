
// src/app/settings/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { AppSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { APP_TITLE, TAX_RATE as DEFAULT_TAX_RATE_PERCENT } from '@/config/constants';
import { Save, Loader2, WifiOff } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const APP_SETTINGS_DOC_ID = 'current'; // Document ID for app settings in Firestore

const defaultSettings: AppSettings = {
  storeName: APP_TITLE,
  taxRate: (DEFAULT_TAX_RATE_PERCENT * 100).toString(),
  receiptFooter: "Thank you for your business!",
  darkMode: false,
  storeAddress: "",
  storePhone: "",
  storeWebsite: "",
};

// Fetcher function for React Query
const fetchAppSettings = async (): Promise<AppSettings> => {
  if (!db) throw new Error("Firestore not available");
  const settingsDocRef = doc(db, 'appSettings', APP_SETTINGS_DOC_ID);
  const docSnap = await getDoc(settingsDocRef);
  if (docSnap.exists()) {
    return { ...defaultSettings, ...(docSnap.data() as AppSettings) };
  }
  // If no settings in Firestore, save and return default settings
  await setDoc(settingsDocRef, defaultSettings);
  return defaultSettings;
};

// Mutation function for React Query
const saveAppSettings = async (settings: AppSettings): Promise<AppSettings> => {
  if (!db) throw new Error("Firestore not available");
  // Validate tax rate before saving
  const tax = parseFloat(settings.taxRate);
  if (isNaN(tax) || tax < 0 || tax > 100) {
    throw new Error('Tax rate must be a number between 0 and 100.');
  }
  const settingsDocRef = doc(db, 'appSettings', APP_SETTINGS_DOC_ID);
  await setDoc(settingsDocRef, settings);
  return settings;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading: isLoadingSettings, isError, error: queryError } = useQuery<AppSettings, Error>({
    queryKey: ['appSettings', APP_SETTINGS_DOC_ID],
    queryFn: fetchAppSettings,
    enabled: !!db, // Only run query if db is initialized
    initialData: defaultSettings, // Provide initial data to prevent undefined state
    retry: false, // Prevent retries if it's an offline/config issue
    onSuccess: (loadedSettings) => {
        if (loadedSettings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
  });
  
  const [formState, setFormState] = useState<AppSettings>(settings || defaultSettings);

  useEffect(() => {
    if (settings) {
      setFormState(settings);
       if (settings.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
    }
  }, [settings]);


  const mutation = useMutation<AppSettings, Error, AppSettings>({
    mutationFn: saveAppSettings,
    onSuccess: (savedData) => {
      queryClient.setQueryData(['appSettings', APP_SETTINGS_DOC_ID], savedData); 
      if (savedData.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      toast({
        title: 'Settings Saved',
        description: 'Your application settings have been updated.',
      });
       queryClient.invalidateQueries({ queryKey: ['appSettings', APP_SETTINGS_DOC_ID]});
    },
    onError: (saveError) => {
      toast({
        title: 'Error Saving Settings',
        description: saveError.message || 'Could not save settings to Firestore.',
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleDarkModeToggle = (checked: boolean) => {
    const newSettings = { ...formState, darkMode: checked };
    setFormState(newSettings); 
    mutation.mutate(newSettings, {
        onSuccess: (savedData) => {
             queryClient.setQueryData(['appSettings', APP_SETTINGS_DOC_ID], savedData);
             if (savedData.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            setTimeout(() => {
              toast({ title: "Dark Mode " + (savedData.darkMode ? "Enabled" : "Disabled") });
            },0);
             queryClient.invalidateQueries({ queryKey: ['appSettings', APP_SETTINGS_DOC_ID]});
        },
        onError: (error) => { // Add onError specifically for darkMode toggle if needed
            toast({
                title: 'Error Updating Dark Mode',
                description: error.message || 'Could not save dark mode preference.',
                variant: 'destructive',
            });
        }
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formState);
  };
  
  useEffect(() => {
    if (queryError) {
      toast({
        title: 'Error Loading Settings',
        description: queryError.message || 'Could not load settings from Firestore.',
        variant: 'destructive',
      });
    }
  }, [queryError, toast]);


  if (!db) {
    return (
      <div className="space-y-8">
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Firebase Not Connected</CardTitle></CardHeader>
          <CardContent><p>Cannot load or save settings. Please ensure your Firebase project is correctly configured.</p></CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingSettings && !settings) { 
    return (
      <div className="space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-md">Loading settings...</p>
        </header>
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (isError && queryError) {
    return (
      <div className="space-y-8">
         <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-md">
            Configure application settings and preferences.
          </p>
        </header>
        <Alert variant="destructive" className="mt-4">
          <WifiOff className="h-5 w-5" />
          <AlertTitle>Failed to Load Settings</AlertTitle>
          <AlertDescription>
            Could not connect to the database to load your settings. Please check your internet connection and Firebase configuration.
            <p className="mt-2 text-xs">Error details: {queryError.message}</p>
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Store & General Settings (Offline)</CardTitle>
            <CardDescription>Settings cannot be saved while offline.</CardDescription>
          </CardHeader>
           <CardContent className="opacity-50 pointer-events-none">
            {/* Render a disabled form or a message */}
            <p>The settings form is unavailable due to a connection issue.</p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-md">
          Configure application settings and preferences. Data is saved to Firestore.
        </p>
      </header>
      
      <form onSubmit={handleSaveSettings}>
        <Card>
          <CardHeader>
              <CardTitle>Store & General Settings</CardTitle>
              <CardDescription>Manage basic application configurations. Changes are saved to Firestore.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input 
                    id="storeName" 
                    name="storeName"
                    placeholder="Your Store Name" 
                    value={formState.storeName}
                    onChange={handleInputChange}
                    disabled={mutation.isPending || !db}
                  />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="storeAddress">Store Address</Label>
                  <Textarea 
                    id="storeAddress" 
                    name="storeAddress"
                    placeholder="123 Main St, Anytown, USA" 
                    value={formState.storeAddress || ""}
                    onChange={handleInputChange} 
                    rows={2}
                    disabled={mutation.isPending || !db}
                  />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="storePhone">Store Phone</Label>
                    <Input 
                      id="storePhone" 
                      name="storePhone"
                      type="tel"
                      placeholder="(555) 123-4567" 
                      value={formState.storePhone || ""}
                      onChange={handleInputChange}
                      disabled={mutation.isPending || !db} 
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="storeWebsite">Store Website/Email</Label>
                    <Input 
                      id="storeWebsite" 
                      name="storeWebsite"
                      type="text"
                      placeholder="www.example.com or info@example.com" 
                      value={formState.storeWebsite || ""}
                      onChange={handleInputChange}
                      disabled={mutation.isPending || !db} 
                    />
                </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                  <Input 
                    id="taxRate" 
                    name="taxRate"
                    type="number" 
                    placeholder="e.g., 10 for 10%" 
                    value={formState.taxRate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={mutation.isPending || !db}
                  />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiptFooter">Receipt Footer Message</Label>
                <Textarea
                  id="receiptFooter"
                  name="receiptFooter"
                  placeholder="e.g., Thank you for shopping with us!"
                  value={formState.receiptFooter}
                  onChange={handleInputChange}
                  rows={3}
                  disabled={mutation.isPending || !db}
                />
              </div>
              <div className="flex items-center space-x-3 pt-2">
                  <Switch 
                    id="darkMode" 
                    checked={formState.darkMode}
                    onCheckedChange={handleDarkModeToggle}
                    disabled={mutation.isPending || !db}
                  />
                  <Label htmlFor="darkMode">Enable Dark Mode</Label>
              </div>
              <Button type="submit" disabled={mutation.isPending || isLoadingSettings || !db}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
          </CardContent>
        </Card>
      </form>

       <Card>
        <CardHeader>
            <CardTitle>Advanced Configuration</CardTitle>
            <CardDescription>More settings options like payment gateway integrations, detailed receipt customization, and user role permissions will be available here in future updates.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
            Application settings are now stored in your Firebase Firestore database.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
