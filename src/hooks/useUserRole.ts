import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'partner_owner' | 'partner_staff' | null;

interface UserRoleData {
  role: AppRole;
  partnerId: string | null;
  partnerRole: 'PARTNER_OWNER' | 'PARTNER_STAFF' | null;
  loading: boolean;
}

export const useUserRole = (): UserRoleData => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerRole, setPartnerRole] = useState<'PARTNER_OWNER' | 'PARTNER_STAFF' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setPartnerId(null);
        setPartnerRole(null);
        setLoading(false);
        return;
      }

      try {
        // Check if user is admin
        const { data: adminRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        const isAdmin = !!adminRole;

        // Check if user belongs to a partner (do this even for admins)
        const { data: partnerUser } = await supabase
          .from('partner_users')
          .select('partner_id, role')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (partnerUser) {
          setPartnerId(partnerUser.partner_id);
          setPartnerRole(partnerUser.role as 'PARTNER_OWNER' | 'PARTNER_STAFF');
        }

        // Set role - admin takes priority over partner role
        if (isAdmin) {
          setRole('admin');
        } else if (partnerUser) {
          setRole(partnerUser.role === 'PARTNER_OWNER' ? 'partner_owner' : 'partner_staff');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { role, partnerId, partnerRole, loading };
};
