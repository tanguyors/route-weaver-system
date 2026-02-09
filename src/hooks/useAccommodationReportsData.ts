import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import { subDays, format, differenceInDays, parseISO } from 'date-fns';

export interface AccommodationReportSummary {
  totalRevenue: number;
  confirmedBookings: number;
  totalNights: number;
  occupancyRate: number;
  avgBookingValue: number;
  currency: string;
}

export interface RevenueByAccommodation {
  name: string;
  bookings: number;
  nights: number;
  revenue: number;
}

export interface ChartDataItem {
  name: string;
  value: number;
}

export const useAccommodationReportsData = () => {
  const { partnerId } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!partnerId) { setLoading(false); return; }
      setLoading(true);
      try {
        const fromStr = format(dateFrom, 'yyyy-MM-dd');
        const toStr = format(dateTo, 'yyyy-MM-dd');

        const [bookingsRes, accommodationsRes] = await Promise.all([
          supabase
            .from('accommodation_bookings')
            .select('*, accommodation:accommodations(name)')
            .eq('partner_id', partnerId)
            .gte('checkin_date', fromStr)
            .lte('checkin_date', toStr)
            .order('checkin_date', { ascending: false }),
          supabase
            .from('accommodations')
            .select('id, name, status')
            .eq('partner_id', partnerId),
        ]);

        if (bookingsRes.error) throw bookingsRes.error;
        if (accommodationsRes.error) throw accommodationsRes.error;

        setBookings(bookingsRes.data || []);
        setAccommodations(accommodationsRes.data || []);
      } catch (err) {
        console.error('Error fetching reports data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [partnerId, dateFrom, dateTo]);

  const summary = useMemo<AccommodationReportSummary>(() => {
    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const totalNights = activeBookings.reduce((sum, b) => sum + (b.total_nights || 0), 0);
    const confirmedBookings = activeBookings.length;
    const avgBookingValue = confirmedBookings > 0 ? totalRevenue / confirmedBookings : 0;

    // Occupancy: booked nights / (days in range * active properties)
    const activeProps = accommodations.filter(a => a.status === 'active').length;
    const daysInRange = Math.max(differenceInDays(dateTo, dateFrom), 1);
    const totalAvailableNights = daysInRange * Math.max(activeProps, 1);
    const occupancyRate = Math.min((totalNights / totalAvailableNights) * 100, 100);

    const currency = activeBookings[0]?.currency || 'IDR';

    return { totalRevenue, confirmedBookings, totalNights, occupancyRate, avgBookingValue, currency };
  }, [bookings, accommodations, dateFrom, dateTo]);

  const revenueByAccommodation = useMemo<RevenueByAccommodation[]>(() => {
    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const map = new Map<string, RevenueByAccommodation>();

    activeBookings.forEach(b => {
      const name = (b.accommodation as any)?.name || 'Unknown';
      const existing = map.get(name) || { name, bookings: 0, nights: 0, revenue: 0 };
      existing.bookings += 1;
      existing.nights += b.total_nights || 0;
      existing.revenue += b.total_amount || 0;
      map.set(name, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [bookings]);

  const bookingsByChannel = useMemo<ChartDataItem[]>(() => {
    const map = new Map<string, number>();
    bookings.forEach(b => {
      const channel = b.channel || 'other';
      map.set(channel, (map.get(channel) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  const bookingsByStatus = useMemo<ChartDataItem[]>(() => {
    const map = new Map<string, number>();
    bookings.forEach(b => {
      const status = b.status || 'draft';
      map.set(status, (map.get(status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  return {
    loading,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    summary,
    revenueByAccommodation,
    bookingsByChannel,
    bookingsByStatus,
  };
};
