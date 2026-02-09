import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminDashboardLayout from '@/components/layouts/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet, TrendingUp, DollarSign, Users, Calendar, Download, Loader2, Percent, BarChart3, Home,
} from 'lucide-react';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';

type TimeRange = 'day' | 'week' | 'month' | 'year' | 'all';

const AdminAccommodationCommissionsPage = () => {
  const [selectedPartnerId, setSelectedPartnerId] = useState('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: partners = [] } = useQuery({
    queryKey: ['admin-partners-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partners').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case 'day': return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'week': return { start: format(subDays(now, 7), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'month': return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'year': return { start: format(startOfYear(now), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      default: return { start: null, end: null };
    }
  };

  // Commission records
  const { data: commissionRecords = [], isLoading: isLoadingCommissions } = useQuery({
    queryKey: ['admin-accom-commissions', selectedPartnerId, timeRange, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('accommodation_commission_records')
        .select(`
          id, booking_id, gross_amount, platform_fee_amount, platform_fee_percent,
          partner_net_amount, currency, created_at,
          partner:partners(id, name)
        `)
        .order('created_at', { ascending: false });

      if (selectedPartnerId !== 'all') query = query.eq('partner_id', selectedPartnerId);

      const range = getDateRange();
      const startDate = dateFrom || range.start;
      const endDate = dateTo || range.end;
      if (startDate) query = query.gte('created_at', `${startDate}T00:00:00`);
      if (endDate) query = query.lte('created_at', `${endDate}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Payments
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['admin-accom-payments', selectedPartnerId, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('accommodation_payments')
        .select(`
          id, booking_id, amount, currency, method, status, paid_at, created_at,
          partner:partners(id, name),
          booking:accommodation_bookings(guest_name)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (selectedPartnerId !== 'all') query = query.eq('partner_id', selectedPartnerId);
      if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00`);
      if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const totals = useMemo(() => {
    const result = { totalGross: 0, totalPlatformFees: 0, totalPartnerNet: 0, transactionCount: 0 };
    commissionRecords.forEach((r: any) => {
      result.totalGross += Number(r.gross_amount) || 0;
      result.totalPlatformFees += Number(r.platform_fee_amount) || 0;
      result.totalPartnerNet += Number(r.partner_net_amount) || 0;
      result.transactionCount += 1;
    });
    return result;
  }, [commissionRecords]);

  const byPartner = useMemo(() => {
    const result: Record<string, { name: string; gross: number; platformFees: number; count: number }> = {};
    commissionRecords.forEach((r: any) => {
      const pid = r.partner?.id || 'unknown';
      const pname = r.partner?.name || 'Unknown';
      if (!result[pid]) result[pid] = { name: pname, gross: 0, platformFees: 0, count: 0 };
      result[pid].gross += Number(r.gross_amount) || 0;
      result[pid].platformFees += Number(r.platform_fee_amount) || 0;
      result[pid].count += 1;
    });
    return Object.values(result).sort((a, b) => b.platformFees - a.platformFees);
  }, [commissionRecords]);

  const byDay = useMemo(() => {
    const result: Record<string, { date: string; gross: number; platformFees: number; count: number }> = {};
    commissionRecords.forEach((r: any) => {
      const date = format(new Date(r.created_at), 'yyyy-MM-dd');
      if (!result[date]) result[date] = { date, gross: 0, platformFees: 0, count: 0 };
      result[date].gross += Number(r.gross_amount) || 0;
      result[date].platformFees += Number(r.platform_fee_amount) || 0;
      result[date].count += 1;
    });
    return Object.values(result).sort((a, b) => b.date.localeCompare(a.date));
  }, [commissionRecords]);

  const fmtCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const exportPaymentsCSV = () => {
    const headers = ['Date', 'Partner', 'Booking ID', 'Guest', 'Amount', 'Method', 'Status'];
    const rows = payments.map((p: any) => [
      format(new Date(p.created_at), 'yyyy-MM-dd HH:mm'),
      p.partner?.name || '-', p.booking_id,
      p.booking?.guest_name || '-', p.amount, p.method, p.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-accom-payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportCommissionsCSV = () => {
    const headers = ['Date', 'Partner', 'Booking ID', 'Gross', 'Rate', 'Platform Fee', 'Partner Net'];
    const rows = commissionRecords.map((c: any) => [
      format(new Date(c.created_at), 'yyyy-MM-dd HH:mm'),
      c.partner?.name || '-', c.booking_id, c.gross_amount,
      `${c.platform_fee_percent}%`, c.platform_fee_amount, c.partner_net_amount,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-accom-commissions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Accommodation Commissions</h1>
            <p className="text-muted-foreground">Revenue from accommodation partner transactions</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="min-w-[200px]">
                <Label>Partner</Label>
                <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="All Partners" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Partners</SelectItem>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Period</Label>
                <div className="flex gap-1 mt-1">
                  {(['day', 'week', 'month', 'year', 'all'] as TimeRange[]).map((range) => (
                    <Button key={range} variant={timeRange === range ? 'default' : 'outline'} size="sm"
                      onClick={() => { setTimeRange(range); setDateFrom(''); setDateTo(''); }}>
                      {range === 'day' && 'Today'}
                      {range === 'week' && '7 Days'}
                      {range === 'month' && 'This Month'}
                      {range === 'year' && 'This Year'}
                      {range === 'all' && 'All Time'}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>From</Label>
                <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setTimeRange('all'); }} className="mt-1" />
              </div>
              <div>
                <Label>To</Label>
                <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setTimeRange('all'); }} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        {isLoadingCommissions ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><DollarSign className="h-4 w-4" />Platform Revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{fmtCurrency(totals.totalPlatformFees)}</div>
                <p className="text-xs text-muted-foreground">Total commission collected</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Gross Volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fmtCurrency(totals.totalGross)}</div>
                <p className="text-xs text-muted-foreground">Total transaction volume</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><Users className="h-4 w-4" />Partner Earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fmtCurrency(totals.totalPartnerNet)}</div>
                <p className="text-xs text-muted-foreground">Net paid to partners</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><Calendar className="h-4 w-4" />Transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.transactionCount}</div>
                <p className="text-xs text-muted-foreground">Commission records</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="by-partner" className="space-y-4">
          <TabsList>
            <TabsTrigger value="by-partner" className="gap-2"><Users className="w-4 h-4" />By Partner</TabsTrigger>
            <TabsTrigger value="by-day" className="gap-2"><BarChart3 className="w-4 h-4" />By Day</TabsTrigger>
            <TabsTrigger value="payments" className="gap-2"><Wallet className="w-4 h-4" />Payment History</TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2"><Percent className="w-4 h-4" />Commission Details</TabsTrigger>
          </TabsList>

          {/* By Partner */}
          <TabsContent value="by-partner">
            <Card>
              <CardHeader>
                <CardTitle>Commission by Partner</CardTitle>
                <CardDescription>Platform revenue breakdown per partner</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCommissions ? <Skeleton className="h-40" /> : byPartner.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No commission data</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Gross Volume</TableHead>
                        <TableHead className="text-right">Platform Commission</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byPartner.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right">{p.count}</TableCell>
                          <TableCell className="text-right">{fmtCurrency(p.gross)}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">{fmtCurrency(p.platformFees)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Day */}
          <TabsContent value="by-day">
            <Card>
              <CardHeader>
                <CardTitle>Commission by Day</CardTitle>
                <CardDescription>Daily breakdown of platform revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCommissions ? <Skeleton className="h-40" /> : byDay.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No data</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Gross Volume</TableHead>
                        <TableHead className="text-right">Platform Commission</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byDay.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell>{format(new Date(d.date), 'dd MMM yyyy')}</TableCell>
                          <TableCell className="text-right">{d.count}</TableCell>
                          <TableCell className="text-right">{fmtCurrency(d.gross)}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">{fmtCurrency(d.platformFees)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History */}
          <TabsContent value="payments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>All accommodation payments</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportPaymentsCSV}>
                  <Download className="w-4 h-4 mr-2" />Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingPayments ? <Skeleton className="h-40" /> : payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No payments found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Guest</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {format(new Date(p.created_at), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>{p.partner?.name || '-'}</TableCell>
                          <TableCell>{p.booking?.guest_name || '-'}</TableCell>
                          <TableCell className="text-right font-medium">{fmtCurrency(p.amount)}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{p.method}</Badge></TableCell>
                          <TableCell>
                            <Badge className={
                              p.status === 'paid' ? 'bg-green-100 text-green-800' :
                              p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>{p.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commission Details */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Commission Details</CardTitle>
                  <CardDescription>Per-booking commission breakdown</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportCommissionsCSV}>
                  <Download className="w-4 h-4 mr-2" />Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingCommissions ? <Skeleton className="h-40" /> : commissionRecords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No commission records</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Platform Fee</TableHead>
                        <TableHead className="text-right">Partner Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionRecords.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {format(new Date(c.created_at), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>{c.partner?.name || '-'}</TableCell>
                          <TableCell className="text-right">{fmtCurrency(c.gross_amount)}</TableCell>
                          <TableCell className="text-right">{c.platform_fee_percent}%</TableCell>
                          <TableCell className="text-right font-medium text-green-600">{fmtCurrency(c.platform_fee_amount)}</TableCell>
                          <TableCell className="text-right">{fmtCurrency(c.partner_net_amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminAccommodationCommissionsPage;
