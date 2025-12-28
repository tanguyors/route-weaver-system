import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { CheckinEvent } from '@/hooks/useCheckinData';

interface RecentScansListProps {
  scans: CheckinEvent[];
}

const resultConfig = {
  success: {
    icon: CheckCircle,
    label: 'Valid',
    variant: 'default' as const,
    color: 'text-green-600',
  },
  already_used: {
    icon: AlertCircle,
    label: 'Already Used',
    variant: 'secondary' as const,
    color: 'text-amber-600',
  },
  invalid: {
    icon: XCircle,
    label: 'Invalid',
    variant: 'destructive' as const,
    color: 'text-red-600',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    variant: 'destructive' as const,
    color: 'text-red-600',
  },
};

const RecentScansList = ({ scans }: RecentScansListProps) => {
  if (scans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No scans today</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {scans.map((scan) => {
        const config = resultConfig[scan.result] || resultConfig.invalid;
        const Icon = config.icon;
        const booking = scan.ticket?.booking;

        return (
          <div
            key={scan.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
          >
            <Icon className={`w-6 h-6 ${config.color}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {booking?.customer?.full_name || 'Unknown'}
                </span>
                <Badge variant={config.variant} className="text-xs">
                  {config.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {booking?.departure?.trip?.trip_name || 'Trip'} •{' '}
                {format(new Date(scan.scanned_at), 'HH:mm')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentScansList;
