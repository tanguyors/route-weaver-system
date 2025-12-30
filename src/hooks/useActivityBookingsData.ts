import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityBookingListItem {
  id: string;
  partner_id: string;
  product_id: string;
  product_name: string;
  booking_date: string;
  slot_time: string | null;
  status: 'draft' | 'confirmed' | 'expired' | 'cancelled' | 'completed';
  total_qty: number;
  subtotal_amount: number;
  created_at: string;
  expires_at: string;
  customer: { name?: string; email?: string; phone?: string } | null;
}

interface ListBookingsParams {
  partnerId?: string;
  productId?: string;
  status?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export const useActivityBookingsData = (params: ListBookingsParams = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading, error, refetch } = useQuery({
    queryKey: ['activity-bookings', params],
    queryFn: async (): Promise<ActivityBookingListItem[]> => {
      const { data, error } = await supabase.rpc('list_activity_bookings', {
        _partner_id: params.partnerId || null,
        _product_id: params.productId || null,
        _status: params.status || null,
        _q: params.q || null,
        _date_from: params.dateFrom || null,
        _date_to: params.dateTo || null,
        _limit: params.limit || 50,
        _offset: params.offset || 0,
      });

      if (error) throw error;
      return (data as unknown as ActivityBookingListItem[]) || [];
    },
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase.rpc('cancel_activity_booking', {
        _booking_id: bookingId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['activity-booking'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase.rpc('complete_activity_booking', {
        _booking_id: bookingId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['activity-booking'] });
    },
  });

  return {
    bookings,
    isLoading,
    error,
    refetch,
    cancelBooking: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    completeBooking: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
  };
};
