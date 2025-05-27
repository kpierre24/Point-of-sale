// src/components/ClientLayoutWrapper.tsx
"use client";

import type React from 'react';
import { useState, useEffect } from 'react'; // Added useState, useEffect
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { APP_TITLE as DEFAULT_APP_TITLE } from '@/config/constants'; // Renamed for clarity
import type { AppSettings } from '@/types';
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

const APP_SETTINGS_KEY = 'appSettings';

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [appTitle, setAppTitle] = useState(DEFAULT_APP_TITLE);

  useEffect(() => {
    // Apply dark mode and set app title from localStorage on initial client load
    const storedSettings = localStorage.getItem(APP_SETTINGS_KEY);
    if (storedSettings) {
      try {
        const parsedSettings: AppSettings = JSON.parse(storedSettings);
        if (parsedSettings.storeName) {
          setAppTitle(parsedSettings.storeName);
        }
        if (parsedSettings.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        console.error("Failed to parse settings in ClientLayoutWrapper", e);
        setAppTitle(DEFAULT_APP_TITLE); // Fallback
        document.documentElement.classList.remove('dark'); // Fallback
      }
    } else {
        // No settings stored, use defaults
        setAppTitle(DEFAULT_APP_TITLE);
        document.documentElement.classList.remove('dark');
    }

    // Listen for changes to settings from other tabs/windows (optional but good practice)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === APP_SETTINGS_KEY && event.newValue) {
        try {
            const newSettings: AppSettings = JSON.parse(event.newValue);
            if (newSettings.storeName) setAppTitle(newSettings.storeName);
            if (newSettings.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } catch(e) { console.error("Error processing storage change", e); }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

  }, [pathname]); // Re-check on pathname change if settings might have been updated on another page

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r">
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <Home className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight text-primary">
                {appTitle}
              </h2>
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
                <h2 className="text-md font-semibold tracking-tight text-primary">{appTitle}</h2>
            </Link>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/40 min-h-[calc(100vh-3.5rem)] md:min-h-screen">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
