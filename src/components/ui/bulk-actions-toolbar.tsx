"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { X, Trash2, Edit, Archive, Download, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface BulkAction {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: "default" | "destructive" | "secondary"
  onClick: () => void
  disabled?: boolean
}

interface BulkActionsToolbarProps {
  selectedCount: number
  totalCount: number
  onClearSelection: () => void
  actions: BulkAction[]
  className?: string
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onClearSelection,
  actions,
  className,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null

  const primaryActions = actions.slice(0, 3)
  const secondaryActions = actions.slice(3)

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-slide-in-right",
      className
    )}>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-medium">
          {selectedCount} of {totalCount} selected
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Clear selection</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-2">
        {primaryActions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.id}
              variant={action.variant || "secondary"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="h-8"
            >
              {Icon && <Icon className="h-3 w-3 mr-1" />}
              {action.label}
            </Button>
          )
        })}

        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-3 w-3" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {secondaryActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <React.Fragment key={action.id}>
                    <DropdownMenuItem
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={cn(
                        action.variant === "destructive" && "text-destructive focus:text-destructive"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </DropdownMenuItem>
                    {index < secondaryActions.length - 1 && <DropdownMenuSeparator />}
                  </React.Fragment>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

// Common bulk actions
export const commonBulkActions = {
  delete: (onDelete: () => void): BulkAction => ({
    id: "delete",
    label: "Delete",
    icon: Trash2,
    variant: "destructive" as const,
    onClick: onDelete,
  }),
  
  edit: (onEdit: () => void): BulkAction => ({
    id: "edit",
    label: "Edit",
    icon: Edit,
    onClick: onEdit,
  }),
  
  archive: (onArchive: () => void): BulkAction => ({
    id: "archive",
    label: "Archive",
    icon: Archive,
    onClick: onArchive,
  }),
  
  export: (onExport: () => void): BulkAction => ({
    id: "export",
    label: "Export",
    icon: Download,
    onClick: onExport,
  }),
}