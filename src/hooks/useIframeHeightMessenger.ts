import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that sends postMessage events to parent window when content height changes.
 * This enables iframe auto-resize for embedded widgets.
 */
export const useIframeHeightMessenger = () => {
  const lastHeightRef = useRef<number>(0);
  const observerRef = useRef<ResizeObserver | null>(null);
  const throttleRef = useRef<number | null>(null);

  const sendHeightMessage = useCallback(() => {
    // Get the maximum height from various sources to ensure we capture everything
    const bodyHeight = document.body.scrollHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const bodyOffsetHeight = document.body.offsetHeight;
    
    // Use the maximum to ensure all content is visible
    const height = Math.max(bodyHeight, documentHeight, bodyOffsetHeight);
    
    // Only send if height actually changed (with small tolerance for rounding)
    if (Math.abs(height - lastHeightRef.current) > 5 && height > 0) {
      lastHeightRef.current = height;
      
      // Send in both standard format and iframe-resizer compatible format
      window.parent.postMessage(
        { type: 'sribooking-resize', height },
        '*'
      );
    }
  }, []);

  // Throttled version to prevent too many updates
  const throttledSendHeight = useCallback(() => {
    if (throttleRef.current) return;
    
    throttleRef.current = window.setTimeout(() => {
      throttleRef.current = null;
      sendHeightMessage();
    }, 50);
  }, [sendHeightMessage]);

  useEffect(() => {
    // Check if we're in an iframe
    const isInIframe = window.self !== window.top;
    
    if (!isInIframe) return;

    // Send initial height after a small delay to ensure content is rendered
    const initialTimeout = setTimeout(sendHeightMessage, 100);
    
    // Also send after images and fonts are loaded
    const loadTimeout = setTimeout(sendHeightMessage, 500);
    
    // And again after a longer delay for dynamic content
    const extendedTimeout = setTimeout(sendHeightMessage, 1500);

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

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(loadTimeout);
      clearTimeout(extendedTimeout);
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      observerRef.current?.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sendHeightMessage, throttledSendHeight]);

  // Return a function to manually trigger height update
  return { sendHeightMessage };
};
