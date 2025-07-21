"use client"

import * as React from "react"
import type { User, Permission } from "@/types/team"

interface PermissionContextType {
  user: User | null
  permissions: Permission[]
  hasPermission: (resource: string, action: string) => boolean
  hasAnyPermission: (permissions: Array<{ resource: string; action: string }>) => boolean
  hasAllPermissions: (permissions: Array<{ resource: string; action: string }>) => boolean
  isAdmin: boolean
  canAccess: (requiredPermissions: string[]) => boolean
}

const PermissionContext = React.createContext<PermissionContextType | undefined>(undefined)

export function PermissionProvider({ 
  children, 
  user 
}: { 
  children: React.ReactNode
  user: User | null 
}) {
  const permissions = React.useMemo(() => {
    if (!user) return []
    return [...user.permissions, ...user.role.permissions]
  }, [user])

  const hasPermission = React.useCallback((resource: string, action: string) => {
    if (!user) return false
    return permissions.some(p => p.resource === resource && p.action === action)
  }, [user, permissions])

  const hasAnyPermission = React.useCallback((requiredPermissions: Array<{ resource: string; action: string }>) => {
    if (!user) return false
    return requiredPermissions.some(({ resource, action }) => hasPermission(resource, action))
  }, [user, hasPermission])

  const hasAllPermissions = React.useCallback((requiredPermissions: Array<{ resource: string; action: string }>) => {
    if (!user) return false
    return requiredPermissions.every(({ resource, action }) => hasPermission(resource, action))
  }, [user, hasPermission])

  const isAdmin = React.useMemo(() => {
    return user?.role.name === "admin" || hasPermission("*", "*")
  }, [user, hasPermission])

  const canAccess = React.useCallback((requiredPermissions: string[]) => {
    if (!user) return false
    if (isAdmin) return true
    
    return requiredPermissions.every(permission => {
      const [resource, action] = permission.split(":")
      return hasPermission(resource, action)
    })
  }, [user, isAdmin, hasPermission])

  const value = React.useMemo(() => ({
    user,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    canAccess,
  }), [user, permissions, hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, canAccess])

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  const context = React.useContext(PermissionContext)
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider")
  }
  return context
}

// Permission-based component wrapper
interface ProtectedComponentProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  fallback?: React.ReactNode
  requireAll?: boolean
}

export function ProtectedComponent({ 
  children, 
  requiredPermissions = [], 
  fallback = null,
  requireAll = true 
}: ProtectedComponentProps) {
  const { canAccess, hasAnyPermission } = usePermissions()

  if (requiredPermissions.length === 0) {
    return <>{children}</>
  }

  const hasAccess = requireAll 
    ? canAccess(requiredPermissions)
    : hasAnyPermission(requiredPermissions.map(p => {
        const [resource, action] = p.split(":")
        return { resource, action }
      }))

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Default permissions for common resources
export const PERMISSIONS = {
  // Products
  PRODUCTS_VIEW: "products:read",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_EDIT: "products:update",
  PRODUCTS_DELETE: "products:delete",
  
  // Sales
  SALES_VIEW: "sales:read",
  SALES_CREATE: "sales:create",
  SALES_EDIT: "sales:update",
  SALES_DELETE: "sales:delete",
  
  // Customers
  CUSTOMERS_VIEW: "customers:read",
  CUSTOMERS_CREATE: "customers:create",
  CUSTOMERS_EDIT: "customers:update",
  CUSTOMERS_DELETE: "customers:delete",
  
  // Reports
  REPORTS_VIEW: "reports:read",
  REPORTS_EXPORT: "reports:export",
  
  // Users
  USERS_VIEW: "users:read",
  USERS_CREATE: "users:create",
  USERS_EDIT: "users:update",
  USERS_DELETE: "users:delete",
  
  // Settings
  SETTINGS_VIEW: "settings:read",
  SETTINGS_EDIT: "settings:update",
  
  // Admin
  ADMIN_ALL: "*:*",
} as const