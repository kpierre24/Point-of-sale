// src/app/settings/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { APP_TITLE, TAX_RATE as DEFAULT_TAX_RATE_PERCENT } from '@/config/constants';
import { Save } from 'lucide-react';

const APP_SETTINGS_KEY = 'appSettings';

const defaultSettings: AppSettings = {
  storeName: APP_TITLE,
  taxRate: (DEFAULT_TAX_RATE_PERCENT * 100).toString(), // Store as string, e.g., "10"
  receiptFooter: "Thank you for your business!",
  darkMode: false,
  storeAddress: "",
  storePhone: "",
  storeWebsite: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedSettings = localStorage.getItem(APP_SETTINGS_KEY);
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        // Ensure all fields from defaultSettings are present, even if not in storedSettings
        const mergedSettings = { ...defaultSettings, ...parsedSettings };
        setSettings(mergedSettings);
        if (mergedSettings.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        console.error("Failed to parse settings from localStorage", e);
        setSettings(defaultSettings);
      }
    } else {
        setSettings(defaultSettings); // Initialize with defaults if nothing in storage
    }
    setIsLoading(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setSettings(prev => {
      const newSettings = { ...prev, darkMode: checked };
      localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(newSettings));
      if (checked) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      setTimeout(() => {
        toast({ title: "Dark Mode " + (checked ? "Enabled" : "Disabled") });
      }, 0);
      return newSettings;
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
     // Validate tax rate
    const tax = parseFloat(settings.taxRate);
    if (isNaN(tax) || tax < 0 || tax > 100) {
      toast({
        title: 'Invalid Tax Rate',
        description: 'Tax rate must be a number between 0 and 100.',
        variant: 'destructive',
      });
      return;
    }
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
    toast({
      title: 'Settings Saved',
      description: 'Your application settings have been updated.',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-md">Loading settings...</p>
        </header>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-md">
          Configure application settings and preferences.
        </p>
      </header>
      
      <form onSubmit={handleSaveSettings}>
        <Card>
          <CardHeader>
              <CardTitle>Store & General Settings</CardTitle>
              <CardDescription>Manage basic application configurations. Changes are saved locally.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input 
                    id="storeName" 
                    name="storeName"
                    placeholder="Your Store Name" 
                    value={settings.storeName}
                    onChange={handleInputChange} 
                  />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="storeAddress">Store Address</Label>
                  <Textarea 
                    id="storeAddress" 
                    name="storeAddress"
                    placeholder="123 Main St, Anytown, USA" 
                    value={settings.storeAddress || ""}
                    onChange={handleInputChange} 
                    rows={2}
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
                      value={settings.storePhone || ""}
                      onChange={handleInputChange} 
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="storeWebsite">Store Website/Email</Label>
                    <Input 
                      id="storeWebsite" 
                      name="storeWebsite"
                      type="text"
                      placeholder="www.example.com or info@example.com" 
                      value={settings.storeWebsite || ""}
                      onChange={handleInputChange} 
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
                    value={settings.taxRate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                  />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receiptFooter">Receipt Footer Message</Label>
                <Textarea
                  id="receiptFooter"
                  name="receiptFooter"
                  placeholder="e.g., Thank you for shopping with us!"
                  value={settings.receiptFooter}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-3 pt-2">
                  <Switch 
                    id="darkMode" 
                    checked={settings.darkMode}
                    onCheckedChange={handleDarkModeToggle}
                  />
                  <Label htmlFor="darkMode">Enable Dark Mode</Label>
              </div>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
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
            Current settings are stored in your browser's local storage.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
