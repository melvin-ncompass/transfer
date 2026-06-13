import { useState, useEffect, useRef } from 'react';
import type { DateRange } from '../types';

type UseDateRangeDragProps = {
  trackRef: React.RefObject<HTMLDivElement | null>;
  totalMonths: number;
  getDateFromIndex: (index: number) => Date;
  getMonthIndex: (date: Date) => number;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  debouncedOnChange?: (range: DateRange) => void;
  playable: boolean;
  isPlaying: boolean;
  frames: Date[];
  onFrameChange?: (frame: Date) => void;
  minYear: number;
  maxYear: number;
  effectiveMinMonth: number;
  effectiveMaxMonth: number;
  onRangeShift?: () => void;  // Called when the entire range is dragged (middle drag)
};

export function useDateRangeDrag({
  trackRef,
  totalMonths,
  getDateFromIndex,
  getMonthIndex,
  dateRange,
  setDateRange,
  debouncedOnChange,
  playable,
  isPlaying,
  frames,
  onFrameChange,
  minYear,
  maxYear,
  effectiveMinMonth,
  effectiveMaxMonth,
  onRangeShift,
}: UseDateRangeDragProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragTarget, setDragTarget] = useState<'start' | 'end' | 'middle' | 'thumb' | null>(null);
  // Track last frame set during drag to prevent redundant updates and jumping
  const lastDraggedFrameRef = useRef<Date | null>(null);
  // Track if onRangeShift has been called during current drag session
  const rangeShiftCalledRef = useRef<boolean>(false);

  const handleMouseDown = (
    target: 'start' | 'end' | 'middle' | 'thumb',
    e: React.MouseEvent | React.TouchEvent
  ) => {
    if (playable && isPlaying) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    setDragTarget(target);
    
    // Call onRangeShift when middle drag starts (to reset to "show all" mode)
    if (target === 'middle' && onRangeShift && !rangeShiftCalledRef.current) {
      rangeShiftCalledRef.current = true;
      onRangeShift();
    }
  };

  const getClientX = (e: MouseEvent | TouchEvent): number => {
    if ('touches' in e && e.touches.length > 0) {
      return e.touches[0].clientX;
    }
    return (e as MouseEvent).clientX;
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const clientX = getClientX(e);
    let percent = ((clientX - rect.left) / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));

    // Clamp index to valid range (0 to totalMonths - 1)
    // When percent is 100%, we want the last valid index, not totalMonths
    let index = Math.round((percent / 100) * (totalMonths - 1));
    index = Math.max(0, Math.min(totalMonths - 1, index));

    const startIndex = getMonthIndex(dateRange.from);
    const endIndex = getMonthIndex(dateRange.to);
    
    // Calculate selected range percentages (for thumb dragging within the blue bar)
    const isEndAtMax = dateRange.to.getFullYear() === maxYear && dateRange.to.getMonth() === effectiveMaxMonth;
    const startPercent = (startIndex / totalMonths) * 100;
    const endPercent = isEndAtMax ? 100 : (endIndex / totalMonths) * 100;

    if (dragTarget === 'thumb' && playable) {
      // For thumb dragging, calculate frame based on position within the selected range
      // The thumb should only move within the blue bar (selected range), not the full track
      if (frames.length > 0 && onFrameChange) {
        // Convert mouse position (relative to full track) to position within selected range
        // Clamp percent to selected range
        const percentInRange = Math.max(startPercent, Math.min(endPercent, percent));
        // Calculate relative position within selected range (0 to 1)
        const rangeWidth = endPercent - startPercent;
        const positionInRange = rangeWidth > 0 
          ? (percentInRange - startPercent) / rangeWidth 
          : 0.5; // If range is 0, use middle
        
        // Map to frame index (0 to frames.length - 1)
        const frameIndex = frames.length === 1
          ? 0
          : Math.round(positionInRange * (frames.length - 1));
        const clampedFrameIndex = Math.max(0, Math.min(frames.length - 1, frameIndex));
        const targetFrame = frames[clampedFrameIndex];
        
        // Only update if the frame actually changed to prevent jumping
        if (!lastDraggedFrameRef.current || 
            targetFrame.getTime() !== lastDraggedFrameRef.current.getTime()) {
          lastDraggedFrameRef.current = targetFrame;
          onFrameChange(targetFrame);
        }
      }
    } else if (dragTarget === 'start') {
      // Ensure minimum 1 month gap: start must be at least 1 month before end
      // index <= endIndex - 1 ensures at least 1 month gap (e.g., if endIndex=5, max startIndex=4)
      if (index <= endIndex - 1 && index >= 0 && index < totalMonths) {
        const newFrom = getDateFromIndex(index);
        if (newFrom.getFullYear() >= minYear && newFrom.getFullYear() <= maxYear) {
          const month = newFrom.getMonth();
          if (
            (newFrom.getFullYear() > minYear || month >= effectiveMinMonth) &&
            (newFrom.getFullYear() < maxYear || month <= effectiveMaxMonth)
          ) {
            setDateRange({ ...dateRange, from: newFrom });
            debouncedOnChange?.({ ...dateRange, from: newFrom });
          }
        }
      }
    } else if (dragTarget === 'end') {
      // Ensure minimum 1 month gap: end must be at least 1 month after start
      // index >= startIndex + 1 ensures at least 1 month gap (e.g., if startIndex=4, min endIndex=5)
      if (index >= startIndex + 1 && index >= 0 && index < totalMonths) {
        const newTo = getDateFromIndex(index);
        if (newTo.getFullYear() >= minYear && newTo.getFullYear() <= maxYear) {
          const month = newTo.getMonth();
          if (
            (newTo.getFullYear() > minYear || month >= effectiveMinMonth) &&
            (newTo.getFullYear() < maxYear || month <= effectiveMaxMonth)
          ) {
            setDateRange({ ...dateRange, to: newTo });
            debouncedOnChange?.({ ...dateRange, to: newTo });
          }
        }
      }
    } else if (dragTarget === 'middle') {
      const range = endIndex - startIndex;
      // Prevent dragging if range is already at minimum (1 month gap = 2 months total)
      if (range < 1) return;

      const mid = startIndex + range / 2;
      const diff = index - mid;

      let newStart = Math.round(startIndex + diff);
      let newEnd = Math.round(endIndex + diff);

      // Ensure minimum range is maintained (at least 1 month gap)
      if (newStart < 0) {
        newStart = 0;
        newEnd = Math.max(1, range); // Ensure at least 1 month gap
      }
      if (newEnd >= totalMonths) {
        newEnd = totalMonths - 1;
        newStart = Math.max(0, newEnd - range); // Ensure at least 1 month gap
      }

      // Final validation: ensure minimum 1 month gap
      if (newEnd - newStart < 1) {
        return; // Don't update if it would violate minimum range
      }

      const newFrom = getDateFromIndex(newStart);
      const newTo = getDateFromIndex(newEnd);

      // Additional validation: ensure dates are not in the same month
      if (
        newFrom.getFullYear() === newTo.getFullYear() &&
        newFrom.getMonth() === newTo.getMonth()
      ) {
        return; // Don't update if same month
      }

      setDateRange({ from: newFrom, to: newTo });
      debouncedOnChange?.({ from: newFrom, to: newTo });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
    // Clear last dragged frame when drag ends
    lastDraggedFrameRef.current = null;
    // Reset rangeShift flag for next drag session
    rangeShiftCalledRef.current = false;
  };

  useEffect(() => {
    // Mouse events
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Touch events for mobile
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchcancel', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchcancel', handleMouseUp);
    };
  });

  return {
    isDragging,
    dragTarget,
    handleMouseDown,
    setIsDragging,
    setDragTarget,
  };
}
