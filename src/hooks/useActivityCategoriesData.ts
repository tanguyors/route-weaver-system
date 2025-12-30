import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ActivityCategory {
  id: string;
  partner_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export type ActivityCategoryInsert = Omit<ActivityCategory, 'id' | 'created_at' | 'updated_at'>;
export type ActivityCategoryUpdate = Partial<Omit<ActivityCategory, 'id' | 'partner_id' | 'created_at' | 'updated_at'>>;

export const useActivityCategoriesData = () => {
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

  // Fetch categories
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['activity-categories', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data, error } = await supabase
        .from('activity_categories')
        .select('*')
        .eq('partner_id', partnerId)
        .order('name');
      if (error) throw error;
      return data as ActivityCategory[];
    },
    enabled: !!partnerId,
  });

  // Create category
  const createMutation = useMutation({
    mutationFn: async (category: Omit<ActivityCategoryInsert, 'partner_id'>) => {
      if (!partnerId) throw new Error('No partner ID');
      const { data, error } = await supabase
        .from('activity_categories')
        .insert({ ...category, partner_id: partnerId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-categories'] });
      toast.success('Category created');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create category');
    },
  });

  // Update category
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & ActivityCategoryUpdate) => {
      const { data, error } = await supabase
        .from('activity_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-categories'] });
      toast.success('Category updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update category');
    },
  });

  // Delete category
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('activity_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-categories'] });
      toast.success('Category deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete category');
    },
  });

  return {
    categories: categories || [],
    isLoading,
    error,
    partnerId,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
