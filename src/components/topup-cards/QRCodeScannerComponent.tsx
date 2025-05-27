// src/components/topup-cards/QRCodeScannerComponent.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, CameraOff, ScanLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeScannerComponentProps {
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  onScanFailure?: (error: any) => void;
  active: boolean; // To control when the scanner is active
  setActive: (active: boolean) => void;
}

const QRCodeScannerComponent = ({ onScanSuccess, onScanFailure, active, setActive }: QRCodeScannerComponentProps) => {
  const scannerRegionId = "qr-scanner-region";
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!active || typeof window === 'undefined') {
      stopScanner();
      return;
    }

    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode(scannerRegionId, { verbose: false });
    }
    const qrCode = html5QrCodeRef.current;

    const startScanner = async () => {
      try {
        // Check for cameras
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          toast({ variant: "destructive", title: "No Cameras Found", description: "Could not find any cameras on this device." });
          setHasCameraPermission(false);
          setActive(false);
          return;
        }
        
        // Try to start scanning
        // Configuration for the scanner
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };
        
        await qrCode.start(
          { facingMode: "environment" }, // prefer back camera
          config,
          (decodedText, decodedResult) => {
            onScanSuccess(decodedText, decodedResult);
            setActive(false); // Stop scanning on success
          },
          (errorMessage) => {
            if (onScanFailure) onScanFailure(errorMessage);
            // Errors like "QR code not found" are common, don't toast them unless persistent
          }
        );
        setHasCameraPermission(true);
      } catch (err: any) {
        console.error("QR Scanner Start Error:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          toast({ variant: "destructive", title: "Camera Access Denied", description: "Please enable camera permissions in your browser." });
          setHasCameraPermission(false);
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
           toast({ variant: "destructive", title: "Camera Not Found", description: "No suitable camera found on this device." });
           setHasCameraPermission(false);
        } else {
          toast({ variant: "destructive", title: "Scanner Error", description: `Could not start QR scanner: ${err.message || err}` });
          setHasCameraPermission(false);
        }
        setActive(false);
      }
    };

    if (active) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]); // Only re-run if 'active' changes

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
      html5QrCodeRef.current.stop().catch(err => {
        console.error("Error stopping QR scanner:", err);
      });
    }
  };

  const toggleScanner = () => {
    setActive(!active);
  };

  return (
    <div className="space-y-4">
      <Button onClick={toggleScanner} variant="outline" className="w-full">
        {active ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
        {active ? 'Stop QR Scanner' : 'Scan Card QR Code'}
      </Button>

      {active && (
        <div id={scannerRegionId} className="w-full border-2 border-dashed border-primary rounded-md overflow-hidden aspect-square max-w-sm mx-auto bg-muted">
          {/* The library will render the video stream here */}
           <div className="flex items-center justify-center h-full">
            <ScanLine className="w-1/2 h-1/2 text-muted-foreground animate-pulse" />
           </div>
        </div>
      )}
      
      {active && hasCameraPermission === false && (
        <Alert variant="destructive">
          <AlertTitle>Camera Issue</AlertTitle>
          <AlertDescription>
            Could not access the camera. Please ensure permissions are granted and no other app is using it.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default QRCodeScannerComponent;

