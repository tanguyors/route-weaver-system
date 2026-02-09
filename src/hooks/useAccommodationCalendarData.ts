import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export interface CalendarEntry {
  id: string;
  accommodation_id: string;
  date: string;
  status: string;
  source: string;
  booking_id: string | null;
  room_id: string | null;
  note: string | null;
  guest_name?: string | null;
}

export const useAccommodationCalendarData = (accommodationId: string, startDate: string, endDate: string) => {
  const { partnerId } = useUserRole();
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendar = useCallback(async () => {
    if (!accommodationId || !partnerId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accommodation_calendar')
        .select('*, accommodation_bookings!accommodation_calendar_booking_id_fkey(guest_name)')
        .eq('accommodation_id', accommodationId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');
      if (error) throw error;
      const mapped = (data || []).map((e: any) => ({
        ...e,
        guest_name: e.accommodation_bookings?.guest_name || null,
      }));
      setCalendarEntries(mapped as CalendarEntry[]);
    } catch (err) {
      console.error('Error fetching calendar:', err);
    } finally {
      setLoading(false);
    }
  }, [accommodationId, partnerId, startDate, endDate]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  const toggleBlock = async (date: string, currentStatus: string) => {
    if (!accommodationId || !partnerId) throw new Error('Missing context');
    
    if (currentStatus === 'blocked') {
      // Remove the block entry
      const { error } = await supabase
        .from('accommodation_calendar')
        .delete()
        .eq('accommodation_id', accommodationId)
        .eq('date', date)
        .eq('status', 'blocked');
      if (error) throw error;
    } else {
      // Upsert as blocked
      const { error } = await supabase
        .from('accommodation_calendar')
        .upsert(
          {
            accommodation_id: accommodationId,
            partner_id: partnerId,
            date,
            status: 'blocked',
            source: 'manual',
          } as any,
          { onConflict: 'accommodation_id,date' }
        );
      if (error) throw error;
    }
    await fetchCalendar();
  };

  return { calendarEntries, loading, fetchCalendar, toggleBlock };
};
