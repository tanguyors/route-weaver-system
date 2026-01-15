import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  isProcessing?: boolean;
}

const QRScanner = memo(function QRScanner({ onScan, isProcessing = false }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerIdRef = useRef(`qr-scanner-${Date.now()}`);
  const isMountedRef = useRef(true);

  // Prevent multiple scans (html5-qrcode callback is not reactive to prop changes)
  const isProcessingRef = useRef(isProcessing);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const destroyScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (!scanner) return;

    try {
      await scanner.stop();
    } catch {
      // ignore (stop throws if not running)
    }

    try {
      // Clears the element contents created by the library
      await scanner.clear();
    } catch {
      // ignore
    }
  }, []);

  const stopScanning = useCallback(async () => {
    await destroyScanner();
    if (isMountedRef.current) {
      setIsScanning(false);
    }
  }, [destroyScanner]);

  const startScanning = async () => {
    if (isStarting) return;

    try {
      setError(null);
      setIsStarting(true);
      hasScannedRef.current = false;

      // Ensure any previous scanner instance is fully cleaned up
      await destroyScanner();

      // Wait for DOM to settle
      await new Promise((resolve) => setTimeout(resolve, 100));

      const containerId = scannerIdRef.current;
      const container = document.getElementById(containerId);
      if (!container) throw new Error('Scanner container not found');

      // Important: never render React children inside the container the library mutates.
      container.replaceChildren();

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
          if (hasScannedRef.current) return;
          if (isProcessingRef.current) return;

          hasScannedRef.current = true;

          if (navigator.vibrate) {
            navigator.vibrate(200);
          }

          onScan(decodedText);
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
      await destroyScanner();
      if (isMountedRef.current) {
        setError(err?.message || 'Failed to start camera');
      }
    } finally {
      if (isMountedRef.current) {
        setIsStarting(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      void destroyScanner();
    };
  }, [destroyScanner]);

  return (
    <div className="space-y-4">
      <div
        className={`relative overflow-hidden rounded-lg bg-muted ${
          isScanning ? 'min-h-[300px]' : 'h-64'
        }`}
      >
        {/* This element is exclusively owned/mutated by html5-qrcode */}
        <div id={scannerIdRef.current} className="h-full w-full" />

        {!isScanning && !isStarting && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-muted/70">
            <Camera className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <p className="mb-4 text-lg text-muted-foreground">Camera Scanner</p>
            <Button onClick={startScanning} variant="hero">
              <Camera className="mr-2 h-4 w-4" />
              Start Scanning
            </Button>
          </div>
        )}

        {isStarting && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-muted/70">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Starting camera...</p>
          </div>
        )}
      </div>

      {isScanning && (
        <div className="flex justify-center">
          <Button onClick={stopScanning} variant="outline" size="lg">
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Scanner
          </Button>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
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
