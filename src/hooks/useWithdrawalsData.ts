import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type WithdrawalStatus = 'requested' | 'approved' | 'paid' | 'rejected';

export interface WithdrawalRequest {
  id: string;
  partner_id: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  requested_at: string;
  processed_at: string | null;
  requested_by_user_id: string;
  processed_by_admin_user_id: string | null;
  partner?: {
    name: string;
  };
}

export const useWithdrawalsData = (isAdmin: boolean = false) => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Get partner ID (for non-admin users)
  useEffect(() => {
    const fetchPartnerId = async () => {
      if (!user || isAdmin) return;

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
  }, [user, isAdmin]);

  // Fetch withdrawals
  const fetchWithdrawals = async () => {
    if (!user) return;
    if (!isAdmin && !partnerId) return;

    setLoading(true);
    try {
      let query = supabase
        .from('withdrawal_requests')
        .select(`
          *,
          partner:partners(name)
        `)
        .order('requested_at', { ascending: false });

      if (!isAdmin && partnerId) {
        query = query.eq('partner_id', partnerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWithdrawals(data as WithdrawalRequest[]);
    } catch (error: any) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load withdrawals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin || partnerId) {
      fetchWithdrawals();
    }
  }, [partnerId, isAdmin, user]);

  // Admin: Approve withdrawal
  const approveWithdrawal = async (withdrawalId: string): Promise<boolean> => {
    if (!user || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'approved',
          processed_by_admin_user_id: user.id,
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        actor_user_id: user.id,
        action: 'withdrawal_approved',
        entity_type: 'withdrawal_request',
        entity_id: withdrawalId,
      });

      toast({
        title: 'Withdrawal Approved',
        description: 'The withdrawal request has been approved',
      });

      await fetchWithdrawals();
      return true;
    } catch (error: any) {
      console.error('Error approving withdrawal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve withdrawal',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Admin: Reject withdrawal
  const rejectWithdrawal = async (withdrawalId: string): Promise<boolean> => {
    if (!user || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by_admin_user_id: user.id,
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        actor_user_id: user.id,
        action: 'withdrawal_rejected',
        entity_type: 'withdrawal_request',
        entity_id: withdrawalId,
      });

      toast({
        title: 'Withdrawal Rejected',
        description: 'The withdrawal request has been rejected',
      });

      await fetchWithdrawals();
      return true;
    } catch (error: any) {
      console.error('Error rejecting withdrawal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject withdrawal',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Admin: Mark as paid
  const markAsPaid = async (withdrawalId: string): Promise<boolean> => {
    if (!user || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'paid',
          processed_at: new Date().toISOString(),
          processed_by_admin_user_id: user.id,
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        actor_user_id: user.id,
        action: 'withdrawal_paid',
        entity_type: 'withdrawal_request',
        entity_id: withdrawalId,
      });

      toast({
        title: 'Withdrawal Marked as Paid',
        description: 'The withdrawal has been marked as paid',
      });

      await fetchWithdrawals();
      return true;
    } catch (error: any) {
      console.error('Error marking withdrawal as paid:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark withdrawal as paid',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    withdrawals,
    loading,
    partnerId,
    approveWithdrawal,
    rejectWithdrawal,
    markAsPaid,
    refetch: fetchWithdrawals,
  };
};
