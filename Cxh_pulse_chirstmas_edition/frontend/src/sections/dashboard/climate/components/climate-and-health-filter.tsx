import { Box, Stack } from '@mui/material';
import { LocationSelector } from '../../../../components/location-selector';
import { useGetDkhisWardsQuery } from '../../../../api';
import { useMemo, useEffect } from 'react';
import DateRangeSlider from '../../../../components/custom-date-range-picker/date-range-picker';
// import { climateAndHealthFilterStyles } from '../../../../styles/sections/climate-and-health-filter.styles';
// import type { ClimateAndHealthFilterProps } from '../../../../types/sections.types';



type ClimateAndHealthFilterProps = {
    /** Selected county/subcounty */
    selectedCounty: string;
    /** Selected ward */
    selectedWard: string;
    /** Callback when county changes */
    onCountyChange: (value: string) => void;
    /** Callback when ward changes */
    onWardChange: (value: string) => void;
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
    selectedWard,
    onCountyChange,
    onWardChange,
    dateRangeProps,
    isFullscreen = false,
}: ClimateAndHealthFilterProps) {
    // Fetch wards data from API (contains county/subcounty -> wards mapping)
    const { data: wardsData } = useGetDkhisWardsQuery();

    // Extract available counties/subcounties from API response
    const availableCounties = useMemo(() => {
        if (!wardsData || Object.keys(wardsData).length === 0) return [];
        return Object.keys(wardsData).sort();
    }, [wardsData]);

    // Extract available wards based on selected county
    const availableWards = useMemo(() => {
        if (!wardsData || Object.keys(wardsData).length === 0) return [];

        if (selectedCounty && selectedCounty !== '') {
            const wards = Object.entries(wardsData).find(([key]) => key === selectedCounty)?.[1];
            return Array.isArray(wards) ? wards : [];
        }
        return Object.values(wardsData).flat();
    }, [wardsData, selectedCounty]);

    // Reset ward when county changes (if ward is no longer valid for the new county)
    useEffect(() => {
        if (selectedCounty && selectedWard && !availableWards.includes(selectedWard)) {
            // Current ward is not valid for the selected county, reset it
            onWardChange('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCounty]); // Only depend on selectedCounty to avoid infinite loops

    return (
        <Box
            sx={{
                p: 1.5,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                flexShrink: 0,
            }}
        >            <Stack
                direction="row"
                spacing={{ xs: 0, md: 2 }}
                alignItems="center"
                sx={{
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                {/* Location Selector - Hierarchical selection (County/Subcounty > Ward) */}
                {(availableCounties.length > 0 || availableWards.length > 0) && (
                    <LocationSelector
                        // Level 2: Counties/Subcounties
                        level2Options={availableCounties}
                        level2Selected={selectedCounty}
                        onLevel2Change={onCountyChange}

                        // Level 3: Wards
                        level3Options={availableWards}
                        level3Selected={selectedWard}
                        onLevel3Change={onWardChange}

                        // Hierarchy: Maps county/subcounty -> wards (for lookup)
                        hierarchyData={wardsData}

                        // UI customization
                        size="small"
                        maxWidth={280}
                        isFullscreen={isFullscreen}
                        label="Location"
                        placeholder="Select location..."
                    />
                )}

                {/* Date Range Picker */}
                <Box sx={{ flex: 1, minWidth: { xs: 180, md: 400 } }}>
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
            </Stack>
        </Box>
    );
}
