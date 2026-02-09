import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export interface AccommodationRoom {
  id: string;
  accommodation_id: string;
  partner_id: string;
  name: string;
  description: string | null;
  capacity: number;
  bed_type: string;
  quantity: number;
  price_per_night: number;
  currency: string;
  minimum_nights: number;
  amenities: any;
  status: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomInput {
  accommodation_id: string;
  name: string;
  description?: string;
  capacity?: number;
  bed_type?: string;
  quantity?: number;
  price_per_night?: number;
  currency?: string;
  minimum_nights?: number;
  amenities?: string[];
  status?: string;
}

export const useAccommodationRoomsData = (accommodationId?: string) => {
  const { partnerId } = useUserRole();
  const [rooms, setRooms] = useState<AccommodationRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    if (!accommodationId || !partnerId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accommodation_rooms')
        .select('*')
        .eq('accommodation_id', accommodationId)
        .eq('partner_id', partnerId)
        .order('display_order');
      if (error) throw error;
      setRooms((data || []) as unknown as AccommodationRoom[]);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  }, [accommodationId, partnerId]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const createRoom = async (input: CreateRoomInput) => {
    if (!partnerId) throw new Error('No partner');
    const maxOrder = rooms.length > 0 ? Math.max(...rooms.map(r => r.display_order)) + 1 : 1;
    const { data, error } = await supabase
      .from('accommodation_rooms')
      .insert({ ...input, partner_id: partnerId, display_order: maxOrder } as any)
      .select()
      .single();
    if (error) throw error;
    await fetchRooms();
    return data;
  };

  const updateRoom = async (id: string, input: Partial<CreateRoomInput>) => {
    const { error } = await supabase
      .from('accommodation_rooms')
      .update(input as any)
      .eq('id', id);
    if (error) throw error;
    await fetchRooms();
  };

  const deleteRoom = async (id: string) => {
    const { count } = await supabase
      .from('accommodation_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', id)
      .in('status', ['confirmed']);
    if (count && count > 0) {
      throw new Error('Cannot delete room with active bookings');
    }
    const { error } = await supabase
      .from('accommodation_rooms')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchRooms();
  };

  return { rooms, loading, fetchRooms, createRoom, updateRoom, deleteRoom };
};
