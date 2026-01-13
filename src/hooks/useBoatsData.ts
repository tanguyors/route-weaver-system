import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

export interface Boat {
  id: string;
  partner_id: string;
  name: string;
  description: string | null;
  capacity: number;
  image_url: string | null;
  images: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export const useBoatsData = () => {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const { role, partnerId } = useUserRole();

  const canEdit = role === 'admin' || role === 'partner_owner';

  const fetchBoats = useCallback(async () => {
    if (!partnerId && role !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    let query = supabase.from('boats').select('*').order('name');

    if (role !== 'admin' && partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching boats:', error);
      toast.error('Failed to load boats');
    } else {
      setBoats((data || []) as Boat[]);
    }
    setLoading(false);
  }, [partnerId, role]);

  useEffect(() => {
    fetchBoats();
  }, [fetchBoats]);

  const createBoat = async (data: {
    name: string;
    description?: string;
    capacity: number;
    image_url?: string;
    images?: string[];
    status: 'active' | 'inactive';
  }): Promise<{ error: Error | null }> => {
    if (!partnerId) {
      return { error: new Error('No partner ID') };
    }

    const { error } = await supabase.from('boats').insert({
      partner_id: partnerId,
      name: data.name,
      description: data.description || null,
      capacity: data.capacity,
      image_url: data.image_url || null,
      images: data.images || [],
      status: data.status,
    });

    if (error) {
      toast.error('Failed to create boat');
      return { error };
    }

    toast.success('Boat created successfully');
    await fetchBoats();
    return { error: null };
  };

  const updateBoat = async (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      capacity: number;
      image_url: string;
      images: string[];
      status: 'active' | 'inactive';
    }>
  ): Promise<{ error: Error | null }> => {
    const { error } = await supabase
      .from('boats')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update boat');
      return { error };
    }

    toast.success('Boat updated successfully');
    await fetchBoats();
    return { error: null };
  };

  const deleteBoat = async (id: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.from('boats').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete boat');
      return { error };
    }

    toast.success('Boat deleted successfully');
    await fetchBoats();
    return { error: null };
  };

  const uploadBoatImage = async (file: File): Promise<{ url: string | null; error: Error | null }> => {
    if (!partnerId) {
      return { url: null, error: new Error('No partner ID') };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${partnerId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('boat-images')
      .upload(fileName, file);

    if (uploadError) {
      toast.error('Failed to upload image');
      return { url: null, error: uploadError };
    }

    const { data: urlData } = supabase.storage
      .from('boat-images')
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl, error: null };
  };

  return {
    boats,
    loading,
    canEdit,
    fetchBoats,
    createBoat,
    updateBoat,
    deleteBoat,
    uploadBoatImage,
  };
};
