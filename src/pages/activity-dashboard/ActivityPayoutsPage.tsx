import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import ActivityDashboardLayout from '@/components/layouts/ActivityDashboardLayout';
import { useActivityPayoutsData } from '@/hooks/useActivityPayoutsData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet } from 'lucide-react';
import PayoutStatusBadge from '@/components/activity-payouts/PayoutStatusBadge';
import PayoutDetailDrawer from '@/components/activity-payouts/PayoutDetailDrawer';

const formatCurrency = (amount: number, currency: string = 'IDR') => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ActivityPayoutsPage = () => {
  const { payouts, isLoading } = useActivityPayoutsData();
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);

  return (
    <ActivityDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payouts</h1>
          <p className="text-muted-foreground">
            View your earnings and payout history
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg">
            <Wallet className="w-12 h-12 mb-4 opacity-50" />
            <p>No payouts yet</p>
            <p className="text-sm">Payouts will appear here once generated</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Gross Revenue</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow 
                    key={payout.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPayoutId(payout.id)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(parseISO(payout.period_start), 'MMM d')} - {format(parseISO(payout.period_end), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payout.gross_revenue, payout.currency)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      -{formatCurrency(payout.commission_amount, payout.currency)}
                      <span className="text-xs text-muted-foreground ml-1">({payout.commission_rate}%)</span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(payout.net_amount, payout.currency)}
                    </TableCell>
                    <TableCell>
                      <PayoutStatusBadge status={payout.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <PayoutDetailDrawer
        payoutId={selectedPayoutId}
        open={!!selectedPayoutId}
        onClose={() => setSelectedPayoutId(null)}
      />
    </ActivityDashboardLayout>
  );
};

export default ActivityPayoutsPage;
