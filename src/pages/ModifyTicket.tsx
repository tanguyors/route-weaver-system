import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Ticket, AlertCircle, CheckCircle, XCircle, User, Phone, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
} from "@/components/ui/alert-dialog";

interface TicketDetails {
  ticketId: string;
  bookingId: string;
  qrToken: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  routeName: string;
  departureDate: string;
  departureTime: string;
  paxAdult: number;
  paxChild: number;
  totalAmount: number;
  currency: string;
}

const ModifyTicket = () => {
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  
  const [bookingRef, setBookingRef] = useState(initialRef);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const searchTicket = async () => {
    if (!bookingRef.trim()) {
      toast.error('Please enter a booking reference');
      return;
    }
    
    setLoading(true);
    setError(null);
    setTicket(null);
    
    try {
      // Search by booking ID (short format from URL or full UUID)
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          pax_adult,
          pax_child,
          total_amount,
          currency,
          customer:customers(full_name, phone, email),
          departure:departures(
            departure_date,
            departure_time,
            route:routes(route_name)
          )
        `)
        .or(`id.eq.${bookingRef},id.ilike.${bookingRef}%`)
        .maybeSingle();
      
      if (bookingError) throw bookingError;
      
      if (!bookingData) {
        setError('Booking not found. Please check your reference number.');
        return;
      }
      
      // Optional email verification
      if (email && bookingData.customer?.email && 
          bookingData.customer.email.toLowerCase() !== email.toLowerCase()) {
        setError('Email does not match our records.');
        return;
      }
      
      // Get ticket details
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('id, qr_token, status')
        .eq('booking_id', bookingData.id)
        .maybeSingle();
      
      if (ticketError) throw ticketError;
      
      setTicket({
        ticketId: ticketData?.id || '',
        bookingId: bookingData.id,
        qrToken: ticketData?.qr_token || '',
        status: ticketData?.status || bookingData.status,
        customerName: bookingData.customer?.full_name || '',
        customerPhone: bookingData.customer?.phone || '',
        customerEmail: bookingData.customer?.email || '',
        routeName: bookingData.departure?.route?.route_name || '',
        departureDate: bookingData.departure?.departure_date || '',
        departureTime: bookingData.departure?.departure_time || '',
        paxAdult: bookingData.pax_adult,
        paxChild: bookingData.pax_child,
        totalAmount: bookingData.total_amount,
        currency: bookingData.currency,
      });
      
      setEditName(bookingData.customer?.full_name || '');
      setEditPhone(bookingData.customer?.phone || '');
      
    } catch (err: any) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!ticket || !editName.trim()) {
      toast.error('Name is required');
      return;
    }
    
    setSaving(true);
    try {
      // Get customer ID from booking
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('customer_id')
        .eq('id', ticket.bookingId)
        .single();
      
      if (!bookingData) throw new Error('Booking not found');
      
      // Update customer info
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          full_name: editName.trim(),
          phone: editPhone.trim() || null,
        })
        .eq('id', bookingData.customer_id);
      
      if (updateError) throw updateError;
      
      setTicket(prev => prev ? {
        ...prev,
        customerName: editName.trim(),
        customerPhone: editPhone.trim(),
      } : null);
      
      setIsEditing(false);
      toast.success('Information updated successfully!');
      
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error('Failed to update information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelTicket = async () => {
    if (!ticket) return;
    
    setCancelling(true);
    try {
      // Update booking status to cancelled
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', ticket.bookingId);
      
      if (bookingError) throw bookingError;
      
      // Update ticket status if exists
      if (ticket.ticketId) {
        const { error: ticketError } = await supabase
          .from('tickets')
          .update({ status: 'cancelled' })
          .eq('id', ticket.ticketId);
        
        if (ticketError) throw ticketError;
      }
      
      // Release departure capacity
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('departure_id, pax_adult, pax_child')
        .eq('id', ticket.bookingId)
        .single();
      
      if (bookingData) {
        const totalPax = bookingData.pax_adult + bookingData.pax_child;
        const { data: departure } = await supabase
          .from('departures')
          .select('capacity_reserved')
          .eq('id', bookingData.departure_id)
          .single();
        
        if (departure) {
          await supabase
            .from('departures')
            .update({
              capacity_reserved: Math.max(0, departure.capacity_reserved - totalPax)
            })
            .eq('id', bookingData.departure_id);
        }
      }
      
      setCancelled(true);
      setTicket(prev => prev ? { ...prev, status: 'cancelled' } : null);
      toast.success('Ticket cancelled. Refund request submitted.');
      
    } catch (err: any) {
      console.error('Cancel error:', err);
      toast.error('Failed to cancel ticket. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm"><Clock className="h-3 w-3" /> Pending</span>;
      case 'validated':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-sm"><CheckCircle className="h-3 w-3" /> Validated</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 text-sm"><XCircle className="h-3 w-3" /> Cancelled</span>;
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm"><CheckCircle className="h-3 w-3" /> Confirmed</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-sm">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Ticket className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Modify Your Ticket</h1>
          </div>
          <p className="text-muted-foreground">
            Enter your booking reference to view and modify your ticket
          </p>
        </div>

        {/* Search Form */}
        {!ticket && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Your Booking
              </CardTitle>
              <CardDescription>
                Enter the booking reference from your confirmation email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bookingRef">Booking Reference *</Label>
                <Input
                  id="bookingRef"
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value)}
                  placeholder="e.g., abc123de"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email (optional verification)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-1"
                />
              </div>
              
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              <Button 
                className="w-full" 
                size="lg" 
                onClick={searchTicket}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Find My Booking
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ticket Details */}
        {ticket && (
          <div className="space-y-4">
            {/* Status Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Booking Reference</p>
                    <p className="font-mono font-bold">{ticket.bookingId.slice(0, 8).toUpperCase()}</p>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>
              </CardContent>
            </Card>

            {/* Trip Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{ticket.routeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(ticket.departureDate)} at {formatTime(ticket.departureTime)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {ticket.paxAdult} Adult{ticket.paxAdult !== 1 ? 's' : ''}
                      {ticket.paxChild > 0 && `, ${ticket.paxChild} Child${ticket.paxChild !== 1 ? 'ren' : ''}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total: {formatPrice(ticket.totalAmount, ticket.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info (Editable) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Passenger Information</CardTitle>
                {!isEditing && ticket.status !== 'cancelled' && ticket.status !== 'validated' && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="editName">Full Name *</Label>
                      <Input
                        id="editName"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="editPhone">Phone Number</Label>
                      <Input
                        id="editPhone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        onClick={handleSaveChanges}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          setEditName(ticket.customerName);
                          setEditPhone(ticket.customerPhone);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{ticket.customerName}</p>
                        <p className="text-sm text-muted-foreground">Primary Passenger</p>
                      </div>
                    </div>
                    {ticket.customerPhone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <p>{ticket.customerPhone}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Cancel Section */}
            {ticket.status !== 'cancelled' && ticket.status !== 'validated' && !cancelled && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-lg text-destructive">Cancel Booking</CardTitle>
                  <CardDescription>
                    Cancel your booking and request a refund. This action cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel & Request Refund
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel your booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel your ticket and submit a refund request. 
                          Refunds are processed according to our cancellation policy 
                          and may take 5-10 business days.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep My Booking</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelTicket}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={cancelling}
                        >
                          {cancelling ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Yes, Cancel Booking'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}

            {/* Cancelled Confirmation */}
            {(ticket.status === 'cancelled' || cancelled) && (
              <Card className="border-muted">
                <CardContent className="pt-6 text-center">
                  <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-1">Booking Cancelled</h3>
                  <p className="text-muted-foreground text-sm">
                    Your refund request has been submitted. You will receive an email confirmation shortly.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Back Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setTicket(null);
                setBookingRef('');
                setEmail('');
                setError(null);
                setCancelled(false);
              }}
            >
              Search Another Booking
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModifyTicket;
