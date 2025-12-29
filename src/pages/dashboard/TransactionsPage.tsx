import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransactionsData } from '@/hooks/useTransactionsData';
import { useWithdrawalsData } from '@/hooks/useWithdrawalsData';
import PaymentList from '@/components/transactions/PaymentList';
import CommissionList from '@/components/transactions/CommissionList';
import WithdrawalList from '@/components/transactions/WithdrawalList';
import WithdrawalDialog from '@/components/transactions/WithdrawalDialog';
import TransactionFilters, { TransactionFilters as FilterType } from '@/components/transactions/TransactionFilters';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Loader2,
  CreditCard,
  Percent,
  Banknote,
} from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

const TransactionsPage = () => {
  const {
    payments,
    commissions,
    summary,
    loading,
    requestWithdrawal,
  } = useTransactionsData();

  const {
    withdrawals,
    loading: withdrawalsLoading,
    refetch: refetchWithdrawals,
  } = useWithdrawalsData(false);

  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [paymentFilters, setPaymentFilters] = useState<FilterType>({
    dateFrom: undefined,
    dateTo: undefined,
    status: 'all',
    method: 'all',
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const paymentDate = new Date(payment.created_at);

    if (paymentFilters.dateFrom && isBefore(paymentDate, startOfDay(paymentFilters.dateFrom))) {
      return false;
    }
    if (paymentFilters.dateTo && isAfter(paymentDate, endOfDay(paymentFilters.dateTo))) {
      return false;
    }
    if (paymentFilters.status !== 'all' && payment.status !== paymentFilters.status) {
      return false;
    }
    if (paymentFilters.method !== 'all' && payment.method !== paymentFilters.method) {
      return false;
    }
    return true;
  });

  // Export to CSV
  const exportPaymentsCSV = () => {
    const headers = ['Date', 'Booking ID', 'Customer', 'Amount', 'Method', 'Status'];
    const rows = filteredPayments.map((p) => [
      format(new Date(p.created_at), 'yyyy-MM-dd HH:mm'),
      p.booking_id,
      p.booking?.customer?.full_name || '-',
      p.amount,
      p.method,
      p.status,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportCommissionsCSV = () => {
    const headers = ['Date', 'Booking ID', 'Gross', 'Commission', 'Commission %', 'Provider Fee', 'Net'];
    const rows = commissions.map((c) => [
      format(new Date(c.created_at), 'yyyy-MM-dd HH:mm'),
      c.booking_id,
      c.gross_amount,
      c.platform_fee_amount,
      `${c.platform_fee_percent}%`,
      c.payment_provider_fee_amount || 0,
      c.partner_net_amount,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleWithdrawalSuccess = async (amount: number) => {
    const success = await requestWithdrawal(amount);
    if (success) {
      refetchWithdrawals();
    }
    return success;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Transactions
            </h1>
            <p className="text-muted-foreground mt-1">
              Track payments, commissions, and withdrawals
            </p>
          </div>
          <Button
            variant="hero"
            onClick={() => setWithdrawalOpen(true)}
            disabled={summary.availableBalance <= 0}
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Request Withdrawal
          </Button>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <ArrowDownRight className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Available Balance
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(summary.availableBalance, 'IDR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(summary.pendingBalance, 'IDR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(summary.totalWithdrawn, 'IDR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Percent className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Commission
                  </p>
                  <p className="text-2xl font-bold text-destructive">
                    -{formatCurrency(summary.totalCommission, 'IDR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Gross Revenue</p>
                <p className="text-xl font-bold">
                  {formatCurrency(summary.totalGross, 'IDR')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Platform Commission
                </p>
                <p className="text-xl font-bold text-destructive">
                  -{formatCurrency(summary.totalCommission, 'IDR')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Provider Fees</p>
                <p className="text-xl font-bold text-muted-foreground">
                  -{formatCurrency(summary.totalProviderFees, 'IDR')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Net Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(summary.totalNet, 'IDR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Payments, Commissions, and Withdrawals */}
        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Payments ({payments.length})
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2">
              <Percent className="w-4 h-4" />
              Commissions ({commissions.length})
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <Banknote className="w-4 h-4" />
              Withdrawals ({withdrawals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionFilters
                  filters={paymentFilters}
                  onFiltersChange={setPaymentFilters}
                  onExport={exportPaymentsCSV}
                  showMethodFilter={true}
                />
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <PaymentList
                    payments={filteredPayments}
                    formatCurrency={formatCurrency}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Commission Breakdown
                </CardTitle>
                <Button variant="outline" onClick={exportCommissionsCSV}>
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <CommissionList
                    commissions={commissions}
                    formatCurrency={formatCurrency}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Withdrawal History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawalsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <WithdrawalList
                    withdrawals={withdrawals}
                    formatCurrency={formatCurrency}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Withdrawal Dialog */}
      <WithdrawalDialog
        open={withdrawalOpen}
        onOpenChange={setWithdrawalOpen}
        availableBalance={summary.availableBalance}
        onSubmit={handleWithdrawalSuccess}
        formatCurrency={formatCurrency}
      />
    </DashboardLayout>
  );
};

export default TransactionsPage;
