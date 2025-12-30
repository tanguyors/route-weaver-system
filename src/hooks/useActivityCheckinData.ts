import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ValidationResult } from '@/components/checkin/ScanResult';

export interface ActivityCheckinEvent {
  id: string;
  ticket_id: string;
  result: 'success' | 'already_used' | 'invalid' | 'cancelled' | 'expired';
  scanned_at: string;
  ticket?: {
    booking?: {
      product?: { name: string };
      customer?: { name: string };
      booking_date: string;
      slot_time: string | null;
    };
  };
}

export const useActivityCheckinData = () => {
  const [recentScans, setRecentScans] = useState<ActivityCheckinEvent[]>([]);
  const [todayStats, setTodayStats] = useState({ total: 0, success: 0, failed: 0 });
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

  // Fetch recent scans
  const fetchRecentScans = async () => {
    if (!partnerId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('activity_checkin_events')
        .select(`
          id,
          ticket_id,
          result,
          scanned_at,
          ticket:activity_tickets(
            booking:activity_bookings(
              product:activity_products(name),
              customer,
              booking_date,
              slot_time
            )
          )
        `)
        .eq('partner_id', partnerId)
        .gte('scanned_at', `${today}T00:00:00`)
        .order('scanned_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Transform data to expected format
      const transformedData = (data || []).map(scan => ({
        ...scan,
        ticket: scan.ticket ? {
          booking: {
            product: scan.ticket.booking?.product,
            customer: scan.ticket.booking?.customer as { name: string } | undefined,
            booking_date: scan.ticket.booking?.booking_date || '',
            slot_time: scan.ticket.booking?.slot_time || null,
          }
        } : undefined
      })) as ActivityCheckinEvent[];

      setRecentScans(transformedData);

      // Calculate stats
      const successCount = data?.filter(s => s.result === 'success').length || 0;
      const failedCount = (data?.length || 0) - successCount;
      
      setTodayStats({
        total: data?.length || 0,
        success: successCount,
        failed: failedCount,
      });
    } catch (error) {
      console.error('Error fetching activity scans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) {
      fetchRecentScans();
    }
  }, [partnerId]);

  // Validate ticket
  const validateTicket = async (qrToken: string): Promise<ValidationResult> => {
    if (!user || !partnerId) {
      return {
        success: false,
        message: 'Not authenticated',
        reason: 'invalid',
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('validate-activity-ticket', {
        body: {
          qr_token: qrToken,
          user_id: user.id,
          partner_id: partnerId,
        },
      });

      if (error) throw error;

      // Refresh recent scans
      await fetchRecentScans();

      // Show toast for result
      if (data.success) {
        toast({
          title: '✓ Valid Ticket',
          description: data.ticket?.product_name || 'Participant checked in',
        });
      } else {
        toast({
          title: '✗ Invalid Ticket',
          description: data.message,
          variant: 'destructive',
        });
      }

      return data as ValidationResult;
    } catch (error: unknown) {
      console.error('Error validating activity ticket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return {
        success: false,
        message: errorMessage,
        reason: 'invalid',
      };
    }
  };

  return {
    recentScans,
    todayStats,
    loading,
    partnerId,
    validateTicket,
    refetch: fetchRecentScans,
  };
};
