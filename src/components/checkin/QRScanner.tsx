import { useEffect, useRef, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanning = async () => {
    if (!containerRef.current) return;

    try {
      setError(null);
      const scanner = new Html5Qrcode('qr-reader');
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

      setIsScanning(true);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Failed to start camera');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        id="qr-reader"
        ref={containerRef}
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
