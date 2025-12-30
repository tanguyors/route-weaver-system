import { useState } from 'react';
import ActivityDashboardLayout from '@/components/layouts/ActivityDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivityCheckinData } from '@/hooks/useActivityCheckinData';
import QRScanner from '@/components/checkin/QRScanner';
import ScanResult, { ValidationResult } from '@/components/checkin/ScanResult';
import {
  QrCode,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const ActivityCheckinPage = () => {
  const { recentScans, todayStats, loading, validateTicket } = useActivityCheckinData();
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

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'success':
        return <Badge className="bg-green-500">Valid</Badge>;
      case 'already_used':
        return <Badge variant="secondary">Already Used</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="destructive">Invalid</Badge>;
    }
  };

  return (
    <ActivityDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Check-in
          </h1>
          <p className="text-muted-foreground mt-1">
            Scan QR tickets to validate participants
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
                <QRScanner onScan={handleScan} isProcessing={isProcessing} />
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
              ) : recentScans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No scans today</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {recentScans.map((scan) => (
                      <div
                        key={scan.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {scan.ticket?.booking?.customer?.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {scan.ticket?.booking?.product?.name || 'Unknown Product'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(scan.scanned_at), 'HH:mm:ss')}
                            {scan.ticket?.booking?.slot_time && (
                              <span>• Slot: {scan.ticket.booking.slot_time}</span>
                            )}
                          </div>
                        </div>
                        {getResultBadge(scan.result)}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ActivityDashboardLayout>
  );
};

export default ActivityCheckinPage;
