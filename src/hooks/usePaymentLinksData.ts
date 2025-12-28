import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type PaymentLinkStatus = 'active' | 'paid' | 'expired' | 'cancelled';
export type PaymentProvider = 'stripe' | 'xendit' | 'midtrans' | 'manual';

export interface PaymentLink {
  id: string;
  partner_id: string;
  booking_id: string | null;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  status: PaymentLinkStatus;
  url: string | null;
  expires_at: string | null;
  created_at: string;
  booking?: {
    id: string;
    customer?: {
      full_name: string;
      email: string | null;
      phone: string | null;
    };
    departure?: {
      departure_date: string;
      departure_time: string;
      trip?: {
        trip_name: string;
      };
    };
  };
}

export interface CreatePaymentLinkData {
  amount: number;
  currency?: string;
  description?: string;
  booking_id?: string;
  expires_at?: string;
  provider: PaymentProvider;
}

export const usePaymentLinksData = () => {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Get partner ID for current user
  useEffect(() => {
    const fetchPartnerId = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
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

  // Fetch payment links
  const fetchPaymentLinks = async () => {
    if (!partnerId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select(`
          *,
          booking:bookings(
            id,
            customer:customers(full_name, email, phone),
            departure:departures(
              departure_date,
              departure_time,
              trip:trips(trip_name)
            )
          )
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Check and update expired links
      const now = new Date();
      const updatedLinks = (data || []).map(link => {
        if (link.status === 'active' && link.expires_at && new Date(link.expires_at) < now) {
          return { ...link, status: 'expired' as PaymentLinkStatus };
        }
        return link;
      });
      
      setPaymentLinks(updatedLinks as PaymentLink[]);
    } catch (error: any) {
      console.error('Error fetching payment links:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment links',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) {
      fetchPaymentLinks();
    }
  }, [partnerId]);

  // Create payment link
  const createPaymentLink = async (data: CreatePaymentLinkData): Promise<PaymentLink | null> => {
    if (!partnerId || !user) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    try {
      // Generate a secure token for the payment link URL
      const token = crypto.randomUUID() + '-' + Date.now().toString(36);
      const baseUrl = window.location.origin;
      const paymentUrl = `${baseUrl}/pay/${token}`;

      const { data: paymentLink, error } = await supabase
        .from('payment_links')
        .insert({
          partner_id: partnerId,
          booking_id: data.booking_id || null,
          amount: data.amount,
          currency: data.currency || 'IDR',
          provider: data.provider,
          status: 'active',
          url: paymentUrl,
          expires_at: data.expires_at || null,
        })
        .select(`
          *,
          booking:bookings(
            id,
            customer:customers(full_name, email, phone),
            departure:departures(
              departure_date,
              departure_time,
              trip:trips(trip_name)
            )
          )
        `)
        .single();

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        partner_id: partnerId,
        actor_user_id: user.id,
        action: 'create',
        entity_type: 'payment_link',
        entity_id: paymentLink.id,
        metadata: {
          amount: data.amount,
          currency: data.currency || 'IDR',
          booking_id: data.booking_id,
          provider: data.provider,
        },
      });

      setPaymentLinks(prev => [paymentLink as PaymentLink, ...prev]);
      
      toast({
        title: 'Payment Link Created',
        description: 'The payment link has been created successfully',
      });

      return paymentLink as PaymentLink;
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment link',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Cancel payment link
  const cancelPaymentLink = async (linkId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('payment_links')
        .update({ status: 'cancelled' })
        .eq('id', linkId);

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        partner_id: partnerId,
        actor_user_id: user.id,
        action: 'cancel',
        entity_type: 'payment_link',
        entity_id: linkId,
      });

      setPaymentLinks(prev =>
        prev.map(link =>
          link.id === linkId ? { ...link, status: 'cancelled' as PaymentLinkStatus } : link
        )
      );

      toast({
        title: 'Payment Link Cancelled',
        description: 'The payment link has been cancelled',
      });

      return true;
    } catch (error: any) {
      console.error('Error cancelling payment link:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel payment link',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Copy payment link URL
  const copyPaymentLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Copied',
        description: 'Payment link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  return {
    paymentLinks,
    loading,
    partnerId,
    createPaymentLink,
    cancelPaymentLink,
    copyPaymentLink,
    refetch: fetchPaymentLinks,
  };
};
