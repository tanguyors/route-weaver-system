import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DayAvailability {
  date: string;
  status: 'open' | 'closed';
  capacity?: number;
  note?: string | null;
  slots?: SlotAvailability[];
}

export interface SlotAvailability {
  slot_time: string;
  status: 'open' | 'closed';
  capacity: number;
}

export interface BlackoutRange {
  id: string;
  product_id: string;
  partner_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
}

export const useAvailabilityData = (productId: string | undefined) => {
  const queryClient = useQueryClient();

  // Fetch availability for a date range
  const fetchAvailability = async (startDate: string, endDate: string): Promise<DayAvailability[]> => {
    if (!productId) return [];

    const { data, error } = await supabase.rpc('get_product_availability', {
      _product_id: productId,
      _start_date: startDate,
      _end_date: endDate,
    });

    if (error) throw error;
    return (data as unknown as DayAvailability[]) || [];
  };

  // Fetch blackout ranges for a product
  const { data: blackoutRanges = [], isLoading: isLoadingBlackouts } = useQuery({
    queryKey: ['blackout-ranges', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('activity_blackout_ranges')
        .select('*')
        .eq('product_id', productId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as BlackoutRange[];
    },
    enabled: !!productId,
  });

  // Set blackout range
  const setBlackoutMutation = useMutation({
    mutationFn: async ({ startDate, endDate, reason }: { startDate: string; endDate: string; reason?: string }) => {
      if (!productId) throw new Error('Product ID required');

      const { data, error } = await supabase.rpc('set_blackout_range', {
        _product_id: productId,
        _start_date: startDate,
        _end_date: endDate,
        _reason: reason || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blackout-ranges', productId] });
      queryClient.invalidateQueries({ queryKey: ['availability', productId], exact: false });
      toast.success('Blackout range added');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add blackout range');
    },
  });

  // Delete blackout range
  const deleteBlackoutMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('delete_blackout_range', { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blackout-ranges', productId] });
      queryClient.invalidateQueries({ queryKey: ['availability', productId], exact: false });
      toast.success('Blackout range removed');
    },
    onError: () => {
      toast.error('Failed to remove blackout range');
    },
  });

  // Upsert day availability
  const upsertDayMutation = useMutation({
    mutationFn: async ({ 
      date, 
      status, 
      capacityOverride, 
      note 
    }: { 
      date: string; 
      status: 'open' | 'closed'; 
      capacityOverride?: number | null; 
      note?: string | null;
    }) => {
      if (!productId) throw new Error('Product ID required');

      const { data, error } = await supabase.rpc('upsert_availability_day', {
        _product_id: productId,
        _date: date,
        _status: status,
        _capacity_override: capacityOverride ?? null,
        _note: note ?? null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', productId], exact: false });
      toast.success('Day updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update day');
    },
  });

  // Upsert slot availability
  const upsertSlotMutation = useMutation({
    mutationFn: async ({ 
      date, 
      slotTime, 
      status, 
      capacityOverride 
    }: { 
      date: string; 
      slotTime: string; 
      status: 'open' | 'closed'; 
      capacityOverride?: number | null;
    }) => {
      if (!productId) throw new Error('Product ID required');

      const { data, error } = await supabase.rpc('upsert_availability_slot', {
        _product_id: productId,
        _date: date,
        _slot_time: slotTime,
        _status: status,
        _capacity_override: capacityOverride ?? null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', productId], exact: false });
      toast.success('Slot updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update slot');
    },
  });

  return {
    fetchAvailability,
    blackoutRanges,
    isLoadingBlackouts,
    setBlackout: setBlackoutMutation.mutateAsync,
    isSettingBlackout: setBlackoutMutation.isPending,
    deleteBlackout: deleteBlackoutMutation.mutateAsync,
    isDeletingBlackout: deleteBlackoutMutation.isPending,
    upsertDay: upsertDayMutation.mutateAsync,
    isUpsertingDay: upsertDayMutation.isPending,
    upsertSlot: upsertSlotMutation.mutateAsync,
    isUpsertingSlot: upsertSlotMutation.isPending,
  };
};
