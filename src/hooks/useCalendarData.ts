import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

export interface CalendarDeparture {
  id: string;
  partner_id: string;
  trip_id: string;
  route_id: string;
  departure_date: string;
  departure_time: string;
  capacity_total: number;
  capacity_reserved: number;
  status: 'open' | 'closed' | 'sold_out' | 'cancelled';
  notes_internal?: string | null;
  trip?: {
    id: string;
    trip_name: string;
    route?: {
      id: string;
      route_name: string;
      origin_port?: { name: string };
      destination_port?: { name: string };
    };
  };
}

export interface DepartureBooking {
  id: string;
  customer: {
    full_name: string;
    email: string | null;
    phone: string | null;
  };
  pax_adult: number;
  pax_child: number;
  status: string;
  channel: string;
  total_amount: number;
  created_at: string;
}

export const useCalendarData = () => {
  const { user } = useAuth();
  const { partnerId, role } = useUserRole();
  const [departures, setDepartures] = useState<CalendarDeparture[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const isAdmin = role === 'admin';
  const canEdit = role === 'admin' || role === 'partner_owner';

  const fetchDepartures = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    let query = supabase
      .from('departures')
      .select(`
        *,
        trip:trips(
          id,
          trip_name,
          route:routes(
            id,
            route_name,
            origin_port:ports!routes_origin_port_id_fkey(name),
            destination_port:ports!routes_destination_port_id_fkey(name)
          )
        )
      `)
      .gte('departure_date', dateRange.start)
      .lte('departure_date', dateRange.end)
      .order('departure_date')
      .order('departure_time');

    if (!isAdmin && partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching departures:', error);
      toast.error('Failed to load departures');
    } else {
      setDepartures(data as CalendarDeparture[]);
    }
    
    setLoading(false);
  }, [user, partnerId, isAdmin, dateRange]);

  const fetchDepartureBookings = async (departureId: string): Promise<DepartureBooking[]> => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        pax_adult,
        pax_child,
        status,
        channel,
        total_amount,
        created_at,
        customer:customers(full_name, email, phone)
      `)
      .eq('departure_id', departureId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }

    return (data || []).map(booking => ({
      ...booking,
      customer: Array.isArray(booking.customer) ? booking.customer[0] : booking.customer,
    })) as DepartureBooking[];
  };

  const updateDepartureStatus = async (
    departureId: string, 
    status: 'open' | 'closed' | 'sold_out' | 'cancelled',
    reason?: string
  ) => {
    const departure = departures.find(d => d.id === departureId);
    if (!departure) return { error: new Error('Departure not found') };

    const { error } = await supabase
      .from('departures')
      .update({ status })
      .eq('id', departureId);

    if (error) {
      toast.error('Failed to update departure status');
      return { error };
    }

    // Log to audit
    await supabase.from('audit_logs').insert({
      partner_id: departure.partner_id,
      actor_user_id: user?.id,
      action: `departure_status_changed_to_${status}`,
      entity_type: 'departure',
      entity_id: departureId,
      metadata: { previous_status: departure.status, new_status: status, reason },
    });

    toast.success(`Departure ${status === 'cancelled' ? 'cancelled' : status === 'closed' ? 'closed' : 'reopened'}`);
    await fetchDepartures();
    return { error: null };
  };

  const updateDepartureCapacity = async (departureId: string, capacity: number) => {
    const departure = departures.find(d => d.id === departureId);
    if (!departure) return { error: new Error('Departure not found') };

    // Auto-update status based on capacity
    let newStatus = departure.status;
    if (capacity <= departure.capacity_reserved && departure.status === 'open') {
      newStatus = 'sold_out';
    } else if (capacity > departure.capacity_reserved && departure.status === 'sold_out') {
      newStatus = 'open';
    }

    const { error } = await supabase
      .from('departures')
      .update({ capacity_total: capacity, status: newStatus })
      .eq('id', departureId);

    if (error) {
      toast.error('Failed to update capacity');
      return { error };
    }

    // Log to audit
    await supabase.from('audit_logs').insert({
      partner_id: departure.partner_id,
      actor_user_id: user?.id,
      action: 'departure_capacity_updated',
      entity_type: 'departure',
      entity_id: departureId,
      metadata: { previous_capacity: departure.capacity_total, new_capacity: capacity },
    });

    toast.success('Capacity updated');
    await fetchDepartures();
    return { error: null };
  };

  const blockSeats = async (departureId: string, seatsToBlock: number) => {
    const departure = departures.find(d => d.id === departureId);
    if (!departure) return { error: new Error('Departure not found') };

    const newReserved = departure.capacity_reserved + seatsToBlock;
    if (newReserved > departure.capacity_total) {
      toast.error('Cannot block more seats than available');
      return { error: new Error('Exceeds capacity') };
    }

    let newStatus = departure.status;
    if (newReserved >= departure.capacity_total) {
      newStatus = 'sold_out';
    }

    const { error } = await supabase
      .from('departures')
      .update({ capacity_reserved: newReserved, status: newStatus })
      .eq('id', departureId);

    if (error) {
      toast.error('Failed to block seats');
      return { error };
    }

    // Log to audit
    await supabase.from('audit_logs').insert({
      partner_id: departure.partner_id,
      actor_user_id: user?.id,
      action: 'departure_seats_blocked',
      entity_type: 'departure',
      entity_id: departureId,
      metadata: { seats_blocked: seatsToBlock, new_reserved: newReserved },
    });

    toast.success(`${seatsToBlock} seats blocked`);
    await fetchDepartures();
    return { error: null };
  };

  useEffect(() => {
    if (user && (isAdmin || partnerId)) {
      fetchDepartures();
    }
  }, [user, partnerId, isAdmin, fetchDepartures]);

  return {
    departures,
    loading,
    dateRange,
    setDateRange,
    canEdit,
    fetchDepartures,
    fetchDepartureBookings,
    updateDepartureStatus,
    updateDepartureCapacity,
    blockSeats,
  };
};
