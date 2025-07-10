// src/components/ClientLayoutWrapper.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { APP_TITLE as DEFAULT_APP_TITLE } from '@/config/constants';
import type { AppSettings, Location } from '@/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Truck,
  Users,
  UserCog,
  Settings as SettingsIcon,
  Home,
  FileText,
  CreditCard,
  Loader2, 
  Database,
  MapPin,
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  tooltip: string;
  devOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', tooltip: 'Dashboard Overview' },
  { href: '/sales', icon: ShoppingCart, label: 'Sales', tooltip: 'Record and View Sales' },
  { href: '/products', icon: Package, label: 'Products', tooltip: 'Manage Products' },
  { href: '/recipes', icon: ClipboardList, label: 'Recipes', tooltip: 'Manage Product Recipes/Builds' },
  { href: '/purchases', icon: Truck, label: 'Purchases', tooltip: 'Manage Stock Purchases' },
  { href: '/customers', icon: Users, label: 'Customers', tooltip: 'Manage Customers' },
  { href: '/topup-cards', icon: CreditCard, label: 'Top-Up Cards', tooltip: 'Manage Customer Top-Up Cards' },
  { href: '/reports', icon: FileText, label: 'Reports', tooltip: 'View Business Reports' },
  { href: '/users', icon: UserCog, label: 'Staff', tooltip: 'Manage Staff Users' },
];

const settingsNavItems: NavItem[] = [
 { href: '/locations', icon: MapPin, label: 'Locations', tooltip: 'Manage Store Locations' },
 { href: '/settings', icon: SettingsIcon, label: 'Settings', tooltip: 'Application Settings' },
 { href: '/migrate-data', icon: Database, label: 'Migrate Data (Dev)', tooltip: 'Migrate Local Storage to Firestore', devOnly: true },
];

const APP_SETTINGS_DOC_ID = 'current'; 
const LOCATIONS_COLLECTION = 'locations';
const queryClient = new QueryClient(); 

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [appTitle, setAppTitle] = useState(DEFAULT_APP_TITLE);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const { toast } = useToast();
  
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const storedLocation = sessionStorage.getItem('selectedLocationId');
    if (storedLocation) {
        setSelectedLocation(storedLocation);
    }
    
    if (!db) {
      console.warn("Firestore not available. Using default settings.");
      setIsSettingsLoading(false);
      return;
    }

    setIsSettingsLoading(true);
    const settingsDocRef = doc(db, 'appSettings', APP_SETTINGS_DOC_ID);
    const unsubscribeSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const loadedSettings = docSnap.data() as AppSettings;
        setAppTitle(loadedSettings.storeName || DEFAULT_APP_TITLE);
        if (loadedSettings.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        setAppTitle(DEFAULT_APP_TITLE);
        document.documentElement.classList.remove('dark');
      }
      setIsSettingsLoading(false);
    }, (error) => {
      console.error("Error fetching app settings from Firestore:", error);
      toast({
        title: "Error Loading Settings",
        description: `Could not load app settings: ${error.message}`,
        variant: "destructive",
      });
      setIsSettingsLoading(false);
    });

    const fetchLocations = async () => {
        try {
            const locationsColRef = collection(db, LOCATIONS_COLLECTION);
            const snapshot = await getDocs(locationsColRef);
            const fetchedLocations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
            setLocations(fetchedLocations);

            if (!sessionStorage.getItem('selectedLocationId') && fetchedLocations.length > 0) {
                const defaultLocationId = fetchedLocations[0].id;
                sessionStorage.setItem('selectedLocationId', defaultLocationId);
                setSelectedLocation(defaultLocationId);
            }
        } catch (error) {
            console.error("Error fetching locations:", error);
            toast({
                title: "Error Loading Locations",
                description: "Could not load store locations.",
                variant: "destructive"
            });
        }
    };
    fetchLocations();

    return () => unsubscribeSettings(); 
  }, [toast]);

  const handleLocationChange = (locationId: string) => {
      sessionStorage.setItem('selectedLocationId', locationId);
      setSelectedLocation(locationId);
  };

  const LocationSelector = () => (
    <div className="space-y-1 p-2">
        <Label className="px-2 text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            Location
        </Label>
        <Select
            value={selectedLocation || undefined}
            onValueChange={handleLocationChange}
            disabled={locations.length === 0}
        >
            <SelectTrigger className="group-data-[collapsible=icon]:hidden">
                <SelectValue placeholder="Select Location" />
            </SelectTrigger>
            <SelectContent>
                {locations.length > 0 ? (
                    locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))
                ) : (
                    <SelectItem value="no-locations-placeholder" disabled>No locations found</SelectItem>
                )}
            </SelectContent>
        </Select>
    </div>
);

  const isAppPage = (children as React.ReactElement)?.props?.isAppPage;

  if (!isAppPage) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r">
          <SidebarHeader className="p-4">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                <Home className="h-6 w-6 text-primary" />
                {isSettingsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <h2 className="text-lg font-semibold tracking-tight text-primary">
                    {appTitle}
                  </h2>
                )}
              </Link>
              <SidebarTrigger className="group-data-[collapsible=icon]:hidden md:flex" />
            </div>
          </SidebarHeader>
          <SidebarContent className="flex-grow p-2 flex flex-col">
            <LocationSelector />
            <SidebarMenu className="space-y-1 flex-grow">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.tooltip}
                    >
                      <a>
                        <item.icon />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-2 border-t">
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                 (item.devOnly && process.env.NODE_ENV !== 'development') ? null : (
                    <SidebarMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                        <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.tooltip}
                        className={item.devOnly ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10' : ''}
                        >
                        <a>
                            <item.icon />
                            <span>{item.label}</span>
                        </a>
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                 )
              ))}
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
              <SidebarTrigger />
              <Link href="/dashboard" className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  {isSettingsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <h2 className="text-md font-semibold tracking-tight text-primary">{appTitle}</h2>
                  )}
              </Link>
          </header>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/40 min-h-[calc(100vh-3.5rem)] md:min-h-screen">
              {React.cloneElement(children as React.ReactElement, { selectedLocationId: selectedLocation })}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
