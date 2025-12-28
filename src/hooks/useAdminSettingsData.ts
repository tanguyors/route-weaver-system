import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

export interface PlatformSettings {
  commission_rate: { percent: number };
  payment_providers: { enabled: string[] };
  currencies: { default: string; enabled: string[] };
}

export const useAdminSettingsData = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings>({
    commission_rate: { percent: 7 },
    payment_providers: { enabled: ['manual', 'stripe', 'xendit', 'midtrans'] },
    currencies: { default: 'IDR', enabled: ['IDR', 'USD', 'EUR'] },
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');

      if (error) throw error;

      if (data) {
        const settingsMap: PlatformSettings = {
          commission_rate: { percent: 7 },
          payment_providers: { enabled: ['manual'] },
          currencies: { default: 'IDR', enabled: ['IDR'] },
        };

        data.forEach((row) => {
          const value = row.setting_value as Record<string, unknown>;
          if (row.setting_key === 'commission_rate') {
            settingsMap.commission_rate = value as PlatformSettings['commission_rate'];
          } else if (row.setting_key === 'payment_providers') {
            settingsMap.payment_providers = value as PlatformSettings['payment_providers'];
          } else if (row.setting_key === 'currencies') {
            settingsMap.currencies = value as PlatformSettings['currencies'];
          }
        });

        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const updateSetting = async (key: string, value: Record<string, unknown>): Promise<boolean> => {
    if (!user) return false;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({ setting_value: value as Json })
        .eq('setting_key', key);

      if (error) throw error;

      // Update local state
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));

      toast({
        title: 'Settings Saved',
        description: 'Platform settings updated successfully',
      });

      return true;
    } catch (error: unknown) {
      console.error('Error updating platform setting:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update settings',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateCommissionRate = (percent: number) => {
    return updateSetting('commission_rate', { percent });
  };

  const updatePaymentProviders = (enabled: string[]) => {
    return updateSetting('payment_providers', { enabled });
  };

  const updateCurrencies = (defaultCurrency: string, enabled: string[]) => {
    return updateSetting('currencies', { default: defaultCurrency, enabled });
  };

  return {
    loading,
    saving,
    settings,
    updateCommissionRate,
    updatePaymentProviders,
    updateCurrencies,
    refetch: fetchSettings,
  };
};
