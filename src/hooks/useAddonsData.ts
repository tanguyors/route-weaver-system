import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export type AddonType = 'pickup' | 'generic';
export type AddonPricingModel = 'per_person' | 'per_booking';
export type AddonApplicability = 'fastboat' | 'activities' | 'both';

export interface PickupZone {
  id: string;
  addon_id: string;
  partner_id: string;
  zone_name: string;
  price_override: number | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Addon {
  id: string;
  partner_id: string;
  name: string;
  description: string | null;
  type: AddonType;
  pricing_model: AddonPricingModel;
  price: number;
  status: 'active' | 'inactive';
  enable_pickup_zones: boolean;
  pickup_required_info: {
    hotel_name: boolean;
    address: boolean;
    pickup_note: boolean;
  };
  is_mandatory: boolean;
  applicability: AddonApplicability;
  applicable_route_ids: string[];
  applicable_trip_ids: string[];
  applicable_schedule_ids: string[];
  created_at: string;
  updated_at: string;
  pickup_zones?: PickupZone[];
}

export interface AddonFormData {
  name: string;
  description?: string;
  type: AddonType;
  pricing_model: AddonPricingModel;
  price: number;
  status?: 'active' | 'inactive';
  enable_pickup_zones?: boolean;
  pickup_required_info?: {
    hotel_name: boolean;
    address: boolean;
    pickup_note: boolean;
  };
  is_mandatory?: boolean;
  applicability?: AddonApplicability;
  applicable_route_ids?: string[];
  applicable_trip_ids?: string[];
  applicable_schedule_ids?: string[];
}

export interface PickupZoneFormData {
  zone_name: string;
  price_override?: number | null;
  status?: 'active' | 'inactive';
}

export const useAddonsData = () => {
  const { user } = useAuth();
  const { partnerId, role } = useUserRole();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';
  const canEdit = role === 'admin' || role === 'partner_owner';

  const fetchAddons = useCallback(async () => {
    if (!user) return;
    
    let query = supabase
      .from('addons')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin && partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data, error } = await query;
    
    if (!error && data) {
      // Fetch pickup zones for each addon
      const addonsWithZones = await Promise.all(
        data.map(async (addon) => {
          if (addon.type === 'pickup' && addon.enable_pickup_zones) {
            const { data: zones } = await supabase
              .from('pickup_zones')
              .select('*')
              .eq('addon_id', addon.id)
              .order('zone_name');
            return { 
              ...addon, 
              pickup_zones: zones || [],
              pickup_required_info: addon.pickup_required_info as Addon['pickup_required_info']
            };
          }
          return { 
            ...addon, 
            pickup_zones: [],
            pickup_required_info: addon.pickup_required_info as Addon['pickup_required_info']
          };
        })
      );
      setAddons(addonsWithZones as Addon[]);
    }
    setLoading(false);
  }, [user, isAdmin, partnerId]);

  const createAddon = async (formData: AddonFormData) => {
    if (!partnerId && !isAdmin) return { error: new Error('No partner assigned') };

    const insertData = {
      partner_id: partnerId,
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      pricing_model: formData.pricing_model,
      price: formData.price,
      status: formData.status || 'active',
      enable_pickup_zones: formData.enable_pickup_zones || false,
      pickup_required_info: formData.pickup_required_info || { hotel_name: false, address: false, pickup_note: false },
      is_mandatory: formData.is_mandatory || false,
      applicability: formData.applicability || 'both',
      applicable_route_ids: formData.applicable_route_ids || [],
      applicable_trip_ids: formData.applicable_trip_ids || [],
      applicable_schedule_ids: formData.applicable_schedule_ids || [],
    };

    const { data, error } = await supabase.from('addons').insert(insertData).select().single();

    if (!error && data) {
      await fetchAddons();
      // Log audit
      await supabase.from('audit_logs').insert({
        entity_type: 'addon',
        action: 'create',
        entity_id: data.id,
        partner_id: partnerId,
        actor_user_id: user?.id,
        metadata: { name: formData.name, type: formData.type },
      });
    }

    return { error, data };
  };

  const updateAddon = async (id: string, formData: Partial<AddonFormData>) => {
    const existingAddon = addons.find(a => a.id === id);
    
    const { error } = await supabase
      .from('addons')
      .update(formData)
      .eq('id', id);

    if (!error) {
      await fetchAddons();
      // Log audit
      await supabase.from('audit_logs').insert({
        entity_type: 'addon',
        action: 'update',
        entity_id: id,
        partner_id: existingAddon?.partner_id,
        actor_user_id: user?.id,
        metadata: { changes: formData },
      });
    }

    return { error };
  };

  const deleteAddon = async (id: string) => {
    const existingAddon = addons.find(a => a.id === id);
    
    const { error } = await supabase
      .from('addons')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchAddons();
      // Log audit
      await supabase.from('audit_logs').insert({
        entity_type: 'addon',
        action: 'delete',
        entity_id: id,
        partner_id: existingAddon?.partner_id,
        actor_user_id: user?.id,
        metadata: { name: existingAddon?.name },
      });
    }

    return { error };
  };

  const toggleStatus = async (id: string) => {
    const addon = addons.find(a => a.id === id);
    if (!addon) return { error: new Error('Addon not found') };

    const newStatus = addon.status === 'active' ? 'inactive' : 'active';
    return updateAddon(id, { status: newStatus });
  };

  // Pickup Zone CRUD
  const createPickupZone = async (addonId: string, formData: PickupZoneFormData) => {
    if (!partnerId && !isAdmin) return { error: new Error('No partner assigned') };

    const { error } = await supabase.from('pickup_zones').insert({
      addon_id: addonId,
      partner_id: partnerId,
      zone_name: formData.zone_name,
      price_override: formData.price_override || null,
      status: formData.status || 'active',
    });

    if (!error) {
      await fetchAddons();
    }

    return { error };
  };

  const updatePickupZone = async (zoneId: string, formData: Partial<PickupZoneFormData>) => {
    const { error } = await supabase
      .from('pickup_zones')
      .update(formData)
      .eq('id', zoneId);

    if (!error) {
      await fetchAddons();
    }

    return { error };
  };

  const deletePickupZone = async (zoneId: string) => {
    const { error } = await supabase
      .from('pickup_zones')
      .delete()
      .eq('id', zoneId);

    if (!error) {
      await fetchAddons();
    }

    return { error };
  };

  useEffect(() => {
    if (user) {
      fetchAddons();
    }
  }, [user, partnerId, fetchAddons]);

  return {
    addons,
    loading,
    canEdit,
    fetchAddons,
    createAddon,
    updateAddon,
    deleteAddon,
    toggleStatus,
    createPickupZone,
    updatePickupZone,
    deletePickupZone,
  };
};
