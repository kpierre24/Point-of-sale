"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Download, FileText, Database, Table } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDataExport, type ExportOptions, type ExportField, type ExportFormat } from "@/hooks/use-data-export"

interface DataExportDialogProps<T> {
  data: T[]
  fields: ExportField[]
  title?: string
  defaultFilename?: string
  trigger?: React.ReactNode
  onExport?: (options: ExportOptions) => void
}

export function DataExportDialog<T extends Record<string, any>>({
  data,
  fields,
  title = "Export Data",
  defaultFilename,
  trigger,
  onExport,
}: DataExportDialogProps<T>) {
  const { exportData, isExporting, exportProgress } = useDataExport<T>()
  
  const [isOpen, setIsOpen] = React.useState(false)
  const [format, setFormat] = React.useState<ExportFormat>("csv")
  const [filename, setFilename] = React.useState(defaultFilename || "export")
  const [includeHeaders, setIncludeHeaders] = React.useState(true)
  const [selectedFields, setSelectedFields] = React.useState<string[]>(
    fields.map(f => f.key)
  )

  const formatOptions = [
    { value: "csv", label: "CSV", icon: FileText, description: "Comma-separated values" },
    { value: "json", label: "JSON", icon: Database, description: "JavaScript Object Notation" },
    { value: "xlsx", label: "Excel", icon: Table, description: "Microsoft Excel format" },
  ]

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, fieldKey])
    } else {
      setSelectedFields(prev => prev.filter(key => key !== fieldKey))
    }
  }

  const handleSelectAll = () => {
    setSelectedFields(fields.map(f => f.key))
  }

  const handleSelectNone = () => {
    setSelectedFields([])
  }

  const handleExport = async () => {
    const options: ExportOptions = {
      format,
      filename: filename.includes(".") ? filename : `${filename}.${format}`,
      includeHeaders,
      selectedFields,
    }

    try {
      await exportData(data, fields, options)
      onExport?.(options)
      setIsOpen(false)
    } catch (error) {
      console.error("Export failed:", error)
      // You might want to show an error toast here
    }
  }

  const selectedFieldsCount = selectedFields.length
  const canExport = selectedFieldsCount > 0 && filename.trim() && !isExporting

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <div className="grid grid-cols-3 gap-3">
              {formatOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => setFormat(option.value as ExportFormat)}
                    className={cn(
                      "p-3 border rounded-lg text-left transition-all hover:shadow-sm",
                      format === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* File Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">File Options</Label>
            
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename..."
              />
            </div>

            {format === "csv" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-headers"
                  checked={includeHeaders}
                  onCheckedChange={setIncludeHeaders}
                />
                <Label htmlFor="include-headers">Include column headers</Label>
              </div>
            )}
          </div>

          <Separator />

          {/* Field Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                Fields to Export ({selectedFieldsCount} of {fields.length})
              </Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleSelectNone}>
                  Select None
                </Button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
              {fields.map((field) => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={selectedFields.includes(field.key)}
                    onCheckedChange={(checked) => handleFieldToggle(field.key, !!checked)}
                  />
                  <Label htmlFor={field.key} className="flex-1 cursor-pointer">
                    <span className="font-medium">{field.label}</span>
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({field.type})
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Exporting...</Label>
                <span className="text-sm text-muted-foreground">
                  {exportProgress}%
                </span>
              </div>
              <Progress value={exportProgress} />
            </div>
          )}

          {/* Summary */}
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              Exporting <strong>{data.length.toLocaleString()}</strong> records
              with <strong>{selectedFieldsCount}</strong> fields
              in <strong>{format.toUpperCase()}</strong> format
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={!canExport}>
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}