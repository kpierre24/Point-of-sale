"use client"

import * as React from "react"

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  category?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === "true"
      ) {
        return
      }

      const matchingShortcut = shortcuts.find(shortcut => {
        return (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.altKey === !!shortcut.altKey &&
          !!event.shiftKey === !!shortcut.shiftKey &&
          !!event.metaKey === !!shortcut.metaKey
        )
      })

      if (matchingShortcut) {
        event.preventDefault()
        matchingShortcut.action()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts])
}

// Hook for displaying keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = React.useState(false)

  const toggleHelp = React.useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const closeHelp = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    toggleHelp,
    closeHelp,
  }
}

// Common keyboard shortcuts for the app
export const commonShortcuts: KeyboardShortcut[] = [
  {
    key: "?",
    action: () => {}, // Will be overridden by components
    description: "Show keyboard shortcuts",
    category: "General"
  },
  {
    key: "n",
    ctrlKey: true,
    action: () => {}, // Will be overridden
    description: "New item",
    category: "Actions"
  },
  {
    key: "s",
    ctrlKey: true,
    action: () => {}, // Will be overridden
    description: "Save",
    category: "Actions"
  },
  {
    key: "f",
    ctrlKey: true,
    action: () => {}, // Will be overridden
    description: "Search",
    category: "Navigation"
  },
  {
    key: "Escape",
    action: () => {}, // Will be overridden
    description: "Close dialog/cancel",
    category: "Navigation"
  }
]