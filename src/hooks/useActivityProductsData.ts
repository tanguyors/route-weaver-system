import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type ActivityProductRow = Database['public']['Tables']['activity_products']['Row'];
type ActivityProductInsert = Database['public']['Tables']['activity_products']['Insert'];
type ActivityProductUpdate = Database['public']['Tables']['activity_products']['Update'];

export interface ActivityProduct extends ActivityProductRow {
  category?: {
    id: string;
    name: string;
  } | null;
  pricing?: Array<{
    id: string;
    tier_name: string;
    price: number;
    min_age: number | null;
    max_age: number | null;
    status: string;
  }>;
  time_slots?: Array<{
    id: string;
    slot_time: string;
    capacity: number;
    status: string;
  }>;
  rental_options?: Array<{
    id: string;
    duration_unit: string;
    duration_value: number;
    price: number;
    status: string;
  }>;
  images?: Array<{
    id: string;
    image_url: string;
    display_order: number;
  }>;
}

export interface ProductFilters {
  category_id?: string;
  product_type?: 'activity' | 'time_slot' | 'rental';
  status?: 'draft' | 'active' | 'inactive';
  search?: string;
}

export const useActivityProductsData = (filters?: ProductFilters) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch partner ID
  const { data: partnerId } = useQuery({
    queryKey: ['partner-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.rpc('get_user_partner_id', { _user_id: user.id });
      if (error) throw error;
      return data as string | null;
    },
    enabled: !!user?.id,
  });

  // Fetch products with related data
  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-products', partnerId, filters],
    queryFn: async () => {
      if (!partnerId) return [];
      
      let query = supabase
        .from('activity_products')
        .select(`
          *,
          category:activity_categories(id, name),
          pricing:activity_pricing(id, tier_name, price, min_age, max_age, status),
          time_slots:activity_time_slots(id, slot_time, capacity, status),
          rental_options:activity_rental_options(id, duration_unit, duration_value, price, status),
          images:activity_product_images(id, image_url, display_order)
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters?.product_type) {
        query = query.eq('product_type', filters.product_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ActivityProduct[];
    },
    enabled: !!partnerId,
  });

  // Create product
  const createMutation = useMutation({
    mutationFn: async (product: Omit<ActivityProductInsert, 'partner_id'>) => {
      if (!partnerId) throw new Error('No partner ID');
      const { data, error } = await supabase
        .from('activity_products')
        .insert({ ...product, partner_id: partnerId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-products'] });
      toast.success('Product created');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create product');
    },
  });

  // Update product
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & ActivityProductUpdate) => {
      const { data, error } = await supabase
        .from('activity_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-products'] });
      toast.success('Product updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update product');
    },
  });

  // Delete product (soft delete by setting status to inactive)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('activity_products')
        .update({ status: 'inactive' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-products'] });
      toast.success('Product deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete product');
    },
  });

  // Duplicate product
  const duplicateMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!partnerId) throw new Error('No partner ID');
      
      // Fetch the original product
      const { data: original, error: fetchError } = await supabase
        .from('activity_products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Create a copy
      const { id, created_at, updated_at, ...rest } = original;
      const { data: newProduct, error: createError } = await supabase
        .from('activity_products')
        .insert({
          ...rest,
          name: `${original.name} (Copy)`,
          status: 'draft',
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Copy pricing
      const { data: pricing } = await supabase
        .from('activity_pricing')
        .select('*')
        .eq('product_id', productId);
      
      if (pricing && pricing.length > 0) {
        await supabase.from('activity_pricing').insert(
          pricing.map(p => ({
            product_id: newProduct.id,
            partner_id: partnerId,
            tier_name: p.tier_name,
            price: p.price,
            min_age: p.min_age,
            max_age: p.max_age,
            status: p.status,
          }))
        );
      }
      
      // Copy time slots if applicable
      if (original.product_type === 'time_slot') {
        const { data: slots } = await supabase
          .from('activity_time_slots')
          .select('*')
          .eq('product_id', productId);
        
        if (slots && slots.length > 0) {
          await supabase.from('activity_time_slots').insert(
            slots.map(s => ({
              product_id: newProduct.id,
              partner_id: partnerId,
              slot_time: s.slot_time,
              capacity: s.capacity,
              status: s.status,
            }))
          );
        }
      }
      
      // Copy rental options if applicable
      if (original.product_type === 'rental') {
        const { data: options } = await supabase
          .from('activity_rental_options')
          .select('*')
          .eq('product_id', productId);
        
        if (options && options.length > 0) {
          await supabase.from('activity_rental_options').insert(
            options.map(o => ({
              product_id: newProduct.id,
              partner_id: partnerId,
              duration_unit: o.duration_unit,
              duration_value: o.duration_value,
              price: o.price,
              status: o.status,
            }))
          );
        }
      }
      
      return newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-products'] });
      toast.success('Product duplicated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to duplicate product');
    },
  });

  // Toggle product status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'active' | 'inactive' }) => {
      const { error } = await supabase
        .from('activity_products')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-products'] });
      toast.success('Product status updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update status');
    },
  });

  return {
    products: products || [],
    isLoading,
    error,
    partnerId,
    refetch,
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutate,
    duplicateProduct: duplicateMutation.mutate,
    toggleStatus: toggleStatusMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
  };
};
