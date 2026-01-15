import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  isProcessing?: boolean;
}

const SCANNER_CONTAINER_ID = 'qr-scanner-container';

const QRScanner = ({ onScan, isProcessing = false }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const isStoppingRef = useRef(false);

  const cleanupScanner = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    
    const scanner = scannerRef.current;
    scannerRef.current = null;
    
    if (scanner) {
      try {
        const state = scanner.getState();
        if (state === 2) { // SCANNING state
          await scanner.stop();
        }
        scanner.clear();
      } catch (err) {
        // Ignore cleanup errors
        console.log('Scanner cleanup:', err);
      }
    }
    
    isStoppingRef.current = false;
  }, []);

  const stopScanning = useCallback(async () => {
    await cleanupScanner();
    if (isMountedRef.current) {
      setIsScanning(false);
    }
  }, [cleanupScanner]);

  const startScanning = async () => {
    try {
      setError(null);
      
      // Ensure any previous scanner is stopped
      await cleanupScanner();
      
      // Wait for DOM to settle
      await new Promise(resolve => setTimeout(resolve, 150));
      
      if (!isMountedRef.current) return;
      
      const scanner = new Html5Qrcode(SCANNER_CONTAINER_ID, { verbose: false });
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
      scannerRef.current = null;
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
      const scanner = scannerRef.current;
      if (scanner) {
        scannerRef.current = null;
        try {
          const state = scanner.getState();
          if (state === 2) {
            scanner.stop().then(() => scanner.clear()).catch(() => {});
          } else {
            scanner.clear();
          }
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        id={SCANNER_CONTAINER_ID}
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
