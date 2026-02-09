import { useState } from 'react';
import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAccommodationTransactionsData } from '@/hooks/useAccommodationTransactionsData';
import { useWithdrawalsData } from '@/hooks/useWithdrawalsData';
import { DollarSign, TrendingUp, Wallet, ArrowDownToLine, CreditCard, Banknote, Receipt } from 'lucide-react';
import { format } from 'date-fns';

const paymentStatusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800 border-green-300',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  failed: 'bg-red-100 text-red-800 border-red-300',
};

const methodIcons: Record<string, React.ElementType> = {
  cash: Banknote,
  transfer: ArrowDownToLine,
  card: CreditCard,
};

const AccommodationTransactionsPage = () => {
  const { payments, commissions, summary, loading } = useAccommodationTransactionsData();
  const { withdrawals, loading: withdrawalsLoading } = useWithdrawalsData();
  const { requestWithdrawal } = useAccommodationTransactionsData();

  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return;
    setSubmitting(true);
    const success = await requestWithdrawal(amount);
    if (success) {
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
    }
    setSubmitting(false);
  };

  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Track payments, commissions & withdrawals</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gross Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {summary.totalGross.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Platform Fees ({summary.partnerCommissionRate}%)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {summary.totalCommission.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">LKR {summary.availableBalance.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Withdrawn</CardTitle>
              <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {summary.totalWithdrawn.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="payments">
          <TabsList>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2">
              <Receipt className="w-4 h-4" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <ArrowDownToLine className="w-4 h-4" />
              Withdrawals
            </TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg m-6">
                    <CreditCard className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No payments recorded yet</p>
                    <p className="text-sm text-muted-foreground">Record payments from the Bookings page</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Guest</TableHead>
                        <TableHead>Accommodation</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map(p => {
                        const MethodIcon = methodIcons[p.method] || CreditCard;
                        return (
                          <TableRow key={p.id}>
                            <TableCell>{format(new Date(p.paid_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="font-medium">{p.booking?.guest_name || '—'}</TableCell>
                            <TableCell>{p.booking?.accommodation?.name || '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <MethodIcon className="w-3.5 h-3.5" />
                                <span className="capitalize">{p.method}</span>
                              </div>
                            </TableCell>
                            <TableCell>{p.currency} {p.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={paymentStatusColors[p.status] || ''}>
                                {p.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : commissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg m-6">
                    <Receipt className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No commission records yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Guest</TableHead>
                        <TableHead>Accommodation</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Fee ({summary.partnerCommissionRate}%)</TableHead>
                        <TableHead>Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map(c => (
                        <TableRow key={c.id}>
                          <TableCell>{format(new Date(c.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="font-medium">{c.booking?.guest_name || '—'}</TableCell>
                          <TableCell>{c.booking?.accommodation?.name || '—'}</TableCell>
                          <TableCell>{c.currency} {c.gross_amount.toLocaleString()}</TableCell>
                          <TableCell className="text-destructive">-{c.currency} {c.platform_fee_amount.toLocaleString()}</TableCell>
                          <TableCell className="text-green-600 font-medium">{c.currency} {c.partner_net_amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setShowWithdrawDialog(true)} disabled={summary.availableBalance <= 0}>
                  <ArrowDownToLine className="h-4 w-4 mr-1" />
                  Request Withdrawal
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  {withdrawalsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-muted-foreground">Loading...</p>
                    </div>
                  ) : withdrawals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg m-6">
                      <Wallet className="w-12 h-12 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No withdrawal requests yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals.map((w: any) => (
                          <TableRow key={w.id}>
                            <TableCell>{format(new Date(w.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell>{w.currency} {Number(w.amount).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                w.status === 'paid' ? 'bg-green-100 text-green-800 border-green-300' :
                                w.status === 'requested' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                w.status === 'approved' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                'bg-red-100 text-red-800 border-red-300'
                              }>
                                {w.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Available balance: LKR {summary.availableBalance.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (LKR)</Label>
              <Input
                type="number"
                min={1}
                max={summary.availableBalance}
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>Cancel</Button>
            <Button
              onClick={handleWithdrawal}
              disabled={submitting || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > summary.availableBalance}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationTransactionsPage;
