"use client"

import * as React from "react"

export type ExportFormat = "csv" | "json" | "xlsx"

export interface ExportOptions {
  format: ExportFormat
  filename?: string
  includeHeaders?: boolean
  selectedFields?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ExportField {
  key: string
  label: string
  type: "string" | "number" | "date" | "boolean"
  required?: boolean
}

export function useDataExport<T extends Record<string, any>>() {
  const [isExporting, setIsExporting] = React.useState(false)
  const [exportProgress, setExportProgress] = React.useState(0)

  const exportToCSV = React.useCallback((data: T[], fields: ExportField[], options: ExportOptions) => {
    const selectedFields = options.selectedFields || fields.map(f => f.key)
    const headers = fields.filter(f => selectedFields.includes(f.key)).map(f => f.label)
    
    let csvContent = ""
    
    // Add headers if requested
    if (options.includeHeaders !== false) {
      csvContent += headers.join(",") + "\n"
    }
    
    // Add data rows
    data.forEach(item => {
      const row = selectedFields.map(fieldKey => {
        const field = fields.find(f => f.key === fieldKey)
        let value = item[fieldKey]
        
        // Format based on field type
        if (field?.type === "date" && value) {
          value = new Date(value).toLocaleDateString()
        } else if (field?.type === "boolean") {
          value = value ? "Yes" : "No"
        } else if (value === null || value === undefined) {
          value = ""
        }
        
        // Escape commas and quotes
        const stringValue = String(value)
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        
        return stringValue
      })
      
      csvContent += row.join(",") + "\n"
    })
    
    return csvContent
  }, [])

  const exportToJSON = React.useCallback((data: T[], fields: ExportField[], options: ExportOptions) => {
    const selectedFields = options.selectedFields || fields.map(f => f.key)
    
    const filteredData = data.map(item => {
      const filteredItem: any = {}
      selectedFields.forEach(fieldKey => {
        filteredItem[fieldKey] = item[fieldKey]
      })
      return filteredItem
    })
    
    return JSON.stringify(filteredData, null, 2)
  }, [])

  const downloadFile = React.useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }, [])

  const exportData = React.useCallback(async (
    data: T[],
    fields: ExportField[],
    options: ExportOptions
  ) => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulate progress for large datasets
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      let content: string
      let mimeType: string
      let extension: string

      switch (options.format) {
        case "csv":
          content = exportToCSV(data, fields, options)
          mimeType = "text/csv;charset=utf-8;"
          extension = "csv"
          break
        
        case "json":
          content = exportToJSON(data, fields, options)
          mimeType = "application/json;charset=utf-8;"
          extension = "json"
          break
        
        case "xlsx":
          // For XLSX, we'd need a library like xlsx or exceljs
          // For now, fall back to CSV
          content = exportToCSV(data, fields, options)
          mimeType = "text/csv;charset=utf-8;"
          extension = "csv"
          break
        
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }

      clearInterval(progressInterval)
      setExportProgress(100)

      const filename = options.filename || `export_${new Date().toISOString().split('T')[0]}.${extension}`
      downloadFile(content, filename, mimeType)

      // Reset progress after a short delay
      setTimeout(() => {
        setExportProgress(0)
        setIsExporting(false)
      }, 1000)

    } catch (error) {
      console.error("Export failed:", error)
      setIsExporting(false)
      setExportProgress(0)
      throw error
    }
  }, [exportToCSV, exportToJSON, downloadFile])

  return {
    exportData,
    isExporting,
    exportProgress,
  }
}