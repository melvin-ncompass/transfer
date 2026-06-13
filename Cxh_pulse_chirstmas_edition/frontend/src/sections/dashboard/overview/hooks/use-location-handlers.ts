import { useCallback } from 'react';
import { normalizeLocationName } from '../../../../utils/location-normalize';
import { POPULATION_INDICATOR_VALUE } from '../../../../components/location-filters/indicator-select';

type UseLocationHandlersProps = {
    setCounty: (value: string | ((prev: string) => string)) => void;
    setWard: (value: string) => void;
    setSelectionMode: (mode: 'subcounty' | 'ward') => void;
    isPopulationMode: boolean;
    wardsData: any;
};

export function useLocationHandlers({
    setCounty,
    setWard,
    setSelectionMode,
    isPopulationMode,
    wardsData,
}: UseLocationHandlersProps) {
    const handleCountyChange = useCallback((value: string) => {
        setCounty(value);
        setWard('');
        if (isPopulationMode) {
            if (value) {
                setSelectionMode('subcounty');
            } else {
                setSelectionMode('subcounty');
            }
        }
    }, [isPopulationMode, setCounty, setWard, setSelectionMode]);

    const handleWardChange = useCallback((value: string) => {
        setWard(value);
        if (isPopulationMode) {
            if (value) {
                setSelectionMode('ward');
                if (wardsData) {
                    const parentSubcounty = Object.entries(wardsData).find(([_, wards]) => {
                        const wardsArray = Array.isArray(wards) ? wards : [];
                        return wardsArray.some(w => normalizeLocationName(w) === normalizeLocationName(value));
                    })?.[0];
                    if (parentSubcounty) {
                        setCounty((prevCounty: string) => prevCounty || parentSubcounty);
                    }
                }
            } else {
                setSelectionMode('subcounty');
            }
        } else {
            if (value && wardsData) {
                const parentSubcounty = Object.entries(wardsData).find(([_, wards]) => {
                    const wardsArray = Array.isArray(wards) ? wards : [];
                    return wardsArray.some(w => normalizeLocationName(w) === normalizeLocationName(value));
                })?.[0];
                if (parentSubcounty) {
                    setCounty((prevCounty) => prevCounty || parentSubcounty);
                }
            }
        }
    }, [isPopulationMode, wardsData, setWard, setSelectionMode, setCounty]);

    return {
        handleCountyChange,
        handleWardChange,
    };
}

