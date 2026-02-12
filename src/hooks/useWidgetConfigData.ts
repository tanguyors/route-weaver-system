import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getProductionBaseUrl } from '@/lib/getProductionUrl';

export type WidgetStyle = 'block' | 'bar' | 'test';

export interface ThemeConfig {
  widget_style?: WidgetStyle;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  button_text_color?: string;
  border_color?: string;
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
        .eq('widget_type', 'fastboat')
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

  // Create or get existing widget (upsert pattern with conflict handling)
  const createWidget = async (): Promise<Widget | null> => {
    if (!partnerId) return null;

    try {
      // Use upsert with onConflict to handle race conditions
      const { data, error } = await supabase
        .from('widgets')
        .upsert(
          {
            partner_id: partnerId,
            widget_type: 'fastboat',
            status: 'active',
            theme_config: {
              primary_color: '#1B5E3B',
              show_child_pax: true,
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
          .eq('widget_type', 'fastboat')
          .maybeSingle();

        if (existing) {
          setWidget(existing as Widget);
          return existing as Widget;
        }
      }

      if (error) throw error;

      setWidget(data as Widget);
      return data as Widget;
    } catch (error: any) {
      console.error('Error creating widget:', error);
      // If it's a duplicate error, try to fetch existing
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('widgets')
          .select('*')
          .eq('partner_id', partnerId)
          .eq('widget_type', 'fastboat')
          .maybeSingle();

        if (existing) {
          setWidget(existing as Widget);
          return existing as Widget;
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

  const getAutoResizeScript = (iframeId: string) => {
    // NOTE: This script is intentionally self-contained for copy/paste embedding.
    // It does two things:
    // 1) listens for sribooking-resize messages *only* from this iframe
    // 2) proactively requests a resize on load/scroll/resize (Safari iOS can delay delivery)
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

  // Forward parent URL params to iframe via postMessage
  window.addEventListener('message', function(e){
    if (!e || !e.data || e.data.type !== 'sribooking-request-params') return;
    if (e.source !== iframe.contentWindow) return;
    try {
      var params = {};
      var qs = window.location.search.substring(1).split('&');
      for (var i = 0; i < qs.length; i++) {
        var pair = qs[i].split('=');
        if (pair[0]) params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
      }
      e.source.postMessage({ type: 'sribooking-params', params: params }, '*');
    } catch(ex){}
  });

  requestResize();
})();
</script>`;
  };

  // Get embed code for block widget
  const getEmbedCode = (height = '600px') => {
    if (!widget) return '';

    const baseUrl = getProductionBaseUrl();
    const iframeId = `sribooking-widget-${widget.public_widget_key.slice(0, 8)}`;
    return `<iframe 
  id="${iframeId}"
  src="${baseUrl}/book?key=${widget.public_widget_key}" 
  width="100%" 
  height="${height}" 
  frameborder="0" 
  style="border: none; border-radius: 8px; transition: height 0.2s ease;"
  allow="payment"
></iframe>
 ${getAutoResizeScript(iframeId)}`;
  };

  // Get embed code for bar widget
  const getBarEmbedCode = () => {
    if (!widget) return '';

    const baseUrl = getProductionBaseUrl();
    const iframeId = `sribooking-bar-${widget.public_widget_key.slice(0, 8)}`;
    return `<iframe 
  id="${iframeId}"
  src="${baseUrl}/book?key=${widget.public_widget_key}&style=bar" 
  width="100%" 
  height="80px" 
  frameborder="0" 
  style="border: none; transition: height 0.2s ease;"
  allow="payment"
></iframe>
 ${getAutoResizeScript(iframeId)}`;
  };

  // Get embed code for test (new) widget
  const getTestEmbedCode = () => {
    if (!widget) return '';

    const baseUrl = getProductionBaseUrl();
    const iframeId = `sribooking-v2-${widget.public_widget_key.slice(0, 8)}`;
    return `<iframe 
  id="${iframeId}"
  src="${baseUrl}/book-new?key=${widget.public_widget_key}" 
  width="100%" 
  height="800px" 
  frameborder="0" 
  style="border: none; border-radius: 8px; transition: height 0.2s ease;"
  allow="payment"
></iframe>
 ${getAutoResizeScript(iframeId)}`;
  };

  // Get direct link
  const getDirectLink = (style: 'block' | 'bar' | 'test' = 'block') => {
    if (!widget) return '';
    const baseUrl = getProductionBaseUrl();
    if (style === 'test') {
      return `${baseUrl}/book-new?key=${widget.public_widget_key}`;
    }
    const styleParam = style === 'bar' ? '&style=bar' : '';
    return `${baseUrl}/book?key=${widget.public_widget_key}${styleParam}`;
  };

  // Get Pre-Widget embed code (native search bar for homepage)
  const getPreWidgetCode = () => {
    if (!widget) return '';
    const baseUrl = getProductionBaseUrl();
    const themeConfig = widget.theme_config || {};
    const primaryColor = themeConfig.primary_color || '#1B5E3B';
    const logoUrl = themeConfig.logo_url || '';
    
    return `<!-- SriBooking Pre-Widget – Homepage Search Bar -->
<!-- Just paste this on your homepage. Change data-redirect to your booking page path. -->
<div
  id="sribooking-prewidget"
  data-key="${widget.public_widget_key}"
  data-redirect="/booking"
  data-lang="en"
  data-theme="light"
  data-primary-color="${primaryColor}"${logoUrl ? `
  data-logo="${logoUrl}"` : ''}
></div>
<script async src="${baseUrl}/embed/prewidget.js"><\/script>`;
  };

  // Get Full Widget embed code (iframe for dedicated booking page)
  const getFullWidgetCode = () => {
    if (!widget) return '';
    const baseUrl = getProductionBaseUrl();
    return `<!-- SriBooking Full Widget – Booking Page -->
<!-- Paste this as the main content of your booking page (e.g., /booking). If you have a fixed header, set --header-h to its height. -->
<script async src="${baseUrl}/embed/prewidget.js"><\/script>
<style>
  /* Adjust min-height if you have a fixed header */
  :root { --header-h: 0px; }
  #sribooking-widget {
    width: 100%;
    min-height: calc(100dvh - var(--header-h));
    border: 0;
    display: block;
    transition: height 0.2s ease;
  }
</style>
<iframe
  id="sribooking-widget"
  src="${baseUrl}/book-new"
  allow="payment"
  title="SriBooking"
></iframe>
<script>
(function(){
  var iframe = document.getElementById('sribooking-widget');
  if(!iframe) return;

  // Setup URL params — try window.location first, then window.top/parent
  // (Hostinger/Zyro may wrap custom HTML in a sub-iframe)
  var qs = window.location.search;
  if(!qs || qs.length < 2){ try { qs = window.top.location.search; } catch(e){} }
  if(!qs || qs.length < 2){ try { qs = window.parent.location.search; } catch(e){} }
  var p = new URLSearchParams(qs || '');
  var base = "${baseUrl}/book-new";
  var url = new URL(base);
  ["key","from","to","depart","return","ad","ch","inf","trip","currency","lang"].forEach(function(k){
    var v = p.get(k);
    if(v) url.searchParams.set(k, v);
  });
  if(!url.searchParams.get("key")) url.searchParams.set("key", "${widget.public_widget_key}");
  iframe.src = url.toString();

  // iOS detection
  var isIOS = false;
  try {
    isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  } catch (e) {}

  // Auto-resize: listen for height messages from widget
  function clampHeight(h){
    if (!isFinite(h) || h <= 0) return null;
    return Math.max(400, Math.round(h));
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

  // Throttled resize requests
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

  // iOS scroll lock during touch interaction
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
</script>

`;
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
    getTestEmbedCode,
    getDirectLink,
    getPreWidgetCode,
    getFullWidgetCode,
    refetch: fetchWidget,
  };
};
