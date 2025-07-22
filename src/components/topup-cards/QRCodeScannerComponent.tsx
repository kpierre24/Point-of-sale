
// src/components/topup-cards/QRCodeScannerComponent.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeError, Html5QrcodeResult } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, CameraOff, ScanLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeScannerComponentProps {
  onScanSuccess: (decodedText: string, decodedResult: Html5QrcodeResult) => void;
  onScanFailure?: (error: Html5QrcodeError) => void;
  active: boolean;
  setActive: (active: boolean) => void;
}

const QRCodeScannerComponent = ({ onScanSuccess, onScanFailure, active, setActive }: QRCodeScannerComponentProps) => {
  const scannerRegionId = "qr-scanner-region";
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  // Use refs to hold the callbacks to avoid them being dependencies in useEffect
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanFailureRef = useRef(onScanFailure);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    onScanFailureRef.current = onScanFailure;
  }, [onScanFailure]);


  // Main effect for scanner lifecycle
  useEffect(() => {
    if (typeof window === 'undefined') {
        return;
    }

    if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerRegionId, { verbose: false });
    }
    const qrCode = html5QrCodeRef.current;

    const startScanner = async () => {
        if (qrCode.getState() === Html5QrcodeScannerState.SCANNING) return;

        try {
            const cameras = await Html5Qrcode.getCameras();
            if (!cameras || cameras.length === 0) {
                throw new Error("No cameras found on this device.");
            }
            setHasCameraPermission(true);
            const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
            
            await qrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText, decodedResult) => {
                    onScanSuccessRef.current(decodedText, decodedResult);
                    setActive(false);
                },
                (errorMessage, error) => {
                    if (onScanFailureRef.current && error) onScanFailureRef.current(error as Html5QrcodeError);
                }
            );
        } catch (err: any) {
            console.error("QR Scanner Start Error:", err);
            const errorMessage = typeof err === 'string' ? err : (err.message || 'An unknown error occurred.');
            if (errorMessage.includes("NotAllowedError") || errorMessage.includes("PermissionDeniedError")) {
                toast({ variant: "destructive", title: "Camera Access Denied", description: "Please enable camera permissions in your browser." });
            } else {
                toast({ variant: "destructive", title: "Scanner Error", description: `Could not start QR scanner: ${errorMessage}` });
            }
            setHasCameraPermission(false);
            setActive(false);
        }
    };

    const stopScanner = () => {
        if (qrCode && qrCode.getState() === Html5QrcodeScannerState.SCANNING) {
            qrCode.stop().catch(err => console.error("Failed to stop scanner cleanly:", err));
        }
    };
    
    if (active) {
        startScanner();
    } else {
        stopScanner();
    }

    // Cleanup function
    return () => {
        stopScanner();
    };
  }, [active, scannerRegionId, setActive, toast]);

  const toggleScanner = () => {
    setActive(!active);
  };

  return (
    <div className="space-y-4">
      <Button onClick={toggleScanner} variant="outline" className="w-full">
        {active ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
        {active ? 'Stop QR Scanner' : 'Scan Card QR Code'}
      </Button>

      <div 
        id={scannerRegionId} 
        className={`w-full border-2 border-dashed border-primary rounded-md overflow-hidden aspect-square max-w-sm mx-auto bg-muted ${!active ? 'hidden' : ''}`}
      >
      </div>
      
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
