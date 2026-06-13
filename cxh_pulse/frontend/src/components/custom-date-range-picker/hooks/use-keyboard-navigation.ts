import { useEffect, useRef, useState } from 'react';
import type { DateRange } from '../types';

type UseKeyboardNavigationProps = {
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;
    debouncedOnChange: (range: DateRange) => void;
    getMonthIndex: (date: Date) => number;
    getDateFromIndex: (index: number) => Date;
    totalMonths: number;
};

export function useKeyboardNavigation({
    dateRange,
    setDateRange,
    debouncedOnChange,
    getMonthIndex,
    getDateFromIndex,
    totalMonths,
}: UseKeyboardNavigationProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                (activeElement as HTMLElement).isContentEditable ||
                (activeElement as HTMLElement).getAttribute('role') === 'textbox'
            );

            if (isInputFocused && !isFocused) {
                return;
            }

            let { from, to } = dateRange;
            const _startIndex = getMonthIndex(from);
            const _endIndex = getMonthIndex(to);

            if (isFocused) {
                if (e.key === 'ArrowRight') {
                    if (_endIndex < totalMonths - 1) {
                        e.preventDefault();
                        from = getDateFromIndex(_startIndex + 1);
                        to = getDateFromIndex(_endIndex + 1);
                        setDateRange({ from, to });
                        debouncedOnChange({ from, to });
                    }
                } else if (e.key === 'ArrowLeft') {
                    if (_startIndex > 0) {
                        e.preventDefault();
                        from = getDateFromIndex(_startIndex - 1);
                        to = getDateFromIndex(_endIndex - 1);
                        setDateRange({ from, to });
                        debouncedOnChange({ from, to });
                    }
                } else if (e.key === 'ArrowUp') {
                    if (_endIndex < totalMonths - 1) {
                        e.preventDefault();
                        to = getDateFromIndex(_endIndex + 1);
                        setDateRange({ from, to });
                        debouncedOnChange({ from, to });
                    }
                } else if (e.key === 'ArrowDown') {
                    if (_endIndex - _startIndex > 1) {
                        e.preventDefault();
                        to = getDateFromIndex(_endIndex - 1);
                        setDateRange({ from, to });
                        debouncedOnChange({ from, to });
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dateRange, totalMonths, isFocused, getMonthIndex, getDateFromIndex, setDateRange, debouncedOnChange]);

    return {
        containerRef,
        isFocused,
        setIsFocused,
    };
}

