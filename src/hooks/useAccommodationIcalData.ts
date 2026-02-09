import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export interface IcalImport {
  id: string;
  accommodation_id: string;
  partner_id: string;
  platform_name: string;
  ical_url: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export const useAccommodationIcalData = (accommodationId: string | null) => {
  const { partnerId } = useUserRole();
  const [icalImports, setIcalImports] = useState<IcalImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchImports = useCallback(async () => {
    if (!accommodationId || !partnerId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accommodation_ical_imports')
        .select('*')
        .eq('accommodation_id', accommodationId)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setIcalImports((data || []) as unknown as IcalImport[]);
    } catch (err) {
      console.error('Error fetching iCal imports:', err);
    } finally {
      setLoading(false);
    }
  }, [accommodationId, partnerId]);

  useEffect(() => { fetchImports(); }, [fetchImports]);

  const createIcalImport = async (data: { platform_name: string; ical_url: string }) => {
    if (!accommodationId || !partnerId) throw new Error('Missing context');
    const { error } = await supabase
      .from('accommodation_ical_imports')
      .insert({
        accommodation_id: accommodationId,
        partner_id: partnerId,
        platform_name: data.platform_name,
        ical_url: data.ical_url,
      } as any);
    if (error) throw error;
    await fetchImports();
  };

  const deleteIcalImport = async (id: string) => {
    const { error } = await supabase
      .from('accommodation_ical_imports')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchImports();
  };

  const toggleIcalImport = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('accommodation_ical_imports')
      .update({ is_active: !isActive } as any)
      .eq('id', id);
    if (error) throw error;
    await fetchImports();
  };

  const triggerSync = async () => {
    if (!accommodationId) return;
    setSyncing(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/sync-ical-imports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accommodation_id: accommodationId }),
      });
      if (!response.ok) throw new Error('Sync failed');
      await fetchImports();
    } catch (err) {
      console.error('Sync error:', err);
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  return { icalImports, loading, syncing, fetchImports, createIcalImport, deleteIcalImport, toggleIcalImport, triggerSync };
};
