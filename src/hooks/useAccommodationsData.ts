import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export interface Accommodation {
  id: string;
  partner_id: string;
  name: string;
  type: string;
  description: string | null;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  amenities: unknown;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  price_per_night: number;
  currency: string;
  minimum_nights: number;
  checkin_time: string | null;
  checkout_time: string | null;
  ical_token: string;
  created_at: string;
  updated_at: string;
}

export const useAccommodationsData = () => {
  const { partnerId } = useUserRole();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccommodations = useCallback(async () => {
    if (!partnerId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAccommodations((data || []) as unknown as Accommodation[]);
    } catch (err) {
      console.error('Error fetching accommodations:', err);
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => { fetchAccommodations(); }, [fetchAccommodations]);

  const createAccommodation = async (input: Partial<Accommodation>) => {
    if (!partnerId) throw new Error('No partner');
    const { data, error } = await supabase
      .from('accommodations')
      .insert({ ...input, partner_id: partnerId } as any)
      .select()
      .single();
    if (error) throw error;
    await fetchAccommodations();
    return data;
  };

  const updateAccommodation = async (id: string, input: Partial<Accommodation>) => {
    const { error } = await supabase
      .from('accommodations')
      .update(input as any)
      .eq('id', id);
    if (error) throw error;
    await fetchAccommodations();
  };

  const deleteAccommodation = async (id: string) => {
    const { error } = await supabase
      .from('accommodations')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchAccommodations();
  };

  return { accommodations, loading, fetchAccommodations, createAccommodation, updateAccommodation, deleteAccommodation };
};
