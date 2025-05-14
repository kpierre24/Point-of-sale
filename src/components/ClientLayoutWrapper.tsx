// src/components/ClientLayoutWrapper.tsx
"use client";

import type React from 'react';
import { useEffect } from 'react'; // Added useEffect
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Added useRouter
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
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { APP_TITLE } from '@/config/constants';
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
  LogOut,
  UserCircle2, // Added UserCircle2
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'; // Import Avatar components
import { Skeleton } from './ui/skeleton'; // Import Skeleton

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  tooltip: string;
  roles?: string[]; // Optional roles to control visibility
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', tooltip: 'Dashboard Overview' },
  { href: '/sales', icon: ShoppingCart, label: 'Sales', tooltip: 'Record and View Sales', roles: ['Admin', 'Manager', 'Cashier', 'Staff'] },
  { href: '/products', icon: Package, label: 'Products', tooltip: 'Manage Products', roles: ['Admin', 'Manager'] },
  { href: '/recipes', icon: ClipboardList, label: 'Recipes', tooltip: 'Manage Product Recipes/Builds', roles: ['Admin', 'Manager'] },
  { href: '/purchases', icon: Truck, label: 'Purchases', tooltip: 'Manage Stock Purchases', roles: ['Admin', 'Manager'] },
  { href: '/customers', icon: Users, label: 'Customers', tooltip: 'Manage Customers', roles: ['Admin', 'Manager', 'Cashier'] },
  { href: '/reports', icon: FileText, label: 'Reports', tooltip: 'View Business Reports', roles: ['Admin', 'Manager'] },
  { href: '/users', icon: UserCog, label: 'Staff', tooltip: 'Manage Staff Users', roles: ['Admin'] },
];

const settingsNavItems: NavItem[] = [
 { href: '/settings', icon: SettingsIcon, label: 'Settings', tooltip: 'Application Settings', roles: ['Admin'] },
];

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, currentUserProfile, logout, loading } = useAuth();

  useEffect(() => {
    const isAuthPage = pathname.startsWith('/auth/');
    const isSplashPage = pathname.startsWith('/(splash)');

    if (!loading && !currentUser && !isAuthPage && !isSplashPage) {
      router.replace('/auth/login');
    }
  }, [currentUser, loading, pathname, router]);

  // If loading or not authenticated and not on an auth/splash page, show minimal or loading UI
  if (loading || (!currentUser && !pathname.startsWith('/auth/') && !pathname.startsWith('/(splash)'))) {
    // You might want a more sophisticated loading screen here
    // For now, if it's not an auth/splash page and we're in this state, children might not be what we want to render.
    // If children is the login page itself, it's fine.
    return <>{children}</>; 
  }
  
  // If user is not authenticated and is on an auth/splash page, render children (e.g. Login, Splash)
  if (!currentUser && (pathname.startsWith('/auth/') || pathname.startsWith('/(splash)'))) {
    return <>{children}</>;
  }

  // If user is authenticated, render the full layout
  const userRole = currentUserProfile?.role;

  const filterNavItemsByRole = (items: NavItem[]) => {
    if (!userRole) return []; // Or return a default set for no role
    return items.filter(item => !item.roles || item.roles.includes(userRole));
  };
  
  const visibleNavItems = filterNavItemsByRole(navItems);
  const visibleSettingsNavItems = filterNavItemsByRole(settingsNavItems);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r">
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <Home className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight text-primary">
                {APP_TITLE}
              </h2>
            </Link>
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden md:flex" />
          </div>
        </SidebarHeader>
        <SidebarContent className="flex-grow p-2 flex flex-col">
          <SidebarMenu className="space-y-1 flex-grow">
            {visibleNavItems.map((item) => (
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
          {/* User Profile Section - visible when sidebar is expanded */}
           <div className="p-2 border-t mt-auto group-data-[collapsible=icon]:hidden">
            {loading && <Skeleton className="h-10 w-full" />}
            {!loading && currentUserProfile && (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {/* Placeholder for user image - next/image or Firebase Storage URL */}
                  {/* <AvatarImage src="https://picsum.photos/id/237/100/100" alt={currentUserProfile.name} data-ai-hint="profile picture" /> */}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(currentUserProfile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[120px]">{currentUserProfile.name}</span>
                  <span className="text-xs text-muted-foreground">{currentUserProfile.role}</span>
                </div>
              </div>
            )}
          </div>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t">
           <SidebarMenu>
            {visibleSettingsNavItems.map((item) => (
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
             <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} tooltip="Log Out">
                  <LogOut />
                  <span>Log Out</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
            <SidebarTrigger />
             <Link href="/dashboard" className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <h2 className="text-md font-semibold tracking-tight text-primary">{APP_TITLE}</h2>
            </Link>
            {/* Mobile User Profile/Logout - could be a dropdown */}
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/40 min-h-[calc(100vh-3.5rem)] md:min-h-screen">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
