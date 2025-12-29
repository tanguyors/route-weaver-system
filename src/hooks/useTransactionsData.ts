import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded' | 'partial';
export type PaymentMethod = 'card' | 'qris' | 'transfer' | 'cash' | 'payment_link';
export type PaymentProvider = 'stripe' | 'xendit' | 'midtrans' | 'manual';

export interface Payment {
  id: string;
  partner_id: string;
  booking_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: PaymentProvider;
  status: PaymentStatus;
  paid_at: string | null;
  provider_reference: string | null;
  created_at: string;
  booking?: {
    id: string;
    total_amount: number;
    customer?: {
      full_name: string;
      email: string | null;
    };
    departure?: {
      departure_date: string;
      trip?: { trip_name: string };
    };
  };
}

export interface CommissionRecord {
  id: string;
  partner_id: string;
  booking_id: string;
  gross_amount: number;
  platform_fee_percent: number;
  platform_fee_amount: number;
  payment_provider_fee_amount: number | null;
  partner_net_amount: number;
  currency: string;
  created_at: string;
  booking?: {
    id: string;
    customer?: { full_name: string };
    departure?: {
      departure_date: string;
      trip?: { trip_name: string };
    };
  };
}

export interface FinancialSummary {
  totalGross: number;
  totalCommission: number;
  totalProviderFees: number;
  totalNet: number;
  pendingBalance: number;
  availableBalance: number;
  totalWithdrawn: number;
  partnerCommissionRate: number;
}

export const useTransactionsData = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalGross: 0,
    totalCommission: 0,
    totalProviderFees: 0,
    totalNet: 0,
    pendingBalance: 0,
    availableBalance: 0,
    totalWithdrawn: 0,
    partnerCommissionRate: 7,
  });
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Get partner ID
  useEffect(() => {
    const fetchPartnerId = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('partner_users')
        .select('partner_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (data) {
        setPartnerId(data.partner_id);
      }
    };
    
    fetchPartnerId();
  }, [user]);

  // Fetch payments
  const fetchPayments = async () => {
    if (!partnerId) return;

    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          booking:bookings(
            id,
            total_amount,
            customer:customers(full_name, email),
            departure:departures(
              departure_date,
              trip:trips(trip_name)
            )
          )
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data as Payment[]);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
    }
  };

  // Fetch commissions
  const fetchCommissions = async () => {
    if (!partnerId) return;

    try {
      const { data, error } = await supabase
        .from('commission_records')
        .select(`
          *,
          booking:bookings(
            id,
            customer:customers(full_name),
            departure:departures(
              departure_date,
              trip:trips(trip_name)
            )
          )
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommissions(data as CommissionRecord[]);
    } catch (error: any) {
      console.error('Error fetching commissions:', error);
    }
  };

  // Calculate financial summary
  const calculateSummary = async () => {
    if (!partnerId) return;

    try {
      // Get partner's commission rate
      const { data: partnerData } = await supabase
        .from('partners')
        .select('commission_percent')
        .eq('id', partnerId)
        .single();

      const partnerCommissionRate = partnerData?.commission_percent || 7;

      // Get all commission records
      const { data: commissionData } = await supabase
        .from('commission_records')
        .select('gross_amount, platform_fee_amount, payment_provider_fee_amount, partner_net_amount')
        .eq('partner_id', partnerId);

      // Get withdrawal requests
      const { data: withdrawalData } = await supabase
        .from('withdrawal_requests')
        .select('amount, status')
        .eq('partner_id', partnerId);

      const totalGross = commissionData?.reduce((sum, r) => sum + Number(r.gross_amount), 0) || 0;
      const totalCommission = commissionData?.reduce((sum, r) => sum + Number(r.platform_fee_amount), 0) || 0;
      const totalProviderFees = commissionData?.reduce((sum, r) => sum + Number(r.payment_provider_fee_amount || 0), 0) || 0;
      const totalNet = commissionData?.reduce((sum, r) => sum + Number(r.partner_net_amount), 0) || 0;

      const approvedWithdrawals = withdrawalData?.filter(w => w.status === 'paid') || [];
      const pendingWithdrawals = withdrawalData?.filter(w => w.status === 'requested' || w.status === 'approved') || [];

      const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
      const pendingBalance = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
      const availableBalance = totalNet - totalWithdrawn - pendingBalance;

      setSummary({
        totalGross,
        totalCommission,
        totalProviderFees,
        totalNet,
        pendingBalance,
        availableBalance,
        totalWithdrawn,
        partnerCommissionRate,
      });
    } catch (error: any) {
      console.error('Error calculating summary:', error);
    }
  };

  // Fetch all data
  const fetchAll = async () => {
    if (!partnerId) return;
    
    setLoading(true);
    await Promise.all([fetchPayments(), fetchCommissions(), calculateSummary()]);
    setLoading(false);
  };

  useEffect(() => {
    if (partnerId) {
      fetchAll();
    }
  }, [partnerId]);

  // Process refund
  const processRefund = async (
    paymentId: string,
    refundAmount: number,
    reason: string
  ): Promise<boolean> => {
    if (!user || !partnerId) return false;

    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');

      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Update booking status
      if (payment.booking_id) {
        await supabase
          .from('bookings')
          .update({ status: 'refunded' })
          .eq('id', payment.booking_id);

        // Update ticket status
        await supabase
          .from('tickets')
          .update({ status: 'refunded' })
          .eq('booking_id', payment.booking_id);
      }

      // Log audit
      await supabase.from('audit_logs').insert({
        partner_id: partnerId,
        actor_user_id: user.id,
        action: 'refund',
        entity_type: 'payment',
        entity_id: paymentId,
        metadata: {
          refund_amount: refundAmount,
          reason,
          original_amount: payment.amount,
        },
      });

      toast({
        title: 'Refund Processed',
        description: `Refunded ${refundAmount} successfully`,
      });

      await fetchAll();
      return true;
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process refund',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Request withdrawal
  const requestWithdrawal = async (amount: number): Promise<boolean> => {
    if (!user || !partnerId) return false;

    if (amount > summary.availableBalance) {
      toast({
        title: 'Error',
        description: 'Insufficient balance for withdrawal',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase.from('withdrawal_requests').insert({
        partner_id: partnerId,
        requested_by_user_id: user.id,
        amount,
        currency: 'IDR',
        status: 'requested',
      });

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        partner_id: partnerId,
        actor_user_id: user.id,
        action: 'withdrawal_request',
        entity_type: 'withdrawal_request',
        metadata: { amount },
      });

      toast({
        title: 'Withdrawal Requested',
        description: `Your withdrawal request for IDR ${amount.toLocaleString()} has been submitted`,
      });

      await calculateSummary();
      return true;
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to request withdrawal',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    payments,
    commissions,
    summary,
    loading,
    partnerId,
    processRefund,
    requestWithdrawal,
    refetch: fetchAll,
  };
};
