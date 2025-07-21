"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotifications, type Notification } from "@/hooks/use-notifications"
import { formatDistanceToNow } from "date-fns"

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onRemove: (id: string) => void
}

function NotificationItem({ notification, onMarkAsRead, onRemove }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-success" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <Info className="h-4 w-4 text-primary" />
    }
  }

  const getBgColor = () => {
    if (notification.read) return ""
    
    switch (notification.type) {
      case "success":
        return "bg-success/5 border-success/20"
      case "warning":
        return "bg-warning/5 border-warning/20"
      case "error":
        return "bg-destructive/5 border-destructive/20"
      default:
        return "bg-primary/5 border-primary/20"
    }
  }

  return (
    <div className={cn(
      "p-3 border rounded-md transition-all duration-200 hover:shadow-sm",
      getBgColor(),
      !notification.read && "border-l-4"
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={cn(
                "text-sm font-medium",
                !notification.read && "font-semibold"
              )}>
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.message}
              </p>
              
              {notification.actionLabel && notification.actionUrl && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-2 text-xs"
                  asChild
                >
                  <a href={notification.actionUrl}>
                    {notification.actionLabel}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="h-6 w-6 p-0"
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(notification.id)}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                title="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </span>
            
            {notification.category && (
              <Badge variant="outline" className="text-xs">
                {notification.category}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications()

  const [isOpen, setIsOpen] = React.useState(false)

  const recentNotifications = React.useMemo(() => {
    return notifications.slice(0, 10) // Show only recent 10
  }, [notifications])

  const hasNotifications = notifications.length > 0

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">
            Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
          </span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            
            {hasNotifications && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 text-xs hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {hasNotifications ? (
          <ScrollArea className="h-96">
            <div className="p-2 space-y-2">
              {recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onRemove={removeNotification}
                />
              ))}
            </div>
            
            {notifications.length > 10 && (
              <div className="p-3 border-t text-center">
                <Button variant="link" size="sm" className="text-xs">
                  View all notifications
                </Button>
              </div>
            )}
          </ScrollArea>
        ) : (
          <div className="p-8 text-center">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}