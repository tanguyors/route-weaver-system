import { useState, useEffect } from 'react';
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import { useActivityInvoicesData, exportInvoicesCsv, exportBookingLinesCsv } from '@/hooks/useActivityInvoicesData';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, XCircle, Loader2 } from 'lucide-react';
import InvoiceStatusBadge from '@/components/activity-invoices/InvoiceStatusBadge';
import InvoiceDetailDrawer from '@/components/activity-invoices/InvoiceDetailDrawer';

interface Partner {
  id: string;
  name: string;
}

const formatCurrency = (amount: number, currency: string = 'IDR') => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const AdminActivityInvoicesPage = () => {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPartnerId, setFilterPartnerId] = useState<string>('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [voidConfirmId, setVoidConfirmId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Export date range
  const lastMonth = subMonths(new Date(), 1);
  const [exportDateFrom, setExportDateFrom] = useState(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
  const [exportDateTo, setExportDateTo] = useState(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));

  const { invoices, isLoading, voidInvoice, isVoiding } = useActivityInvoicesData({
    status: filterStatus || undefined,
    partnerId: filterPartnerId || undefined,
  });

  useEffect(() => {
    const fetchPartners = async () => {
      const { data } = await supabase
        .from('partners')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      if (data) setPartners(data);
    };
    fetchPartners();
  }, []);

  const handleVoid = async () => {
    if (!voidConfirmId) return;
    try {
      await voidInvoice(voidConfirmId);
      toast({ title: 'Invoice voided' });
      setVoidConfirmId(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleExportInvoices = async () => {
    setIsExporting(true);
    try {
      const data = await exportInvoicesCsv(exportDateFrom, exportDateTo, filterPartnerId || undefined);
      if (!data || data.length === 0) {
        toast({ title: 'No data', description: 'No invoices found for the selected period' });
        return;
      }
      
      const escapeCsvValue = (val: any) => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      const headers = ['Invoice Number', 'Partner', 'Period Start', 'Period End', 'Issue Date', 'Currency', 'Gross Revenue', 'Commission', 'Net Amount', 'Status', 'Paid At'];
      const rows = data.map(row => [
        row.invoice_number,
        row.partner_name,
        row.period_start,
        row.period_end,
        row.issue_date,
        row.currency,
        row.gross_revenue,
        row.commission_amount,
        row.net_amount,
        row.status,
        row.paid_at || '',
      ]);
      
      const csv = [headers.map(escapeCsvValue).join(','), ...rows.map(r => r.map(escapeCsvValue).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-invoices-${exportDateFrom}-to-${exportDateTo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: 'Exported', description: `${data.length} invoices exported` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBookings = async () => {
    setIsExporting(true);
    try {
      const data = await exportBookingLinesCsv(exportDateFrom, exportDateTo, filterPartnerId || undefined);
      if (!data || data.length === 0) {
        toast({ title: 'No data', description: 'No bookings found for the selected period' });
        return;
      }
      
      const escapeCsvValue = (val: any) => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      const headers = ['Booking ID', 'Partner', 'Product', 'Booking Date', 'Slot Time', 'Qty', 'Amount', 'Status', 'Payout ID', 'Invoice Number'];
      const rows = data.map(row => [
        row.booking_id,
        row.partner_name,
        row.product_name,
        row.booking_date,
        row.slot_time || '',
        row.total_qty,
        row.subtotal_amount,
        row.status,
        row.payout_id || '',
        row.invoice_number || '',
      ]);
      
      const csv = [headers.map(escapeCsvValue).join(','), ...rows.map(r => r.map(escapeCsvValue).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-bookings-${exportDateFrom}-to-${exportDateTo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: 'Exported', description: `${data.length} booking lines exported` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Invoices</h1>
          <p className="text-muted-foreground">
            Manage partner invoices and export accounting data
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={filterPartnerId} onValueChange={setFilterPartnerId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Partners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Partners</SelectItem>
              {partners.map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Section */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium mb-3">Export Data</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={exportDateFrom}
                onChange={(e) => setExportDateFrom(e.target.value)}
                className="w-[150px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                value={exportDateTo}
                onChange={(e) => setExportDateTo(e.target.value)}
                className="w-[150px]"
              />
            </div>
            <Button variant="outline" onClick={handleExportInvoices} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export Invoices CSV
            </Button>
            <Button variant="outline" onClick={handleExportBookings} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export Booking Lines CSV
            </Button>
          </div>
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
            <p>No invoices found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead className="text-right">Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>{invoice.partner_name}</TableCell>
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
                    <TableCell className="text-right">
                      {invoice.status === 'issued' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVoidConfirmId(invoice.id);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Void
                        </Button>
                      )}
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

      <AlertDialog open={!!voidConfirmId} onOpenChange={() => setVoidConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The invoice will be marked as void.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVoid} disabled={isVoiding}>
              {isVoiding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Void Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminDashboardLayout>
  );
};

export default AdminActivityInvoicesPage;
