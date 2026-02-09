import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import { useActivityPayoutsData } from '@/hooks/useActivityPayoutsData';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Plus, Check, Banknote, Loader2 } from 'lucide-react';
import PayoutStatusBadge from '@/components/activity-payouts/PayoutStatusBadge';
import PayoutDetailDrawer from '@/components/activity-payouts/PayoutDetailDrawer';
import GeneratePayoutModal from '@/components/activity-payouts/GeneratePayoutModal';

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

const AdminActivityPayoutsPage = () => {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPartnerId, setFilterPartnerId] = useState<string>('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { payouts, isLoading, approvePayout, markPaid } = useActivityPayoutsData({
    status: filterStatus || undefined,
    partnerId: filterPartnerId || undefined,
  });

  // Fetch partners for filter and modal
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

  const handleApprove = async (payoutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(payoutId);
    try {
      await approvePayout(payoutId);
      toast({ title: 'Payout approved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (payoutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(payoutId);
    try {
      await markPaid(payoutId);
      toast({ title: 'Payout marked as paid' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity Payouts</h1>
            <p className="text-muted-foreground">
              Manage partner payouts and commissions
            </p>
          </div>
          <Button onClick={() => setShowGenerateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Generate Payout
          </Button>
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
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
            <p>No payouts found</p>
            <p className="text-sm">Generate a payout to get started</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow 
                    key={payout.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPayoutId(payout.id)}
                  >
                    <TableCell className="font-medium">{payout.partner_name}</TableCell>
                    <TableCell>
                      {format(parseISO(payout.period_start), 'MMM d')} - {format(parseISO(payout.period_end), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payout.gross_revenue, payout.currency)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      -{formatCurrency(payout.commission_amount, payout.currency)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(payout.net_amount, payout.currency)}
                    </TableCell>
                    <TableCell>
                      <PayoutStatusBadge status={payout.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {payout.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleApprove(payout.id, e)}
                            disabled={actionLoading === payout.id}
                          >
                            {actionLoading === payout.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                        )}
                        {payout.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={(e) => handleMarkPaid(payout.id, e)}
                            disabled={actionLoading === payout.id}
                          >
                            {actionLoading === payout.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Banknote className="w-4 h-4 mr-1" />
                                Mark Paid
                              </>
                            )}
                          </Button>
                        )}
                      </div>
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

      <GeneratePayoutModal
        open={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        partners={partners}
      />
    </DashboardLayout>
  );
};

export default AdminActivityPayoutsPage;
