import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  isProcessing?: boolean;
}

const QRScanner = memo(function QRScanner({ onScan, isProcessing = false }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerIdRef = useRef(`qr-scanner-${Date.now()}`);

  const stopScanning = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setIsScanning(false);
      return;
    }

    try {
      const state = scanner.getState();
      if (state === Html5QrcodeScannerState.SCANNING) {
        await scanner.stop();
      }
    } catch (err) {
      console.log('Stop scanner error (ignored):', err);
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
    }
  }, []);

  const startScanning = async () => {
    if (isStarting) return;
    
    try {
      setError(null);
      setIsStarting(true);
      
      // Stop any existing scanner
      if (scannerRef.current) {
        await stopScanning();
      }
      
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const containerId = scannerIdRef.current;
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error('Scanner container not found');
      }
      
      // Clear container
      container.innerHTML = '';
      
      const scanner = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (!isProcessing) {
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

      setIsScanning(true);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      scannerRef.current = null;
      setError(err.message || 'Failed to start camera');
    } finally {
      setIsStarting(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner) {
        scannerRef.current = null;
        try {
          const state = scanner.getState();
          if (state === Html5QrcodeScannerState.SCANNING) {
            scanner.stop().catch(() => {});
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
        ref={containerRef}
        id={scannerIdRef.current}
        className={`relative overflow-hidden rounded-lg bg-black ${
          isScanning ? 'min-h-[300px]' : 'h-64'
        }`}
      >
        {!isScanning && !isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 z-10">
            <Camera className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg mb-4">Camera Scanner</p>
            <Button onClick={startScanning} variant="hero">
              <Camera className="w-4 h-4 mr-2" />
              Start Scanning
            </Button>
          </div>
        )}
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 z-10">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Starting camera...</p>
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
});

export default QRScanner;
