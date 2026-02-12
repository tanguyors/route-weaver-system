import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getProductionBaseUrl } from '@/lib/getProductionUrl';

export type WidgetStyle = 'block' | 'bar';

export interface ActivityThemeConfig {
  widget_style?: WidgetStyle;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  button_text_color?: string;
  border_color?: string;
  logo_url?: string;
}

export interface ActivityWidget {
  id: string;
  partner_id: string;
  public_widget_key: string;
  widget_type: 'activity';
  status: 'active' | 'inactive';
  allowed_domains: string[] | null;
  theme_config: ActivityThemeConfig | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateActivityWidgetData {
  status?: 'active' | 'inactive';
  allowed_domains?: string[];
  theme_config?: ActivityThemeConfig;
}

export const useActivityWidgetConfigData = () => {
  const [widget, setWidget] = useState<ActivityWidget | null>(null);
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
        .eq('widget_type', 'activity')
        .maybeSingle();

      if (error) throw error;
      setWidget(data as ActivityWidget);
    } catch (error: any) {
      console.error('Error fetching activity widget:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) {
      fetchWidget();
    }
  }, [partnerId]);

  // Create or get existing widget (upsert pattern with conflict handling)
  const createWidget = async (): Promise<ActivityWidget | null> => {
    if (!partnerId) return null;

    try {
      // Use upsert with onConflict to handle race conditions
      const { data, error } = await supabase
        .from('widgets')
        .upsert(
          {
            partner_id: partnerId,
            widget_type: 'activity',
            status: 'active',
            theme_config: {
              primary_color: '#1B5E3B',
            },
          },
          {
            onConflict: 'partner_id,widget_type',
            ignoreDuplicates: true,
          }
        )
        .select()
        .maybeSingle();

      // If upsert returned nothing (duplicate ignored), fetch existing
      if (!data) {
        const { data: existing } = await supabase
          .from('widgets')
          .select('*')
          .eq('partner_id', partnerId)
          .eq('widget_type', 'activity')
          .maybeSingle();

        if (existing) {
          setWidget(existing as ActivityWidget);
          return existing as ActivityWidget;
        }
      }

      if (error) throw error;

      setWidget(data as ActivityWidget);
      return data as ActivityWidget;
    } catch (error: any) {
      console.error('Error creating activity widget:', error);
      // If it's a duplicate error, try to fetch existing
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('widgets')
          .select('*')
          .eq('partner_id', partnerId)
          .eq('widget_type', 'activity')
          .maybeSingle();

        if (existing) {
          setWidget(existing as ActivityWidget);
          return existing as ActivityWidget;
        }
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to create widget',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update widget
  const updateWidget = async (updates: UpdateActivityWidgetData): Promise<boolean> => {
    if (!widget) return false;

    try {
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
      console.error('Error updating activity widget:', error);
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
  const updateTheme = async (theme: Partial<ActivityThemeConfig>): Promise<boolean> => {
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

  const getAutoResizeScript = (iframeId: string) => {
    return `<script>
(function(){
  var iframe = document.getElementById('${iframeId}');
  if (!iframe) return;

  // iOS Safari can sometimes treat taps inside large iframes as page scroll gestures.
  // Locking the host-page scroll *only while interacting with the iframe* makes taps
  // reliably reach the widget, while still keeping the overall UX as page-scroll.
  var isIOS = false;
  try {
    isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  } catch (e) {}

  try {
    iframe.style.display = 'block';
    iframe.style.width = '100%';
    iframe.style.maxWidth = '100%';
    iframe.style.touchAction = 'manipulation';
  } catch (e) {}

  var __sr_lock = { locked: false, y: 0, prev: null };
  function lockHostScroll(){
    if (!isIOS) return;
    if (__sr_lock.locked) return;
    if (!document || !document.body) return;

    __sr_lock.locked = true;
    __sr_lock.y = window.pageYOffset || document.documentElement.scrollTop || 0;

    __sr_lock.prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width
    };

    document.body.style.position = 'fixed';
    document.body.style.top = (-__sr_lock.y) + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  function unlockHostScroll(){
    if (!__sr_lock.locked) return;
    if (!document || !document.body) return;

    __sr_lock.locked = false;
    var y = __sr_lock.y;
    var prev = __sr_lock.prev;
    __sr_lock.prev = null;

    try {
      if (prev) {
        document.body.style.position = prev.position;
        document.body.style.top = prev.top;
        document.body.style.left = prev.left;
        document.body.style.right = prev.right;
        document.body.style.width = prev.width;
      } else {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
      }
    } catch (e) {}

    try { window.scrollTo(0, y); } catch (e) {}
  }

  function clampHeight(h){
    if (!isFinite(h) || h <= 0) return null;
    return Math.max(200, Math.round(h));
  }

  function requestResize(){
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'sribooking-request-resize' }, '*');
      }
    } catch (e) {}
  }

  function onMessage(e){
    if (!e || !e.data || e.data.type !== 'sribooking-resize') return;
    if (e.source !== iframe.contentWindow) return;
    var h = clampHeight(Number(e.data.height));
    if (h === null) return;
    iframe.style.height = h + 'px';
  }

  window.addEventListener('message', onMessage);

  var t = null;
  function throttledRequest(){
    if (t) return;
    t = setTimeout(function(){
      t = null;
      requestResize();
    }, 150);
  }

  window.addEventListener('resize', throttledRequest);
  window.addEventListener('orientationchange', throttledRequest);
  window.addEventListener('scroll', throttledRequest, { passive: true });
  window.addEventListener('pageshow', function(){ requestResize(); });

  // iOS interaction help: lock host scroll while finger is down on the iframe.
  // We do NOT preventDefault; we only stabilize Safari's gesture routing.
  if (isIOS) {
    iframe.addEventListener('touchstart', function(){ lockHostScroll(); requestResize(); }, { passive: true });
    iframe.addEventListener('touchend', function(){ setTimeout(unlockHostScroll, 0); }, { passive: true });
    iframe.addEventListener('touchcancel', function(){ unlockHostScroll(); }, { passive: true });
  }

  iframe.addEventListener('load', function(){
    requestResize();
    setTimeout(requestResize, 300);
    setTimeout(requestResize, 1200);
    setTimeout(requestResize, 2500);
  });

  requestResize();
})();
</script>`;
  };

  // Get embed code for block widget
  const getEmbedCode = (height = '700px') => {
    if (!widget) return '';

    const baseUrl = getProductionBaseUrl();
    const iframeId = `sribooking-activity-${widget.public_widget_key.slice(0, 8)}`;
    return `<iframe 
  id="${iframeId}"
  src="${baseUrl}/activity-widget?key=${widget.public_widget_key}" 
  width="100%" 
  height="${height}" 
  frameborder="0" 
  style="border: none; border-radius: 8px; transition: height 0.2s ease;"
  allow="payment"
></iframe>
 ${getAutoResizeScript(iframeId)}`;
  };

  // Get embed code for bar widget (compact product list)
  const getBarEmbedCode = () => {
    if (!widget) return '';

    const baseUrl = getProductionBaseUrl();
    const iframeId = `sribooking-activity-bar-${widget.public_widget_key.slice(0, 8)}`;
    return `<iframe 
  id="${iframeId}"
  src="${baseUrl}/activity-widget?key=${widget.public_widget_key}&style=bar" 
  width="100%" 
  height="200px" 
  frameborder="0" 
  style="border: none; transition: height 0.2s ease;"
  allow="payment"
></iframe>
 ${getAutoResizeScript(iframeId)}`;
  };

  // Get direct link
  const getDirectLink = (style: 'block' | 'bar' = 'block') => {
    if (!widget) return '';
    const baseUrl = getProductionBaseUrl();
    const styleParam = style === 'bar' ? '&style=bar' : '';
    return `${baseUrl}/activity-widget?key=${widget.public_widget_key}${styleParam}`;
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
    getBarEmbedCode,
    getDirectLink,
    refetch: fetchWidget,
  };
};
