"use client"

import * as React from "react"

export interface SearchFilter {
  id: string
  label: string
  type: "text" | "select" | "date" | "number" | "boolean"
  options?: { value: string; label: string }[]
  value: any
}

export interface SavedSearch {
  id: string
  name: string
  filters: SearchFilter[]
  createdAt: Date
}

export interface AdvancedSearchOptions<T> {
  items: T[]
  searchFields: (keyof T)[]
  filters: SearchFilter[]
  onFiltersChange?: (filters: SearchFilter[]) => void
}

export function useAdvancedSearch<T>({ 
  items, 
  searchFields, 
  filters: initialFilters,
  onFiltersChange 
}: AdvancedSearchOptions<T>) {
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<SearchFilter[]>(initialFilters)
  const [savedSearches, setSavedSearches] = React.useState<SavedSearch[]>([])

  // Load saved searches from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("advanced-search-saved")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSavedSearches(parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt)
        })))
      } catch (error) {
        console.error("Failed to load saved searches:", error)
      }
    }
  }, [])

  // Save searches to localStorage
  const saveSavedSearches = React.useCallback((searches: SavedSearch[]) => {
    localStorage.setItem("advanced-search-saved", JSON.stringify(searches))
    setSavedSearches(searches)
  }, [])

  const filteredItems = React.useMemo(() => {
    let result = items

    // Apply text search
    if (query.trim()) {
      const searchTerm = query.toLowerCase()
      result = result.filter(item => 
        searchFields.some(field => {
          const value = item[field]
          return String(value).toLowerCase().includes(searchTerm)
        })
      )
    }

    // Apply filters
    result = result.filter(item => {
      return filters.every(filter => {
        if (!filter.value && filter.value !== 0 && filter.value !== false) {
          return true // Skip empty filters
        }

        const itemValue = (item as any)[filter.id]

        switch (filter.type) {
          case "text":
            return String(itemValue).toLowerCase().includes(String(filter.value).toLowerCase())
          
          case "select":
            return itemValue === filter.value
          
          case "number":
            return Number(itemValue) === Number(filter.value)
          
          case "boolean":
            return Boolean(itemValue) === Boolean(filter.value)
          
          case "date":
            // Assuming filter.value is a date string or Date object
            const filterDate = new Date(filter.value)
            const itemDate = new Date(itemValue)
            return itemDate.toDateString() === filterDate.toDateString()
          
          default:
            return true
        }
      })
    })

    return result
  }, [items, query, filters, searchFields])

  const updateFilter = React.useCallback((filterId: string, value: any) => {
    const newFilters = filters.map(filter => 
      filter.id === filterId ? { ...filter, value } : filter
    )
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }, [filters, onFiltersChange])

  const clearFilters = React.useCallback(() => {
    const clearedFilters = filters.map(filter => ({ ...filter, value: "" }))
    setFilters(clearedFilters)
    setQuery("")
    onFiltersChange?.(clearedFilters)
  }, [filters, onFiltersChange])

  const saveSearch = React.useCallback((name: string) => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters: filters.filter(f => f.value !== "" && f.value !== null && f.value !== undefined),
      createdAt: new Date(),
    }
    
    const updatedSearches = [...savedSearches, newSearch]
    saveSavedSearches(updatedSearches)
  }, [filters, savedSearches, saveSavedSearches])

  const loadSearch = React.useCallback((searchId: string) => {
    const search = savedSearches.find(s => s.id === searchId)
    if (search) {
      const newFilters = filters.map(filter => {
        const savedFilter = search.filters.find(sf => sf.id === filter.id)
        return savedFilter ? { ...filter, value: savedFilter.value } : { ...filter, value: "" }
      })
      setFilters(newFilters)
      onFiltersChange?.(newFilters)
    }
  }, [savedSearches, filters, onFiltersChange])

  const deleteSearch = React.useCallback((searchId: string) => {
    const updatedSearches = savedSearches.filter(s => s.id !== searchId)
    saveSavedSearches(updatedSearches)
  }, [savedSearches, saveSavedSearches])

  const hasActiveFilters = React.useMemo(() => {
    return query.trim() !== "" || filters.some(f => f.value !== "" && f.value !== null && f.value !== undefined)
  }, [query, filters])

  return {
    query,
    setQuery,
    filters,
    updateFilter,
    clearFilters,
    filteredItems,
    savedSearches,
    saveSearch,
    loadSearch,
    deleteSearch,
    hasActiveFilters,
    resultCount: filteredItems.length,
    totalCount: items.length,
  }
}