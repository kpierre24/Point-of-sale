"use client"

import * as React from "react"

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  timestamp: Date
  read: boolean
  persistent?: boolean
  actionLabel?: string
  actionUrl?: string
  category?: string
}

export interface NotificationRule {
  id: string
  name: string
  condition: (data: any) => boolean
  template: (data: any) => Omit<Notification, "id" | "timestamp" | "read">
  enabled: boolean
  category: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  rules: NotificationRule[]
  addRule: (rule: Omit<NotificationRule, "id">) => void
  updateRule: (id: string, updates: Partial<NotificationRule>) => void
  removeRule: (id: string) => void
  checkRules: (data: any) => void
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [rules, setRules] = React.useState<NotificationRule[]>([])

  // Load from localStorage on mount
  React.useEffect(() => {
    const savedNotifications = localStorage.getItem("app-notifications")
    const savedRules = localStorage.getItem("notification-rules")
    
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications)
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })))
      } catch (error) {
        console.error("Failed to load notifications:", error)
      }
    }

    if (savedRules) {
      try {
        setRules(JSON.parse(savedRules))
      } catch (error) {
        console.error("Failed to load notification rules:", error)
      }
    }
  }, [])

  // Save to localStorage when notifications change
  React.useEffect(() => {
    localStorage.setItem("app-notifications", JSON.stringify(notifications))
  }, [notifications])

  // Save rules to localStorage
  React.useEffect(() => {
    localStorage.setItem("notification-rules", JSON.stringify(rules))
  }, [rules])

  const addNotification = React.useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      timestamp: new Date(),
      read: false,
    }

    setNotifications(prev => [newNotification, ...prev])

    // Auto-remove non-persistent notifications after 5 seconds
    if (!notification.persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
      }, 5000)
    }
  }, [])

  const markAsRead = React.useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  const markAllAsRead = React.useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = React.useCallback(() => {
    setNotifications([])
  }, [])

  const addRule = React.useCallback((rule: Omit<NotificationRule, "id">) => {
    const newRule: NotificationRule = {
      ...rule,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
    }
    setRules(prev => [...prev, newRule])
  }, [])

  const updateRule = React.useCallback((id: string, updates: Partial<NotificationRule>) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ))
  }, [])

  const removeRule = React.useCallback((id: string) => {
    setRules(prev => prev.filter(rule => rule.id !== id))
  }, [])

  const checkRules = React.useCallback((data: any) => {
    rules.forEach(rule => {
      try {
        if (rule.enabled && typeof rule.condition === 'function' && rule.condition(data)) {
          const notification = rule.template(data)
          addNotification(notification)
        }
      } catch (error) {
        console.error('Error checking notification rule:', rule.name, error)
      }
    })
  }, [rules, addNotification])

  const unreadCount = React.useMemo(() => {
    return notifications.filter(n => !n.read).length
  }, [notifications])

  const value = React.useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    rules,
    addRule,
    updateRule,
    removeRule,
    checkRules,
  }), [
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    rules,
    addRule,
    updateRule,
    removeRule,
    checkRules,
  ])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = React.useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}