import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface ReportsSummary {
  confirmed_bookings_count: number;
  draft_bookings_count: number;
  expired_bookings_count: number;
  cancelled_bookings_count: number;
  completed_bookings_count: number;
  total_bookings_count: number;
  conversion_rate: number;
  revenue_confirmed: number;
  revenue_completed: number;
  avg_order_value: number;
  total_qty_confirmed: number;
}

interface TimeseriesPoint {
  bucket_start: string;
  confirmed_count: number;
  expired_count: number;
  cancelled_count: number;
  revenue: number;
  qty: number;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  confirmed_count: number;
  revenue: number;
  qty: number;
}

export const useActivityReportsData = (
  dateFrom: string,
  dateTo: string,
  granularity: 'day' | 'week' | 'month' = 'day'
) => {
  const { partnerId } = useUserRole();
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ['activity-reports', 'summary', partnerId, dateFrom, dateTo],
    queryFn: async () => {
      if (!partnerId) throw new Error('No partner ID');
      
      const { data, error } = await supabase.rpc('get_activity_reports_summary', {
        _partner_id: partnerId,
        _date_from: dateFrom,
        _date_to: dateTo,
      });
      
      if (error) throw error;
      // RPC returns jsonb_build_object which is a single object
      return data as unknown as ReportsSummary;
    },
    enabled: !!partnerId && !!dateFrom && !!dateTo,
  });

  const timeseriesQuery = useQuery({
    queryKey: ['activity-reports', 'timeseries', partnerId, dateFrom, dateTo, granularity],
    queryFn: async () => {
      if (!partnerId) throw new Error('No partner ID');
      
      const { data, error } = await supabase.rpc('get_activity_reports_timeseries', {
        _partner_id: partnerId,
        _date_from: dateFrom,
        _date_to: dateTo,
        _granularity: granularity,
      });
      
      if (error) throw error;
      return (data as unknown as TimeseriesPoint[]) || [];
    },
    enabled: !!partnerId && !!dateFrom && !!dateTo,
  });

  const topProductsQuery = useQuery({
    queryKey: ['activity-reports', 'top-products', partnerId, dateFrom, dateTo],
    queryFn: async () => {
      if (!partnerId) throw new Error('No partner ID');
      
      const { data, error } = await supabase.rpc('get_activity_reports_top_products', {
        _partner_id: partnerId,
        _date_from: dateFrom,
        _date_to: dateTo,
        _limit: 10,
      });
      
      if (error) throw error;
      return (data as unknown as TopProduct[]) || [];
    },
    enabled: !!partnerId && !!dateFrom && !!dateTo,
  });

  const invalidateReports = () => {
    queryClient.invalidateQueries({ queryKey: ['activity-reports'], exact: false });
  };

  return {
    summary: summaryQuery.data,
    timeseries: timeseriesQuery.data || [],
    topProducts: topProductsQuery.data || [],
    isLoading: summaryQuery.isLoading || timeseriesQuery.isLoading || topProductsQuery.isLoading,
    error: summaryQuery.error || timeseriesQuery.error || topProductsQuery.error,
    refetch: () => {
      summaryQuery.refetch();
      timeseriesQuery.refetch();
      topProductsQuery.refetch();
    },
    invalidateReports,
  };
};
