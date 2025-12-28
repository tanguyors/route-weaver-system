import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, RotateCcw, Ticket } from 'lucide-react';

interface BookingStatusMetrics {
  pending: number;
  confirmed: number;
  cancelled: number;
  refunded: number;
  validatedTickets: number;
  validationRate: number;
}

interface BookingStatusReportProps {
  metrics: BookingStatusMetrics;
}

const BookingStatusReport = ({ metrics }: BookingStatusReportProps) => {
  const statuses = [
    {
      label: 'Pending',
      count: metrics.pending,
      icon: Clock,
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
    },
    {
      label: 'Confirmed',
      count: metrics.confirmed,
      icon: CheckCircle,
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    },
    {
      label: 'Cancelled',
      count: metrics.cancelled,
      icon: XCircle,
      color: 'bg-red-100 dark:bg-red-900/30 text-red-600',
    },
    {
      label: 'Refunded',
      count: metrics.refunded,
      icon: RotateCcw,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    },
  ];

  const totalBookings = metrics.pending + metrics.confirmed + metrics.cancelled + metrics.refunded;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statuses.map((status) => {
            const Icon = status.icon;
            const percentage = totalBookings > 0 ? (status.count / totalBookings) * 100 : 0;

            return (
              <div key={status.label} className="p-4 rounded-lg border text-center">
                <div className={`w-10 h-10 rounded-lg ${status.color} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold">{status.count}</p>
                <p className="text-sm text-muted-foreground">{status.label}</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {percentage.toFixed(1)}%
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Ticket Validation */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Ticket Validation Rate</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.validatedTickets} tickets validated
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">
                {metrics.validationRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingStatusReport;
