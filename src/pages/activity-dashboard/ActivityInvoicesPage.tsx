import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import ActivityDashboardLayout from '@/components/layouts/ActivityDashboardLayout';
import { useActivityInvoicesData } from '@/hooks/useActivityInvoicesData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';
import InvoiceStatusBadge from '@/components/activity-invoices/InvoiceStatusBadge';
import InvoiceDetailDrawer from '@/components/activity-invoices/InvoiceDetailDrawer';

const formatCurrency = (amount: number, currency: string = 'IDR') => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ActivityInvoicesPage = () => {
  const { invoices, isLoading } = useActivityInvoicesData();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  return (
    <ActivityDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">
            View and download your payout invoices
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p>No invoices yet</p>
            <p className="text-sm">Invoices are generated from approved payouts</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead className="text-right">Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedInvoiceId(invoice.id)}
                  >
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>
                      {format(parseISO(invoice.period_start), 'MMM d')} - {format(parseISO(invoice.period_end), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{format(parseISO(invoice.issue_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(invoice.net_amount, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <InvoiceDetailDrawer
        invoiceId={selectedInvoiceId}
        open={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </ActivityDashboardLayout>
  );
};

export default ActivityInvoicesPage;
