import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export interface BookingWithDetails {
  id: string;
  partner_id: string;
  departure_id: string;
  customer_id: string;
  channel: string;
  pax_adult: number;
  pax_child: number;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  currency: string;
  notes_internal: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    country: string | null;
  };
  departure?: {
    id: string;
    departure_date: string;
    departure_time: string;
    trip?: {
      id: string;
      trip_name: string;
      route?: {
        id: string;
        route_name: string;
      };
    };
  };
  payments?: {
    id: string;
    amount: number;
    method: string;
    status: string;
    paid_at: string | null;
    created_at: string;
  }[];
  ticket?: {
    id: string;
    qr_token: string;
    status: string;
  };
}

export interface CreateBookingData {
  departure_id: string;
  customer: {
    full_name: string;
    phone?: string;
    email?: string;
    country?: string;
  };
  channel: 'offline_walkin' | 'offline_whatsapp' | 'offline_agency' | 'offline_other';
  pax_adult: number;
  pax_child: number;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  notes_internal?: string;
  payment?: {
    method: 'cash' | 'qris' | 'transfer' | 'card' | 'payment_link';
    amount: number;
    status: 'unpaid' | 'paid' | 'partial';
  };
  generate_ticket: boolean;
  price_override?: {
    reason: string;
  };
}

export const useBookingsData = () => {
  const { user } = useAuth();
  const { partnerId, role } = useUserRole();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    channel: '',
    search: '',
    paymentStatus: '',
  });

  const isAdmin = role === 'admin';
  const canEdit = role === 'admin' || role === 'partner_owner';
  const canCreate = role === 'admin' || role === 'partner_owner' || role === 'partner_staff';

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    let query = supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(id, full_name, email, phone, country),
        departure:departures(
          id, departure_date, departure_time,
          trip:trips(id, trip_name, route:routes(id, route_name))
        ),
        ticket:tickets(id, qr_token, status)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!isAdmin && partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    if (filters.status && ['pending', 'confirmed', 'cancelled', 'refunded'].includes(filters.status)) {
      query = query.eq('status', filters.status as 'pending' | 'confirmed' | 'cancelled' | 'refunded');
    }
    
    if (filters.channel && ['online_widget', 'offline_walkin', 'offline_whatsapp', 'offline_agency', 'offline_other'].includes(filters.channel)) {
      query = query.eq('channel', filters.channel as 'online_widget' | 'offline_walkin' | 'offline_whatsapp' | 'offline_agency' | 'offline_other');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      // Fetch payments for each booking
      const bookingsWithPayments = await Promise.all(
        (data || []).map(async (booking) => {
          const { data: payments } = await supabase
            .from('payments')
            .select('id, amount, method, status, paid_at, created_at')
            .eq('booking_id', booking.id)
            .order('created_at', { ascending: false });
          
          return {
            ...booking,
            customer: Array.isArray(booking.customer) ? booking.customer[0] : booking.customer,
            departure: Array.isArray(booking.departure) ? booking.departure[0] : booking.departure,
            ticket: Array.isArray(booking.ticket) ? booking.ticket[0] : booking.ticket,
            payments: payments || [],
          };
        })
      );
      
      // Filter by search
      let filtered = bookingsWithPayments;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(b => 
          b.customer?.full_name?.toLowerCase().includes(search) ||
          b.customer?.email?.toLowerCase().includes(search) ||
          b.customer?.phone?.includes(search) ||
          b.id.toLowerCase().includes(search)
        );
      }

      // Filter by payment status
      if (filters.paymentStatus) {
        filtered = filtered.filter(b => {
          const totalPaid = b.payments?.reduce((sum, p) => 
            p.status === 'paid' ? sum + p.amount : sum, 0) || 0;
          
          if (filters.paymentStatus === 'unpaid') return totalPaid === 0;
          if (filters.paymentStatus === 'partial') return totalPaid > 0 && totalPaid < b.total_amount;
          if (filters.paymentStatus === 'paid') return totalPaid >= b.total_amount;
          return true;
        });
      }

      setBookings(filtered as BookingWithDetails[]);
    }
    
    setLoading(false);
  }, [user, partnerId, isAdmin, filters]);

  const createOfflineBooking = async (data: CreateBookingData) => {
    if (!partnerId && !isAdmin) {
      return { error: new Error('No partner assigned') };
    }

    try {
      // 1. Check departure capacity
      const { data: departure, error: depError } = await supabase
        .from('departures')
        .select('id, capacity_total, capacity_reserved, status, trip_id, route_id')
        .eq('id', data.departure_id)
        .single();

      if (depError || !departure) {
        return { error: new Error('Departure not found') };
      }

      if (departure.status !== 'open') {
        return { error: new Error('Departure is not available') };
      }

      const totalPax = data.pax_adult + data.pax_child;
      const available = departure.capacity_total - departure.capacity_reserved;

      if (totalPax > available) {
        return { error: new Error(`Only ${available} seats available`) };
      }

      // 2. Create or find customer
      let customerId: string;
      
      if (data.customer.email) {
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('email', data.customer.email)
          .maybeSingle();
        
        if (existing) {
          customerId = existing.id;
        } else {
          const { data: newCustomer, error: custErr } = await supabase
            .from('customers')
            .insert({
              full_name: data.customer.full_name,
              phone: data.customer.phone || null,
              email: data.customer.email || null,
              country: data.customer.country || null,
            })
            .select('id')
            .single();
          
          if (custErr) throw custErr;
          customerId = newCustomer.id;
        }
      } else {
        const { data: newCustomer, error: custErr } = await supabase
          .from('customers')
          .insert({
            full_name: data.customer.full_name,
            phone: data.customer.phone || null,
            email: data.customer.email || null,
            country: data.customer.country || null,
          })
          .select('id')
          .single();
        
        if (custErr) throw custErr;
        customerId = newCustomer.id;
      }

      // 3. Lock capacity
      const newReserved = departure.capacity_reserved + totalPax;
      const newStatus = newReserved >= departure.capacity_total ? 'sold_out' : 'open';

      const { error: lockError } = await supabase
        .from('departures')
        .update({ capacity_reserved: newReserved, status: newStatus })
        .eq('id', data.departure_id)
        .eq('capacity_reserved', departure.capacity_reserved);

      if (lockError) {
        return { error: new Error('Failed to reserve seats. Please try again.') };
      }

      // 4. Create booking
      const bookingStatus = data.payment?.status === 'paid' ? 'confirmed' : 'pending';
      
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          partner_id: partnerId,
          departure_id: data.departure_id,
          customer_id: customerId,
          channel: data.channel,
          pax_adult: data.pax_adult,
          pax_child: data.pax_child,
          subtotal_amount: data.subtotal_amount,
          discount_amount: data.discount_amount,
          total_amount: data.total_amount,
          status: bookingStatus,
          currency: 'IDR',
          notes_internal: data.notes_internal || null,
          created_by_user_id: user?.id,
        })
        .select('id')
        .single();

      if (bookingError) {
        // Rollback capacity
        await supabase
          .from('departures')
          .update({ capacity_reserved: departure.capacity_reserved, status: departure.status })
          .eq('id', data.departure_id);
        throw bookingError;
      }

      // 5. Create payment if provided
      if (data.payment && data.payment.amount > 0) {
        await supabase.from('payments').insert({
          booking_id: booking.id,
          partner_id: partnerId,
          amount: data.payment.amount,
          method: data.payment.method,
          status: data.payment.status,
          paid_at: data.payment.status === 'paid' ? new Date().toISOString() : null,
        });
      }

      // 6. Generate ticket if requested
      if (data.generate_ticket) {
        await supabase.from('tickets').insert({
          booking_id: booking.id,
          status: 'pending',
        });
      }

      // 7. Create commission record
      const platformFeePercent = 7;
      const platformFeeAmount = data.total_amount * (platformFeePercent / 100);
      const partnerNetAmount = data.total_amount - platformFeeAmount;

      await supabase.from('commission_records').insert({
        booking_id: booking.id,
        partner_id: partnerId,
        gross_amount: data.total_amount,
        platform_fee_percent: platformFeePercent,
        platform_fee_amount: platformFeeAmount,
        partner_net_amount: partnerNetAmount,
        currency: 'IDR',
      });

      // 8. Audit log
      await supabase.from('audit_logs').insert({
        partner_id: partnerId,
        actor_user_id: user?.id,
        action: 'offline_booking_created',
        entity_type: 'booking',
        entity_id: booking.id,
        metadata: {
          channel: data.channel,
          total_amount: data.total_amount,
          price_override: data.price_override,
        },
      });

      await fetchBookings();
      return { error: null, bookingId: booking.id };

    } catch (error: any) {
      console.error('Create booking error:', error);
      return { error };
    }
  };

  const addPayment = async (
    bookingId: string, 
    payment: { method: string; amount: number; status: string }
  ) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { error: new Error('Booking not found') };

    const { error } = await supabase.from('payments').insert({
      booking_id: bookingId,
      partner_id: booking.partner_id,
      amount: payment.amount,
      method: payment.method as 'cash' | 'qris' | 'transfer' | 'card' | 'payment_link',
      status: payment.status as 'unpaid' | 'paid' | 'failed' | 'refunded' | 'partial',
      paid_at: payment.status === 'paid' ? new Date().toISOString() : null,
    });

    if (error) return { error };

    // Check if booking should be confirmed
    const totalPaid = (booking.payments?.reduce((sum, p) => 
      p.status === 'paid' ? sum + p.amount : sum, 0) || 0) + payment.amount;

    if (totalPaid >= booking.total_amount && booking.status === 'pending') {
      await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      partner_id: booking.partner_id,
      actor_user_id: user?.id,
      action: 'payment_added',
      entity_type: 'booking',
      entity_id: bookingId,
      metadata: { payment },
    });

    await fetchBookings();
    return { error: null };
  };

  const cancelBooking = async (bookingId: string, reason?: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { error: new Error('Booking not found') };

    // Release capacity
    const { data: departure } = await supabase
      .from('departures')
      .select('capacity_reserved, status')
      .eq('id', booking.departure_id)
      .single();

    if (departure) {
      const totalPax = booking.pax_adult + booking.pax_child;
      const newReserved = Math.max(0, departure.capacity_reserved - totalPax);
      
      await supabase
        .from('departures')
        .update({ 
          capacity_reserved: newReserved,
          status: departure.status === 'sold_out' ? 'open' : departure.status
        })
        .eq('id', booking.departure_id);
    }

    // Update booking
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) return { error };

    // Update ticket
    if (booking.ticket) {
      await supabase
        .from('tickets')
        .update({ status: 'cancelled' })
        .eq('id', booking.ticket.id);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      partner_id: booking.partner_id,
      actor_user_id: user?.id,
      action: 'booking_cancelled',
      entity_type: 'booking',
      entity_id: bookingId,
      metadata: { reason },
    });

    await fetchBookings();
    return { error: null };
  };

  useEffect(() => {
    if (user && (isAdmin || partnerId)) {
      fetchBookings();
    }
  }, [user, partnerId, isAdmin, fetchBookings]);

  return {
    bookings,
    loading,
    filters,
    setFilters,
    canEdit,
    canCreate,
    fetchBookings,
    createOfflineBooking,
    addPayment,
    cancelBooking,
  };
};
