import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Banknote } from 'lucide-react';

export type WithdrawalStatus = 'requested' | 'approved' | 'paid' | 'rejected';

export interface WithdrawalRequest {
  id: string;
  partner_id: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  requested_at: string;
  processed_at: string | null;
  requested_by_user_id: string;
  processed_by_admin_user_id: string | null;
}

interface WithdrawalListProps {
  withdrawals: WithdrawalRequest[];
  formatCurrency: (amount: number, currency: string) => string;
}

const statusConfig: Record<WithdrawalStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  requested: { label: 'Pending', variant: 'secondary', icon: Clock },
  approved: { label: 'Approved', variant: 'default', icon: CheckCircle },
  paid: { label: 'Paid', variant: 'outline', icon: Banknote },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
};

const WithdrawalList = ({ withdrawals, formatCurrency }: WithdrawalListProps) => {
  if (withdrawals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Banknote className="w-12 h-12 mb-4 opacity-50" />
        <p>No withdrawal requests yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Request Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Processed Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {withdrawals.map((withdrawal) => {
          const config = statusConfig[withdrawal.status];
          const StatusIcon = config.icon;

          return (
            <TableRow key={withdrawal.id}>
              <TableCell>
                {format(new Date(withdrawal.requested_at), 'dd MMM yyyy HH:mm')}
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(withdrawal.amount, withdrawal.currency)}
              </TableCell>
              <TableCell>
                <Badge variant={config.variant} className="gap-1">
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </Badge>
              </TableCell>
              <TableCell>
                {withdrawal.processed_at
                  ? format(new Date(withdrawal.processed_at), 'dd MMM yyyy HH:mm')
                  : '-'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default WithdrawalList;
