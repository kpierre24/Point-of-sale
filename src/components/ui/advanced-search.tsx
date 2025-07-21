"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  Filter, 
  X, 
  Save, 
  Bookmark, 
  Trash2,
  SlidersHorizontal 
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SearchFilter, SavedSearch } from "@/hooks/use-advanced-search"

interface AdvancedSearchProps {
  query: string
  onQueryChange: (query: string) => void
  filters: SearchFilter[]
  onFilterChange: (filterId: string, value: any) => void
  onClearFilters: () => void
  savedSearches: SavedSearch[]
  onSaveSearch: (name: string) => void
  onLoadSearch: (searchId: string) => void
  onDeleteSearch: (searchId: string) => void
  hasActiveFilters: boolean
  resultCount: number
  totalCount: number
  placeholder?: string
  className?: string
}

export function AdvancedSearch({
  query,
  onQueryChange,
  filters,
  onFilterChange,
  onClearFilters,
  savedSearches,
  onSaveSearch,
  onLoadSearch,
  onDeleteSearch,
  hasActiveFilters,
  resultCount,
  totalCount,
  placeholder = "Search...",
  className,
}: AdvancedSearchProps) {
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = React.useState(false)
  const [saveSearchName, setSaveSearchName] = React.useState("")

  const activeFiltersCount = filters.filter(f => 
    f.value !== "" && f.value !== null && f.value !== undefined
  ).length

  const handleSaveSearch = () => {
    if (saveSearchName.trim()) {
      onSaveSearch(saveSearchName.trim())
      setSaveSearchName("")
      setIsSaveDialogOpen(false)
    }
  }

  const renderFilterInput = (filter: SearchFilter) => {
    switch (filter.type) {
      case "select":
        return (
          <Select value={filter.value || ""} onValueChange={(value) => onFilterChange(filter.id, value)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${filter.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "number":
        return (
          <Input
            type="number"
            value={filter.value || ""}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
            placeholder={`Enter ${filter.label.toLowerCase()}...`}
          />
        )

      case "date":
        return (
          <Input
            type="date"
            value={filter.value || ""}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
          />
        )

      case "boolean":
        return (
          <Select 
            value={filter.value === null || filter.value === undefined ? "" : String(filter.value)} 
            onValueChange={(value) => onFilterChange(filter.id, value === "" ? null : value === "true")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )

      default:
        return (
          <Input
            value={filter.value || ""}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
            placeholder={`Filter by ${filter.label.toLowerCase()}...`}
          />
        )
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-4"
          />
        </div>

        {/* Filters toggle */}
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={onClearFilters}>
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {filters.map((filter) => (
                  <div key={filter.id} className="space-y-2">
                    <Label className="text-sm font-medium">{filter.label}</Label>
                    {renderFilterInput(filter)}
                  </div>
                ))}
              </div>

              {hasActiveFilters && (
                <>
                  <Separator />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsSaveDialogOpen(true)}
                    className="w-full"
                  >
                    <Save className="h-3 w-3 mr-2" />
                    Save Search
                  </Button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Saved searches */}
        {savedSearches.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Bookmark className="h-4 w-4 mr-2" />
                Saved
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="space-y-1">
                <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                  Saved Searches
                </div>
                {savedSearches.map((search) => (
                  <div key={search.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                    <button
                      onClick={() => onLoadSearch(search.id)}
                      className="flex-1 text-left text-sm hover:text-primary"
                    >
                      {search.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteSearch(search.id)}
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {query && (
            <Badge variant="secondary" className="gap-1">
              Search: "{query}"
              <button
                onClick={() => onQueryChange("")}
                className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-2 w-2" />
              </button>
            </Badge>
          )}
          
          {filters
            .filter(f => f.value !== "" && f.value !== null && f.value !== undefined)
            .map((filter) => (
              <Badge key={filter.id} variant="secondary" className="gap-1">
                {filter.label}: {String(filter.value)}
                <button
                  onClick={() => onFilterChange(filter.id, "")}
                  className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            ))}
          
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {resultCount.toLocaleString()} of {totalCount.toLocaleString()} results
      </div>

      {/* Save search dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                placeholder="Enter a name for this search..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveSearch()
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSearch} disabled={!saveSearchName.trim()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}