import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface AccommodationThemeConfig {
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  button_text_color?: string;
  border_color?: string;
  logo_url?: string;
}

export interface AccommodationWidget {
  id: string;
  partner_id: string;
  public_widget_key: string;
  widget_type: 'accommodation';
  status: 'active' | 'inactive';
  allowed_domains: string[] | null;
  theme_config: AccommodationThemeConfig | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateAccommodationWidgetData {
  status?: 'active' | 'inactive';
  allowed_domains?: string[];
  theme_config?: AccommodationThemeConfig;
}

export const useAccommodationWidgetConfigData = () => {
  const [widget, setWidget] = useState<AccommodationWidget | null>(null);
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
      if (data) setPartnerId(data.partner_id);
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
        .eq('widget_type', 'accommodation')
        .maybeSingle();
      if (error) throw error;
      setWidget(data as AccommodationWidget);
    } catch (error: any) {
      console.error('Error fetching accommodation widget:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) fetchWidget();
  }, [partnerId]);

  // Create widget (upsert)
  const createWidget = async (): Promise<AccommodationWidget | null> => {
    if (!partnerId) return null;
    try {
      const { data, error } = await supabase
        .from('widgets')
        .upsert(
          {
            partner_id: partnerId,
            widget_type: 'accommodation' as any,
            status: 'active',
            theme_config: { primary_color: '#7c3aed' },
          },
          { onConflict: 'partner_id,widget_type', ignoreDuplicates: true }
        )
        .select()
        .maybeSingle();

      if (!data) {
        const { data: existing } = await supabase
          .from('widgets')
          .select('*')
          .eq('partner_id', partnerId)
          .eq('widget_type', 'accommodation')
          .maybeSingle();
        if (existing) {
          setWidget(existing as AccommodationWidget);
          return existing as AccommodationWidget;
        }
      }
      if (error) throw error;
      setWidget(data as AccommodationWidget);
      return data as AccommodationWidget;
    } catch (error: any) {
      console.error('Error creating accommodation widget:', error);
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('widgets')
          .select('*')
          .eq('partner_id', partnerId)
          .eq('widget_type', 'accommodation')
          .maybeSingle();
        if (existing) {
          setWidget(existing as AccommodationWidget);
          return existing as AccommodationWidget;
        }
      }
      toast({ title: 'Error', description: error.message || 'Failed to create widget', variant: 'destructive' });
      return null;
    }
  };

  // Update widget
  const updateWidget = async (updates: UpdateAccommodationWidgetData): Promise<boolean> => {
    if (!widget) return false;
    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.allowed_domains !== undefined) updateData.allowed_domains = updates.allowed_domains;
      if (updates.theme_config !== undefined) updateData.theme_config = updates.theme_config;

      const { error } = await supabase.from('widgets').update(updateData).eq('id', widget.id);
      if (error) throw error;
      setWidget((prev) => (prev ? { ...prev, ...updates } : null));
      toast({ title: 'Widget Updated', description: 'Your widget settings have been saved' });
      return true;
    } catch (error: any) {
      console.error('Error updating accommodation widget:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update widget', variant: 'destructive' });
      return false;
    }
  };

  // Domain management
  const addDomain = async (domain: string): Promise<boolean> => {
    if (!widget) return false;
    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const currentDomains = widget.allowed_domains || [];
    if (currentDomains.includes(cleanDomain)) {
      toast({ title: 'Domain exists', description: 'This domain is already in the list', variant: 'destructive' });
      return false;
    }
    return updateWidget({ allowed_domains: [...currentDomains, cleanDomain] });
  };

  const removeDomain = async (domain: string): Promise<boolean> => {
    if (!widget) return false;
    return updateWidget({ allowed_domains: (widget.allowed_domains || []).filter((d) => d !== domain) });
  };

  // Theme
  const updateTheme = async (theme: Partial<AccommodationThemeConfig>): Promise<boolean> => {
    if (!widget) return false;
    return updateWidget({ theme_config: { ...(widget.theme_config || {}), ...theme } });
  };

  // Toggle status
  const toggleStatus = async (): Promise<boolean> => {
    if (!widget) return false;
    return updateWidget({ status: widget.status === 'active' ? 'inactive' : 'active' });
  };

  // Copy widget key
  const copyWidgetKey = async () => {
    if (!widget) return;
    try {
      await navigator.clipboard.writeText(widget.public_widget_key);
      toast({ title: 'Copied', description: 'Widget key copied to clipboard' });
    } catch {
      toast({ title: 'Error', description: 'Failed to copy', variant: 'destructive' });
    }
  };

  // Auto-resize script
  const getAutoResizeScript = (iframeId: string) => {
    return `<script>
(function(){
  var iframe = document.getElementById('${iframeId}');
  if (!iframe) return;
  var isIOS = false;
  try { isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); } catch(e){}
  try { iframe.style.display='block'; iframe.style.width='100%'; iframe.style.maxWidth='100%'; iframe.style.touchAction='manipulation'; } catch(e){}
  function clampHeight(h){ if(!isFinite(h)||h<=0) return null; return Math.max(200,Math.round(h)); }
  function requestResize(){ try { if(iframe.contentWindow) iframe.contentWindow.postMessage({type:'sribooking-request-resize'},'*'); } catch(e){} }
  function onMessage(e){ if(!e||!e.data||e.data.type!=='sribooking-resize') return; if(e.source!==iframe.contentWindow) return; var h=clampHeight(Number(e.data.height)); if(h===null) return; iframe.style.height=h+'px'; }
  window.addEventListener('message',onMessage);
  var t=null; function throttledRequest(){ if(t) return; t=setTimeout(function(){ t=null; requestResize(); },150); }
  window.addEventListener('resize',throttledRequest);
  window.addEventListener('scroll',throttledRequest,{passive:true});
  iframe.addEventListener('load',function(){ requestResize(); setTimeout(requestResize,300); setTimeout(requestResize,1200); });
  requestResize();
})();
</script>`;
  };

  // Get embed code
  const getEmbedCode = (height = '800px') => {
    if (!widget) return '';
    const baseUrl = window.location.origin;
    const iframeId = `sribooking-acc-${widget.public_widget_key.slice(0, 8)}`;
    return `<iframe 
  id="${iframeId}"
  src="${baseUrl}/accommodation/${widget.public_widget_key}" 
  width="100%" 
  height="${height}" 
  frameborder="0" 
  style="border: none; border-radius: 8px; transition: height 0.2s ease;"
  allow="payment"
></iframe>
 ${getAutoResizeScript(iframeId)}`;
  };

  // Direct link
  const getDirectLink = () => {
    if (!widget) return '';
    return `${window.location.origin}/accommodation/${widget.public_widget_key}`;
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