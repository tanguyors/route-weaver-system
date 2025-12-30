import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ActivityDashboardLayout from '@/components/layouts/ActivityDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Ticket,
  User,
  Users,
  Calendar,
  Clock,
  Package,
  CreditCard,
  XCircle,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useActivityBookingsData, type ActivityBookingListItem } from '@/hooks/useActivityBookingsData';
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface BookingDetails {
  id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  booking_date: string;
  slot_time: string | null;
  status: string;
  currency: string;
  line_items: { tier_name?: string; duration_unit?: string; duration_value?: number; qty: number; price: number }[];
  total_qty: number;
  subtotal_amount: number;
  customer: { name?: string; email?: string; phone?: string } | null;
  guest_data: unknown;
  expires_at: string;
  participants: { id: string; name: string | null; phone: string | null; age: number | null; custom_fields: unknown }[];
  is_expired: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

const ActivityBookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { cancelBooking, isCancelling, completeBooking, isCompleting } = useActivityBookingsData();

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['activity-booking', id],
    queryFn: async (): Promise<BookingDetails | null> => {
      if (!id) return null;
      const { data, error } = await supabase.rpc('get_activity_booking', {
        _booking_id: id,
      });
      if (error) throw error;
      return data as unknown as BookingDetails;
    },
    enabled: !!id,
  });

  const formatCurrency = (amount: number, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      await cancelBooking(id);
      toast.success('Booking cancelled');
      queryClient.invalidateQueries({ queryKey: ['activity-booking', id] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking');
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    try {
      await completeBooking(id);
      toast.success('Booking marked as completed');
      queryClient.invalidateQueries({ queryKey: ['activity-booking', id] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete booking');
    }
  };

  const canCancel = booking && (booking.status === 'draft' || booking.status === 'confirmed');
  const canComplete = booking && booking.status === 'confirmed' && isPast(parseISO(booking.booking_date));

  if (isLoading) {
    return (
      <ActivityDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </ActivityDashboardLayout>
    );
  }

  if (error || !booking) {
    return (
      <ActivityDashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground">Booking not found</p>
          <Button variant="outline" onClick={() => navigate('/activity-dashboard/bookings')}>
            Back to Bookings
          </Button>
        </div>
      </ActivityDashboardLayout>
    );
  }

  return (
    <ActivityDashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/activity-dashboard/bookings')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">Booking Details</h1>
                <Badge className={statusColors[booking.status] || ''}>
                  {booking.status}
                </Badge>
              </div>
              <p className="text-muted-foreground font-mono text-sm">{booking.id}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {canComplete && (
              <Button
                variant="outline"
                onClick={handleComplete}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Mark Completed
              </Button>
            )}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isCancelling}>
                    {isCancelling ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Cancel Booking
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The booking will be marked as cancelled.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel}>
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Booking Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product</span>
                <span className="font-medium">{booking.product_name}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(booking.booking_date), 'EEEE, dd MMMM yyyy')}
                </span>
              </div>
              {booking.slot_time && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Slot</span>
                  <span className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {booking.slot_time.slice(0, 5)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Guests</span>
                <span className="font-medium">{booking.total_qty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-lg">
                  {formatCurrency(booking.subtotal_amount, booking.currency)}
                </span>
              </div>

              {/* Line Items */}
              {booking.line_items && booking.line_items.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Line Items</span>
                    {booking.line_items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.tier_name || `${item.duration_value} ${item.duration_unit}`} × {item.qty}
                        </span>
                        <span>{formatCurrency(item.qty * item.price, booking.currency)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Customer Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.customer ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{booking.customer.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{booking.customer.email || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{booking.customer.phone || '-'}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">No customer information</p>
              )}
            </CardContent>
          </Card>

          {/* Participants Card (if any) */}
          {booking.participants && booking.participants.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participants ({booking.participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {booking.participants.map((p, idx) => (
                    <div key={p.id} className="p-4 rounded-lg border bg-muted/50">
                      <p className="font-medium">Participant {idx + 1}</p>
                      {p.name && <p className="text-sm text-muted-foreground">Name: {p.name}</p>}
                      {p.phone && <p className="text-sm text-muted-foreground">Phone: {p.phone}</p>}
                      {p.age && <p className="text-sm text-muted-foreground">Age: {p.age}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(booking.expires_at).getTime() - 30 * 60 * 1000, 'dd MMM yyyy, HH:mm')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(booking.expires_at).getTime() - 30 * 60 * 1000, { addSuffix: true })}
                  </p>
                </div>
                {booking.status === 'draft' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Expires</p>
                    <p className="font-medium">
                      {format(new Date(booking.expires_at), 'dd MMM yyyy, HH:mm')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {booking.is_expired ? 'Expired' : formatDistanceToNow(new Date(booking.expires_at), { addSuffix: true })}
                    </p>
                  </div>
                )}
                {booking.status === 'confirmed' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmed</p>
                    <p className="font-medium text-green-600">✓ Confirmed</p>
                  </div>
                )}
                {booking.status === 'cancelled' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                    <p className="font-medium text-red-600">✗ Cancelled</p>
                  </div>
                )}
                {booking.status === 'completed' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="font-medium text-blue-600">✓ Completed</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ActivityDashboardLayout>
  );
};

export default ActivityBookingDetailPage;
