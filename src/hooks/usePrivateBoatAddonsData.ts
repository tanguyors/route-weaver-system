import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

export interface PrivateBoatActivityAddon {
  id: string;
  partner_id: string;
  name: string;
  description: string | null;
  price: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface PrivateBoatRouteAddon {
  id: string;
  route_id: string;
  activity_addon_id: string;
  partner_id: string;
  pricing_type: 'included' | 'normal';
  created_at: string;
  activity_addon?: PrivateBoatActivityAddon;
}

export const usePrivateBoatAddonsData = () => {
  const { partnerId } = useUserRole();
  const [activityAddons, setActivityAddons] = useState<PrivateBoatActivityAddon[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivityAddons = useCallback(async () => {
    if (!partnerId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('private_boat_activity_addons')
      .select('*')
      .eq('partner_id', partnerId)
      .order('name');

    if (error) {
      console.error('Error fetching activity addons:', error);
      toast.error('Failed to load activity add-ons');
    } else {
      setActivityAddons((data || []).map(item => ({
        ...item,
        status: item.status as 'active' | 'inactive',
      })));
    }
    setLoading(false);
  }, [partnerId]);

  useEffect(() => {
    fetchActivityAddons();
  }, [fetchActivityAddons]);

  const createActivityAddon = async (data: {
    name: string;
    description?: string;
    price: number;
    status: 'active' | 'inactive';
  }) => {
    if (!partnerId) return { error: new Error('No partner ID') };

    const { error } = await supabase
      .from('private_boat_activity_addons')
      .insert({
        partner_id: partnerId,
        name: data.name,
        description: data.description || null,
        price: data.price,
        status: data.status,
      });

    if (error) {
      toast.error('Failed to create activity add-on');
      return { error };
    }

    toast.success('Activity add-on created');
    fetchActivityAddons();
    return { error: null };
  };

  const updateActivityAddon = async (
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      status?: 'active' | 'inactive';
    }
  ) => {
    const { error } = await supabase
      .from('private_boat_activity_addons')
      .update(data)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update activity add-on');
      return { error };
    }

    toast.success('Activity add-on updated');
    fetchActivityAddons();
    return { error: null };
  };

  const deleteActivityAddon = async (id: string) => {
    const { error } = await supabase
      .from('private_boat_activity_addons')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete activity add-on');
      return { error };
    }

    toast.success('Activity add-on deleted');
    fetchActivityAddons();
    return { error: null };
  };

  // Fetch addons for a specific route
  const fetchRouteAddons = async (routeId: string): Promise<PrivateBoatRouteAddon[]> => {
    if (!partnerId) return [];

    const { data, error } = await supabase
      .from('private_boat_route_addons')
      .select(`
        *,
        activity_addon:private_boat_activity_addons(*)
      `)
      .eq('route_id', routeId);

    if (error) {
      console.error('Error fetching route addons:', error);
      return [];
    }

    return (data || []).map(item => ({
      ...item,
      pricing_type: item.pricing_type as 'included' | 'normal',
      activity_addon: item.activity_addon ? {
        ...item.activity_addon,
        status: item.activity_addon.status as 'active' | 'inactive',
      } : undefined,
    }));
  };

  // Update addons for a route
  const updateRouteAddons = async (
    routeId: string,
    addons: { activity_addon_id: string; pricing_type: 'included' | 'normal' }[]
  ) => {
    if (!partnerId) return { error: new Error('No partner ID') };

    // Delete existing addons for this route
    await supabase
      .from('private_boat_route_addons')
      .delete()
      .eq('route_id', routeId);

    // Insert new addons
    if (addons.length > 0) {
      const { error } = await supabase
        .from('private_boat_route_addons')
        .insert(
          addons.map(a => ({
            route_id: routeId,
            activity_addon_id: a.activity_addon_id,
            partner_id: partnerId,
            pricing_type: a.pricing_type,
          }))
        );

      if (error) {
        toast.error('Failed to update route add-ons');
        return { error };
      }
    }

    return { error: null };
  };

  return {
    activityAddons,
    loading,
    createActivityAddon,
    updateActivityAddon,
    deleteActivityAddon,
    fetchRouteAddons,
    updateRouteAddons,
    refetch: fetchActivityAddons,
  };
};
