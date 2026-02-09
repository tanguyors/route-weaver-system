import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAccommodationsData } from '@/hooks/useAccommodationsData';
import { useAccommodationBookingsData, CreateBookingInput } from '@/hooks/useAccommodationBookingsData';
import { toast } from '@/hooks/use-toast';
import { Plus, MoreHorizontal, BookOpen, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  completed: 'bg-blue-100 text-blue-800 border-blue-300',
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
};

const AccommodationBookingsPage = () => {
  const { accommodations } = useAccommodationsData();
  const [filterAccId, setFilterAccId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');

  const { bookings, loading, createBooking, updateBookingStatus } = useAccommodationBookingsData({
    accommodationId: filterAccId !== 'all' ? filterAccId : undefined,
    status: filterStatus,
    channel: filterChannel,
  });

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [form, setForm] = useState({
    accommodation_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    guests_count: 1,
    checkin_date: '',
    checkout_date: '',
    total_amount: 0,
    channel: 'walk-in',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Record Payment state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: 'cash', notes: '' });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const openPaymentDialog = (booking: any) => {
    setPaymentBooking(booking);
    setPaymentForm({ amount: booking.total_amount, method: 'cash', notes: '' });
    setShowPaymentDialog(true);
  };

  const handleRecordPayment = async () => {
    if (!paymentBooking || paymentForm.amount <= 0) return;
    setPaymentSubmitting(true);
    try {
      // Get partner commission rate
      const partnerId = bookings[0]?.partner_id;
      if (!partnerId) throw new Error('No partner');

      const { data: partnerData } = await supabase
        .from('partners')
        .select('commission_percent')
        .eq('id', partnerId)
        .single();

      const commissionRate = partnerData?.commission_percent || 7;
      const feeAmount = Math.round((paymentForm.amount * commissionRate) / 100);
      const netAmount = paymentForm.amount - feeAmount;

      // Insert payment
      const { error: payErr } = await supabase
        .from('accommodation_payments')
        .insert({
          partner_id: partnerId,
          booking_id: paymentBooking.id,
          amount: paymentForm.amount,
          currency: paymentBooking.currency || 'LKR',
          method: paymentForm.method,
          status: 'paid',
          notes: paymentForm.notes || null,
        } as any);
      if (payErr) throw payErr;

      // Insert commission
      const { error: commErr } = await supabase
        .from('accommodation_commission_records')
        .insert({
          partner_id: partnerId,
          booking_id: paymentBooking.id,
          gross_amount: paymentForm.amount,
          platform_fee_percent: commissionRate,
          platform_fee_amount: feeAmount,
          partner_net_amount: netAmount,
          currency: paymentBooking.currency || 'LKR',
        } as any);
      if (commErr) throw commErr;

      toast({ title: 'Payment recorded', description: `${paymentBooking.currency || 'LKR'} ${paymentForm.amount.toLocaleString()} recorded` });
      setShowPaymentDialog(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const selectedAcc = accommodations.find(a => a.id === form.accommodation_id);
  const nights = form.checkin_date && form.checkout_date
    ? Math.max(0, Math.round((new Date(form.checkout_date).getTime() - new Date(form.checkin_date).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleAccChange = (accId: string) => {
    const acc = accommodations.find(a => a.id === accId);
    const autoTotal = acc && nights > 0 ? nights * acc.price_per_night : 0;
    setForm(f => ({ ...f, accommodation_id: accId, total_amount: autoTotal }));
  };

  const handleDateChange = (field: 'checkin_date' | 'checkout_date', value: string) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      const ci = field === 'checkin_date' ? value : f.checkin_date;
      const co = field === 'checkout_date' ? value : f.checkout_date;
      if (ci && co && selectedAcc) {
        const n = Math.max(0, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / (1000 * 60 * 60 * 24)));
        updated.total_amount = n * selectedAcc.price_per_night;
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!form.accommodation_id || !form.guest_name || !form.checkin_date || !form.checkout_date) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await createBooking({
        accommodation_id: form.accommodation_id,
        guest_name: form.guest_name,
        guest_email: form.guest_email || undefined,
        guest_phone: form.guest_phone || undefined,
        guests_count: form.guests_count,
        checkin_date: form.checkin_date,
        checkout_date: form.checkout_date,
        total_amount: form.total_amount,
        channel: form.channel,
        notes: form.notes || undefined,
      });
      toast({ title: 'Booking created', description: 'Calendar dates have been blocked automatically.' });
      setShowNewDialog(false);
      setForm({ accommodation_id: '', guest_name: '', guest_email: '', guest_phone: '', guests_count: 1, checkin_date: '', checkout_date: '', total_amount: 0, channel: 'walk-in', notes: '' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateBookingStatus(id, status);
      toast({ title: `Booking ${status}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bookings</h1>
            <p className="text-muted-foreground">Manage accommodation reservations</p>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Booking
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filterAccId} onValueChange={setFilterAccId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Accommodations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accommodations</SelectItem>
              {accommodations.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterChannel} onValueChange={setFilterChannel}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="walk-in">Walk-in</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg m-6">
                <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No bookings found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Accommodation</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Nights</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.guest_name}</TableCell>
                      <TableCell>{b.accommodation?.name || '—'}</TableCell>
                      <TableCell>{format(new Date(b.checkin_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(new Date(b.checkout_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{b.total_nights}</TableCell>
                      <TableCell>{b.currency} {b.total_amount.toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{b.channel}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[b.status] || ''}>
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {b.status !== 'confirmed' && b.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(b.id, 'confirmed')}>Confirm</DropdownMenuItem>
                            )}
                            {b.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(b.id, 'completed')}>Mark Completed</DropdownMenuItem>
                            )}
                            {b.status !== 'cancelled' && (
                              <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(b.id, 'cancelled')}>Cancel</DropdownMenuItem>
                            )}
                            {b.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => openPaymentDialog(b)}>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Booking Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
            <DialogDescription>Create a manual reservation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <Label>Accommodation *</Label>
              <Select value={form.accommodation_id} onValueChange={handleAccChange}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {accommodations.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name} — {a.currency} {a.price_per_night}/night</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Check-in *</Label>
                <Input type="date" value={form.checkin_date} onChange={e => handleDateChange('checkin_date', e.target.value)} />
              </div>
              <div>
                <Label>Check-out *</Label>
                <Input type="date" value={form.checkout_date} onChange={e => handleDateChange('checkout_date', e.target.value)} />
              </div>
            </div>
            {nights > 0 && (
              <p className="text-sm text-muted-foreground">{nights} night{nights > 1 ? 's' : ''}</p>
            )}
            <div>
              <Label>Guest Name *</Label>
              <Input value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.guest_email} onChange={e => setForm(f => ({ ...f, guest_email: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.guest_phone} onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Guests</Label>
                <Input type="number" min={1} value={form.guests_count} onChange={e => setForm(f => ({ ...f, guests_count: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Total Amount ({selectedAcc?.currency || 'IDR'})</Label>
              <Input type="number" min={0} value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {paymentBooking?.guest_name} — {paymentBooking?.accommodation?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount ({paymentBooking?.currency || 'LKR'})</Label>
              <Input
                type="number"
                min={0}
                value={paymentForm.amount}
                onChange={e => setPaymentForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentForm.method} onValueChange={v => setPaymentForm(f => ({ ...f, method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={paymentForm.notes}
                onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={paymentSubmitting || paymentForm.amount <= 0}>
              {paymentSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationBookingsPage;
