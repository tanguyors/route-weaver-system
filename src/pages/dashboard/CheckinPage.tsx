import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCheckinData } from '@/hooks/useCheckinData';
import QRScanner from '@/components/checkin/QRScanner';
import ScanResult, { ValidationResult } from '@/components/checkin/ScanResult';
import RecentScansList from '@/components/checkin/RecentScansList';
import {
  QrCode,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
} from 'lucide-react';

const CheckinPage = () => {
  const { recentScans, todayStats, loading, validateTicket } = useCheckinData();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ValidationResult | null>(null);

  const handleScan = async (qrToken: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await validateTicket(qrToken);
      setScanResult(result);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    setScanResult(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Check-in
          </h1>
          <p className="text-muted-foreground mt-1">
            Scan QR tickets to validate passengers
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{todayStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Scans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {todayStats.success}
                  </p>
                  <p className="text-xs text-muted-foreground">Valid</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {todayStats.failed}
                  </p>
                  <p className="text-xs text-muted-foreground">Invalid</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanResult ? (
                <ScanResult result={scanResult} onContinue={handleContinue} />
              ) : (
                <QRScanner onScan={handleScan} isProcessing={isProcessing} key="qr-scanner" />
              )}
            </CardContent>
          </Card>

          {/* Recent Scans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Recent Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <RecentScansList scans={recentScans} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CheckinPage;
