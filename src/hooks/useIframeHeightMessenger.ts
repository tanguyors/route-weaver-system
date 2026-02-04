import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that sends postMessage events to parent window when content height changes.
 * This enables iframe auto-resize for embedded widgets.
 * 
 * CRITICAL FIX: On iOS, touch events do NOT fire on elements that are in the
 * overflow area of an iframe. This hook now also applies CSS fixes to ensure
 * the iframe content is never clipped, and sends height updates more aggressively.
 */
export const useIframeHeightMessenger = () => {
  const lastHeightRef = useRef<number>(0);
  const observerRef = useRef<ResizeObserver | null>(null);
  const throttleRef = useRef<number | null>(null);

  const sendHeightMessage = useCallback((options?: { force?: boolean }) => {
    const force = options?.force ?? false;

    // iOS SAFARI QUIRK:
    // If an iframe is taller than the iPhone viewport (i.e., its bottom is off-screen),
    // Safari can deliver very unreliable touch events inside the iframe.
    // A robust workaround is to cap the *iframe height we ask the parent to apply*
    // to the current visual viewport height, letting the iframe content scroll normally.
    const isIOS =
      typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        // iPadOS reports itself as MacIntel
        (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1));

    // Get the maximum height from various sources to ensure we capture everything
    const bodyHeight = document.body.scrollHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const bodyOffsetHeight = document.body.offsetHeight;
    
    // Use the maximum to ensure all content is visible
    let height = Math.max(bodyHeight, documentHeight, bodyOffsetHeight);

    if (isIOS) {
      const vv = typeof window !== 'undefined' ? window.visualViewport : undefined;
      const viewportHeight =
        Math.round((vv?.height ?? window.innerHeight ?? document.documentElement.clientHeight) || 0);

      // Only cap when we have a meaningful viewport measurement.
      if (viewportHeight > 0) {
        // Keep a small floor so we don't collapse on transient 0/1px measurements.
        const safeViewportHeight = Math.max(320, viewportHeight);
        height = Math.min(height, safeViewportHeight);
      }
    }
    
    // Only send if height actually changed (with small tolerance for rounding)
    // IMPORTANT: we must sometimes re-send the same height, because on iOS
    // postMessage delivery or parent listeners can be delayed until the user scrolls.
    if ((force || Math.abs(height - lastHeightRef.current) > 5) && height > 0) {
      lastHeightRef.current = height;
      
      // Send in both standard format and iframe-resizer compatible format
      window.parent.postMessage(
        { type: 'sribooking-resize', height },
        '*'
      );
    }
  }, []);

  // Throttled version to prevent too many updates
  const throttledSendHeight = useCallback((options?: { force?: boolean }) => {
    const force = options?.force ?? false;
    if (throttleRef.current) return;
    
    throttleRef.current = window.setTimeout(() => {
      throttleRef.current = null;
      sendHeightMessage({ force });
    }, 50);
  }, [sendHeightMessage]);

  useEffect(() => {
    // Check if we're in an iframe
    const isInIframe = window.self !== window.top;
    
    if (!isInIframe) return;

    // =====================================================================
    // CRITICAL iOS FIX: Prevent touch event clipping in iframe overflow
    // =====================================================================
    // On iOS Safari/Chrome, touch events do NOT fire on elements that are
    // positioned in the overflow/clipped area of an iframe. The parent page
    // may set a fixed height on the iframe, causing the bottom to be clipped.
    // 
    // We apply CSS to:
    // 1. Ensure the html/body have no overflow:hidden that could clip events
    // 2. Set min-height to ensure content is not collapsed
    // 3. Use overflow:visible to allow content to extend
    // =====================================================================
    const styleEl = document.createElement('style');
    styleEl.id = 'sribooking-iframe-fix';
    styleEl.textContent = `
      html, body {
        overflow: visible !important;
        overflow-x: hidden !important;
        min-height: 100% !important;
      }
      /* Ensure no ancestor clips pointer events */
      html *, body * {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(styleEl);

    // Send initial height after a small delay to ensure content is rendered
    const initialTimeout = setTimeout(() => sendHeightMessage({ force: true }), 100);
    
    // Also send after images and fonts are loaded
    const loadTimeout = setTimeout(() => sendHeightMessage({ force: true }), 500);
    
    // And again after a longer delay for dynamic content
    const extendedTimeout = setTimeout(() => sendHeightMessage({ force: true }), 1500);
    
    // Aggressive height updates every 2 seconds to catch any missed changes
    const intervalId = setInterval(() => sendHeightMessage(), 2000);

    // Set up ResizeObserver to watch for content changes
    observerRef.current = new ResizeObserver(() => {
      throttledSendHeight();
    });

    observerRef.current.observe(document.body);
    observerRef.current.observe(document.documentElement);

    // Also watch for DOM mutations (e.g., dynamic content)
    const mutationObserver = new MutationObserver(() => {
      throttledSendHeight();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    // Send height on window resize
    const handleResize = () => {
      throttledSendHeight();
    };
    window.addEventListener('resize', handleResize);
    
    // Also listen for scroll events that might indicate content change
    const handleScroll = () => {
      throttledSendHeight();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // When the user starts interacting (common iOS case), request an immediate height re-check.
    const handleInteraction = () => {
      throttledSendHeight();
    };
    const interactionOptions: AddEventListenerOptions = { capture: true, passive: true };
    document.addEventListener('touchstart', handleInteraction, interactionOptions);
    document.addEventListener('pointerdown', handleInteraction, interactionOptions);

    // Parent can explicitly request a resize (useful when Safari delays message delivery).
    const handleParentMessage = (e: MessageEvent) => {
      if (!e?.data || e.data.type !== 'sribooking-request-resize') return;
      sendHeightMessage({ force: true });
    };
    window.addEventListener('message', handleParentMessage);

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(loadTimeout);
      clearTimeout(extendedTimeout);
      clearInterval(intervalId);
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      observerRef.current?.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('touchstart', handleInteraction, interactionOptions);
      document.removeEventListener('pointerdown', handleInteraction, interactionOptions);
      window.removeEventListener('message', handleParentMessage);
      document.getElementById('sribooking-iframe-fix')?.remove();
    };
  }, [sendHeightMessage, throttledSendHeight]);

  // Return a function to manually trigger height update
  return { sendHeightMessage };
};
