import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { CreatePaymentLinkData, PaymentProvider } from '@/hooks/usePaymentLinksData';
import { Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  total_amount: number;
  customer: { full_name: string } | null;
  departure: {
    departure_date: string;
    trip: { trip_name: string } | null;
  } | null;
}

interface PaymentLinkFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePaymentLinkData) => Promise<any>;
  partnerId: string | null;
  preselectedBookingId?: string;
}

const PaymentLinkForm = ({
  open,
  onOpenChange,
  onSubmit,
  partnerId,
  preselectedBookingId,
}: PaymentLinkFormProps) => {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'IDR',
    description: '',
    booking_id: preselectedBookingId || '',
    expires_at: '',
    provider: 'xendit' as PaymentProvider,
  });

  // Fetch unpaid bookings for linking
  useEffect(() => {
    const fetchBookings = async () => {
      if (!partnerId) return;

      const { data } = await supabase
        .from('bookings')
        .select(`
          id,
          total_amount,
          customer:customers(full_name),
          departure:departures(
            departure_date,
            trip:trips(trip_name)
          )
        `)
        .eq('partner_id', partnerId)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setBookings(data as unknown as Booking[]);
      }
    };

    if (open) {
      fetchBookings();
    }
  }, [partnerId, open]);

  // Auto-fill amount when booking selected
  useEffect(() => {
    if (formData.booking_id) {
      const booking = bookings.find(b => b.id === formData.booking_id);
      if (booking) {
        setFormData(prev => ({
          ...prev,
          amount: booking.total_amount.toString(),
        }));
      }
    }
  }, [formData.booking_id, bookings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onSubmit({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description || undefined,
        booking_id: formData.booking_id || undefined,
        expires_at: formData.expires_at || undefined,
        provider: formData.provider,
      });

      if (result) {
        setFormData({
          amount: '',
          currency: 'IDR',
          description: '',
          booking_id: '',
          expires_at: '',
          provider: 'xendit',
        });
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get default expiration (24 hours from now)
  const getDefaultExpiration = () => {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Payment Link</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Link to Booking (Optional) */}
          <div className="space-y-2">
            <Label>Link to Booking (Optional)</Label>
            <Select
              value={formData.booking_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, booking_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a booking..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No booking (standalone)</SelectItem>
                {bookings.map((booking) => (
                  <SelectItem key={booking.id} value={booking.id}>
                    {booking.customer?.full_name || 'Unknown'} -{' '}
                    {booking.departure?.trip?.trip_name || 'Trip'} (
                    {booking.departure?.departure_date})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="flex gap-2">
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">IDR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="amount"
                type="number"
                min="0"
                step="1000"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="Enter amount"
                required
                className="flex-1"
              />
            </div>
          </div>

          {/* Payment Provider */}
          <div className="space-y-2">
            <Label>Payment Provider *</Label>
            <Select
              value={formData.provider}
              onValueChange={(value: PaymentProvider) =>
                setFormData((prev) => ({ ...prev, provider: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xendit">Xendit</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="midtrans">Midtrans</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Payment description..."
              rows={2}
            />
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label htmlFor="expires_at">Expires At (Optional)</Label>
            <Input
              id="expires_at"
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, expires_at: e.target.value }))
              }
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for no expiration, or{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    expires_at: getDefaultExpiration(),
                  }))
                }
              >
                set 24 hours
              </button>
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.amount}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Link
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentLinkForm;
