import { Box, Stack } from '@mui/material';
import { useGetDkhisWardsQuery } from '../../../../api';
import { useMemo, useEffect, useCallback, useState } from 'react';
import DateRangeSlider from '../../../../components/custom-date-range-picker/date-range-picker';
import { LocationSelector } from '../../../../../src/components/location-selector/location-selector-v1'
import { useLocationData } from '../../overview/hooks/use-location-data';
// import { climateAndHealthFilterStyles } from '../../../../styles/sections/climate-and-health-filter.styles';
// import type { ClimateAndHealthFilterProps } from '../../../../types/sections.types';



type ClimateAndHealthFilterProps = {
    /** Selected County */
    selectedCounty: string;
    /** Selected subcounty */
    selectedSubCounty: string;
    /** Selected ward */
    selectedWard: string;
    /** Callback when county changes */
    onCountyChange?: (value: string) => void;
    /** Callback when Subcounty changes */
    onSubCountyChange?: (value: string) => void;
    /** Callback when ward changes */
    onWardChange?: (value: string) => void;
    /** Date range picker props */
    dateRangeProps: {
        minYear?: number;
        maxYear?: number;
        minMonth?: number;
        maxMonth?: number;
        initialFrom: Date;
        initialTo: Date;
        onChange?: (range: { from: Date; to: Date }) => void;
    };
    /** Whether in fullscreen mode (for z-index) */
    isFullscreen?: boolean;
};

// ----------------------------------------------------------------------

/**
 * ClimateAndHealthFilter - Filter component for Climate and Health view
 *
 * Contains:
 * - LocationSelector (hierarchical location selector for county/subcounty and ward)
 * - Date range picker
 */
export function ClimateAndHealthFilter({
    selectedCounty,
    selectedSubCounty,
    selectedWard,
    onCountyChange,
    onSubCountyChange,
    onWardChange,
    dateRangeProps,
    isFullscreen = false,
}: ClimateAndHealthFilterProps) {
    // Fetch wards data from API (contains county/subcounty -> wards mapping)
    const { data: wardsData } = useGetDkhisWardsQuery();

        // Location data processing
    const { countyData, availableSubcounties, availableWards, hierarchyData } = useLocationData({
        wardsData
    });

    useEffect(() => {
    if (countyData?.id) {
        onCountyChange?.(countyData.id);
    }
    }, [countyData?.id, onCountyChange]);


    // Extract available counties/subcounties from API response
    const availableCounties = useMemo(() => {
        if (!wardsData || Object.keys(wardsData).length === 0) return [];
        return Object.keys(wardsData).sort();
    }, [wardsData]);

    // Extract available wards based on selected county
    // const availableWards = useMemo(() => {
    //     if (!wardsData || Object.keys(wardsData).length === 0) return [];

    //     if (selectedSubCounty && selectedSubCounty !== '') {
    //         const wards = Object.entries(wardsData).find(([key]) => key === selectedSubCounty)?.[1];
    //         return Array.isArray(wards) ? wards : [];
    //     }
    //     return Object.values(wardsData).flat();
    // }, [wardsData, selectedSubCounty]);

    // Reset ward when county changes (if ward is no longer valid for the new county)
    // useEffect(() => {
    //     if (selectedSubCounty && selectedWard && !availableWards.includes(selectedWard)) {
    //         // Current ward is not valid for the selected county, reset it
    //         onWardChange?.('');
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [selectedSubCounty]); // Only depend on selectedCounty to avoid infinite loops

    const resetLocation = useCallback(() => {
        // setWard('');
        // setCounty('');
    }, []);



    return (
        <Box
            sx={{
                p: 1.5,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                flexShrink: 0,
                position: 'sticky',
                top: { xs: '56px', md: '60px' },
                zIndex: 10,
            }}
        >   <Box sx={{ display:'flex', gap:{ xs: 2, md: 2 }, alignItems:'center', flexDirection:{xs:'column', md:'row'}}}
            >
                {/* Location Selector - Hierarchical selection (County/Subcounty > Ward) */}
                {(availableCounties.length > 0 || availableWards.length > 0) && (
                    <Box sx={{width:'100%', flex: {xs: 'unset', md: '1 1 30%' } }}>
                    <LocationSelector
                            level1Option={countyData}
                            level2Options={availableSubcounties}
                            selectedSubcountyId={selectedSubCounty}
                            onSubcountyChange={(id) => onSubCountyChange?.(id)}
                            level3Options={availableWards}
                            selectedWardId={selectedWard}
                            onWardChange={(id) => onWardChange?.(id)}
                            hierarchyData={hierarchyData}
                            onLocationSelect={({ subcountyId, wardId }) => {
                                if (subcountyId) {
                                    onSubCountyChange?.(subcountyId);
                                }
                            if (wardId) {
                                onWardChange?.(wardId);
                            }
                        }}
                        size="small"
                        onResetLocation={resetLocation}
                        />
                    </Box>
                )}

                {/* Date Range Picker */}
                <Box sx={{ width: '100%', flex: {xs: 'unset', md: '1 1 70%' }}}>
                    <DateRangeSlider
                        minYear={dateRangeProps.minYear}
                        maxYear={dateRangeProps.maxYear}
                        minMonth={dateRangeProps.minMonth}
                        maxMonth={dateRangeProps.maxMonth}
                        initialFrom={dateRangeProps.initialFrom}
                        initialTo={dateRangeProps.initialTo}
                        onChange={dateRangeProps.onChange}
                    />
                </Box>
            </Box>
        </Box>
    );
}
