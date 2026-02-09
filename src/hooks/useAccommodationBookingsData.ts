import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export interface AccommodationBooking {
  id: string;
  accommodation_id: string;
  partner_id: string;
  room_id: string | null;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  guests_count: number;
  checkin_date: string;
  checkout_date: string;
  total_nights: number;
  total_amount: number;
  currency: string;
  channel: string;
  status: string;
  notes: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  accommodation?: { name: string; price_per_night: number };
  room?: { name: string; price_per_night: number } | null;
}

export interface BookingStats {
  totalProperties: number;
  nightsBooked: number;
  activeBookings: number;
  revenue: number;
}

export interface CreateBookingInput {
  accommodation_id: string;
  room_id?: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  guests_count: number;
  checkin_date: string;
  checkout_date: string;
  total_amount: number;
  channel: string;
  notes?: string;
}

function getDatesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + 'T00:00:00Z');
  const endDate = new Date(end + 'T00:00:00Z');
  while (current < endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function diffDays(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end + 'T00:00:00Z');
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export const useAccommodationBookingsData = (filters?: {
  accommodationId?: string;
  status?: string;
  channel?: string;
}) => {
  const { partnerId } = useUserRole();
  const [bookings, setBookings] = useState<AccommodationBooking[]>([]);
  const [stats, setStats] = useState<BookingStats>({ totalProperties: 0, nightsBooked: 0, activeBookings: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!partnerId) { setLoading(false); return; }
    setLoading(true);
    try {
      let query = supabase
        .from('accommodation_bookings')
        .select('*, accommodation:accommodations(name, price_per_night), room:accommodation_rooms(name, price_per_night)')
        .eq('partner_id', partnerId)
        .order('checkin_date', { ascending: false });

      if (filters?.accommodationId) query = query.eq('accommodation_id', filters.accommodationId);
      if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters?.channel && filters.channel !== 'all') query = query.eq('channel', filters.channel);

      const { data, error } = await query;
      if (error) throw error;
      setBookings((data || []) as unknown as AccommodationBooking[]);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [partnerId, filters?.accommodationId, filters?.status, filters?.channel]);

  const fetchStats = useCallback(async () => {
    if (!partnerId) return;
    try {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const monthEnd = nextMonth.toISOString().split('T')[0];

      const { count: propCount } = await supabase
        .from('accommodations')
        .select('id', { count: 'exact', head: true })
        .eq('partner_id', partnerId)
        .eq('status', 'active');

      const { data: monthBookings } = await supabase
        .from('accommodation_bookings')
        .select('total_nights, total_amount, status')
        .eq('partner_id', partnerId)
        .eq('status', 'confirmed')
        .gte('checkin_date', monthStart)
        .lt('checkin_date', monthEnd);

      const nightsBooked = (monthBookings || []).reduce((sum, b) => sum + (b.total_nights || 0), 0);
      const revenue = (monthBookings || []).reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const activeBookings = (monthBookings || []).length;

      setStats({ totalProperties: propCount || 0, nightsBooked, activeBookings, revenue });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [partnerId]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const createBooking = async (input: CreateBookingInput) => {
    if (!partnerId) throw new Error('No partner');

    const nights = diffDays(input.checkin_date, input.checkout_date);
    if (nights <= 0) throw new Error('Check-out must be after check-in');

    const datesToBlock = getDatesBetween(input.checkin_date, input.checkout_date);

    if (input.room_id) {
      // --- Hotel room booking: check availability from bookings ---
      const { data: roomData } = await supabase
        .from('accommodation_rooms')
        .select('quantity')
        .eq('id', input.room_id)
        .single();

      if (!roomData) throw new Error('Room not found');

      // Check accommodation-level blocks
      const { data: accBlocks } = await supabase
        .from('accommodation_calendar')
        .select('date')
        .eq('accommodation_id', input.accommodation_id)
        .is('room_id', null)
        .in('date', datesToBlock)
        .in('status', ['blocked', 'booked_external']);

      if (accBlocks && accBlocks.length > 0) {
        throw new Error(`Dates blocked at property level: ${accBlocks.map(b => b.date).join(', ')}`);
      }

      // Check room stock availability
      const { data: overlapping } = await supabase
        .from('accommodation_bookings')
        .select('checkin_date, checkout_date')
        .eq('room_id', input.room_id)
        .eq('status', 'confirmed')
        .lt('checkin_date', input.checkout_date)
        .gte('checkout_date', input.checkin_date);

      for (const date of datesToBlock) {
        const count = (overlapping || []).filter(b =>
          b.checkin_date <= date && b.checkout_date > date
        ).length;
        if (count >= (roomData as any).quantity) {
          throw new Error(`No rooms available on ${date}`);
        }
      }

      // Insert booking with room_id (no calendar entries for room bookings)
      const { data: booking, error: bookingError } = await supabase
        .from('accommodation_bookings')
        .insert({
          accommodation_id: input.accommodation_id,
          partner_id: partnerId,
          room_id: input.room_id,
          guest_name: input.guest_name,
          guest_email: input.guest_email || null,
          guest_phone: input.guest_phone || null,
          guests_count: input.guests_count,
          checkin_date: input.checkin_date,
          checkout_date: input.checkout_date,
          total_nights: nights,
          total_amount: input.total_amount,
          channel: input.channel,
          status: 'confirmed',
          notes: input.notes || null,
        } as any)
        .select()
        .single();

      if (bookingError) throw bookingError;

      supabase.functions.invoke('send-accommodation-booking-confirmation', {
        body: { booking_id: (booking as any).id }
      }).catch(err => console.error('Notification error:', err));

      await fetchBookings();
      await fetchStats();
      return booking;
    } else {
      // --- Villa booking: use calendar-based availability ---
      const { data: existing } = await supabase
        .from('accommodation_calendar')
        .select('date')
        .eq('accommodation_id', input.accommodation_id)
        .in('date', datesToBlock)
        .in('status', ['booked_sribooking', 'booked_external', 'blocked']);

      if (existing && existing.length > 0) {
        const conflictDates = existing.map(e => e.date).join(', ');
        throw new Error(`Dates unavailable: ${conflictDates}`);
      }

      const { data: booking, error: bookingError } = await supabase
        .from('accommodation_bookings')
        .insert({
          accommodation_id: input.accommodation_id,
          partner_id: partnerId,
          guest_name: input.guest_name,
          guest_email: input.guest_email || null,
          guest_phone: input.guest_phone || null,
          guests_count: input.guests_count,
          checkin_date: input.checkin_date,
          checkout_date: input.checkout_date,
          total_nights: nights,
          total_amount: input.total_amount,
          channel: input.channel,
          status: 'confirmed',
          notes: input.notes || null,
        } as any)
        .select()
        .single();

      if (bookingError) throw bookingError;

      const calendarRows = datesToBlock.map(date => ({
        accommodation_id: input.accommodation_id,
        partner_id: partnerId,
        date,
        status: 'booked_sribooking',
        source: 'sribooking',
        booking_id: (booking as any).id,
      }));

      const { error: calError } = await supabase
        .from('accommodation_calendar')
        .upsert(calendarRows as any[], { onConflict: 'accommodation_id,date' });

      if (calError) throw calError;

      supabase.functions.invoke('send-accommodation-booking-confirmation', {
        body: { booking_id: (booking as any).id }
      }).catch(err => console.error('Notification error:', err));

      await fetchBookings();
      await fetchStats();
      return booking;
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    if (status === 'cancelled') {
      const { error: calDelError } = await supabase
        .from('accommodation_calendar')
        .delete()
        .eq('booking_id', id);
      if (calDelError) throw calDelError;

      const { error } = await supabase
        .from('accommodation_bookings')
        .update({ status, cancelled_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('accommodation_bookings')
        .update({ status } as any)
        .eq('id', id);
      if (error) throw error;
    }

    await fetchBookings();
    await fetchStats();
  };

  const getUpcomingBookings = useCallback(async (limit = 5): Promise<AccommodationBooking[]> => {
    if (!partnerId) return [];
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('accommodation_bookings')
      .select('*, accommodation:accommodations(name, price_per_night), room:accommodation_rooms(name, price_per_night)')
      .eq('partner_id', partnerId)
      .eq('status', 'confirmed')
      .gte('checkin_date', today)
      .order('checkin_date')
      .limit(limit);
    return (data || []) as unknown as AccommodationBooking[];
  }, [partnerId]);

  return { bookings, stats, loading, fetchBookings, fetchStats, createBooking, updateBookingStatus, getUpcomingBookings };
};
