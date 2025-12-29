import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CommissionRecord } from '@/hooks/useTransactionsData';

interface CommissionListProps {
  commissions: CommissionRecord[];
  formatCurrency: (amount: number, currency: string) => string;
}

const CommissionList = ({ commissions, formatCurrency }: CommissionListProps) => {
  if (commissions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No commission records found
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
            <TableHead className="text-right">Gross</TableHead>
            <TableHead className="text-right">Commission</TableHead>
            <TableHead className="text-right">Provider Fee</TableHead>
            <TableHead className="text-right">Net Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commissions.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                {format(new Date(record.created_at), 'dd MMM yyyy')}
              </TableCell>
              <TableCell>
                {record.booking ? (
                  <div>
                    <div className="font-medium">
                      {record.booking.customer?.full_name || 'Unknown'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {record.booking.departure?.trip?.trip_name} •{' '}
                      {record.booking.departure?.departure_date}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(record.gross_amount, record.currency)}
              </TableCell>
              <TableCell className="text-right text-destructive">
                -{formatCurrency(record.platform_fee_amount, record.currency)}
                <span className="text-xs text-muted-foreground ml-1">({record.platform_fee_percent}%)</span>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {record.payment_provider_fee_amount
                  ? `-${formatCurrency(record.payment_provider_fee_amount, record.currency)}`
                  : '—'}
              </TableCell>
              <TableCell className="text-right font-bold text-green-600">
                {formatCurrency(record.partner_net_amount, record.currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CommissionList;
