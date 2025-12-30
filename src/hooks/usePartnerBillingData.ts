import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BillingDetails {
  company_name: string;
  address: string;
  city: string;
  country: string;
  tax_id: string;
  billing_email: string;
  billing_phone: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
}

const defaultBillingDetails: BillingDetails = {
  company_name: '',
  address: '',
  city: '',
  country: 'Indonesia',
  tax_id: '',
  billing_email: '',
  billing_phone: '',
  bank_name: '',
  bank_account: '',
  bank_holder: '',
};

export const usePartnerBillingData = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['partner-billing-details'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_partner_billing_details');
      if (error) throw error;
      return data as unknown as BillingDetails;
    },
  });
  const updateMutation = useMutation({
    mutationFn: async (details: Partial<BillingDetails>) => {
      const { data, error } = await supabase.rpc('update_partner_billing_details', {
        _company_name: details.company_name,
        _address: details.address,
        _city: details.city,
        _country: details.country,
        _tax_id: details.tax_id,
        _billing_email: details.billing_email,
        _billing_phone: details.billing_phone,
        _bank_name: details.bank_name,
        _bank_account: details.bank_account,
        _bank_holder: details.bank_holder,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-billing-details'], exact: false });
    },
  });

  return {
    billingDetails: data ?? defaultBillingDetails,
    isLoading,
    error,
    updateBillingDetails: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
