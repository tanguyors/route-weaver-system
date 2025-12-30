import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';

export type ModuleType = 'boat' | 'activity';
export type ModuleStatus = 'active' | 'pending' | 'disabled';

export interface PartnerModule {
  id: string;
  partner_id: string;
  module_type: ModuleType;
  status: ModuleStatus;
  created_at: string;
  updated_at: string;
}

interface PartnerModulesData {
  modules: PartnerModule[];
  activeModules: ModuleType[];
  loading: boolean;
  hasModule: (type: ModuleType) => boolean;
  hasActiveModule: (type: ModuleType) => boolean;
}

export const usePartnerModules = (): PartnerModulesData => {
  const { user } = useAuth();
  const { partnerId } = useUserRole();
  const [modules, setModules] = useState<PartnerModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      if (!user || !partnerId) {
        setModules([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('partner_modules')
          .select('*')
          .eq('partner_id', partnerId);

        if (error) throw error;
        
        // Cast the data to ensure proper typing
        const typedModules = (data || []).map(m => ({
          ...m,
          module_type: m.module_type as ModuleType,
          status: m.status as ModuleStatus
        }));
        
        setModules(typedModules);
      } catch (error) {
        console.error('Error fetching partner modules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [user, partnerId]);

  const activeModules = modules
    .filter(m => m.status === 'active')
    .map(m => m.module_type);

  const hasModule = (type: ModuleType) => 
    modules.some(m => m.module_type === type);

  const hasActiveModule = (type: ModuleType) => 
    modules.some(m => m.module_type === type && m.status === 'active');

  return { modules, activeModules, loading, hasModule, hasActiveModule };
};
