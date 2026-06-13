import { useMemo } from 'react';
import { normalizeLocationName } from '../../../../utils/location-normalize';

type UseLocationDataProps = {
    wardsData?: Record<string, any[]>;
    county: string;
};

export function useLocationData({ wardsData, county }: UseLocationDataProps) {
    // Extract available subcounties from wardsData API
    const availableSubcounties = useMemo(() => {
        if (!wardsData || Object.keys(wardsData).length === 0) return [];
        return Object.keys(wardsData).sort();
    }, [wardsData]);

    // Extract available wards based on selected subcounty
    const availableWards = useMemo(() => {
        if (!wardsData || Object.keys(wardsData).length === 0) return [];

        if (county && county !== '') {
            const wards = Object.entries(wardsData).find(([key]) => {
                // Normalize both keys for comparison
                const normalizedKey = normalizeLocationName(key);
                const normalizedCounty = normalizeLocationName(county);
                return normalizedKey === normalizedCounty;
            })?.[1];
            return Array.isArray(wards) ? wards : [];
        }
        return Object.values(wardsData).flat();
    }, [wardsData, county]);

    const hierarchyData = useMemo(() => {
        if (!wardsData) return {};
        return wardsData;
    }, [wardsData]);

    return {
        availableSubcounties,
        availableWards,
        hierarchyData,
    };
}

