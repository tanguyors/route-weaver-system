import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export type AccomDiscountCategory =
  | 'booking_fixed'
  | 'booking_percent'
  | 'per_night_fixed'
  | 'per_night_percent'
  | 'early_bird'
  | 'last_minute'
  | 'long_stay';

export interface AccommodationDiscount {
  id: string;
  partner_id: string;
  code: string | null;
  type: 'promo_code' | 'automatic';
  category: AccomDiscountCategory;
  discount_value: number;
  discount_value_type: 'percent' | 'fixed';
  book_start_date: string | null;
  book_end_date: string | null;
  checkin_start_date: string | null;
  checkin_end_date: string | null;
  minimum_spend: number;
  min_nights: number | null;
  early_bird_days: number | null;
  last_minute_days: number | null;
  applicable_accommodation_ids: string[] | null;
  individual_use_only: boolean;
  usage_limit: number | null;
  limit_per_customer: number;
  usage_count: number;
  total_discounted_amount: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AccomDiscountUsage {
  id: string;
  discount_id: string;
  booking_id: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  discounted_amount: number;
  partner_id: string;
  used_at: string;
}

export interface AccomDiscountFormData {
  code?: string;
  type: 'promo_code' | 'automatic';
  category: AccomDiscountCategory;
  discount_value: number;
  discount_value_type: 'percent' | 'fixed';
  book_start_date?: string;
  book_end_date?: string;
  checkin_start_date?: string;
  checkin_end_date?: string;
  minimum_spend?: number;
  min_nights?: number;
  early_bird_days?: number;
  last_minute_days?: number;
  applicable_accommodation_ids?: string[];
  individual_use_only?: boolean;
  usage_limit?: number;
  limit_per_customer?: number;
  status?: 'active' | 'inactive';
}

export const ACCOM_DISCOUNT_CATEGORIES: { value: AccomDiscountCategory; label: string; description: string }[] = [
  { value: 'booking_fixed', label: 'Booking Discount (Fixed)', description: 'Fixed amount discount on total booking' },
  { value: 'booking_percent', label: 'Booking Discount (%)', description: 'Percentage discount on total booking' },
  { value: 'per_night_fixed', label: 'Per Night (Fixed)', description: 'Fixed amount discount per night' },
  { value: 'per_night_percent', label: 'Per Night (%)', description: 'Percentage discount per night' },
  { value: 'early_bird', label: 'Early Bird', description: 'Discount for booking X days before check-in' },
  { value: 'last_minute', label: 'Last Minute', description: 'Discount for booking close to check-in' },
  { value: 'long_stay', label: 'Long Stay', description: 'Discount for stays of X nights minimum' },
];

export const useAccommodationDiscountsData = () => {
  const { user } = useAuth();
  const { partnerId, role } = useUserRole();
  const [discounts, setDiscounts] = useState<AccommodationDiscount[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';
  const canEdit = role === 'admin' || role === 'partner_owner';

  const fetchDiscounts = useCallback(async () => {
    if (!user) return;

    let query = supabase
      .from('accommodation_discounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin && partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setDiscounts(data as unknown as AccommodationDiscount[]);
    }
    setLoading(false);
  }, [user, isAdmin, partnerId]);

  const fetchUsage = useCallback(async (discountId?: string) => {
    if (!user) return [];

    let query = supabase
      .from('accommodation_discount_usage')
      .select('*')
      .order('used_at', { ascending: false });

    if (!isAdmin && partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    if (discountId) {
      query = query.eq('discount_id', discountId);
    }

    const { data, error } = await query;

    if (!error && data) {
      return data as unknown as AccomDiscountUsage[];
    }
    return [];
  }, [user, isAdmin, partnerId]);

  const createDiscount = async (formData: AccomDiscountFormData) => {
    if (!partnerId && !isAdmin) return { error: new Error('No partner assigned') };

    const insertData = {
      partner_id: partnerId,
      code: formData.code || null,
      type: formData.type,
      category: formData.category,
      discount_value: formData.discount_value,
      discount_value_type: formData.discount_value_type,
      book_start_date: formData.book_start_date || null,
      book_end_date: formData.book_end_date || null,
      checkin_start_date: formData.checkin_start_date || null,
      checkin_end_date: formData.checkin_end_date || null,
      minimum_spend: formData.minimum_spend || 0,
      min_nights: formData.min_nights || null,
      early_bird_days: formData.early_bird_days || null,
      last_minute_days: formData.last_minute_days || null,
      applicable_accommodation_ids: formData.applicable_accommodation_ids || [],
      individual_use_only: formData.individual_use_only || false,
      usage_limit: formData.usage_limit || null,
      limit_per_customer: formData.limit_per_customer || 1,
      status: formData.status || 'active',
    };

    const { error } = await supabase.from('accommodation_discounts').insert(insertData as any);

    if (!error) {
      await fetchDiscounts();
      await supabase.from('audit_logs').insert({
        entity_type: 'accommodation_discount',
        action: 'create',
        partner_id: partnerId,
        actor_user_id: user?.id,
        metadata: { code: formData.code, category: formData.category },
      });
    }

    return { error };
  };

  const updateDiscount = async (id: string, formData: Partial<AccomDiscountFormData>) => {
    const existingDiscount = discounts.find(d => d.id === id);

    const { error } = await supabase
      .from('accommodation_discounts')
      .update(formData as any)
      .eq('id', id);

    if (!error) {
      await fetchDiscounts();
      await supabase.from('audit_logs').insert({
        entity_type: 'accommodation_discount',
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
      .from('accommodation_discounts')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchDiscounts();
      await supabase.from('audit_logs').insert({
        entity_type: 'accommodation_discount',
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
