import { RefObject, useEffect, useState, useCallback, useRef } from 'react';

export interface AutoScrollOptions {
  /** Enable/disable auto-scroll (default: true) */
  enabled?: boolean;
  /** Scroll behavior (default: 'smooth') */
  behavior?: ScrollBehavior;
  /** Threshold in pixels to consider "at bottom" (default: 50) */
  threshold?: number;
}

export interface AutoScrollReturn {
  /** Whether the scroll position is at/near the bottom */
  isAtBottom: boolean;
  /** Manually scroll to bottom */
  scrollToBottom: () => void;
  /** Whether auto-scroll is currently active */
  isAutoScrolling: boolean;
}

/**
 * Hook for auto-scroll behavior in scrollable containers
 * 
 * Automatically scrolls to bottom when new content is added,
 * but pauses when user scrolls up to read history.
 * 
 * @param ref - Ref to the scrollable container element
 * @param deps - Dependencies that trigger scroll check (e.g., [logs.length])
 * @param options - Configuration options
 * 
 * @example
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { isAtBottom, scrollToBottom } = useAutoScroll(containerRef, [logs]);
 * 
 * return (
 *   <div ref={containerRef} className="overflow-y-auto">
 *     {logs.map(log => <LogLine key={log.id} log={log} />)}
 *   </div>
 * );
 */
export function useAutoScroll(
  ref: RefObject<HTMLElement>,
  deps: unknown[],
  options: AutoScrollOptions = {}
): AutoScrollReturn {
  const {
    enabled = true,
    behavior = 'smooth',
    threshold = 50,
  } = options;

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const userScrolledUp = useRef(false);
  const lastScrollTop = useRef(0);

  // Check if scroll position is at bottom
  const checkIsAtBottom = useCallback((element: HTMLElement): boolean => {
    const { scrollTop, scrollHeight, clientHeight } = element;
    return scrollHeight - scrollTop - clientHeight <= threshold;
  }, [threshold]);

  // Scroll to bottom programmatically
  const scrollToBottom = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    userScrolledUp.current = false;
    setIsAutoScrolling(true);
    
    element.scrollTo({
      top: element.scrollHeight,
      behavior,
    });
  }, [ref, behavior]);

  // Handle scroll events to detect user scroll
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    const handleScroll = () => {
      const currentScrollTop = element.scrollTop;
      const atBottom = checkIsAtBottom(element);
      
      // Detect if user scrolled up
      if (currentScrollTop < lastScrollTop.current && !atBottom) {
        userScrolledUp.current = true;
        setIsAutoScrolling(false);
      }
      
      // Re-enable auto-scroll if user scrolled back to bottom
      if (atBottom && userScrolledUp.current) {
        userScrolledUp.current = false;
        setIsAutoScrolling(true);
      }
      
      lastScrollTop.current = currentScrollTop;
      setIsAtBottom(atBottom);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [ref, enabled, checkIsAtBottom]);

  // Auto-scroll when deps change (new content)
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    // Only auto-scroll if we should be auto-scrolling
    if (isAutoScrolling && !userScrolledUp.current) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        element.scrollTo({
          top: element.scrollHeight,
          behavior,
        });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, isAutoScrolling, behavior]);

  // Initial check on mount
  useEffect(() => {
    const element = ref.current;
    if (element) {
      setIsAtBottom(checkIsAtBottom(element));
    }
  }, [ref, checkIsAtBottom]);

  return {
    isAtBottom,
    scrollToBottom,
    isAutoScrolling,
  };
}
