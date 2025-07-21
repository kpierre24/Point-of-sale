"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Camera, 
  Scan, 
  Type,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onBarcodeScanned: (barcode: string) => void
}

export function BarcodeScanner({ isOpen, onClose, onBarcodeScanned }: BarcodeScannerProps) {
  const [scanMode, setScanMode] = React.useState<"camera" | "manual">("camera")
  const [manualBarcode, setManualBarcode] = React.useState("")
  const [isScanning, setIsScanning] = React.useState(false)
  const [lastScanned, setLastScanned] = React.useState<string | null>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)

  // Mock camera scanning - in a real app, you'd use a library like QuaggaJS or ZXing
  const startCameraScanning = async () => {
    setIsScanning(true)
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment" // Use back camera if available
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }

      // Simulate barcode detection after 3 seconds
      setTimeout(() => {
        const mockBarcode = "1234567890123"
        setLastScanned(mockBarcode)
        onBarcodeScanned(mockBarcode)
        stopScanning()
      }, 3000)

    } catch (error) {
      console.error("Camera access denied:", error)
      setScanMode("manual")
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      setLastScanned(manualBarcode)
      onBarcodeScanned(manualBarcode)
      setManualBarcode("")
    }
  }

  React.useEffect(() => {
    if (isOpen && scanMode === "camera") {
      startCameraScanning()
    }
    
    return () => {
      stopScanning()
    }
  }, [isOpen, scanMode])

  React.useEffect(() => {
    if (!isOpen) {
      stopScanning()
      setLastScanned(null)
      setManualBarcode("")
      setScanMode("camera")
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Barcode Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scan Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={scanMode === "camera" ? "default" : "outline"}
              size="sm"
              onClick={() => setScanMode("camera")}
            >
              <Camera className="h-4 w-4 mr-2" />
              Camera
            </Button>
            <Button
              variant={scanMode === "manual" ? "default" : "outline"}
              size="sm"
              onClick={() => setScanMode("manual")}
            >
              <Type className="h-4 w-4 mr-2" />
              Manual
            </Button>
          </div>

          {/* Camera Scanning */}
          {scanMode === "camera" && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-48 bg-gray-100 rounded-lg object-cover"
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-primary border-dashed w-48 h-24 rounded-lg flex items-center justify-center">
                    {isScanning ? (
                      <div className="flex items-center gap-2 text-primary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Scanning...</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Position barcode here
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={startCameraScanning}
                  disabled={isScanning}
                  className="flex-1"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Scan className="h-4 w-4 mr-2" />
                      Start Scan
                    </>
                  )}
                </Button>
                
                {isScanning && (
                  <Button variant="outline" onClick={stopScanning}>
                    Stop
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Manual Entry */}
          {scanMode === "manual" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Enter Barcode</Label>
                <Input
                  id="barcode"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="1234567890123"
                  onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
                />
              </div>
              
              <Button 
                onClick={handleManualSubmit}
                disabled={!manualBarcode.trim()}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Barcode
              </Button>
            </div>
          )}

          {/* Last Scanned Result */}
          {lastScanned && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Barcode Scanned Successfully
                </span>
              </div>
              <Badge variant="outline" className="font-mono">
                {lastScanned}
              </Badge>
            </div>
          )}

          {/* Instructions */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Scanning Tips:</p>
                <ul className="text-xs space-y-1">
                  <li>• Hold the barcode steady in the frame</li>
                  <li>• Ensure good lighting</li>
                  <li>• Keep the barcode flat and unobstructed</li>
                  <li>• Use manual entry if camera scanning fails</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}