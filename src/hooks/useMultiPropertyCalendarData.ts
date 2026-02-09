import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export interface MultiCalendarEntry {
  id: string;
  accommodation_id: string;
  date: string;
  status: string;
  source: string;
  booking_id: string | null;
  note: string | null;
  guest_name: string | null;
  checkin_date: string | null;
  checkout_date: string | null;
}

export interface AccommodationGroup {
  accommodation_id: string;
  accommodation_name: string;
  entries: MultiCalendarEntry[];
}

export const useMultiPropertyCalendarData = (startDate: string, endDate: string) => {
  const { partnerId } = useUserRole();
  const [groups, setGroups] = useState<AccommodationGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!partnerId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Fetch accommodations
      const { data: accommodations, error: accError } = await supabase
        .from('accommodations')
        .select('id, name')
        .eq('partner_id', partnerId)
        .order('name');
      if (accError) throw accError;

      // Fetch calendar entries for all accommodations in the date range
      const { data: entries, error: calError } = await supabase
        .from('accommodation_calendar')
        .select('*, accommodation_bookings!accommodation_calendar_booking_id_fkey(guest_name, checkin_date, checkout_date)')
        .eq('partner_id', partnerId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');
      if (calError) throw calError;

      // Map entries to flat structure with guest info
      const mappedEntries: MultiCalendarEntry[] = (entries || []).map((e: any) => ({
        id: e.id,
        accommodation_id: e.accommodation_id,
        date: e.date,
        status: e.status,
        source: e.source,
        booking_id: e.booking_id,
        note: e.note,
        guest_name: e.accommodation_bookings?.guest_name || null,
        checkin_date: e.accommodation_bookings?.checkin_date || null,
        checkout_date: e.accommodation_bookings?.checkout_date || null,
      }));

      // Group by accommodation
      const grouped: AccommodationGroup[] = (accommodations || []).map((acc: any) => ({
        accommodation_id: acc.id,
        accommodation_name: acc.name,
        entries: mappedEntries.filter(e => e.accommodation_id === acc.id),
      }));

      setGroups(grouped);
    } catch (err) {
      console.error('Error fetching multi-property calendar:', err);
    } finally {
      setLoading(false);
    }
  }, [partnerId, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleBlock = async (accommodationId: string, date: string, currentStatus: string) => {
    if (!partnerId) throw new Error('Missing context');

    if (currentStatus === 'blocked') {
      const { error } = await supabase
        .from('accommodation_calendar')
        .delete()
        .eq('accommodation_id', accommodationId)
        .eq('date', date)
        .eq('status', 'blocked');
      if (error) throw error;
    } else {
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
    await fetchData();
  };

  return { groups, loading, fetchData, toggleBlock };
};
