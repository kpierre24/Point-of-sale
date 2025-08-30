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
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
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
  PackageCheck,
  Landmark,
  DollarSign,
  Keyboard,
  Zap,
  BarChart3,
  HardDriveDownload,
  Archive,
} from 'lucide-react';
import { LocationProvider, useLocation } from '@/context/LocationContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NotificationCenter } from '@/components/ui/notification-center';
import { KeyboardShortcutsHelp } from '@/components/ui/keyboard-shortcuts-help';
import { useKeyboardShortcuts, useKeyboardShortcutsHelp, commonShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { PermissionProvider } from '@/hooks/use-permissions';
import { HeaderConnectionStatus, OfflineBanner } from '@/components/ui/connection-status';

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
  { href: '/stock-take', icon: PackageCheck, label: 'Stock Take', tooltip: 'Initial Inventory Count' },
  { href: '/recipes', icon: ClipboardList, label: 'Recipes', tooltip: 'Manage Product Recipes/Builds' },
  { href: '/purchases', icon: Truck, label: 'Purchases', tooltip: 'Manage Stock Purchases' },
  { href: '/cash-reconciliation', icon: Landmark, label: 'Reconciliation', tooltip: 'End-of-day Cash Reconciliation' },
  { href: '/petty-cash', icon: DollarSign, label: 'Petty Cash', tooltip: 'Manage Petty Cash' },
  { href: '/customers', icon: Users, label: 'Customers', tooltip: 'Manage Customers' },
  { href: '/crm', icon: Users, label: 'CRM', tooltip: 'Customer Relationship Management' },
  { href: '/topup-cards', icon: CreditCard, label: 'Top-Up Cards', tooltip: 'Manage Customer Top-Up Cards' },
  { href: '/reports', icon: FileText, label: 'Reports', tooltip: 'View Business Reports' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics', tooltip: 'Advanced Analytics & Insights' },
  { href: '/users', icon: UserCog, label: 'Staff', tooltip: 'Manage Staff Users' },
  { href: '/features-demo', icon: Zap, label: 'Enhanced Features', tooltip: 'View New Features Demo', devOnly: true },
];

const settingsNavItems: NavItem[] = [
 { href: '/locations', icon: MapPin, label: 'Locations', tooltip: 'Manage Store Locations' },
 { href: '/team', icon: UserCog, label: 'Team', tooltip: 'Team Time Tracking & Management' },
 { href: '/settings', icon: SettingsIcon, label: 'Settings', tooltip: 'Application Settings' },
 { href: '/export', icon: HardDriveDownload, label: 'Export Data', tooltip: 'Download your data' },
 { href: '/migrate-data', icon: Database, label: 'Migrate Data (Dev)', tooltip: 'Migrate Local Storage to Firestore', devOnly: true },
];

const APP_SETTINGS_DOC_ID = 'current'; 
const LOCATIONS_COLLECTION = 'locations';
const queryClient = new QueryClient(); 

function LocationAwareLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [appTitle, setAppTitle] = useState(DEFAULT_APP_TITLE);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const { selectedLocationId, setSelectedLocationId } = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Enhanced features
  const { addNotification, addRule } = useNotifications();
  const { isOpen: isShortcutsOpen, toggleHelp, closeHelp } = useKeyboardShortcutsHelp();
  
  const hasInitialized = useRef(false);

  // Initialize business notification rules
  React.useEffect(() => {
    // Only initialize rules once
    if (hasInitialized.current) return;
    
    // Add default business notification rules
    const businessRules = [
      {
        name: "Low Stock Alert",
        condition: (data: any) => data.type === "inventory" && data.stockLevel <= data.lowStockThreshold,
        template: (data: any) => ({
          title: "Low Stock Alert",
          message: `${data.productName} is running low (${data.stockLevel} remaining)`,
          type: "warning" as const,
          persistent: true,
          category: "inventory",
          actionLabel: "Restock",
          actionUrl: "/products",
        }),
        enabled: true,
        category: "inventory",
      },
      {
        name: "Out of Stock Alert",
        condition: (data: any) => data.type === "inventory" && data.stockLevel <= 0,
        template: (data: any) => ({
          title: "Out of Stock",
          message: `${data.productName} is out of stock`,
          type: "error" as const,
          persistent: true,
          category: "inventory",
          actionLabel: "Restock",
          actionUrl: "/products",
        }),
        enabled: true,
        category: "inventory",
      },
      {
        name: "High Sales Volume",
        condition: (data: any) => data.type === "sales" && data.dailySales > data.averageDailySales * 1.5,
        template: (data: any) => ({
          title: "High Sales Day!",
          message: `Today's sales ($${data.dailySales}) are 50% above average`,
          type: "success" as const,
          category: "sales",
        }),
        enabled: true,
        category: "sales",
      },
      {
        name: "New Customer Welcome",
        condition: (data: any) => data.type === "customer" && data.isNewCustomer,
        template: (data: any) => ({
          title: "New Customer",
          message: `Welcome ${data.customerName} to your store!`,
          type: "info" as const,
          category: "customers",
        }),
        enabled: true,
        category: "customers",
      },
      {
        name: "Large Sale Alert",
        condition: (data: any) => data.type === "sale" && data.amount > 500,
        template: (data: any) => ({
          title: "Large Sale Completed",
          message: `Sale of $${data.amount} completed successfully`,
          type: "success" as const,
          category: "sales",
        }),
        enabled: true,
        category: "sales",
      },
    ];

    // Add each rule only once
    businessRules.forEach(rule => {
      addRule(rule);
    });

    // Demo notification to show the system is working
    setTimeout(() => {
      addNotification({
        title: "System Ready",
        message: "Enhanced notification system is active with business rules",
        type: "success",
      });
    }, 2000);
  }, [addRule, addNotification]);

  // Keyboard shortcuts
  const shortcuts = React.useMemo(() => [
    ...commonShortcuts.map(shortcut => ({
      ...shortcut,
      action: shortcut.key === "?" ? toggleHelp : () => {
        if (shortcut.key === "n" && shortcut.ctrlKey) {
          addNotification({
            title: "Quick Action",
            message: "Keyboard shortcut activated!",
            type: "info" as const,
          });
        }
      },
    })),
    {
      key: "d",
      ctrlKey: true,
      action: () => window.location.href = "/dashboard",
      description: "Go to Dashboard",
      category: "Navigation",
    },
    {
      key: "s",
      ctrlKey: true,
      action: () => window.location.href = "/sales",
      description: "Go to Sales",
      category: "Navigation",
    },
    {
      key: "p",
      ctrlKey: true,
      action: () => window.location.href = "/products",
      description: "Go to Products",
      category: "Navigation",
    },
  ], [toggleHelp, addNotification]);

  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
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

            const storedLocation = sessionStorage.getItem('selectedLocationId');
            if (storedLocation) {
                setSelectedLocationId(storedLocation);
            } else if (fetchedLocations.length > 0) {
                const defaultLocationId = fetchedLocations[0].id;
                setSelectedLocationId(defaultLocationId);
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
  }, [toast, setSelectedLocationId]);

  const handleLocationChange = (locationId: string) => {
      setSelectedLocationId(locationId);
  };

  const LocationSelector = () => (
    <div className="space-y-1 p-2">
        <Label className="px-2 text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            Location
        </Label>
        <Select
            value={selectedLocationId || undefined}
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
  
  const isSplashPage = pathname === '/';
  const isLookupPage = pathname.startsWith('/card-lookup');
  
  if (isSplashPage || isLookupPage) {
    return <>{children}</>;
  }

  // Render the full application layout with sidebar
  return (
      <SidebarProvider defaultOpen={!isMobile}>
        <Sidebar 
          collapsible={isMobile ? "offcanvas" : "icon"} 
          side="left" 
          variant="sidebar" 
          className="border-r"
        >
          <SidebarHeader className="p-4 touch-manipulation">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden touch-manipulation min-h-[44px]">
                <Home className="h-6 w-6 text-primary flex-shrink-0" />
                {isSettingsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <h2 className="text-lg font-semibold tracking-tight text-primary truncate">
                    {appTitle}
                  </h2>
                )}
              </Link>
              <SidebarTrigger className="group-data-[collapsible=icon]:hidden md:flex h-10 w-10 touch-manipulation" />
            </div>
          </SidebarHeader>
          <SidebarContent className="flex-grow p-2 flex flex-col">
            <LocationSelector />
            
            {/* Main Navigation Section */}
            <div className="space-y-1">
              <div className="px-2 py-1.5">
                <h3 className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                  Main
                </h3>
              </div>
              <SidebarMenu className="space-y-1">
                {navItems.slice(0, 3).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.tooltip}
                        className={cn(
                          "transition-all duration-200",
                          pathname.startsWith(item.href) && 
                          "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border-l-2 border-primary"
                        )}
                      >
                        <a className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>

            {/* Inventory Section */}
            <div className="space-y-1 mt-4">
              <div className="px-2 py-1.5">
                <h3 className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                  Inventory
                </h3>
              </div>
              <SidebarMenu className="space-y-1">
                {navItems.slice(3, 6).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.tooltip}
                        className={cn(
                          "transition-all duration-200",
                          pathname.startsWith(item.href) && 
                          "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border-l-2 border-primary"
                        )}
                      >
                        <a className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>

            {/* Financial Section */}
            <div className="space-y-1 mt-4">
              <div className="px-2 py-1.5">
                <h3 className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                  Financial
                </h3>
              </div>
              <SidebarMenu className="space-y-1">
                {navItems.slice(6, 8).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.tooltip}
                        className={cn(
                          "transition-all duration-200",
                          pathname.startsWith(item.href) && 
                          "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border-l-2 border-primary"
                        )}
                      >
                        <a className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>

            {/* Customer Management Section */}
            <div className="space-y-1 mt-4">
              <div className="px-2 py-1.5">
                <h3 className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                  Customers
                </h3>
              </div>
              <SidebarMenu className="space-y-1">
                {navItems.slice(8, 11).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.tooltip}
                        className={cn(
                          "transition-all duration-200",
                          pathname.startsWith(item.href) && 
                          "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border-l-2 border-primary"
                        )}
                      >
                        <a className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>

            {/* Administration Section */}
            <div className="space-y-1 mt-4 flex-grow">
              <div className="px-2 py-1.5">
                <h3 className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                  Admin
                </h3>
              </div>
              <SidebarMenu className="space-y-1">
                {navItems.slice(11).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.tooltip}
                        className={cn(
                          "transition-all duration-200",
                          pathname.startsWith(item.href) && 
                          "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border-l-2 border-primary"
                        )}
                      >
                        <a className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          </SidebarContent>
          <SidebarFooter className="p-2 border-t bg-sidebar-accent/20">
            <div className="space-y-1">
              <div className="px-2 py-1.5">
                <h3 className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                  Settings
                </h3>
              </div>
              <SidebarMenu className="space-y-1">
                {settingsNavItems.map((item) => (
                   (item.devOnly && process.env.NODE_ENV !== 'development') ? null : (
                      <SidebarMenuItem key={item.href}>
                      <Link href={item.href} legacyBehavior passHref>
                          <SidebarMenuButton
                          asChild
                          isActive={pathname.startsWith(item.href)}
                          tooltip={item.tooltip}
                          className={cn(
                            "transition-all duration-200",
                            pathname.startsWith(item.href) && 
                            "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border-l-2 border-primary",
                            item.devOnly && 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/10'
                          )}
                          >
                          <a className="flex items-center gap-3">
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                          </a>
                          </SidebarMenuButton>
                      </Link>
                      </SidebarMenuItem>
                   )
                ))}
              </SidebarMenu>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          {/* Enhanced Desktop Header */}
          <header className="hidden md:flex sticky top-0 z-30 h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9" />
              {selectedLocationId && locations.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">
                    {locations.find(loc => loc.id === selectedLocationId)?.name || 'Unknown Location'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <HeaderConnectionStatus />
              <Button variant="ghost" size="sm" onClick={toggleHelp}>
                <Keyboard className="h-4 w-4 mr-2" />
                Shortcuts
              </Button>
              <ThemeToggle />
              <NotificationCenter />
            </div>
          </header>

          {/* Enhanced Mobile Header with Touch-Friendly Elements */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:hidden">
              <SidebarTrigger className="h-10 w-10 touch-manipulation" />
              <Link href="/dashboard" className="flex items-center gap-3 touch-manipulation min-h-[44px]">
                  <Home className="h-6 w-6 text-primary" />
                  {isSettingsLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <h2 className="text-lg font-semibold tracking-tight text-primary truncate">{appTitle}</h2>
                  )}
              </Link>
              
              {/* Mobile Controls */}
              <div className="ml-auto flex items-center gap-2">
                <HeaderConnectionStatus />
                <ThemeToggle />
                <NotificationCenter />
              </div>
          </header>

          <OfflineBanner />
          
          {/* Mobile Bottom Navigation - Only visible on small screens */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t md:hidden">
            <div className="grid grid-cols-4 h-16">
              <Link 
                href="/dashboard" 
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors touch-manipulation",
                  pathname.startsWith('/dashboard') 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link 
                href="/sales" 
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors touch-manipulation",
                  pathname.startsWith('/sales') 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Sales</span>
              </Link>
              <Link 
                href="/products" 
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors touch-manipulation",
                  pathname.startsWith('/products') 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <Package className="h-5 w-5" />
                <span>Products</span>
              </Link>
              <Link 
                href="/reports" 
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors touch-manipulation",
                  pathname.startsWith('/reports') 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <FileText className="h-5 w-5" />
                <span>Reports</span>
              </Link>
            </div>
          </nav>
          
          {/* Main Content Area with Responsive Padding - Account for mobile bottom nav */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 bg-muted/40 min-h-[calc(100vh-4rem)] md:min-h-screen pb-20 md:pb-3">
            {children}
          </div>
        </SidebarInset>
        
        {/* Keyboard Shortcuts Help Dialog */}
        <KeyboardShortcutsHelp
          isOpen={isShortcutsOpen}
          onClose={closeHelp}
          shortcuts={shortcuts}
        />
      </SidebarProvider>
  );
}


// Mock user for demonstration - in a real app, this would come from authentication
const mockUser = {
  id: "current-user",
  name: "Demo User",
  email: "demo@example.com",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  role: {
    id: "manager",
    name: "manager",
    permissions: [
      { id: "1", resource: "products", action: "read" },
      { id: "2", resource: "products", action: "create" },
      { id: "3", resource: "products", action: "update" },
      { id: "4", resource: "sales", action: "read" },
      { id: "5", resource: "sales", action: "create" },
      { id: "6", resource: "reports", action: "read" },
      { id: "7", resource: "users", action: "read" },
      { id: "8", resource: "time", action: "read" },
      { id: "9", resource: "time", action: "create" },
    ]
  },
  permissions: []
};

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <PermissionProvider user={mockUser}>
                <LocationProvider>
                    <LocationAwareLayout>{children}</LocationAwareLayout>
                </LocationProvider>
            </PermissionProvider>
        </QueryClientProvider>
    );
}
