"use client";

import { useEffect, useState, useCallback, RefObject } from "react";

interface Dimensions {
  width: number;
  height: number;
}

export function useDimensions(ref: RefObject<HTMLElement>, debounceMs: number = 100): Dimensions {
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });

  const updateDimensions = useCallback(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, [ref]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const debouncedUpdateDimensions = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, debounceMs);
    };

    // Initial measurement
    updateDimensions();

    // Set up ResizeObserver for more accurate dimension tracking
    let resizeObserver: ResizeObserver;
    
    if (ref.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(debouncedUpdateDimensions);
      resizeObserver.observe(ref.current);
    } else {
      // Fallback to window resize listener
      window.addEventListener('resize', debouncedUpdateDimensions);
    }

    return () => {
      clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', debouncedUpdateDimensions);
      }
    };
  }, [ref, updateDimensions, debounceMs]);

  return dimensions;
}

// Add default export as well for better compatibility
export default useDimensions;