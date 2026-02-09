import { useState } from 'react';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWithdrawalsData, WithdrawalStatus } from '@/hooks/useWithdrawalsData';
import {
  Loader2,
  Banknote,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';

const statusConfig: Record<
  WithdrawalStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }
> = {
  requested: { label: 'Pending', variant: 'secondary', icon: Clock },
  approved: { label: 'Approved', variant: 'default', icon: CheckCircle },
  paid: { label: 'Paid', variant: 'outline', icon: Banknote },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
};

const AdminWithdrawalsPage = () => {
  const {
    withdrawals,
    loading,
    approveWithdrawal,
    rejectWithdrawal,
    markAsPaid,
  } = useWithdrawalsData(true);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | 'paid';
    withdrawalId: string;
  } | null>(null);

  const [processing, setProcessing] = useState(false);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAction = async () => {
    if (!confirmDialog) return;

    setProcessing(true);
    let success = false;

    switch (confirmDialog.action) {
      case 'approve':
        success = await approveWithdrawal(confirmDialog.withdrawalId);
        break;
      case 'reject':
        success = await rejectWithdrawal(confirmDialog.withdrawalId);
        break;
      case 'paid':
        success = await markAsPaid(confirmDialog.withdrawalId);
        break;
    }

    setProcessing(false);
    if (success) {
      setConfirmDialog(null);
    }
  };

  // Separate withdrawals by status
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'requested');
  const approvedWithdrawals = withdrawals.filter((w) => w.status === 'approved');
  const completedWithdrawals = withdrawals.filter(
    (w) => w.status === 'paid' || w.status === 'rejected'
  );

  // Calculate totals
  const totalPending = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const totalApproved = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const totalPaid = withdrawals
    .filter((w) => w.status === 'paid')
    .reduce((sum, w) => sum + w.amount, 0);

  const renderWithdrawalRow = (withdrawal: (typeof withdrawals)[0]) => {
    const config = statusConfig[withdrawal.status];
    const StatusIcon = config.icon;

    return (
      <TableRow key={withdrawal.id}>
        <TableCell>
          {format(new Date(withdrawal.requested_at), 'dd MMM yyyy HH:mm')}
        </TableCell>
        <TableCell className="font-medium">
          {withdrawal.partner?.name || '-'}
        </TableCell>
        <TableCell className="font-bold">
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
        <TableCell>
          <div className="flex gap-2">
            {withdrawal.status === 'requested' && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() =>
                    setConfirmDialog({
                      open: true,
                      action: 'approve',
                      withdrawalId: withdrawal.id,
                    })
                  }
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    setConfirmDialog({
                      open: true,
                      action: 'reject',
                      withdrawalId: withdrawal.id,
                    })
                  }
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {withdrawal.status === 'approved' && (
              <Button
                size="sm"
                variant="default"
                onClick={() =>
                  setConfirmDialog({
                    open: true,
                    action: 'paid',
                    withdrawalId: withdrawal.id,
                  })
                }
              >
                <Banknote className="w-4 h-4 mr-1" />
                Mark as Paid
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Withdrawal Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and process partner withdrawal requests
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pending Requests
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(totalPending, 'IDR')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pendingWithdrawals.length} requests
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Approved (Awaiting Payout)
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(totalApproved, 'IDR')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {approvedWithdrawals.length} requests
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid Out</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(totalPaid, 'IDR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingWithdrawals.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved ({approvedWithdrawals.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <Banknote className="w-4 h-4" />
              Completed ({completedWithdrawals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Withdrawal Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingWithdrawals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Clock className="w-12 h-12 mb-4 opacity-50" />
                    <p>No pending withdrawal requests</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Processed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingWithdrawals.map(renderWithdrawalRow)}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Withdrawals (Awaiting Payout)</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : approvedWithdrawals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mb-4 opacity-50" />
                    <p>No approved withdrawals awaiting payout</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Processed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedWithdrawals.map(renderWithdrawalRow)}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : completedWithdrawals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Banknote className="w-12 h-12 mb-4 opacity-50" />
                    <p>No completed withdrawals</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Processed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedWithdrawals.map(renderWithdrawalRow)}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog?.open}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'approve' && 'Approve Withdrawal'}
              {confirmDialog?.action === 'reject' && 'Reject Withdrawal'}
              {confirmDialog?.action === 'paid' && 'Mark as Paid'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'approve' &&
                'Are you sure you want to approve this withdrawal request? The partner will be notified.'}
              {confirmDialog?.action === 'reject' &&
                'Are you sure you want to reject this withdrawal request? The amount will be returned to the partner\'s available balance.'}
              {confirmDialog?.action === 'paid' &&
                'Are you sure you want to mark this withdrawal as paid? This confirms the payout has been completed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={processing}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminDashboardLayout>
  );
};

export default AdminWithdrawalsPage;
