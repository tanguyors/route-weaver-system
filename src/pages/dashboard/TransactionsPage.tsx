import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransactionsData } from '@/hooks/useTransactionsData';
import PaymentList from '@/components/transactions/PaymentList';
import CommissionList from '@/components/transactions/CommissionList';
import WithdrawalDialog from '@/components/transactions/WithdrawalDialog';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Loader2,
  CreditCard,
  Percent,
} from 'lucide-react';

const TransactionsPage = () => {
  const {
    payments,
    commissions,
    summary,
    loading,
    requestWithdrawal,
  } = useTransactionsData();

  const [withdrawalOpen, setWithdrawalOpen] = useState(false);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
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
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
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
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
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
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
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
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Percent className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Commission (7%)
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

        {/* Tabs for Payments and Commissions */}
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
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <PaymentList
                    payments={payments}
                    formatCurrency={formatCurrency}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Commission Breakdown
                </CardTitle>
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
        </Tabs>
      </div>

      {/* Withdrawal Dialog */}
      <WithdrawalDialog
        open={withdrawalOpen}
        onOpenChange={setWithdrawalOpen}
        availableBalance={summary.availableBalance}
        onSubmit={requestWithdrawal}
        formatCurrency={formatCurrency}
      />
    </DashboardLayout>
  );
};

export default TransactionsPage;
