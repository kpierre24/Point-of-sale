// src/components/ClientLayoutWrapper.tsx
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Added
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
import { APP_TITLE as DEFAULT_APP_TITLE } from '@/config/constants';
import type { AppSettings } from '@/types';
import { db } from '@/lib/firebase'; // Added
import { doc, getDoc } from 'firebase/firestore'; // Added
import { useToast } from '@/hooks/use-toast'; // Added
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
  Loader2, // Added
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  tooltip: string;
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
 { href: '/settings', icon: SettingsIcon, label: 'Settings', tooltip: 'Application Settings' },
];

const APP_SETTINGS_DOC_ID = 'current'; // Document ID for app settings in Firestore
const queryClient = new QueryClient(); // Create a client

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [appTitle, setAppTitle] = useState(DEFAULT_APP_TITLE);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAppSettings = async () => {
      setIsSettingsLoading(true);
      if (!db) {
        console.warn("Firestore not available. Using default settings.");
        toast({
          title: "Firebase Not Connected",
          description: "App settings could not be loaded. Using defaults. Please check Firebase configuration.",
          variant: "destructive",
          duration: 10000,
        });
        setAppTitle(DEFAULT_APP_TITLE);
        document.documentElement.classList.remove('dark');
        setIsSettingsLoading(false);
        return;
      }

      try {
        const settingsDocRef = doc(db, 'appSettings', APP_SETTINGS_DOC_ID);
        const docSnap = await getDoc(settingsDocRef);

        if (docSnap.exists()) {
          const loadedSettings = docSnap.data() as AppSettings;
          if (loadedSettings.storeName) {
            setAppTitle(loadedSettings.storeName);
          } else {
            setAppTitle(DEFAULT_APP_TITLE);
          }
          if (loadedSettings.darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } else {
          // No settings in Firestore, use defaults
          setAppTitle(DEFAULT_APP_TITLE);
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error("Error fetching app settings from Firestore:", error);
        toast({
          title: "Error Loading Settings",
          description: "Could not load app settings from Firestore. Using defaults.",
          variant: "destructive",
        });
        setAppTitle(DEFAULT_APP_TITLE);
        document.documentElement.classList.remove('dark');
      } finally {
        setIsSettingsLoading(false);
      }
    };

    fetchAppSettings();
    // Consider adding a listener for Firestore settings changes if real-time updates are needed across tabs
    // For now, settings are primarily managed on the /settings page and re-fetched on navigation/reload.
  }, [pathname, toast]); // Re-fetch on pathname change to reflect potential updates from settings page


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
              {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
