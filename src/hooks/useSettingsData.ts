import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface CancellationTier {
  days_min: number;
  days_max: number;
  refund_percent: number;
}

export interface PartnerSettings {
  id: string;
  partner_id: string;
  // Payment
  payment_methods_enabled: string[];
  default_payment_provider: string;
  currency: string;
  deposit_enabled: boolean;
  min_deposit_percent: number;
  // Cancellation
  cancellation_deadline_hours: number;
  cancellation_fee_type: string;
  cancellation_fee_value: number;
  refund_enabled: boolean;
  no_show_policy: string;
  // Ticket
  ticket_validity_hours: number;
  checkin_requires_full_payment: boolean;
  qr_override_allowed: boolean;
  auto_expire_tickets: boolean;
  // Notifications
  email_booking_confirmation: boolean;
  email_payment_received: boolean;
  email_cancellation: boolean;
  whatsapp_booking_confirmation: boolean;
  whatsapp_payment_link: boolean;
  // Terms & Conditions
  terms_booking: string | null;
  terms_voucher: string | null;
  cancellation_policy_enabled: boolean;
  cancellation_policy_tiers: CancellationTier[] | null;
  tax_service_percent: number;
  max_booking_advance_days: number;
}

export interface PartnerInfo {
  id: string;
  name: string;
  legal_name: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_name: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  tax_id: string | null;
  website: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  bank_swift_code: string | null;
  status: 'active' | 'pending' | 'suspended';
}

export interface StaffMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  profile?: {
    email: string | null;
    full_name: string | null;
  };
}

export const useSettingsData = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PartnerSettings | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Get partner ID
  useEffect(() => {
    const fetchPartnerId = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('partner_users')
        .select('partner_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (data) {
        setPartnerId(data.partner_id);
      } else {
        // User is not associated with a partner (e.g., admin)
        setLoading(false);
      }
    };

    fetchPartnerId();
  }, [user]);

  // Fetch all data
  const fetchData = async () => {
    if (!partnerId) return;

    setLoading(true);
    try {
      // Fetch partner info
      const { data: partnerData } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (partnerData) {
        setPartnerInfo(partnerData as PartnerInfo);
      }

      // Fetch or create settings
      let { data: settingsData } = await supabase
        .from('partner_settings')
        .select('*')
        .eq('partner_id', partnerId)
        .maybeSingle();

      if (!settingsData) {
        // Create default settings
        const { data: newSettings } = await supabase
          .from('partner_settings')
          .insert({ partner_id: partnerId })
          .select()
          .single();
        settingsData = newSettings;
      }

      if (settingsData) {
        // Convert Json types to proper TypeScript types
        const parsedSettings = {
          ...settingsData,
          cancellation_policy_tiers: settingsData.cancellation_policy_tiers as unknown as CancellationTier[] | null,
        };
        setSettings(parsedSettings as PartnerSettings);
      }

      // Fetch staff members
      const { data: staffData } = await supabase
        .from('partner_users')
        .select(`
          id,
          user_id,
          role,
          status,
          created_at,
          profile:profiles!partner_users_user_id_fkey(email, full_name)
        `)
        .eq('partner_id', partnerId);

      if (staffData) {
        setStaff(staffData as unknown as StaffMember[]);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) {
      fetchData();
    }
  }, [partnerId]);

  // Update partner info
  const updatePartnerInfo = async (updates: Partial<PartnerInfo>): Promise<boolean> => {
    if (!partnerId || !user) return false;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update(updates)
        .eq('id', partnerId);

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        partner_id: partnerId,
        actor_user_id: user.id,
        action: 'update_partner_info',
        entity_type: 'partner',
        entity_id: partnerId,
        metadata: { updates },
      });

      setPartnerInfo((prev) => (prev ? { ...prev, ...updates } : null));

      toast({
        title: 'Settings Saved',
        description: 'Business information updated successfully',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating partner info:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Update settings
  const updateSettings = async (updates: Partial<PartnerSettings>): Promise<boolean> => {
    if (!partnerId || !user || !settings) return false;

    setSaving(true);
    try {
      // Convert CancellationTier[] to Json for Supabase
      const supabaseUpdates = {
        ...updates,
        cancellation_policy_tiers: updates.cancellation_policy_tiers 
          ? JSON.parse(JSON.stringify(updates.cancellation_policy_tiers))
          : undefined,
      };

      const { error } = await supabase
        .from('partner_settings')
        .update(supabaseUpdates)
        .eq('partner_id', partnerId);

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert([{
        partner_id: partnerId,
        actor_user_id: user.id,
        action: 'update_settings',
        entity_type: 'partner_settings',
        entity_id: settings.id,
        metadata: { updates: supabaseUpdates },
      }]);

      setSettings((prev) => (prev ? { ...prev, ...updates } : null));

      toast({
        title: 'Settings Saved',
        description: 'Settings updated successfully',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Toggle staff status
  const toggleStaffStatus = async (staffId: string, newStatus: 'active' | 'inactive'): Promise<boolean> => {
    if (!user || !partnerId) return false;

    try {
      const { error } = await supabase
        .from('partner_users')
        .update({ status: newStatus })
        .eq('id', staffId);

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        partner_id: partnerId,
        actor_user_id: user.id,
        action: newStatus === 'active' ? 'activate_staff' : 'deactivate_staff',
        entity_type: 'partner_user',
        entity_id: staffId,
      });

      setStaff((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, status: newStatus } : s))
      );

      toast({
        title: newStatus === 'active' ? 'Staff Activated' : 'Staff Deactivated',
        description: 'Staff status updated successfully',
      });

      return true;
    } catch (error: any) {
      console.error('Error toggling staff status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update staff status',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    loading,
    saving,
    partnerId,
    settings,
    partnerInfo,
    staff,
    updatePartnerInfo,
    updateSettings,
    toggleStaffStatus,
    refetch: fetchData,
  };
};
