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
            
            setSelectedIndicator(indicatorsData[1].indicatorId);
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
        const indicator = indicatorsData.find((ind: any) => ind.indicatorId === selectedIndicator);
        return indicator?.indicatorName || 'Indicator';
    }, [selectedIndicator, indicatorsData, isPopulationMode]);

    return {
        selectedIndicator,
        setSelectedIndicator,
        isPopulationMode,
        indicatorDisplayName,
        previousIndicatorRef,
    };
}

