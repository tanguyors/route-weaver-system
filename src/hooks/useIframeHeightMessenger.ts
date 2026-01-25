import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that sends postMessage events to parent window when content height changes.
 * This enables iframe auto-resize for embedded widgets.
 */
export const useIframeHeightMessenger = () => {
  const lastHeightRef = useRef<number>(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const sendHeightMessage = useCallback(() => {
    // Get the height of the body content
    const height = document.body.scrollHeight;
    
    // Only send if height actually changed
    if (height !== lastHeightRef.current && height > 0) {
      lastHeightRef.current = height;
      
      // Send in both standard format and iframe-resizer compatible format
      window.parent.postMessage(
        { type: 'sribooking-resize', height },
        '*'
      );
    }
  }, []);

  useEffect(() => {
    // Check if we're in an iframe
    const isInIframe = window.self !== window.top;
    
    if (!isInIframe) return;

    // Send initial height after a small delay to ensure content is rendered
    const initialTimeout = setTimeout(sendHeightMessage, 100);
    
    // Also send after images and fonts are loaded
    const loadTimeout = setTimeout(sendHeightMessage, 500);

    // Set up ResizeObserver to watch for content changes
    observerRef.current = new ResizeObserver(() => {
      // Debounce resize events
      requestAnimationFrame(sendHeightMessage);
    });

    observerRef.current.observe(document.body);

    // Also watch for DOM mutations (e.g., dynamic content)
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(sendHeightMessage);
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Send height on window resize
    const handleResize = () => {
      requestAnimationFrame(sendHeightMessage);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(loadTimeout);
      observerRef.current?.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [sendHeightMessage]);

  // Return a function to manually trigger height update
  return { sendHeightMessage };
};
