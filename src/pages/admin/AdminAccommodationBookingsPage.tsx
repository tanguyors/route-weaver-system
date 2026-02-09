import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

const AdminAccommodationBookingsPage = () => {
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
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

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['admin-accommodation-bookings', partnerFilter, statusFilter, channelFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('accommodation_bookings')
        .select(`
          id, created_at, guest_name, guest_email, guest_phone,
          checkin_date, checkout_date, total_nights, total_amount,
          currency, status, channel,
          accommodation:accommodations(name),
          partner:partners(name)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (partnerFilter !== 'all') query = query.eq('partner_id', partnerFilter);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (channelFilter !== 'all') query = query.eq('channel', channelFilter);
      if (dateFrom) query = query.gte('checkin_date', dateFrom);
      if (dateTo) query = query.lte('checkout_date', dateTo);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Accommodation Bookings</h1>
            <p className="text-muted-foreground">All accommodation reservations across partners</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="min-w-[180px]">
                <Label>Partner</Label>
                <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="All Partners" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Partners</SelectItem>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[140px]">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[140px]">
                <Label>Channel</Label>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>From</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>To</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No accommodation bookings found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead className="text-center">Nights</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b: any) => {
                    const accom = Array.isArray(b.accommodation) ? b.accommodation[0] : b.accommodation;
                    const partner = Array.isArray(b.partner) ? b.partner[0] : b.partner;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(new Date(b.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">{b.guest_name}</TableCell>
                        <TableCell>{accom?.name || '-'}</TableCell>
                        <TableCell>{partner?.name || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(new Date(b.checkin_date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(new Date(b.checkout_date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-center">{b.total_nights}</TableCell>
                        <TableCell className="text-right whitespace-nowrap font-medium">
                          {formatCurrency(b.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{b.channel}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[b.status] || 'bg-muted text-muted-foreground'}>
                            {b.status}
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
      </div>
    </DashboardLayout>
  );
};

export default AdminAccommodationBookingsPage;
