import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ActivityPayoutStatus = 'pending' | 'approved' | 'paid';

export interface ActivityPayout {
  id: string;
  partner_id: string;
  partner_name: string;
  period_start: string;
  period_end: string;
  gross_revenue: number;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  currency: string;
  status: ActivityPayoutStatus;
  paid_at: string | null;
  created_at: string;
}

export interface ActivityPayoutDetail extends ActivityPayout {
  booking_count: number;
  total_qty: number;
  bookings: Array<{
    id: string;
    product_name: string;
    booking_date: string;
    total_qty: number;
    subtotal_amount: number;
    status: string;
  }>;
  product_breakdown: Array<{
    product_id: string;
    product_name: string;
    booking_count: number;
    total_qty: number;
    revenue: number;
  }>;
}

interface ListPayoutsParams {
  partnerId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export const useActivityPayoutsData = (params: ListPayoutsParams = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: payouts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['activity-payouts', params],
    queryFn: async (): Promise<ActivityPayout[]> => {
      const { data, error } = await supabase.rpc('list_activity_partner_payouts', {
        _partner_id: params.partnerId || null,
        _status: params.status || null,
        _date_from: params.dateFrom || null,
        _date_to: params.dateTo || null,
        _limit: params.limit || 50,
        _offset: params.offset || 0,
      });

      if (error) throw error;
      return (data as unknown as ActivityPayout[]) || [];
    },
    enabled: !!user,
  });

  const generateMutation = useMutation({
    mutationFn: async ({ partnerId, periodStart, periodEnd }: { partnerId: string; periodStart: string; periodEnd: string }) => {
      const { data, error } = await supabase.rpc('generate_activity_partner_payout', {
        _partner_id: partnerId,
        _period_start: periodStart,
        _period_end: periodEnd,
      });
      if (error) throw error;
      return data as { success: boolean; payout_id?: string; error?: string; net_amount?: number; gross_revenue?: number; commission_amount?: number };
    },
    onSuccess: () => {
      invalidatePayouts();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const { data, error } = await supabase.rpc('approve_activity_partner_payout', {
        _payout_id: payoutId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidatePayouts();
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const { data, error } = await supabase.rpc('mark_activity_partner_payout_paid', {
        _payout_id: payoutId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidatePayouts();
    },
  });

  const invalidatePayouts = () => {
    queryClient.invalidateQueries({ queryKey: ['activity-payouts'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['activity-payout-detail'], exact: false });
  };

  return {
    payouts,
    isLoading,
    error,
    refetch,
    generatePayout: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    approvePayout: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    markPaid: markPaidMutation.mutateAsync,
    isMarkingPaid: markPaidMutation.isPending,
    invalidatePayouts,
  };
};

export const useActivityPayoutDetail = (payoutId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activity-payout-detail', payoutId],
    queryFn: async (): Promise<ActivityPayoutDetail | null> => {
      if (!payoutId) return null;
      const { data, error } = await supabase.rpc('get_activity_payout_detail', {
        _payout_id: payoutId,
      });
      if (error) throw error;
      return data as unknown as ActivityPayoutDetail;
    },
    enabled: !!user && !!payoutId,
  });
};
