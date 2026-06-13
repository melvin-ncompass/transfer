import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { RiskCategory, PriorityLevel } from './constants';

// ----------------------------------------------------------------------

type PromptFilterContextType = {
    selectedCategory: RiskCategory | null;
    selectedPriorityByCategory: Partial<Record<RiskCategory, PriorityLevel | null>>;
    selectedPriority: PriorityLevel | null;
    setCategory: (category: RiskCategory | null) => void;
    setPriority: (category: RiskCategory, priority: PriorityLevel | null) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
};

const PromptFilterContext = createContext<PromptFilterContextType | undefined>(undefined);

// ----------------------------------------------------------------------

type PromptFilterProviderProps = {
    children: ReactNode;
};

/**
 * PromptFilterProvider - Context provider for managing cross-chart filters
 * 
 * Manages:
 * - Selected category (maternal_risk | baby_risk | null)
 * - Selected priority (danger sign/urgent | high | low | null)
 * 
 * Provides:
 * - Filter state
 * - Setter functions
 * - Clear filters function
 */
export function PromptFilterProvider({ children }: PromptFilterProviderProps) {
    const [selectedCategory, setSelectedCategory] = useState<RiskCategory | null>(null);
    const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | null>(null);
    const [selectedPriorityByCategory, setSelectedPriorityByCategory] = useState<Partial<Record<RiskCategory, PriorityLevel | null>>>({});

    const setCategory = useCallback((category: RiskCategory | null) => {
        // Toggle: if clicking the same category, clear it
        setSelectedCategory((prev) => (prev === category ? null : category));
    }, []);

    const setPriority = useCallback(
        (category: RiskCategory, priority: PriorityLevel | null) => {
        setSelectedPriorityByCategory((prev) => ({
            ...prev,
            [category]: prev[category] === priority ? null : priority,
        }));
        },
        []
    );

    const clearFilters = useCallback(() => {
        setSelectedCategory(null);
        setSelectedPriority(null);
        setSelectedPriorityByCategory({})
    }, []);

    const hasActiveFilters = selectedCategory !== null || Object.values(selectedPriorityByCategory).some(Boolean);

    return (
        <PromptFilterContext.Provider
            value={{
                selectedCategory,
                selectedPriorityByCategory,
                selectedPriority,
                setCategory,
                setPriority,
                clearFilters,
                hasActiveFilters,
            }}
        >
            {children}
        </PromptFilterContext.Provider>
    );
}

// ----------------------------------------------------------------------

/**
 * usePromptFilter - Hook to access prompt filter context
 * 
 * @throws Error if used outside PromptFilterProvider
 */
export function usePromptFilter(): PromptFilterContextType {
    const context = useContext(PromptFilterContext);
    if (context === undefined) {
        throw new Error('usePromptFilter must be used within a PromptFilterProvider');
    }
    return context;
}

