import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Globe, Store } from 'lucide-react';

interface ChannelMetrics {
  online: { bookings: number; revenue: number };
  offline: { bookings: number; revenue: number };
  onlinePercentage: number;
  offlinePercentage: number;
}

interface ChannelComparisonProps {
  metrics: ChannelMetrics;
  formatCurrency: (amount: number) => string;
}

const ChannelComparison = ({ metrics, formatCurrency }: ChannelComparisonProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Online vs Offline Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Online */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Online (Widget)</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.online.bookings} bookings
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatCurrency(metrics.online.revenue)}</p>
              <p className="text-sm text-muted-foreground">
                {metrics.onlinePercentage.toFixed(1)}%
              </p>
            </div>
          </div>
          <Progress value={metrics.onlinePercentage} className="h-2" />
        </div>

        {/* Offline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Store className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Offline</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.offline.bookings} bookings
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatCurrency(metrics.offline.revenue)}</p>
              <p className="text-sm text-muted-foreground">
                {metrics.offlinePercentage.toFixed(1)}%
              </p>
            </div>
          </div>
          <Progress value={metrics.offlinePercentage} className="h-2" />
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">
                {metrics.online.bookings + metrics.offline.bookings}
              </p>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(metrics.online.revenue + metrics.offline.revenue)}
              </p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelComparison;
