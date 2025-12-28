import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ReportFilters {
  dateRange: DateRange;
  routeId?: string;
  tripId?: string;
  channel?: string;
  paymentMethod?: string;
}

export interface SalesMetrics {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  refundedBookings: number;
  totalGross: number;
  totalCommission: number;
  totalProviderFees: number;
  totalNet: number;
  totalPax: number;
  avgBookingValue: number;
}

export interface ChannelMetrics {
  online: { bookings: number; revenue: number };
  offline: { bookings: number; revenue: number };
  onlinePercentage: number;
  offlinePercentage: number;
}

export interface CapacityMetrics {
  totalCapacity: number;
  totalSold: number;
  occupancyRate: number;
  departures: Array<{
    id: string;
    date: string;
    time: string;
    tripName: string;
    routeName: string;
    capacity: number;
    sold: number;
    occupancy: number;
  }>;
}

export interface PaymentMetrics {
  byMethod: Record<string, { count: number; amount: number }>;
  paid: number;
  unpaid: number;
  refunded: number;
  totalRefundAmount: number;
}

export interface BookingStatusMetrics {
  pending: number;
  confirmed: number;
  cancelled: number;
  refunded: number;
  validatedTickets: number;
  validationRate: number;
}

export const useReportsData = (isAdmin: boolean = false) => {
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
  });

  // Raw data
  const [bookings, setBookings] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [departures, setDepartures] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);

  const { user } = useAuth();

  // Get partner ID
  useEffect(() => {
    const fetchPartnerId = async () => {
      if (!user || isAdmin) return;

      const { data } = await supabase
        .from('partner_users')
        .select('partner_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (data) {
        setPartnerId(data.partner_id);
      }
    };

    fetchPartnerId();
  }, [user, isAdmin]);

  // Fetch data
  const fetchData = async () => {
    if (!user) return;
    if (!isAdmin && !partnerId) return;

    setLoading(true);

    try {
      const fromDate = format(filters.dateRange.from, 'yyyy-MM-dd');
      const toDate = format(filters.dateRange.to, 'yyyy-MM-dd');

      // Fetch bookings
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          *,
          customer:customers(full_name, email),
          departure:departures(
            departure_date,
            departure_time,
            capacity_total,
            capacity_reserved,
            trip:trips(trip_name),
            route:routes(route_name)
          )
        `)
        .gte('created_at', `${fromDate}T00:00:00`)
        .lte('created_at', `${toDate}T23:59:59`);

      if (!isAdmin && partnerId) {
        bookingsQuery = bookingsQuery.eq('partner_id', partnerId);
      }

      const { data: bookingsData } = await bookingsQuery;
      setBookings(bookingsData || []);

      // Fetch commissions
      let commissionsQuery = supabase
        .from('commission_records')
        .select('*')
        .gte('created_at', `${fromDate}T00:00:00`)
        .lte('created_at', `${toDate}T23:59:59`);

      if (!isAdmin && partnerId) {
        commissionsQuery = commissionsQuery.eq('partner_id', partnerId);
      }

      const { data: commissionsData } = await commissionsQuery;
      setCommissions(commissionsData || []);

      // Fetch payments
      let paymentsQuery = supabase
        .from('payments')
        .select('*')
        .gte('created_at', `${fromDate}T00:00:00`)
        .lte('created_at', `${toDate}T23:59:59`);

      if (!isAdmin && partnerId) {
        paymentsQuery = paymentsQuery.eq('partner_id', partnerId);
      }

      const { data: paymentsData } = await paymentsQuery;
      setPayments(paymentsData || []);

      // Fetch departures for capacity
      let departuresQuery = supabase
        .from('departures')
        .select(`
          *,
          trip:trips(trip_name),
          route:routes(route_name)
        `)
        .gte('departure_date', fromDate)
        .lte('departure_date', toDate)
        .neq('status', 'cancelled');

      if (!isAdmin && partnerId) {
        departuresQuery = departuresQuery.eq('partner_id', partnerId);
      }

      const { data: departuresData } = await departuresQuery;
      setDepartures(departuresData || []);

      // Fetch tickets for validation rate
      let ticketsQuery = supabase
        .from('tickets')
        .select(`
          *,
          booking:bookings!inner(created_at, partner_id)
        `)
        .gte('booking.created_at', `${fromDate}T00:00:00`)
        .lte('booking.created_at', `${toDate}T23:59:59`);

      if (!isAdmin && partnerId) {
        ticketsQuery = ticketsQuery.eq('booking.partner_id', partnerId);
      }

      const { data: ticketsData } = await ticketsQuery;
      setTickets(ticketsData || []);

      // Fetch routes and trips for filters
      let routesQuery = supabase.from('routes').select('id, route_name');
      let tripsQuery = supabase.from('trips').select('id, trip_name');

      if (!isAdmin && partnerId) {
        routesQuery = routesQuery.eq('partner_id', partnerId);
        tripsQuery = tripsQuery.eq('partner_id', partnerId);
      }

      const { data: routesData } = await routesQuery;
      const { data: tripsData } = await tripsQuery;
      setRoutes(routesData || []);
      setTrips(tripsData || []);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin || partnerId) {
      fetchData();
    }
  }, [partnerId, isAdmin, filters.dateRange]);

  // Calculate sales metrics
  const salesMetrics = useMemo<SalesMetrics>(() => {
    let filteredBookings = bookings;

    // Apply filters
    if (filters.channel && filters.channel !== 'all') {
      if (filters.channel === 'online') {
        filteredBookings = filteredBookings.filter(b => b.channel === 'online_widget');
      } else {
        filteredBookings = filteredBookings.filter(b => b.channel !== 'online_widget');
      }
    }

    const confirmed = filteredBookings.filter(b => b.status === 'confirmed');
    const cancelled = filteredBookings.filter(b => b.status === 'cancelled');
    const refunded = filteredBookings.filter(b => b.status === 'refunded');

    const totalGross = commissions.reduce((sum, c) => sum + Number(c.gross_amount), 0);
    const totalCommission = commissions.reduce((sum, c) => sum + Number(c.platform_fee_amount), 0);
    const totalProviderFees = commissions.reduce((sum, c) => sum + Number(c.payment_provider_fee_amount || 0), 0);
    const totalNet = commissions.reduce((sum, c) => sum + Number(c.partner_net_amount), 0);
    const totalPax = confirmed.reduce((sum, b) => sum + b.pax_adult + b.pax_child, 0);

    return {
      totalBookings: filteredBookings.length,
      confirmedBookings: confirmed.length,
      cancelledBookings: cancelled.length,
      refundedBookings: refunded.length,
      totalGross,
      totalCommission,
      totalProviderFees,
      totalNet,
      totalPax,
      avgBookingValue: confirmed.length > 0 ? totalGross / confirmed.length : 0,
    };
  }, [bookings, commissions, filters]);

  // Calculate channel metrics
  const channelMetrics = useMemo<ChannelMetrics>(() => {
    const onlineBookings = bookings.filter(b => b.channel === 'online_widget' && b.status === 'confirmed');
    const offlineBookings = bookings.filter(b => b.channel !== 'online_widget' && b.status === 'confirmed');

    const onlineRevenue = onlineBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
    const offlineRevenue = offlineBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
    const totalRevenue = onlineRevenue + offlineRevenue;

    return {
      online: { bookings: onlineBookings.length, revenue: onlineRevenue },
      offline: { bookings: offlineBookings.length, revenue: offlineRevenue },
      onlinePercentage: totalRevenue > 0 ? (onlineRevenue / totalRevenue) * 100 : 0,
      offlinePercentage: totalRevenue > 0 ? (offlineRevenue / totalRevenue) * 100 : 0,
    };
  }, [bookings]);

  // Calculate capacity metrics
  const capacityMetrics = useMemo<CapacityMetrics>(() => {
    const totalCapacity = departures.reduce((sum, d) => sum + d.capacity_total, 0);
    const totalSold = departures.reduce((sum, d) => sum + d.capacity_reserved, 0);

    const departuresList = departures.map(d => ({
      id: d.id,
      date: d.departure_date,
      time: d.departure_time,
      tripName: d.trip?.trip_name || '-',
      routeName: d.route?.route_name || '-',
      capacity: d.capacity_total,
      sold: d.capacity_reserved,
      occupancy: d.capacity_total > 0 ? (d.capacity_reserved / d.capacity_total) * 100 : 0,
    }));

    return {
      totalCapacity,
      totalSold,
      occupancyRate: totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0,
      departures: departuresList.sort((a, b) => b.occupancy - a.occupancy),
    };
  }, [departures]);

  // Calculate payment metrics
  const paymentMetrics = useMemo<PaymentMetrics>(() => {
    const byMethod: Record<string, { count: number; amount: number }> = {};

    payments.forEach(p => {
      if (!byMethod[p.method]) {
        byMethod[p.method] = { count: 0, amount: 0 };
      }
      byMethod[p.method].count++;
      byMethod[p.method].amount += Number(p.amount);
    });

    const paid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
    const unpaid = payments.filter(p => p.status === 'unpaid').reduce((sum, p) => sum + Number(p.amount), 0);
    const refunded = payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      byMethod,
      paid,
      unpaid,
      refunded,
      totalRefundAmount: refunded,
    };
  }, [payments]);

  // Calculate booking status metrics
  const bookingStatusMetrics = useMemo<BookingStatusMetrics>(() => {
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const refunded = bookings.filter(b => b.status === 'refunded').length;

    const validatedTickets = tickets.filter(t => t.status === 'validated').length;
    const totalTickets = tickets.length;

    return {
      pending,
      confirmed,
      cancelled,
      refunded,
      validatedTickets,
      validationRate: totalTickets > 0 ? (validatedTickets / totalTickets) * 100 : 0,
    };
  }, [bookings, tickets]);

  // Export functions
  const exportSalesCSV = () => {
    const headers = ['Date', 'Booking ID', 'Customer', 'Route', 'Pax', 'Gross', 'Commission', 'Net', 'Status', 'Channel'];
    const rows = bookings.map(b => [
      format(new Date(b.created_at), 'yyyy-MM-dd'),
      b.id.slice(0, 8),
      b.customer?.full_name || '-',
      b.departure?.route?.route_name || '-',
      b.pax_adult + b.pax_child,
      b.total_amount,
      (Number(b.total_amount) * 0.07).toFixed(0),
      (Number(b.total_amount) * 0.93).toFixed(0),
      b.status,
      b.channel,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportCapacityCSV = () => {
    const headers = ['Date', 'Time', 'Trip', 'Route', 'Capacity', 'Sold', 'Occupancy %'];
    const rows = capacityMetrics.departures.map(d => [
      d.date,
      d.time,
      d.tripName,
      d.routeName,
      d.capacity,
      d.sold,
      d.occupancy.toFixed(1),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capacity-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return {
    loading,
    filters,
    setFilters,
    salesMetrics,
    channelMetrics,
    capacityMetrics,
    paymentMetrics,
    bookingStatusMetrics,
    routes,
    trips,
    exportSalesCSV,
    exportCapacityCSV,
    refetch: fetchData,
  };
};
