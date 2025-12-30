import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  isProcessing?: boolean;
}

const QRScanner = ({ onScan, isProcessing = false }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const scannerIdRef = useRef(`qr-reader-${Date.now()}`);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        await scanner.stop();
        // Clear the container manually to prevent React DOM conflicts
        const container = document.getElementById(scannerIdRef.current);
        if (container) {
          container.innerHTML = '';
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    if (isMountedRef.current) {
      setIsScanning(false);
    }
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      
      // Ensure any previous scanner is stopped
      if (scannerRef.current) {
        await stopScanning();
      }
      
      // Wait a bit for DOM to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const container = document.getElementById(scannerIdRef.current);
      if (!container || !isMountedRef.current) return;
      
      // Clear container before starting
      container.innerHTML = '';
      
      const scanner = new Html5Qrcode(scannerIdRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (!isProcessing && isMountedRef.current) {
            // Vibrate on successful scan if supported
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
            onScan(decodedText);
          }
        },
        () => {
          // QR code not found - ignore
        }
      );

      if (isMountedRef.current) {
        setIsScanning(true);
      }
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to start camera');
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        id={scannerIdRef.current}
        className={`relative overflow-hidden rounded-lg bg-black ${
          isScanning ? 'min-h-[300px]' : 'h-64'
        }`}
      >
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
            <Camera className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg mb-4">Camera Scanner</p>
            <Button onClick={startScanning} variant="hero">
              <Camera className="w-4 h-4 mr-2" />
              Start Scanning
            </Button>
          </div>
        )}
      </div>

      {isScanning && (
        <div className="flex justify-center">
          <Button onClick={stopScanning} variant="outline" size="lg">
            <CameraOff className="w-4 h-4 mr-2" />
            Stop Scanner
          </Button>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Validating ticket...
        </div>
      )}

      {error && (
        <div className="text-center text-destructive text-sm">
          {error}
          <br />
          <span className="text-muted-foreground">
            Please ensure camera permissions are granted.
          </span>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
