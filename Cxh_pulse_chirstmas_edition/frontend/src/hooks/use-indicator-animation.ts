import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';

export interface UseIndicatorAnimationOptions {
  /** Indicator data array with comYear and comMonth fields */
  indicatorData: any[];
  /** Date range for filtering frames */
  dateRange: { from: Date; to: Date } | null;
  /** Animation speed (frames per second) */
  speed?: number;
  /** Whether to loop animation */
  isLooping?: boolean;
  /** Whether to show all data (aggregated) or frame-by-frame */
  showAll?: boolean;
  /** Whether animation is enabled (only for indicators, not population) */
  enabled?: boolean;
}

export interface UseIndicatorAnimationReturn {
  /** Current frame index */
  frameIdx: number;
  /** Set frame index */
  setFrameIdx: (idx: number | ((prev: number) => number)) => void;
  /** Whether animation is playing */
  playing: boolean;
  /** Set playing state */
  setPlaying: (playing: boolean) => void;
  /** Available frames as "YYYY-MM" strings */
  frames: string[];
  /** Available frames as Date objects */
  frameDates: Date[];
  /** Current frame string (e.g., "2024-01") */
  currentFrame: string | undefined;
  /** Current frame date */
  currentFrameDate: Date | null;
  /** Filtered data for current frame */
  filteredData: any[];
  /** Reset animation to first frame */
  reset: () => void;
}

/**
 * Hook for managing indicator choropleth animation
 * Extracts frames from indicator data and manages animation loop
 */
export function useIndicatorAnimation({
  indicatorData,
  dateRange,
  speed = 1,
  isLooping = true,
  showAll = true,
  enabled = true,
}: UseIndicatorAnimationOptions): UseIndicatorAnimationReturn {
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Stop playing and reset frame when showAll becomes true
  // Use useLayoutEffect to ensure this runs synchronously before render
  useLayoutEffect(() => {
    if (showAll) {
      setPlaying(false);
      setFrameIdx(0);
    }
  }, [showAll]);

  // Ensure playing is false when showAll is true (additional safeguard)
  useEffect(() => {
    if (showAll && playing) {
      setPlaying(false);
    }
  }, [showAll, playing]);

  // Extract unique frames from indicator data
  const { frames, frameDates } = useMemo(() => {
    if (!enabled || !dateRange || !indicatorData || indicatorData.length === 0) {
      return { frames: [], frameDates: [] };
    }

    const frameSet = new Set<string>();
    const dateSet = new Set<number>();
    const rangeStart = new Date(dateRange.from);
    const rangeEnd = new Date(dateRange.to);

    for (const record of indicatorData) {
      if (record.comYear !== undefined && record.comMonth !== undefined) {
        const frameDate = new Date(record.comYear, record.comMonth - 1, 1);
        if (frameDate >= rangeStart && frameDate <= rangeEnd) {
          const yearMonth = `${record.comYear}-${String(record.comMonth).padStart(2, '0')}`;
          frameSet.add(yearMonth);
          dateSet.add(frameDate.getTime());
        }
      }
    }

    const sortedFrames = Array.from(frameSet).sort();
    const sortedDates = Array.from(dateSet)
      .sort((a, b) => a - b)
      .map((timestamp) => new Date(timestamp));

    return { frames: sortedFrames, frameDates: sortedDates };
  }, [indicatorData, dateRange, enabled]);

  // Filter data for current frame
  const currentFrame = frames[frameIdx];
  const currentFrameDate = frameDates[frameIdx] || null;

  const filteredData = useMemo(() => {
    if (!enabled || !dateRange) return indicatorData;

    // If showAll is true, return all data within the date range
    if (showAll) {
      const rangeStart = new Date(dateRange.from);
      const rangeEnd = new Date(dateRange.to);
      return indicatorData.filter((d: any) => {
        if (d.comYear !== undefined && d.comMonth !== undefined) {
          const recordDate = new Date(d.comYear, d.comMonth - 1, 1);
          return recordDate >= rangeStart && recordDate <= rangeEnd;
        }
        return false;
      });
    }

    // If showAll is false (playing or paused), return data for current frame only
    if (!currentFrame) return indicatorData;
    const [year, month] = currentFrame.split('-').map(Number);
    return indicatorData.filter((d: any) => d.comYear === year && d.comMonth === month);
  }, [indicatorData, currentFrame, enabled, showAll, dateRange]);

  // Animation loop refs
  const rafRef = useRef<number>(0);
  const lastTs = useRef<number>(0);
  const playingRef = useRef<boolean>(false);
  const framesRef = useRef<string[]>([]);
  const speedRef = useRef<number>(1);
  const isLoopingRef = useRef<boolean>(true);

  // Sync refs with state
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  // Animation loop
  useEffect(() => {
    if (!enabled || !playing || frames.length === 0) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      lastTs.current = 0;
      return undefined;
    }

    const loop = (ts: number) => {
      if (!playingRef.current || framesRef.current.length === 0) {
        rafRef.current = 0;
        return;
      }

      if (!lastTs.current) lastTs.current = ts;
      const delta = (ts - lastTs.current) / 1000;
      const minInterval = 0.1;
      const frameInterval = Math.max(1 / speedRef.current, minInterval);

      if (delta >= frameInterval) {
        setFrameIdx((i) => {
          const nextIdx = i + 1;
          const maxFrames = Math.max(framesRef.current.length, 1);
          if (isLoopingRef.current) {
            return nextIdx % maxFrames;
          } else {
            if (nextIdx >= maxFrames) {
              playingRef.current = false;
              setPlaying(false);
              return i;
            }
            return nextIdx;
          }
        });
        lastTs.current = ts;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      lastTs.current = 0;
    };
  }, [enabled, playing, speed, frames.length, isLooping]);

  // Reset when frames change or date range changes
  useEffect(() => {
    if (enabled) {
      setFrameIdx(0);
      setPlaying(false);
    }
  }, [frames.length, dateRange?.from, dateRange?.to, enabled]);

  // Stop playing and reset when showAll becomes true
  useEffect(() => {
    if (showAll && playing) {
      setPlaying(false);
      setFrameIdx(0);
    }
  }, [showAll, playing]);

  const reset = () => {
    setFrameIdx(0);
    setPlaying(false);
  };

  return {
    frameIdx,
    setFrameIdx,
    playing,
    setPlaying,
    frames,
    frameDates,
    currentFrame,
    currentFrameDate,
    filteredData,
    reset,
  };
}
