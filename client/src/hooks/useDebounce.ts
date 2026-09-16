import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid value updates (e.g. search inputs).
 *
 * @param value - Value to debounce
 * @param delayMs - Delay duration in milliseconds (default: 300ms)
 * @returns Debounced value that only updates after delayMs of inactivity
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
