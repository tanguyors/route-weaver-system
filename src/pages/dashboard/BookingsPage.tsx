import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, Filter, Eye, MoreHorizontal, Users, Calendar, CreditCard, ArrowLeftRight, Car } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useBookingsData, BookingWithDetails } from '@/hooks/useBookingsData';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingDetailModal } from '@/components/bookings/BookingDetailModal';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  refunded: { label: 'Refunded', variant: 'outline' },
};

const channelLabels: Record<string, string> = {
  online_widget: 'Online',
  offline_walkin: 'Walk-in',
  offline_whatsapp: 'WhatsApp',
  offline_agency: 'Agency',
  offline_other: 'Other',
};

const BookingsPage = () => {
  const { bookings, loading, filters, setFilters, canEdit, cancelBooking, addPayment, fetchBookings } = useBookingsData();
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const formatCurrency = (amount: number, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentStatus = (booking: BookingWithDetails) => {
    const totalPaid = booking.payments?.reduce((sum, p) => 
      p.status === 'paid' ? sum + p.amount : sum, 0) || 0;
    
    if (totalPaid === 0) return { label: 'Unpaid', variant: 'destructive' as const };
    if (totalPaid >= booking.total_amount) return { label: 'Paid', variant: 'default' as const };
    return { label: 'Partial', variant: 'secondary' as const };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Bookings</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all bookings
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone or ID..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Channel</label>
                  <Select
                    value={filters.channel || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, channel: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All channels</SelectItem>
                      <SelectItem value="online_widget">Online</SelectItem>
                      <SelectItem value="offline_walkin">Walk-in</SelectItem>
                      <SelectItem value="offline_whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="offline_agency">Agency</SelectItem>
                      <SelectItem value="offline_other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment</label>
                  <Select
                    value={filters.paymentStatus || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, paymentStatus: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All payments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All payments</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              All Bookings ({bookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg mb-2">No bookings yet</p>
                  <p className="text-muted-foreground text-sm">
                    Bookings will appear here once created
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Return</TableHead>
                      <TableHead>Pickup</TableHead>
                      <TableHead>Pax</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      const paymentStatus = getPaymentStatus(booking);
                      return (
                        <TableRow 
                          key={booking.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <TableCell className="font-mono text-xs">
                            {booking.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.customer?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{booking.customer?.email || booking.customer?.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{booking.departure?.trip?.route?.route_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{booking.departure?.trip?.trip_name}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">
                                {booking.departure?.departure_date 
                                  ? format(new Date(booking.departure.departure_date), 'dd MMM yyyy')
                                  : 'N/A'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{booking.departure?.departure_time?.slice(0, 5)}</p>
                          </TableCell>
                          <TableCell>
                            {booking.return_departure ? (
                              <div className="flex items-center gap-1">
                                <ArrowLeftRight className="w-3 h-3 text-primary" />
                                <span className="text-xs">
                                  {format(new Date(booking.return_departure.departure_date), 'dd MMM')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {booking.hasPickup ? (
                              <div className="flex items-center gap-1 text-primary">
                                <Car className="w-3 h-3" />
                                <span className="text-xs">Yes</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span>{booking.pax_adult + booking.pax_child}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatCurrency(booking.total_amount, booking.currency)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={paymentStatus.variant}>{paymentStatus.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusConfig[booking.status]?.variant || 'secondary'}>
                              {statusConfig[booking.status]?.label || booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBooking(booking);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          canEdit={canEdit}
          onAddPayment={addPayment}
          onCancel={cancelBooking}
        />
      )}
    </DashboardLayout>
  );
};

export default BookingsPage;
