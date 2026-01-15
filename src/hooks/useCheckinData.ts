import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ValidationResult } from '@/components/checkin/ScanResult';

export interface CheckinEvent {
  id: string;
  ticket_id: string;
  result: 'success' | 'already_used' | 'invalid' | 'cancelled';
  scanned_at: string;
  ticket?: {
    booking?: {
      customer?: { full_name: string };
      departure?: {
        departure_date: string;
        departure_time: string;
        trip?: { trip_name: string };
      };
    };
  };
}

export const useCheckinData = () => {
  const [recentScans, setRecentScans] = useState<CheckinEvent[]>([]);
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
        .from('checkin_events')
        .select(`
          id,
          ticket_id,
          result,
          scanned_at,
          ticket:tickets(
            booking:bookings(
              customer:customers(full_name),
              departure:departures!bookings_departure_id_fkey(
                departure_date,
                departure_time,
                trip:trips(trip_name)
              )
            )
          )
        `)
        .eq('partner_id', partnerId)
        .gte('scanned_at', `${today}T00:00:00`)
        .order('scanned_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setRecentScans(data as unknown as CheckinEvent[]);

      // Calculate stats
      const successCount = data?.filter(s => s.result === 'success').length || 0;
      const failedCount = (data?.length || 0) - successCount;
      
      setTodayStats({
        total: data?.length || 0,
        success: successCount,
        failed: failedCount,
      });
    } catch (error: any) {
      console.error('Error fetching scans:', error);
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
      const { data, error } = await supabase.functions.invoke('validate-ticket', {
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
          description: data.ticket?.booking?.customer?.full_name || 'Passenger checked in',
        });
      } else {
        toast({
          title: '✗ Invalid Ticket',
          description: data.message,
          variant: 'destructive',
        });
      }

      return data as ValidationResult;
    } catch (error: any) {
      console.error('Error validating ticket:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to validate ticket',
        variant: 'destructive',
      });
      return {
        success: false,
        message: error.message || 'Validation failed',
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
