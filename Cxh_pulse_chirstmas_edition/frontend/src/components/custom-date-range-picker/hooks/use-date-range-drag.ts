import { useState, useEffect } from 'react';
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
}: UseDateRangeDragProps) {
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragTarget, setDragTarget] = useState<'start' | 'end' | 'middle' | 'thumb' | null>(null);

    const handleMouseDown = (target: 'start' | 'end' | 'middle', e: React.MouseEvent) => {
        if (playable && isPlaying) {
            e.preventDefault();
            return;
        }
        e.preventDefault();
        setIsDragging(true);
        setDragTarget(target);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        let percent = ((e.clientX - rect.left) / rect.width) * 100;
        percent = Math.max(0, Math.min(100, percent));

        const index = Math.round((percent / 100) * totalMonths);
        const startIndex = getMonthIndex(dateRange.from);
        const endIndex = getMonthIndex(dateRange.to);

        if (dragTarget === 'thumb' && playable) {
            const targetDate = getDateFromIndex(index);
            if (frames.length > 0 && onFrameChange) {
                let closestFrame = frames[0];
                let minDiff = Math.abs(targetDate.getTime() - closestFrame.getTime());

                for (const frame of frames) {
                    const diff = Math.abs(targetDate.getTime() - frame.getTime());
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestFrame = frame;
                    }
                }
                onFrameChange(closestFrame);
            }
        } else if (dragTarget === 'start') {
            if (index < endIndex && index >= 0 && index < totalMonths) {
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
            if (index > startIndex && index >= 0 && index < totalMonths) {
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
            const mid = startIndex + range / 2;
            const diff = index - mid;

            let newStart = startIndex + diff;
            let newEnd = endIndex + diff;

            if (newStart < 0) {
                newStart = 0;
                newEnd = range;
            }
            if (newEnd > totalMonths) {
                newEnd = totalMonths;
                newStart = totalMonths - range;
            }

            const newFrom = getDateFromIndex(newStart);
            const newTo = getDateFromIndex(newEnd);

            setDateRange({ from: newFrom, to: newTo });
            debouncedOnChange?.({ from: newFrom, to: newTo });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragTarget(null);
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
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

