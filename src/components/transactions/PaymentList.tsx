import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Payment, PaymentStatus, PaymentMethod } from '@/hooks/useTransactionsData';

interface PaymentListProps {
  payments: Payment[];
  formatCurrency: (amount: number, currency: string) => string;
}

const statusConfig: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  unpaid: { label: 'Unpaid', variant: 'outline' },
  paid: { label: 'Paid', variant: 'default' },
  partial: { label: 'Partial', variant: 'secondary' },
  failed: { label: 'Failed', variant: 'destructive' },
  refunded: { label: 'Refunded', variant: 'destructive' },
};

const methodLabels: Record<PaymentMethod, string> = {
  card: 'Card',
  qris: 'QRIS',
  transfer: 'Bank Transfer',
  cash: 'Cash',
  payment_link: 'Payment Link',
};

const PaymentList = ({ payments, formatCurrency }: PaymentListProps) => {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No payments found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Booking</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const status = statusConfig[payment.status];
            return (
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="font-medium">
                    {format(new Date(payment.created_at), 'dd MMM yyyy')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(payment.created_at), 'HH:mm')}
                  </div>
                </TableCell>
                <TableCell>
                  {payment.booking ? (
                    <div>
                      <div className="font-medium">
                        {payment.booking.customer?.full_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {payment.booking.departure?.trip?.trip_name} •{' '}
                        {payment.booking.departure?.departure_date}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(payment.amount, payment.currency)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{methodLabels[payment.method]}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {payment.provider}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaymentList;
