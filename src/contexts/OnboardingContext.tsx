import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

interface OnboardingContextType {
  loading: boolean;
  partnerId: string | null;
  status: OnboardingStatus;
  isComplete: boolean;
  completedCount: number;
  totalSections: number;
  markSectionComplete: (section: keyof OnboardingStatus) => void;
  refetch: () => Promise<void>;
}

const defaultStatus: OnboardingStatus = {
  business: false,
  payments: false,
  cancellation: false,
  tickets: false,
  terms: false,
  notifications: false,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [status, setStatus] = useState<OnboardingStatus>(defaultStatus);
  const { user } = useAuth();

  const isComplete = Object.values(status).every(Boolean);
  const completedCount = Object.values(status).filter(Boolean).length;
  const totalSections = Object.keys(status).length;

  const fetchStatus = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Optimistically update a section as complete (updates UI immediately)
  const markSectionComplete = useCallback((section: keyof OnboardingStatus) => {
    setStatus(prev => ({ ...prev, [section]: true }));
  }, []);

  const refetch = useCallback(async () => {
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
          terms: settings.onboarding_terms_completed ?? false,
          notifications: settings.onboarding_notifications_completed ?? false,
        });
      }
    } catch (error) {
      console.error('Error refetching onboarding status:', error);
    }
  }, [partnerId]);

  return (
    <OnboardingContext.Provider
      value={{
        loading,
        partnerId,
        status,
        isComplete,
        completedCount,
        totalSections,
        markSectionComplete,
        refetch,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
