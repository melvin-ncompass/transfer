import { useEffect, useState } from 'react';
import { debounce } from 'lodash';

/**
 * Hook to debounce location values (ward and county) to prevent rapid API calls
 * when user clicks multiple locations quickly on the map.
 *
 * @param ward - Current ward value
 * @param county - Current county value
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 * @returns Debounced ward and county values
 */
export function useDebouncedLocation(
  ward: string,
  county: string,
  delay: number = 500
): { debouncedWard: string; debouncedCounty: string } {
  const [debouncedWard, setDebouncedWard] = useState(ward);
  const [debouncedCounty, setDebouncedCounty] = useState(county);

  useEffect(() => {
    // Create debounced setters
    const debouncedSetWard = debounce((value: string) => {
      setDebouncedWard(value);
    }, delay);

    const debouncedSetCounty = debounce((value: string) => {
      setDebouncedCounty(value);
    }, delay);

    // Update debounced values
    debouncedSetWard(ward);
    debouncedSetCounty(county);

    // Cleanup: cancel pending debounced calls on unmount or when values change
    return () => {
      debouncedSetWard.cancel();
      debouncedSetCounty.cancel();
    };
  }, [ward, county, delay]);

  return { debouncedWard, debouncedCounty };
}
