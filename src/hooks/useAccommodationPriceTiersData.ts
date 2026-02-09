import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export interface AccommodationPriceTier {
  id: string;
  accommodation_id: string;
  room_id: string | null;
  partner_id: string;
  min_nights: number;
  price_per_night: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PriceTierInput {
  min_nights: number;
  price_per_night: number;
  currency: string;
}

export const useAccommodationPriceTiersData = (accommodationId?: string, roomId?: string | null) => {
  const { partnerId } = useUserRole();
  const [tiers, setTiers] = useState<AccommodationPriceTier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTiers = useCallback(async () => {
    if (!accommodationId || !partnerId) { setLoading(false); return; }
    setLoading(true);
    try {
      let query = supabase
        .from('accommodation_price_tiers')
        .select('*')
        .eq('accommodation_id', accommodationId)
        .eq('partner_id', partnerId)
        .eq('status', 'active')
        .order('min_nights');

      if (roomId) {
        query = query.eq('room_id', roomId);
      } else {
        query = query.is('room_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTiers((data || []) as unknown as AccommodationPriceTier[]);
    } catch (err) {
      console.error('Error fetching price tiers:', err);
    } finally {
      setLoading(false);
    }
  }, [accommodationId, partnerId, roomId]);

  useEffect(() => { fetchTiers(); }, [fetchTiers]);

  const saveTiers = async (accId: string, rId: string | null, newTiers: PriceTierInput[]) => {
    if (!partnerId) throw new Error('No partner');

    let deleteQuery = supabase
      .from('accommodation_price_tiers')
      .delete()
      .eq('accommodation_id', accId)
      .eq('partner_id', partnerId);

    if (rId) {
      deleteQuery = deleteQuery.eq('room_id', rId);
    } else {
      deleteQuery = deleteQuery.is('room_id', null);
    }

    const { error: delError } = await deleteQuery;
    if (delError) throw delError;

    if (newTiers.length > 0) {
      const rows = newTiers.map(t => ({
        accommodation_id: accId,
        room_id: rId || null,
        partner_id: partnerId,
        min_nights: t.min_nights,
        price_per_night: t.price_per_night,
        currency: t.currency,
        status: 'active',
      }));
      const { error: insError } = await supabase
        .from('accommodation_price_tiers')
        .insert(rows as any[]);
      if (insError) throw insError;
    }

    await fetchTiers();
  };

  const getEffectivePrice = useCallback(
    (tiersList: AccommodationPriceTier[], nights: number, basePrice: number): number => {
      if (tiersList.length === 0) return basePrice;
      const applicable = tiersList
        .filter(t => t.min_nights <= nights)
        .sort((a, b) => b.min_nights - a.min_nights);
      return applicable.length > 0 ? applicable[0].price_per_night : basePrice;
    },
    []
  );

  return { tiers, loading, fetchTiers, saveTiers, getEffectivePrice };
};
