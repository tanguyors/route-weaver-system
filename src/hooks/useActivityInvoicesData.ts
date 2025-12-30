import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ActivityInvoiceStatus = 'draft' | 'issued' | 'void';

export interface ActivityInvoice {
  id: string;
  invoice_number: string;
  partner_id: string;
  partner_name: string;
  payout_id: string;
  period_start: string;
  period_end: string;
  issue_date: string;
  currency: string;
  gross_revenue: number;
  commission_amount: number;
  net_amount: number;
  status: ActivityInvoiceStatus;
  payout_status: string;
  created_at: string;
}

export interface ActivityInvoiceDetail extends ActivityInvoice {
  billing_details: {
    company_name?: string;
    address?: string;
    city?: string;
    country?: string;
    tax_id?: string;
    email?: string;
    phone?: string;
    bank_name?: string;
    bank_account?: string;
    bank_holder?: string;
  };
  due_date: string | null;
  payout_paid_at: string | null;
  booking_count: number;
  total_qty: number;
  product_breakdown: Array<{
    product_id: string;
    product_name: string;
    booking_count: number;
    total_qty: number;
    revenue: number;
  }>;
  bookings: Array<{
    id: string;
    product_name: string;
    booking_date: string;
    slot_time: string | null;
    total_qty: number;
    subtotal_amount: number;
    status: string;
  }>;
}

interface ListInvoicesParams {
  partnerId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export const useActivityInvoicesData = (params: ListInvoicesParams = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading, error, refetch } = useQuery({
    queryKey: ['activity-invoices', params],
    queryFn: async (): Promise<ActivityInvoice[]> => {
      const { data, error } = await supabase.rpc('list_activity_partner_invoices', {
        _partner_id: params.partnerId || null,
        _status: params.status || null,
        _date_from: params.dateFrom || null,
        _date_to: params.dateTo || null,
        _limit: params.limit || 50,
        _offset: params.offset || 0,
      });

      if (error) throw error;
      return (data as unknown as ActivityInvoice[]) || [];
    },
    enabled: !!user,
  });

  const createFromPayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const { data, error } = await supabase.rpc('create_activity_invoice_from_payout', {
        _payout_id: payoutId,
      });
      if (error) throw error;
      return data as { success: boolean; invoice_id?: string; invoice_number?: string; already_exists?: boolean };
    },
    onSuccess: () => {
      invalidateInvoices();
    },
  });

  const voidInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase.rpc('void_activity_invoice', {
        _invoice_id: invoiceId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateInvoices();
    },
  });

  const invalidateInvoices = () => {
    queryClient.invalidateQueries({ queryKey: ['activity-invoices'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['activity-invoice-detail'], exact: false });
  };

  return {
    invoices,
    isLoading,
    error,
    refetch,
    createFromPayout: createFromPayoutMutation.mutateAsync,
    isCreating: createFromPayoutMutation.isPending,
    voidInvoice: voidInvoiceMutation.mutateAsync,
    isVoiding: voidInvoiceMutation.isPending,
    invalidateInvoices,
  };
};

export const useActivityInvoiceDetail = (invoiceId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activity-invoice-detail', invoiceId],
    queryFn: async (): Promise<ActivityInvoiceDetail | null> => {
      if (!invoiceId) return null;
      const { data, error } = await supabase.rpc('get_activity_invoice_detail', {
        _invoice_id: invoiceId,
      });
      if (error) throw error;
      return data as unknown as ActivityInvoiceDetail;
    },
    enabled: !!user && !!invoiceId,
  });
};

// Export functions for CSV download
export const exportInvoicesCsv = async (dateFrom: string, dateTo: string, partnerId?: string) => {
  const { data, error } = await supabase.rpc('export_activity_invoices_csv', {
    _date_from: dateFrom,
    _date_to: dateTo,
    _partner_id: partnerId || null,
  });
  if (error) throw error;
  return data as Array<{
    invoice_number: string;
    partner_name: string;
    period_start: string;
    period_end: string;
    issue_date: string;
    currency: string;
    gross_revenue: number;
    commission_amount: number;
    net_amount: number;
    status: string;
    paid_at: string | null;
  }>;
};

export const exportBookingLinesCsv = async (dateFrom: string, dateTo: string, partnerId?: string) => {
  const { data, error } = await supabase.rpc('export_activity_bookings_lines_csv', {
    _date_from: dateFrom,
    _date_to: dateTo,
    _partner_id: partnerId || null,
  });
  if (error) throw error;
  return data as Array<{
    booking_id: string;
    partner_name: string;
    product_name: string;
    booking_date: string;
    slot_time: string | null;
    total_qty: number;
    subtotal_amount: number;
    status: string;
    payout_id: string | null;
    invoice_number: string | null;
  }>;
};
