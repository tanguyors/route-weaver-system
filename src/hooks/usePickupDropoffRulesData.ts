import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

export type ServiceType = 'pickup' | 'dropoff';

export interface PickupDropoffRule {
  id: string;
  partner_id: string;
  from_port_id: string;
  city_name: string;
  service_type: ServiceType;
  price: number;
  car_price: number;
  bus_price: number;
  pickup_before_departure_minutes: number | null;
  dropoff_after_arrival_minutes: number | null;
  status: 'active' | 'inactive';
  sort_order: number;
  created_at: string;
  updated_at: string;
  port?: { id: string; name: string };
}

export interface Port {
  id: string;
  name: string;
  area: string | null;
}

export const usePickupDropoffRulesData = (partnerId?: string, fromPortId?: string, serviceType?: ServiceType) => {
  const [rules, setRules] = useState<PickupDropoffRule[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const { role, partnerId: userPartnerId } = useUserRole();

  const isAdmin = role === 'admin';
  const effectivePartnerId = partnerId || userPartnerId;
  const canManage = isAdmin || (role === 'partner_owner' && !!effectivePartnerId);

  const fetchRules = useCallback(async () => {
    if (!effectivePartnerId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    let query = supabase
      .from('private_pickup_dropoff_rules')
      .select(`
        *,
        port:ports!private_pickup_dropoff_rules_from_port_id_fkey(id, name)
      `)
      .eq('partner_id', effectivePartnerId)
      .order('sort_order')
      .order('city_name');

    if (fromPortId) {
      query = query.eq('from_port_id', fromPortId);
    }

    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pickup/dropoff rules:', error);
      toast.error('Failed to load pickup/dropoff rules');
    } else {
      setRules((data || []) as PickupDropoffRule[]);
    }
    setLoading(false);
  }, [effectivePartnerId, fromPortId, serviceType]);

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
    fetchRules();
    fetchPorts();
  }, [fetchRules, fetchPorts]);

  const createRule = async (data: {
    from_port_id: string;
    city_name: string;
    service_type: ServiceType;
    car_price: number;
    bus_price: number;
    pickup_before_departure_minutes?: number;
    dropoff_after_arrival_minutes?: number;
    status: 'active' | 'inactive';
    sort_order?: number;
  }): Promise<{ error: Error | null }> => {
    if (!canManage || !effectivePartnerId) {
      toast.error('You do not have permission to manage pickup/dropoff rules');
      return { error: new Error('Unauthorized') };
    }

    const { error } = await supabase
      .from('private_pickup_dropoff_rules')
      .insert({
        ...data,
        partner_id: effectivePartnerId,
        price: data.car_price, // Keep price field updated for backwards compatibility
        pickup_before_departure_minutes: data.service_type === 'pickup' ? data.pickup_before_departure_minutes : null,
        dropoff_after_arrival_minutes: data.service_type === 'dropoff' ? data.dropoff_after_arrival_minutes : null,
      });

    if (error) {
      toast.error('Failed to create rule');
      return { error };
    }

    toast.success('Rule created successfully');
    await fetchRules();
    return { error: null };
  };

  const updateRule = async (
    id: string,
    data: Partial<{
      from_port_id: string;
      city_name: string;
      service_type: ServiceType;
      car_price: number;
      bus_price: number;
      pickup_before_departure_minutes: number;
      dropoff_after_arrival_minutes: number;
      status: 'active' | 'inactive';
      sort_order: number;
    }>
  ): Promise<{ error: Error | null }> => {
    if (!canManage) {
      toast.error('You do not have permission to manage pickup/dropoff rules');
      return { error: new Error('Unauthorized') };
    }

    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
      // Keep price field updated for backwards compatibility
      ...(data.car_price !== undefined ? { price: data.car_price } : {}),
    };

    const { error } = await supabase
      .from('private_pickup_dropoff_rules')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update rule');
      return { error };
    }

    toast.success('Rule updated successfully');
    await fetchRules();
    return { error: null };
  };

  const deleteRule = async (id: string): Promise<{ error: Error | null }> => {
    if (!canManage) {
      toast.error('You do not have permission to manage pickup/dropoff rules');
      return { error: new Error('Unauthorized') };
    }

    const { error } = await supabase
      .from('private_pickup_dropoff_rules')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete rule');
      return { error };
    }

    toast.success('Rule deleted successfully');
    await fetchRules();
    return { error: null };
  };

  return {
    rules,
    ports,
    loading,
    canManage,
    isAdmin,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
  };
};
