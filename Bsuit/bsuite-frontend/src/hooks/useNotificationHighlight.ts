import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { SxProps, Theme } from "@mui/material";

/**
 * Custom hook to standardize notification redirection highlights.
 * 
 * It extracts specified keys from the URL, stores them in local state for the duration 
 * of the animation, and removes them from the URL immediately so reloads don't re-trigger.
 * 
 * @param paramKeys Array of URL parameters to extract (e.g., ["highlightId", "folderId"]).
 */
export function useNotificationHighlight(
  paramKeys: string[] = ["highlightId", "folderId", "documentTypeId"]
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightedValues, setHighlightedValues] = useState<Record<string, string>>({});
  
  // Stabilize paramKeys so passing a new array literal on every render doesn't trigger loops
  const memoizedParamKeys = useMemo(() => paramKeys, [paramKeys.join(",")]);
  
  useEffect(() => {
    let changed = false;
    const newValues: Record<string, string> = {};
    const nextSearchParams = new URLSearchParams(searchParams);

    for (const key of memoizedParamKeys) {
      const val = searchParams.get(key);
      if (val) {
        newValues[key] = val;
        nextSearchParams.delete(key);
        changed = true;
      }
    }

    if (changed) {
      // 1. Persist values locally for the animation duration
      setHighlightedValues((prev) => ({ ...prev, ...newValues }));
      
      // 2. Clear from URL so back/refresh doesn't re-trigger
      setSearchParams(nextSearchParams, { replace: true });
      
      // 3. Clear local highlight state after animation finishes
      const timer = setTimeout(() => {
        setHighlightedValues({});
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, memoizedParamKeys, setSearchParams]);

  /**
   * Generates the SxProps for the pulse animation if the item matches the highlighted value.
   */
  const getHighlightSx = useCallback((
    itemKey: string,
    itemValue: string | number | null | undefined,
    theme: Theme,
    customColor?: string
  ): SxProps<Theme> => {
    if (!itemValue || highlightedValues[itemKey] !== String(itemValue)) return {};
    
    const rowHighlight = customColor || (theme.palette as any).rowHighlight || theme.palette.action.hover;
    
    return {
      "@keyframes notificationHighlightPulse": {
        "0%": { backgroundColor: rowHighlight },
        "60%": { backgroundColor: rowHighlight },
        "100%": { backgroundColor: "transparent" },
      },
      animation: "notificationHighlightPulse 4.2s ease-out forwards",
    };
  }, [highlightedValues]);

  /**
   * Helper to scroll an element into view.
   */
  const scrollToElement = useCallback((id: string, block: ScrollLogicalPosition = "center", delay = 200) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block });
      }
    }, delay);
  }, []);

  return { highlightedValues, getHighlightSx, scrollToElement };
}
