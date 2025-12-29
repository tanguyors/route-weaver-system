import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export type DiscountCategory = 
  | 'cart_fixed'
  | 'cart_percent'
  | 'schedule_fixed'
  | 'schedule_percent'
  | 'free_ticket'
  | 'per_product'
  | 'value_added'
  | 'last_minute';

export interface DiscountRule {
  id: string;
  partner_id: string;
  code: string | null;
  type: 'promo_code' | 'automatic';
  category: DiscountCategory;
  discount_value: number;
  discount_value_type: 'percent' | 'fixed';
  book_start_date: string | null;
  book_end_date: string | null;
  checkin_start_date: string | null;
  checkin_end_date: string | null;
  start_date: string;
  end_date: string;
  minimum_spend: number;
  min_pax: number | null;
  individual_use_only: boolean;
  usage_limit: number | null;
  limit_per_customer: number;
  usage_count: number;
  total_discounted_amount: number;
  applicable_trip_ids: string[] | null;
  applicable_route_ids: string[] | null;
  applicable_schedule_ids: string[] | null;
  free_ticket_min_pax: number;
  free_ticket_pax_type: string;
  last_minute_hours: number;
  value_added_addon_name: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface DiscountUsage {
  id: string;
  discount_rule_id: string;
  booking_id: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  discounted_amount: number;
  used_at: string;
  partner_id: string;
}

export interface DiscountFormData {
  code?: string;
  type: 'promo_code' | 'automatic';
  category: DiscountCategory;
  discount_value: number;
  discount_value_type: 'percent' | 'fixed';
  book_start_date?: string;
  book_end_date?: string;
  checkin_start_date?: string;
  checkin_end_date?: string;
  minimum_spend?: number;
  min_pax?: number;
  individual_use_only?: boolean;
  usage_limit?: number;
  limit_per_customer?: number;
  applicable_trip_ids?: string[];
  applicable_route_ids?: string[];
  applicable_schedule_ids?: string[];
  free_ticket_min_pax?: number;
  free_ticket_pax_type?: string;
  last_minute_hours?: number;
  value_added_addon_name?: string;
  status?: 'active' | 'inactive';
}

export const DISCOUNT_CATEGORIES: { value: DiscountCategory; label: string; description: string }[] = [
  { value: 'cart_fixed', label: 'Cart Discount (Fixed)', description: 'Fixed amount discount on total cart' },
  { value: 'cart_percent', label: 'Cart Discount (%)', description: 'Percentage discount on total cart' },
  { value: 'schedule_fixed', label: 'Schedule Discount (Fixed)', description: 'Fixed discount on selected schedules' },
  { value: 'schedule_percent', label: 'Schedule Discount (%)', description: 'Percentage discount on selected schedules' },
  { value: 'free_ticket', label: 'Free Ticket', description: 'X paid = 1 free ticket' },
  { value: 'per_product', label: 'Per Product', description: 'Discount on specific routes/trips' },
  { value: 'value_added', label: 'Value Added', description: 'Free or discounted add-on' },
  { value: 'last_minute', label: 'Last Minute Deal', description: 'Discount for bookings close to departure' },
];

export const useDiscountsData = () => {
  const { user } = useAuth();
  const { partnerId, role } = useUserRole();
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [usage, setUsage] = useState<DiscountUsage[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';
  const canEdit = role === 'admin' || role === 'partner_owner';

  const fetchDiscounts = useCallback(async () => {
    if (!user) return;
    
    let query = supabase
      .from('discount_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin && partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data, error } = await query;
    
    if (!error && data) {
      setDiscounts(data as unknown as DiscountRule[]);
    }
    setLoading(false);
  }, [user, isAdmin, partnerId]);

  const fetchUsage = useCallback(async (discountRuleId?: string) => {
    if (!user) return [];
    
    let query = supabase
      .from('discount_usage')
      .select('*')
      .order('used_at', { ascending: false });

    if (!isAdmin && partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    if (discountRuleId) {
      query = query.eq('discount_rule_id', discountRuleId);
    }

    const { data, error } = await query;
    
    if (!error && data) {
      setUsage(data as DiscountUsage[]);
      return data as DiscountUsage[];
    }
    return [];
  }, [user, isAdmin, partnerId]);

  const createDiscount = async (formData: DiscountFormData) => {
    if (!partnerId && !isAdmin) return { error: new Error('No partner assigned') };

    const insertData = {
      partner_id: partnerId,
      code: formData.code || null,
      type: formData.type,
      category: formData.category,
      discount_value: formData.discount_value,
      discount_value_type: formData.discount_value_type,
      start_date: formData.book_start_date || new Date().toISOString().split('T')[0],
      end_date: formData.book_end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      book_start_date: formData.book_start_date || null,
      book_end_date: formData.book_end_date || null,
      checkin_start_date: formData.checkin_start_date || null,
      checkin_end_date: formData.checkin_end_date || null,
      minimum_spend: formData.minimum_spend || 0,
      min_pax: formData.min_pax || null,
      individual_use_only: formData.individual_use_only || false,
      usage_limit: formData.usage_limit || null,
      limit_per_customer: formData.limit_per_customer || 1,
      applicable_trip_ids: formData.applicable_trip_ids || null,
      applicable_route_ids: formData.applicable_route_ids || null,
      applicable_schedule_ids: formData.applicable_schedule_ids || null,
      free_ticket_min_pax: formData.free_ticket_min_pax || 2,
      free_ticket_pax_type: formData.free_ticket_pax_type || 'any',
      last_minute_hours: formData.last_minute_hours || 24,
      value_added_addon_name: formData.value_added_addon_name || null,
      status: formData.status || 'active',
    };

    const { error } = await supabase.from('discount_rules').insert(insertData);

    if (!error) {
      await fetchDiscounts();
      // Log audit
      await supabase.from('audit_logs').insert({
        entity_type: 'discount_rule',
        action: 'create',
        partner_id: partnerId,
        actor_user_id: user?.id,
        metadata: { code: formData.code, category: formData.category },
      });
    }

    return { error };
  };

  const updateDiscount = async (id: string, formData: Partial<DiscountFormData>) => {
    const existingDiscount = discounts.find(d => d.id === id);
    
    const updateData: Record<string, unknown> = { ...formData };
    
    // Handle date fields
    if (formData.book_start_date !== undefined) {
      updateData.start_date = formData.book_start_date;
    }
    if (formData.book_end_date !== undefined) {
      updateData.end_date = formData.book_end_date;
    }

    const { error } = await supabase
      .from('discount_rules')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      await fetchDiscounts();
      // Log audit
      await supabase.from('audit_logs').insert({
        entity_type: 'discount_rule',
        action: 'update',
        entity_id: id,
        partner_id: existingDiscount?.partner_id,
        actor_user_id: user?.id,
        metadata: { changes: formData },
      });
    }

    return { error };
  };

  const deleteDiscount = async (id: string) => {
    const existingDiscount = discounts.find(d => d.id === id);
    
    const { error } = await supabase
      .from('discount_rules')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchDiscounts();
      // Log audit
      await supabase.from('audit_logs').insert({
        entity_type: 'discount_rule',
        action: 'delete',
        entity_id: id,
        partner_id: existingDiscount?.partner_id,
        actor_user_id: user?.id,
        metadata: { code: existingDiscount?.code },
      });
    }

    return { error };
  };

  const toggleStatus = async (id: string) => {
    const discount = discounts.find(d => d.id === id);
    if (!discount) return { error: new Error('Discount not found') };

    const newStatus = discount.status === 'active' ? 'inactive' : 'active';
    return updateDiscount(id, { status: newStatus });
  };

  useEffect(() => {
    if (user) {
      fetchDiscounts();
    }
  }, [user, partnerId, fetchDiscounts]);

  return {
    discounts,
    usage,
    loading,
    canEdit,
    fetchDiscounts,
    fetchUsage,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    toggleStatus,
  };
};
