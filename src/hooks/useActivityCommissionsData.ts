import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ActivitySettings {
  default_commission_rate: number;
}

export interface PartnerProductCommission {
  id: string;
  product_id: string;
  product_name: string;
  commission_rate: number;
}

export const useActivityCommissionsData = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get global settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['activity-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_activity_settings');
      if (error) throw error;
      return data as unknown as ActivitySettings;
    },
    enabled: !!user,
  });

  // Update global default commission
  const updateDefaultCommissionMutation = useMutation({
    mutationFn: async (rate: number) => {
      const { data, error } = await supabase.rpc('update_activity_settings_default_commission', {
        _rate: rate,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-settings'] });
      toast.success('Default commission rate updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Set partner commission override
  const setPartnerCommissionMutation = useMutation({
    mutationFn: async ({ partnerId, rate }: { partnerId: string; rate: number | null }) => {
      const { data, error } = await supabase.rpc('set_partner_commission_rate', {
        _partner_id: partnerId,
        _rate: rate,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast.success('Partner commission rate updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Upsert partner+product commission
  const upsertProductCommissionMutation = useMutation({
    mutationFn: async ({ partnerId, productId, rate }: { partnerId: string; productId: string; rate: number }) => {
      const { data, error } = await supabase.rpc('upsert_partner_product_commission', {
        _partner_id: partnerId,
        _product_id: productId,
        _rate: rate,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['partner-product-commissions', variables.partnerId] });
      toast.success('Product commission override saved');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete partner+product commission
  const deleteProductCommissionMutation = useMutation({
    mutationFn: async ({ id, partnerId }: { id: string; partnerId: string }) => {
      const { data, error } = await supabase.rpc('delete_partner_product_commission', {
        _id: id,
      });
      if (error) throw error;
      return { data, partnerId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['partner-product-commissions', result.partnerId] });
      toast.success('Product commission override deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Invalidate all commission-related queries
  const invalidateCommissionRules = () => {
    queryClient.invalidateQueries({ queryKey: ['activity-settings'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['partners'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['partner-product-commissions'], exact: false });
  };

  return {
    settings,
    isLoadingSettings,
    updateDefaultCommission: updateDefaultCommissionMutation.mutateAsync,
    isUpdatingDefault: updateDefaultCommissionMutation.isPending,
    setPartnerCommission: setPartnerCommissionMutation.mutateAsync,
    isSettingPartner: setPartnerCommissionMutation.isPending,
    upsertProductCommission: upsertProductCommissionMutation.mutateAsync,
    isUpsertingProduct: upsertProductCommissionMutation.isPending,
    deleteProductCommission: deleteProductCommissionMutation.mutateAsync,
    isDeletingProduct: deleteProductCommissionMutation.isPending,
    invalidateCommissionRules,
  };
};

// Separate hook for partner product commissions list
export const usePartnerProductCommissions = (partnerId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['partner-product-commissions', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data, error } = await supabase.rpc('list_partner_product_commissions', {
        _partner_id: partnerId,
      });
      if (error) throw error;
      return (data as unknown as PartnerProductCommission[]) || [];
    },
    enabled: !!user && !!partnerId,
  });
};
