import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

type ChartHoverContextType = {
    hoveredDate: number | null; // Timestamp in milliseconds
    setHoveredDate: (date: number | null) => void;
    highlightMode: 'hover' | 'click';
    setHighlightMode: (mode: 'hover' | 'click') => void;
    clickedDate: number | null; // Timestamp for click mode
    setClickedDate: (date: number | null) => void;
};

const ChartHoverContext = createContext<ChartHoverContextType | undefined>(undefined);

export function ChartHoverProvider({ children }: { children: ReactNode }) {
    const [hoveredDate, setHoveredDate] = useState<number | null>(null);
    const [highlightMode, setHighlightMode] = useState<'hover' | 'click'>('click');
    const [clickedDate, setClickedDate] = useState<number | null>(null);

    const handleSetHoveredDate = useCallback((date: number | null) => {
        if (highlightMode === 'hover') {
            setHoveredDate(date);
        }
    }, [highlightMode]);

    const handleSetClickedDate = useCallback((date: number | null) => {
        setClickedDate(date);
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        hoveredDate,
        setHoveredDate: handleSetHoveredDate,
        highlightMode,
        setHighlightMode,
        clickedDate,
        setClickedDate: handleSetClickedDate,
    }), [hoveredDate, handleSetHoveredDate, highlightMode, clickedDate, handleSetClickedDate]);

    return (
        <ChartHoverContext.Provider value={contextValue}>
            {children}
        </ChartHoverContext.Provider>
    );
}

/**
 * Default context value for when provider is not available
 * This allows components to work without the provider (e.g., in ClimateView)
 */
const defaultContextValue: ChartHoverContextType = {
    hoveredDate: null,
    setHoveredDate: () => { },
    highlightMode: 'click',
    setHighlightMode: () => { },
    clickedDate: null,
    setClickedDate: () => { },
};

export function useChartHover() {
    const context = useContext(ChartHoverContext);
    // Return default values if provider is not available (defensive approach)
    // This allows components to work in contexts where the provider isn't needed
    if (context === undefined) {
        return defaultContextValue;
    }
    return context;
}

