// src/components/topup-cards/QRCodeScannerComponent.tsx
"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, CameraOff, ScanLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Html5QrcodeResult {
    decodedText: string;
    result: {
        format: {
            formatName: string;
        };
        text: string;
    };
}
interface QRCodeScannerComponentProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
  active: boolean;
  setActive: (active: boolean) => void;
}

const QRCodeScannerComponent = ({ onScanSuccess, onScanFailure, active, setActive }: QRCodeScannerComponentProps) => {
  const scannerRegionId = "qr-scanner-region";
  const html5QrCodeRef = useRef<any>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  
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
    if (typeof window === 'undefined' || !active) {
        return;
    }

    const startScanner = async () => {
        const { Html5Qrcode } = await import('html5-qrcode');

        if (!html5QrCodeRef.current) {
            html5QrCodeRef.current = new Html5Qrcode(scannerRegionId, { verbose: false });
        }
        const qrCode = html5QrCodeRef.current;

        if (qrCode && qrCode.getState() === 2 /* SCANNING */) return;

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
                (decodedText: string, decodedResult: Html5QrcodeResult) => {
                    onScanSuccessRef.current(decodedText);
                    setActive(false);
                },
                (errorMessage: string, error: any) => {
                    if (onScanFailureRef.current && error) onScanFailureRef.current(error);
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
    
    startScanner();

    // Cleanup function
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.getState() === 2 /* SCANNING */) {
        html5QrCodeRef.current.stop().catch((err: any) => console.error("Failed to stop scanner cleanly:", err));
      }
    };
  }, [active, setActive, toast]);

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
