import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, Loader2 } from 'lucide-react';
import { useBookingsData, BookingWithDetails } from '@/hooks/useBookingsData';
import { OfflineBookingForm } from '@/components/bookings/OfflineBookingForm';
import { BookingDetailModal } from '@/components/bookings/BookingDetailModal';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const OfflineBookingPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  
  const {
    bookings,
    loading,
    filters,
    setFilters,
    canEdit,
    canCreate,
    createOfflineBooking,
    addPayment,
    cancelBooking,
  } = useBookingsData();

  // Filter to offline bookings only
  const offlineBookings = bookings.filter(b => b.channel.startsWith('offline_'));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-700',
      confirmed: 'bg-emerald-500/20 text-emerald-700',
      cancelled: 'bg-red-500/20 text-red-700',
    };
    return <Badge className={cn('capitalize', variants[status] || '')}>{status}</Badge>;
  };

  const getPaymentStatus = (booking: BookingWithDetails) => {
    const totalPaid = booking.payments?.reduce((sum, p) => 
      p.status === 'paid' ? sum + p.amount : sum, 0) || 0;
    
    if (totalPaid >= booking.total_amount) return { label: 'Paid', color: 'text-emerald-600' };
    if (totalPaid > 0) return { label: 'Partial', color: 'text-orange-600' };
    return { label: 'Unpaid', color: 'text-red-600' };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Offline Booking</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage walk-in, phone, and agency bookings
            </p>
          </div>
          {canCreate && (
            <Button variant="hero" onClick={() => setShowForm(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <Select 
            value={filters.paymentStatus} 
            onValueChange={(v) => setFilters(prev => ({ ...prev, paymentStatus: v }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Select 
            value={filters.status} 
            onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Offline Bookings ({offlineBookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : offlineBookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <PlusCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No offline bookings yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Pax</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offlineBookings.map(booking => {
                    const paymentStatus = getPaymentStatus(booking);
                    return (
                      <TableRow 
                        key={booking.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <TableCell>
                          <div className="font-medium">{booking.customer?.full_name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{booking.customer?.phone}</div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {booking.departure?.trip?.route?.route_name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {booking.departure?.departure_date 
                            ? format(new Date(booking.departure.departure_date), 'MMM d')
                            : 'N/A'}
                          <span className="text-muted-foreground ml-1">
                            {booking.departure?.departure_time?.slice(0, 5)}
                          </span>
                        </TableCell>
                        <TableCell>{booking.pax_adult + booking.pax_child}</TableCell>
                        <TableCell className="font-medium">{formatPrice(booking.total_amount)}</TableCell>
                        <TableCell className={paymentStatus.color}>{paymentStatus.label}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <OfflineBookingForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={createOfflineBooking}
      />

      <BookingDetailModal
        booking={selectedBooking}
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        canEdit={canEdit}
        onAddPayment={addPayment}
        onCancel={cancelBooking}
      />
    </DashboardLayout>
  );
};

export default OfflineBookingPage;
