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
  Wallet,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Download,
  Loader2,
  Percent,
  BarChart3,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, parseISO, isSameDay, isSameMonth, isSameYear } from 'date-fns';

type TimeRange = 'day' | 'week' | 'month' | 'year' | 'all';

const AdminCommissionsPage = () => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Fetch partners
  const { data: partners = [] } = useQuery({
    queryKey: ['admin-partners-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Get date range based on timeRange
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case 'day':
        return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'week':
        return { start: format(subDays(now, 7), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'month':
        return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'year':
        return { start: format(startOfYear(now), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      default:
        return { start: null, end: null };
    }
  };

  // Fetch commission records with partner info
  const { data: commissionRecords = [], isLoading: isLoadingCommissions } = useQuery({
    queryKey: ['admin-all-commissions', selectedPartnerId, timeRange, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('commission_records')
        .select(`
          id,
          booking_id,
          gross_amount,
          platform_fee_amount,
          platform_fee_percent,
          partner_net_amount,
          payment_provider_fee_amount,
          currency,
          created_at,
          partner:partners(id, name)
        `)
        .order('created_at', { ascending: false });

      // Filter by partner
      if (selectedPartnerId !== 'all') {
        query = query.eq('partner_id', selectedPartnerId);
      }

      // Date range
      const range = getDateRange();
      const startDate = dateFrom || range.start;
      const endDate = dateTo || range.end;

      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00`);
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch payments with partner info
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['admin-all-payments', selectedPartnerId, dateFrom, dateTo, statusFilter, methodFilter],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          id,
          booking_id,
          amount,
          currency,
          method,
          status,
          provider,
          paid_at,
          created_at,
          partner:partners(id, name),
          booking:bookings(
            id,
            customer:customers(full_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by partner
      if (selectedPartnerId !== 'all') {
        query = query.eq('partner_id', selectedPartnerId);
      }

      // Date range
      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00`);
      }
      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59`);
      }

      // Status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      // Method filter
      if (methodFilter !== 'all') {
        query = query.eq('method', methodFilter as any);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Calculate totals
  const totals = useMemo(() => {
    const result = {
      totalGross: 0,
      totalPlatformFees: 0,
      totalPartnerNet: 0,
      totalProviderFees: 0,
      transactionCount: 0,
    };

    commissionRecords.forEach((record) => {
      result.totalGross += Number(record.gross_amount) || 0;
      result.totalPlatformFees += Number(record.platform_fee_amount) || 0;
      result.totalPartnerNet += Number(record.partner_net_amount) || 0;
      result.totalProviderFees += Number(record.payment_provider_fee_amount) || 0;
      result.transactionCount += 1;
    });

    return result;
  }, [commissionRecords]);

  // Group by partner
  const byPartner = useMemo(() => {
    const result: Record<string, { 
      name: string; 
      gross: number; 
      platformFees: number; 
      count: number; 
      currency: string 
    }> = {};

    commissionRecords.forEach((record) => {
      const partnerId = (record.partner as any)?.id || 'unknown';
      const partnerName = (record.partner as any)?.name || 'Unknown';

      if (!result[partnerId]) {
        result[partnerId] = { name: partnerName, gross: 0, platformFees: 0, count: 0, currency: record.currency };
      }

      result[partnerId].gross += Number(record.gross_amount) || 0;
      result[partnerId].platformFees += Number(record.platform_fee_amount) || 0;
      result[partnerId].count += 1;
    });

    return Object.values(result).sort((a, b) => b.platformFees - a.platformFees);
  }, [commissionRecords]);

  // Group by day
  const byDay = useMemo(() => {
    const result: Record<string, { 
      date: string; 
      gross: number; 
      platformFees: number; 
      count: number;
    }> = {};

    commissionRecords.forEach((record) => {
      const date = format(new Date(record.created_at), 'yyyy-MM-dd');

      if (!result[date]) {
        result[date] = { date, gross: 0, platformFees: 0, count: 0 };
      }

      result[date].gross += Number(record.gross_amount) || 0;
      result[date].platformFees += Number(record.platform_fee_amount) || 0;
      result[date].count += 1;
    });

    return Object.values(result).sort((a, b) => b.date.localeCompare(a.date));
  }, [commissionRecords]);

  const formatCurrency = (amount: number, currency: string = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Export CSV
  const exportPaymentsCSV = () => {
    const headers = ['Date', 'Partner', 'Booking ID', 'Customer', 'Amount', 'Method', 'Status'];
    const rows = payments.map((p: any) => [
      format(new Date(p.created_at), 'yyyy-MM-dd HH:mm'),
      p.partner?.name || '-',
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
    a.download = `admin-payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportCommissionsCSV = () => {
    const headers = ['Date', 'Partner', 'Booking ID', 'Gross', 'Commission Rate', 'Platform Commission', 'Partner Net'];
    const rows = commissionRecords.map((c: any) => [
      format(new Date(c.created_at), 'yyyy-MM-dd HH:mm'),
      c.partner?.name || '-',
      c.booking_id,
      c.gross_amount,
      `${c.platform_fee_percent}%`,
      c.platform_fee_amount,
      c.partner_net_amount,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-commissions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Percent className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Platform Commissions</h1>
            <p className="text-muted-foreground">
              Revenue collected from all partner transactions
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Partner Filter */}
              <div className="min-w-[200px]">
                <Label>Partner</Label>
                <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Partners" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Partners</SelectItem>
                    {partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Range */}
              <div>
                <Label>Period</Label>
                <div className="flex gap-1 mt-1">
                  {(['day', 'week', 'month', 'year', 'all'] as TimeRange[]).map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setTimeRange(range);
                        setDateFrom('');
                        setDateTo('');
                      }}
                    >
                      {range === 'day' && 'Today'}
                      {range === 'week' && '7 Days'}
                      {range === 'month' && 'This Month'}
                      {range === 'year' && 'This Year'}
                      {range === 'all' && 'All Time'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div>
                <Label>From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setTimeRange('all');
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setTimeRange('all');
                  }}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {isLoadingCommissions ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Platform Revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.totalPlatformFees)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total commission collected
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Gross Volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totals.totalGross)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total transaction volume
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Partner Earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totals.totalPartnerNet)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Net paid to partners
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.transactionCount}</div>
                <p className="text-xs text-muted-foreground">
                  Commission records
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="by-partner" className="space-y-4">
          <TabsList>
            <TabsTrigger value="by-partner" className="gap-2">
              <Users className="w-4 h-4" />
              By Partner
            </TabsTrigger>
            <TabsTrigger value="by-day" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              By Day
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <Wallet className="w-4 h-4" />
              Payment History
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2">
              <Percent className="w-4 h-4" />
              Commission Details
            </TabsTrigger>
          </TabsList>

          {/* By Partner Tab */}
          <TabsContent value="by-partner">
            <Card>
              <CardHeader>
                <CardTitle>Commission by Partner</CardTitle>
                <CardDescription>
                  Platform revenue breakdown per partner
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCommissions ? (
                  <Skeleton className="h-40" />
                ) : byPartner.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No commission data available for this period
                  </p>
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
                      {byPartner.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">{item.count}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.gross, item.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600 font-semibold">
                              {formatCurrency(item.platformFees, item.currency)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Total Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right">{totals.transactionCount}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(totals.totalGross)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(totals.totalPlatformFees)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Day Tab */}
          <TabsContent value="by-day">
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue</CardTitle>
                <CardDescription>
                  Gross and commission by day
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCommissions ? (
                  <Skeleton className="h-40" />
                ) : byDay.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No data available for this period
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Gross Revenue</TableHead>
                        <TableHead className="text-right">Platform Commission</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byDay.map((item) => (
                        <TableRow key={item.date}>
                          <TableCell className="font-medium">
                            {format(parseISO(item.date), 'EEEE, dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="text-right">{item.count}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.gross)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600 font-semibold">
                              {formatCurrency(item.platformFees)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Payment History
                  </CardTitle>
                </div>
                <Button variant="outline" onClick={exportPaymentsCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {/* Payment Filters */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="min-w-[150px]">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[150px]">
                    <Label>Method</Label>
                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoadingPayments ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No payments found
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Booking</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(payment.created_at), 'dd MMM yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.partner?.name || '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.booking_id?.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {payment.booking?.customer?.full_name || '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(payment.amount, payment.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.method}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                payment.status === 'completed'
                                  ? 'default'
                                  : payment.status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commission Details Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="w-5 h-5" />
                    Commission Details
                  </CardTitle>
                </div>
                <Button variant="outline" onClick={exportCommissionsCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingCommissions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : commissionRecords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No commission records found
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Partner</TableHead>
                        <TableHead>Booking</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Partner Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionRecords.slice(0, 50).map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(record.created_at), 'dd MMM yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {record.partner?.name || '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {record.booking_id?.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(record.gross_amount, record.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{record.platform_fee_percent}%</Badge>
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            {formatCurrency(record.platform_fee_amount, record.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(record.partner_net_amount, record.currency)}
                          </TableCell>
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
    </AdminDashboardLayout>
  );
};

export default AdminCommissionsPage;
