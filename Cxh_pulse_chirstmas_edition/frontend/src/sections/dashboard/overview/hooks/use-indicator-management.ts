import { useState, useEffect, useRef, useMemo } from 'react';
import { POPULATION_INDICATOR_VALUE } from '../../../../components/location-filters/indicator-select';

type UseIndicatorManagementProps = {
    indicatorsData?: any[];
    onIndicatorChange?: (indicator: string) => void;
};

export function useIndicatorManagement({ indicatorsData, onIndicatorChange }: UseIndicatorManagementProps = {}) {
    const [selectedIndicator, setSelectedIndicator] = useState<string>('');
    const isPopulationMode = selectedIndicator === POPULATION_INDICATOR_VALUE;
    const previousIndicatorRef = useRef<string>('');

    // Auto-select first indicator when indicators data loads
    useEffect(() => {
        if (indicatorsData && indicatorsData.length > 0 && !selectedIndicator) {
            // Sort by section and select first indicator
            const sortedIndicators = [...indicatorsData].sort((a, b) =>
                (a.section || '').localeCompare(b.section || '')
            );
            setSelectedIndicator(sortedIndicators[0].indicator);
        }
    }, [indicatorsData, selectedIndicator]);

    // Track indicator changes
    useEffect(() => {
        if (previousIndicatorRef.current && previousIndicatorRef.current !== selectedIndicator) {
            onIndicatorChange?.(selectedIndicator);
        }
        previousIndicatorRef.current = selectedIndicator;
    }, [selectedIndicator, onIndicatorChange]);

    // Get indicator display name
    const indicatorDisplayName = useMemo(() => {
        if (isPopulationMode) return 'Population';
        if (!selectedIndicator || !indicatorsData) return 'Indicator';
        const indicator = indicatorsData.find((ind: any) => ind.indicator === selectedIndicator);
        return indicator?.mappedIndicatorName || indicator?.indicator || 'Indicator';
    }, [selectedIndicator, indicatorsData, isPopulationMode]);

    return {
        selectedIndicator,
        setSelectedIndicator,
        isPopulationMode,
        indicatorDisplayName,
        previousIndicatorRef,
    };
}

