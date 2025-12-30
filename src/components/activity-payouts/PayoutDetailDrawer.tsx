import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Loader2 } from 'lucide-react';
import { useActivityPayoutDetail } from '@/hooks/useActivityPayoutsData';
import { useActivityInvoicesData } from '@/hooks/useActivityInvoicesData';
import { useToast } from '@/hooks/use-toast';
import PayoutStatusBadge from './PayoutStatusBadge';
import InvoiceDetailDrawer from '@/components/activity-invoices/InvoiceDetailDrawer';

interface PayoutDetailDrawerProps {
  payoutId: string | null;
  open: boolean;
  onClose: () => void;
}

const formatCurrency = (amount: number, currency: string = 'IDR') => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const PayoutDetailDrawer = ({ payoutId, open, onClose }: PayoutDetailDrawerProps) => {
  const { toast } = useToast();
  const { data: payout, isLoading } = useActivityPayoutDetail(payoutId);
  const { createFromPayout, isCreating } = useActivityInvoicesData();
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const handleGenerateInvoice = async () => {
    if (!payoutId) return;
    try {
      const result = await createFromPayout(payoutId);
      if (result.success && result.invoice_id) {
        toast({ 
          title: result.already_exists ? 'Invoice exists' : 'Invoice generated',
          description: `Invoice ${result.invoice_number}` 
        });
        setInvoiceId(result.invoice_id);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Payout Details</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        ) : payout ? (
          <div className="space-y-6 mt-6">
            {/* Summary Card */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Period</span>
                <span className="font-medium">
                  {format(parseISO(payout.period_start), 'MMM d, yyyy')} - {format(parseISO(payout.period_end), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <PayoutStatusBadge status={payout.status} />
              </div>
              {payout.paid_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paid At</span>
                  <span className="font-medium">
                    {format(parseISO(payout.paid_at), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
              )}

              {/* Invoice Action - only for approved or paid payouts */}
              {(payout.status === 'approved' || payout.status === 'paid') && (
                <div className="border-t pt-3 mt-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleGenerateInvoice}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Generate / View Invoice
                  </Button>
                </div>
              )}

              <div className="border-t pt-3 mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gross Revenue</span>
                  <span className="font-medium">{formatCurrency(payout.gross_revenue, payout.currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Commission ({payout.commission_rate}%)</span>
                  <span className="font-medium text-destructive">-{formatCurrency(payout.commission_amount, payout.currency)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-medium">Net Amount</span>
                  <span className="font-bold text-green-600">{formatCurrency(payout.net_amount, payout.currency)}</span>
                </div>
              </div>
              <div className="border-t pt-3 mt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bookings</p>
                  <p className="text-lg font-semibold">{payout.booking_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Guests</p>
                  <p className="text-lg font-semibold">{payout.total_qty}</p>
                </div>
              </div>
            </div>

            {/* Product Breakdown */}
            {payout.product_breakdown && payout.product_breakdown.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Breakdown by Product</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Bookings</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payout.product_breakdown.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell className="text-right">{item.booking_count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.revenue, payout.currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Bookings List */}
            {payout.bookings && payout.bookings.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Included Bookings ({payout.bookings.length})</h4>
                <div className="rounded-md border max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payout.bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>{format(parseISO(booking.booking_date), 'MMM d')}</TableCell>
                          <TableCell className="truncate max-w-[120px]">{booking.product_name}</TableCell>
                          <TableCell className="text-right">{booking.total_qty}</TableCell>
                          <TableCell className="text-right">{formatCurrency(booking.subtotal_amount, payout.currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Payout not found
          </div>
        )}
      </SheetContent>
    </Sheet>
    
    <InvoiceDetailDrawer
      invoiceId={invoiceId}
      open={!!invoiceId}
      onClose={() => setInvoiceId(null)}
    />
    </>
  );
};

export default PayoutDetailDrawer;
