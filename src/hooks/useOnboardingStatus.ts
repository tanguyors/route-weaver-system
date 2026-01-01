import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OnboardingStatus {
  business: boolean;
  payments: boolean;
  cancellation: boolean;
  tickets: boolean;
  terms: boolean;
  notifications: boolean;
}

export const useOnboardingStatus = () => {
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [status, setStatus] = useState<OnboardingStatus>({
    business: false,
    payments: false,
    cancellation: false,
    tickets: false,
    terms: false,
    notifications: false,
  });
  const { user } = useAuth();

  const isComplete = Object.values(status).every(Boolean);

  const completedCount = Object.values(status).filter(Boolean).length;
  const totalSections = Object.keys(status).length;

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get partner ID
        const { data: partnerUser } = await supabase
          .from('partner_users')
          .select('partner_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (!partnerUser) {
          setLoading(false);
          return;
        }

        setPartnerId(partnerUser.partner_id);

        // Get onboarding status from partner_settings
        const { data: settings } = await supabase
          .from('partner_settings')
          .select(`
            onboarding_business_completed,
            onboarding_payments_completed,
            onboarding_cancellation_completed,
            onboarding_tickets_completed,
            onboarding_terms_completed,
            onboarding_notifications_completed
          `)
          .eq('partner_id', partnerUser.partner_id)
          .maybeSingle();

        if (settings) {
          setStatus({
            business: settings.onboarding_business_completed ?? false,
            payments: settings.onboarding_payments_completed ?? false,
            cancellation: settings.onboarding_cancellation_completed ?? false,
            tickets: settings.onboarding_tickets_completed ?? false,
            terms: settings.onboarding_terms_completed ?? false,
            notifications: settings.onboarding_notifications_completed ?? false,
          });
        }
      } catch (error) {
        console.error('Error fetching onboarding status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user]);

  const markSectionComplete = async (section: keyof OnboardingStatus) => {
    if (!partnerId) return false;

    const columnName = `onboarding_${section}_completed`;

    try {
      const { error } = await supabase
        .from('partner_settings')
        .update({ [columnName]: true })
        .eq('partner_id', partnerId);

      if (error) throw error;

      setStatus(prev => ({ ...prev, [section]: true }));
      return true;
    } catch (error) {
      console.error('Error marking section complete:', error);
      return false;
    }
  };

  const refetch = async () => {
    if (!partnerId) return;

    try {
      const { data: settings } = await supabase
        .from('partner_settings')
        .select(`
          onboarding_business_completed,
          onboarding_payments_completed,
          onboarding_cancellation_completed,
          onboarding_tickets_completed,
          onboarding_terms_completed,
          onboarding_notifications_completed
        `)
        .eq('partner_id', partnerId)
        .maybeSingle();

      if (settings) {
        setStatus({
          business: settings.onboarding_business_completed ?? false,
          payments: settings.onboarding_payments_completed ?? false,
          cancellation: settings.onboarding_cancellation_completed ?? false,
          tickets: settings.onboarding_tickets_completed ?? false,
          terms: settings.onboarding_notifications_completed ?? false,
          notifications: settings.onboarding_notifications_completed ?? false,
        });
      }
    } catch (error) {
      console.error('Error refetching onboarding status:', error);
    }
  };

  return {
    loading,
    status,
    isComplete,
    completedCount,
    totalSections,
    markSectionComplete,
    refetch,
  };
};
