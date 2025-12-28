import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface ThemeConfig {
  primary_color?: string;
  logo_url?: string;
  show_child_pax?: boolean;
  default_route_id?: string;
}

export interface Widget {
  id: string;
  partner_id: string;
  public_widget_key: string;
  widget_type: 'fastboat';
  status: 'active' | 'inactive';
  allowed_domains: string[] | null;
  theme_config: ThemeConfig | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateWidgetData {
  status?: 'active' | 'inactive';
  allowed_domains?: string[];
  theme_config?: ThemeConfig;
}

export const useWidgetConfigData = () => {
  const [widget, setWidget] = useState<Widget | null>(null);
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

  // Fetch widget
  const fetchWidget = async () => {
    if (!partnerId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('widgets')
        .select('*')
        .eq('partner_id', partnerId)
        .maybeSingle();

      if (error) throw error;
      setWidget(data as Widget);
    } catch (error: any) {
      console.error('Error fetching widget:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) {
      fetchWidget();
    }
  }, [partnerId]);

  // Create widget if not exists
  const createWidget = async (): Promise<Widget | null> => {
    if (!partnerId) return null;

    try {
      const { data, error } = await supabase
        .from('widgets')
        .insert({
          partner_id: partnerId,
          widget_type: 'fastboat',
          status: 'active',
          theme_config: {
            primary_color: '#0ea5e9',
            show_child_pax: true,
          },
        })
        .select()
        .single();

      if (error) throw error;

      setWidget(data as Widget);
      toast({
        title: 'Widget Created',
        description: 'Your booking widget has been created',
      });

      return data as Widget;
    } catch (error: any) {
      console.error('Error creating widget:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create widget',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update widget
  const updateWidget = async (updates: UpdateWidgetData): Promise<boolean> => {
    if (!widget) return false;

    try {
      // Build update object with only defined values
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.status !== undefined) {
        updateData.status = updates.status;
      }
      if (updates.allowed_domains !== undefined) {
        updateData.allowed_domains = updates.allowed_domains;
      }
      if (updates.theme_config !== undefined) {
        updateData.theme_config = updates.theme_config;
      }

      const { error } = await supabase
        .from('widgets')
        .update(updateData)
        .eq('id', widget.id);

      if (error) throw error;

      setWidget(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: 'Widget Updated',
        description: 'Your widget settings have been saved',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating widget:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update widget',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Add domain
  const addDomain = async (domain: string): Promise<boolean> => {
    if (!widget) return false;

    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const currentDomains = widget.allowed_domains || [];

    if (currentDomains.includes(cleanDomain)) {
      toast({
        title: 'Domain exists',
        description: 'This domain is already in the list',
        variant: 'destructive',
      });
      return false;
    }

    return updateWidget({
      allowed_domains: [...currentDomains, cleanDomain],
    });
  };

  // Remove domain
  const removeDomain = async (domain: string): Promise<boolean> => {
    if (!widget) return false;

    const currentDomains = widget.allowed_domains || [];
    return updateWidget({
      allowed_domains: currentDomains.filter(d => d !== domain),
    });
  };

  // Update theme
  const updateTheme = async (theme: Partial<ThemeConfig>): Promise<boolean> => {
    if (!widget) return false;

    return updateWidget({
      theme_config: {
        ...(widget.theme_config || {}),
        ...theme,
      },
    });
  };

  // Toggle status
  const toggleStatus = async (): Promise<boolean> => {
    if (!widget) return false;

    return updateWidget({
      status: widget.status === 'active' ? 'inactive' : 'active',
    });
  };

  // Copy widget key
  const copyWidgetKey = async () => {
    if (!widget) return;

    try {
      await navigator.clipboard.writeText(widget.public_widget_key);
      toast({
        title: 'Copied',
        description: 'Widget key copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy',
        variant: 'destructive',
      });
    }
  };

  // Get embed code
  const getEmbedCode = (height = '600px') => {
    if (!widget) return '';

    const baseUrl = window.location.origin;
    return `<iframe 
  src="${baseUrl}/book?key=${widget.public_widget_key}" 
  width="100%" 
  height="${height}" 
  frameborder="0" 
  style="border: none; border-radius: 8px;"
  allow="payment"
></iframe>`;
  };

  // Get direct link
  const getDirectLink = () => {
    if (!widget) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/book?key=${widget.public_widget_key}`;
  };

  return {
    widget,
    loading,
    partnerId,
    createWidget,
    updateWidget,
    addDomain,
    removeDomain,
    updateTheme,
    toggleStatus,
    copyWidgetKey,
    getEmbedCode,
    getDirectLink,
    refetch: fetchWidget,
  };
};
