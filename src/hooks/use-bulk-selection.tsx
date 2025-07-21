"use client"

import * as React from "react"

export interface BulkSelectionOptions<T> {
  items: T[]
  getItemId: (item: T) => string
  onSelectionChange?: (selectedItems: T[]) => void
}

export function useBulkSelection<T>({ items, getItemId, onSelectionChange }: BulkSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  const selectedItems = React.useMemo(() => {
    return items.filter(item => selectedIds.has(getItemId(item)))
  }, [items, selectedIds, getItemId])

  const isSelected = React.useCallback((item: T) => {
    return selectedIds.has(getItemId(item))
  }, [selectedIds, getItemId])

  const isAllSelected = React.useMemo(() => {
    return items.length > 0 && items.every(item => selectedIds.has(getItemId(item)))
  }, [items, selectedIds, getItemId])

  const isPartiallySelected = React.useMemo(() => {
    return selectedIds.size > 0 && !isAllSelected
  }, [selectedIds.size, isAllSelected])

  const toggleItem = React.useCallback((item: T) => {
    const id = getItemId(item)
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [getItemId])

  const toggleAll = React.useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(getItemId)))
    }
  }, [isAllSelected, items, getItemId])

  const selectItems = React.useCallback((itemsToSelect: T[]) => {
    setSelectedIds(new Set(itemsToSelect.map(getItemId)))
  }, [getItemId])

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectRange = React.useCallback((startItem: T, endItem: T) => {
    const startIndex = items.findIndex(item => getItemId(item) === getItemId(startItem))
    const endIndex = items.findIndex(item => getItemId(item) === getItemId(endItem))
    
    if (startIndex === -1 || endIndex === -1) return

    const start = Math.min(startIndex, endIndex)
    const end = Math.max(startIndex, endIndex)
    
    const rangeItems = items.slice(start, end + 1)
    const rangeIds = rangeItems.map(getItemId)
    
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      rangeIds.forEach(id => newSet.add(id))
      return newSet
    })
  }, [items, getItemId])

  // Notify parent of selection changes
  React.useEffect(() => {
    onSelectionChange?.(selectedItems)
  }, [selectedItems, onSelectionChange])

  return {
    selectedItems,
    selectedIds,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    toggleItem,
    toggleAll,
    selectItems,
    clearSelection,
    selectRange,
    selectedCount: selectedIds.size,
    totalCount: items.length,
  }
}