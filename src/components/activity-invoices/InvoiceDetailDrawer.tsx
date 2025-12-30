import { useRef } from 'react';
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
import { Printer, Download } from 'lucide-react';
import { useActivityInvoiceDetail } from '@/hooks/useActivityInvoicesData';
import InvoiceStatusBadge from './InvoiceStatusBadge';

interface InvoiceDetailDrawerProps {
  invoiceId: string | null;
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

const InvoiceDetailDrawer = ({ invoiceId, open, onClose }: InvoiceDetailDrawerProps) => {
  const { data: invoice, isLoading } = useActivityInvoiceDetail(invoiceId);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice?.invoice_number}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .header { margin-bottom: 30px; }
            .summary { margin: 20px 0; }
            .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
            .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; padding-top: 8px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadCSV = () => {
    if (!invoice) return;
    
    const escapeCsvValue = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const rows = [
      ['Invoice Number', invoice.invoice_number],
      ['Partner', invoice.partner_name],
      ['Issue Date', invoice.issue_date],
      ['Period', `${invoice.period_start} to ${invoice.period_end}`],
      ['Gross Revenue', invoice.gross_revenue.toString()],
      ['Commission', invoice.commission_amount.toString()],
      ['Net Amount', invoice.net_amount.toString()],
      ['Currency', invoice.currency],
      ['Status', invoice.status],
      [],
      ['Product Breakdown'],
      ['Product', 'Bookings', 'Qty', 'Revenue'],
      ...invoice.product_breakdown.map(p => [p.product_name, p.booking_count.toString(), p.total_qty.toString(), p.revenue.toString()]),
    ];
    
    const csv = rows.map(row => row.map(escapeCsvValue).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.invoice_number}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Invoice Details</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        ) : invoice ? (
          <div className="space-y-6 mt-6">
            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print / PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>

            {/* Printable Content */}
            <div ref={printRef}>
              {/* Header */}
              <div className="header border-b pb-4 mb-4">
                <h2 className="text-2xl font-bold">{invoice.invoice_number}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
              </div>

              {/* Billing Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Bill To</h4>
                  <p className="font-medium">{invoice.billing_details?.company_name || invoice.partner_name}</p>
                  {invoice.billing_details?.address && <p className="text-sm">{invoice.billing_details.address}</p>}
                  {invoice.billing_details?.city && <p className="text-sm">{invoice.billing_details.city}, {invoice.billing_details?.country}</p>}
                  {invoice.billing_details?.tax_id && <p className="text-sm">NPWP: {invoice.billing_details.tax_id}</p>}
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Issue Date: </span>
                    <span className="font-medium">{format(parseISO(invoice.issue_date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Period: </span>
                    <span className="font-medium">
                      {format(parseISO(invoice.period_start), 'MMM d')} - {format(parseISO(invoice.period_end), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount Summary */}
              <div className="summary rounded-lg border bg-card p-4 space-y-2 mb-6">
                <div className="summary-row flex justify-between">
                  <span className="text-muted-foreground">Gross Revenue ({invoice.booking_count} bookings, {invoice.total_qty} guests)</span>
                  <span className="font-medium">{formatCurrency(invoice.gross_revenue, invoice.currency)}</span>
                </div>
                <div className="summary-row flex justify-between">
                  <span className="text-muted-foreground">Platform Commission</span>
                  <span className="font-medium text-destructive">-{formatCurrency(invoice.commission_amount, invoice.currency)}</span>
                </div>
                <div className="summary-row total flex justify-between border-t pt-2">
                  <span className="font-bold">Net Amount Payable</span>
                  <span className="font-bold text-green-600">{formatCurrency(invoice.net_amount, invoice.currency)}</span>
                </div>
              </div>

              {/* Bank Details */}
              {invoice.billing_details?.bank_name && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Bank Details</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Bank:</span> {invoice.billing_details.bank_name}</p>
                    <p><span className="text-muted-foreground">Account:</span> {invoice.billing_details.bank_account}</p>
                    <p><span className="text-muted-foreground">Holder:</span> {invoice.billing_details.bank_holder}</p>
                  </div>
                </div>
              )}

              {/* Product Breakdown */}
              {invoice.product_breakdown && invoice.product_breakdown.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Product Breakdown</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Bookings</TableHead>
                          <TableHead className="text-right">Guests</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.product_breakdown.map((item) => (
                          <TableRow key={item.product_id}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell className="text-right">{item.booking_count}</TableCell>
                            <TableCell className="text-right">{item.total_qty}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.revenue, invoice.currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            {/* Bookings (not in printable for brevity) */}
            {invoice.bookings && invoice.bookings.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Included Bookings ({invoice.bookings.length})</h4>
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
                      {invoice.bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>{format(parseISO(booking.booking_date), 'MMM d')}</TableCell>
                          <TableCell className="truncate max-w-[120px]">{booking.product_name}</TableCell>
                          <TableCell className="text-right">{booking.total_qty}</TableCell>
                          <TableCell className="text-right">{formatCurrency(booking.subtotal_amount, invoice.currency)}</TableCell>
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
            Invoice not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default InvoiceDetailDrawer;
