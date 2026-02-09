import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';

export interface AccommodationPayment {
  id: string;
  partner_id: string;
  booking_id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paid_at: string;
  notes: string | null;
  created_at: string;
  booking?: {
    guest_name: string;
    total_amount: number;
    checkin_date: string;
    checkout_date: string;
    accommodation?: { name: string };
  };
}

export interface AccommodationCommission {
  id: string;
  partner_id: string;
  booking_id: string;
  gross_amount: number;
  platform_fee_percent: number;
  platform_fee_amount: number;
  partner_net_amount: number;
  currency: string;
  created_at: string;
  booking?: {
    guest_name: string;
    checkin_date: string;
    accommodation?: { name: string };
  };
}

export interface AccommodationFinancialSummary {
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  availableBalance: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  partnerCommissionRate: number;
}

export const useAccommodationTransactionsData = () => {
  const [payments, setPayments] = useState<AccommodationPayment[]>([]);
  const [commissions, setCommissions] = useState<AccommodationCommission[]>([]);
  const [summary, setSummary] = useState<AccommodationFinancialSummary>({
    totalGross: 0,
    totalCommission: 0,
    totalNet: 0,
    availableBalance: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: 0,
    partnerCommissionRate: 7,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { partnerId } = useUserRole();

  const fetchPayments = useCallback(async () => {
    if (!partnerId) return;
    try {
      const { data, error } = await supabase
        .from('accommodation_payments')
        .select(`
          *,
          booking:accommodation_bookings(
            guest_name,
            total_amount,
            checkin_date,
            checkout_date,
            accommodation:accommodations(name)
          )
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments((data || []) as unknown as AccommodationPayment[]);
    } catch (error: any) {
      console.error('Error fetching accommodation payments:', error);
    }
  }, [partnerId]);

  const fetchCommissions = useCallback(async () => {
    if (!partnerId) return;
    try {
      const { data, error } = await supabase
        .from('accommodation_commission_records')
        .select(`
          *,
          booking:accommodation_bookings(
            guest_name,
            checkin_date,
            accommodation:accommodations(name)
          )
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommissions((data || []) as unknown as AccommodationCommission[]);
    } catch (error: any) {
      console.error('Error fetching accommodation commissions:', error);
    }
  }, [partnerId]);

  const calculateSummary = useCallback(async () => {
    if (!partnerId) return;
    try {
      const { data: partnerData } = await supabase
        .from('partners')
        .select('commission_percent')
        .eq('id', partnerId)
        .single();

      const partnerCommissionRate = partnerData?.commission_percent || 7;

      const { data: commissionData } = await supabase
        .from('accommodation_commission_records')
        .select('gross_amount, platform_fee_amount, partner_net_amount')
        .eq('partner_id', partnerId);

      const { data: withdrawalData } = await supabase
        .from('withdrawal_requests')
        .select('amount, status')
        .eq('partner_id', partnerId);

      let totalGross = 0;
      let totalCommission = 0;
      let totalNet = 0;

      commissionData?.forEach(record => {
        totalGross += Number(record.gross_amount);
        totalCommission += Number(record.platform_fee_amount);
        totalNet += Number(record.partner_net_amount);
      });

      const paidWithdrawals = withdrawalData?.filter(w => w.status === 'paid') || [];
      const pendingWithdrawalsList = withdrawalData?.filter(w => w.status === 'requested' || w.status === 'approved') || [];

      const totalWithdrawn = paidWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
      const pendingWithdrawals = pendingWithdrawalsList.reduce((sum, w) => sum + Number(w.amount), 0);
      const availableBalance = totalNet - totalWithdrawn - pendingWithdrawals;

      setSummary({
        totalGross,
        totalCommission,
        totalNet,
        availableBalance,
        totalWithdrawn,
        pendingWithdrawals,
        partnerCommissionRate,
      });
    } catch (error: any) {
      console.error('Error calculating accommodation summary:', error);
    }
  }, [partnerId]);

  const fetchAll = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    await Promise.all([fetchPayments(), fetchCommissions(), calculateSummary()]);
    setLoading(false);
  }, [partnerId, fetchPayments, fetchCommissions, calculateSummary]);

  useEffect(() => {
    if (partnerId) fetchAll();
  }, [partnerId, fetchAll]);

  const recordPayment = async (
    bookingId: string,
    amount: number,
    method: string,
    currency: string,
    notes?: string
  ): Promise<boolean> => {
    if (!user || !partnerId) return false;
    try {
      // Insert payment
      const { error: paymentError } = await supabase
        .from('accommodation_payments')
        .insert({
          partner_id: partnerId,
          booking_id: bookingId,
          amount,
          currency,
          method,
          status: 'paid',
          notes: notes || null,
        } as any);

      if (paymentError) throw paymentError;

      // Get commission rate
      const { data: partnerData } = await supabase
        .from('partners')
        .select('commission_percent')
        .eq('id', partnerId)
        .single();

      const commissionRate = partnerData?.commission_percent || 7;
      const feeAmount = Math.round((amount * commissionRate) / 100);
      const netAmount = amount - feeAmount;

      // Insert commission record
      const { error: commError } = await supabase
        .from('accommodation_commission_records')
        .insert({
          partner_id: partnerId,
          booking_id: bookingId,
          gross_amount: amount,
          platform_fee_percent: commissionRate,
          platform_fee_amount: feeAmount,
          partner_net_amount: netAmount,
          currency,
        } as any);

      if (commError) throw commError;

      toast({ title: 'Payment recorded', description: `${currency} ${amount.toLocaleString()} recorded successfully` });
      await fetchAll();
      return true;
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const requestWithdrawal = async (amount: number): Promise<boolean> => {
    if (!user || !partnerId) return false;

    if (amount > summary.availableBalance) {
      toast({ title: 'Error', description: 'Insufficient balance for withdrawal', variant: 'destructive' });
      return false;
    }

    try {
      const { error } = await supabase.from('withdrawal_requests').insert({
        partner_id: partnerId,
        requested_by_user_id: user.id,
        amount,
        currency: 'LKR',
        status: 'requested',
      });

      if (error) throw error;

      toast({
        title: 'Withdrawal Requested',
        description: `Your withdrawal request for LKR ${amount.toLocaleString()} has been submitted`,
      });

      await calculateSummary();
      return true;
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  return {
    payments,
    commissions,
    summary,
    loading,
    partnerId,
    recordPayment,
    requestWithdrawal,
    refetch: fetchAll,
  };
};
