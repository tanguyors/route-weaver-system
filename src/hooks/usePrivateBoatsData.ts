import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

export type PrivateBoatStatus = 'draft' | 'active' | 'inactive';

export interface PrivateBoat {
  id: string;
  partner_id: string;
  name: string;
  description: string | null;
  capacity: number;
  min_capacity: number;
  max_capacity: number | null;
  image_url: string | null;
  status: PrivateBoatStatus;
  min_departure_time: string;
  max_departure_time: string;
  created_at: string;
  updated_at: string;
  routes_count?: number;
}

export interface PrivateBoatRoute {
  id: string;
  private_boat_id: string;
  from_port_id: string;
  to_port_id: string;
  price: number;
  duration_minutes: number | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  from_port?: { id: string; name: string };
  to_port?: { id: string; name: string };
}

export interface Port {
  id: string;
  name: string;
  area: string | null;
}

export const usePrivateBoatsData = () => {
  const [boats, setBoats] = useState<PrivateBoat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PrivateBoatStatus | 'all'>('all');
  const { role, partnerId } = useUserRole();

  const canEdit = role === 'admin' || role === 'partner_owner';

  const fetchBoats = useCallback(async () => {
    if (!partnerId && role !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    let query = supabase
      .from('private_boats')
      .select('*')
      .order('name');

    if (role !== 'admin' && partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching private boats:', error);
      toast.error('Failed to load private boats');
    } else {
      // Get routes count for each boat
      const boatIds = (data || []).map(b => b.id);
      if (boatIds.length > 0) {
        const { data: routeCounts } = await supabase
          .from('private_boat_routes')
          .select('private_boat_id')
          .in('private_boat_id', boatIds);
        
        const countMap: Record<string, number> = {};
        routeCounts?.forEach(r => {
          countMap[r.private_boat_id] = (countMap[r.private_boat_id] || 0) + 1;
        });

        setBoats((data || []).map(boat => ({
          ...boat,
          routes_count: countMap[boat.id] || 0
        })) as PrivateBoat[]);
      } else {
        setBoats([]);
      }
    }
    setLoading(false);
  }, [partnerId, role, searchQuery, statusFilter]);

  useEffect(() => {
    fetchBoats();
  }, [fetchBoats]);

  const createBoat = async (data: {
    name: string;
    description?: string;
    capacity: number;
    min_capacity: number;
    max_capacity: number;
    image_url?: string;
    status: PrivateBoatStatus;
    min_departure_time: string;
    max_departure_time: string;
  }): Promise<{ error: Error | null; data?: PrivateBoat }> => {
    if (!partnerId) {
      return { error: new Error('No partner ID') };
    }

    const { data: result, error } = await supabase
      .from('private_boats')
      .insert({
        partner_id: partnerId,
        name: data.name,
        description: data.description || null,
        capacity: data.max_capacity,
        min_capacity: data.min_capacity,
        max_capacity: data.max_capacity,
        image_url: data.image_url || null,
        status: data.status,
        min_departure_time: data.min_departure_time,
        max_departure_time: data.max_departure_time,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create private boat');
      return { error };
    }

    toast.success('Private boat created successfully');
    await fetchBoats();
    return { error: null, data: result as PrivateBoat };
  };

  const updateBoat = async (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      capacity: number;
      min_capacity: number;
      max_capacity: number;
      image_url: string;
      status: PrivateBoatStatus;
      min_departure_time: string;
      max_departure_time: string;
    }>
  ): Promise<{ error: Error | null }> => {
    // If max_capacity is provided, also update capacity
    const updateData = { ...data, updated_at: new Date().toISOString() };
    if (data.max_capacity) {
      updateData.capacity = data.max_capacity;
    }
    const { error } = await supabase
      .from('private_boats')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update private boat');
      return { error };
    }

    toast.success('Private boat updated successfully');
    await fetchBoats();
    return { error: null };
  };

  const deleteBoat = async (id: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.from('private_boats').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete private boat');
      return { error };
    }

    toast.success('Private boat deleted successfully');
    await fetchBoats();
    return { error: null };
  };

  const uploadBoatImage = async (file: File): Promise<{ url: string | null; error: Error | null }> => {
    if (!partnerId) {
      return { url: null, error: new Error('No partner ID') };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `private-boats/${partnerId}/${Date.now()}.${fileExt}`;

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
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    fetchBoats,
    createBoat,
    updateBoat,
    deleteBoat,
    uploadBoatImage,
  };
};

export const usePrivateBoatRoutesData = (privateBoatId: string | null) => {
  const [routes, setRoutes] = useState<PrivateBoatRoute[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRoutes = useCallback(async () => {
    if (!privateBoatId) {
      setRoutes([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('private_boat_routes')
      .select(`
        *,
        from_port:ports!private_boat_routes_from_port_id_fkey(id, name),
        to_port:ports!private_boat_routes_to_port_id_fkey(id, name)
      `)
      .eq('private_boat_id', privateBoatId)
      .order('created_at');

    if (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to load routes');
    } else {
      setRoutes((data || []) as PrivateBoatRoute[]);
    }
    setLoading(false);
  }, [privateBoatId]);

  const fetchPorts = useCallback(async () => {
    const { data, error } = await supabase
      .from('ports')
      .select('id, name, area')
      .order('name');

    if (!error) {
      setPorts(data || []);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
    fetchPorts();
  }, [fetchRoutes, fetchPorts]);

  const createRoute = async (data: {
    private_boat_id: string;
    from_port_id: string;
    to_port_id: string;
    price: number;
    duration_minutes?: number;
    status: 'active' | 'inactive';
  }): Promise<{ error: Error | null }> => {
    const { error } = await supabase
      .from('private_boat_routes')
      .insert(data);

    if (error) {
      if (error.code === '23505') {
        toast.error('This route already exists for this boat');
      } else {
        toast.error('Failed to create route');
      }
      return { error };
    }

    toast.success('Route added successfully');
    await fetchRoutes();
    return { error: null };
  };

  const updateRoute = async (
    id: string,
    data: Partial<{
      from_port_id: string;
      to_port_id: string;
      price: number;
      duration_minutes: number;
      status: 'active' | 'inactive';
    }>
  ): Promise<{ error: Error | null }> => {
    const { error } = await supabase
      .from('private_boat_routes')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update route');
      return { error };
    }

    toast.success('Route updated successfully');
    await fetchRoutes();
    return { error: null };
  };

  const deleteRoute = async (id: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase
      .from('private_boat_routes')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete route');
      return { error };
    }

    toast.success('Route deleted successfully');
    await fetchRoutes();
    return { error: null };
  };

  return {
    routes,
    ports,
    loading,
    fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
  };
};
