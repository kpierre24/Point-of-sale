"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Keyboard } from "lucide-react"
import type { KeyboardShortcut } from "@/hooks/use-keyboard-shortcuts"

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: KeyboardShortcut[]
}

export function KeyboardShortcutsHelp({ isOpen, onClose, shortcuts }: KeyboardShortcutsHelpProps) {
  const [isMac, setIsMac] = React.useState(false)

  React.useEffect(() => {
    // This check runs only on the client, avoiding SSR errors.
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0)
  }, [])

  // Group shortcuts by category
  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {}
    
    shortcuts.forEach(shortcut => {
      const category = shortcut.category || "General"
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(shortcut)
    })
    
    return groups
  }, [shortcuts])

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = []
    
    if (shortcut.ctrlKey || shortcut.metaKey) {
      keys.push(isMac ? "⌘" : "Ctrl")
    }
    if (shortcut.altKey) {
      keys.push(isMac ? "⌥" : "Alt")
    }
    if (shortcut.shiftKey) {
      keys.push("⇧")
    }
    
    keys.push(shortcut.key.toUpperCase())
    
    return keys
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {formatShortcut(shortcut).map((key, keyIndex) => (
                        <Badge key={keyIndex} variant="outline" className="text-xs font-mono px-2 py-1">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Press <Badge variant="outline" className="text-xs font-mono">?</Badge> to toggle this help
        </div>
      </DialogContent>
    </Dialog>
  )
}
