import { useMemo, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Stack } from '@mui/material';
import { useGetDkhisWardsQuery } from '../../api';
import { countyWardSelectStyles } from '../../styles/components/county-ward-select.styles';

// ----------------------------------------------------------------------

// Helper function to remove "ward" and "subcounty" suffixes from location names
const removeLocationSuffix = (name: string): string => {
    if (!name) return name;
    return name
        .replace(/\s+ward$/i, '')
        .replace(/ward$/i, '')
        .replace(/\s+sub\s+county$/i, '')
        .replace(/subcounty$/i, '')
        .replace(/\s+sub\s+county$/i, '')
        .trim();
};

// Helper function to convert string to title case
const toTitleCase = (str: string): string => {
    if (!str) return str;
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// ----------------------------------------------------------------------

import type { CountyAndWardSelectProps } from '../../types/component.types';

/**
 * CountyAndWardSelect - Combined county and ward filter component
 * 
 * Fetches data from API once and handles both county and ward selection.
 * Ward options are automatically filtered based on selected county.
 * Automatically resets ward when county changes.
 */
export function CountyAndWardSelect({
    selectedCounty,
    selectedWard,
    onCountyChange,
    onWardChange,
    countyLabel = 'County',
    wardLabel = 'Ward',
    countyPlaceholder = 'Search county...',
    wardPlaceholder = 'Search ward...',
    disablePortal = true,
    zIndex,
    maxWidth = 250,
    direction = 'row',
    spacing = 2,
}: CountyAndWardSelectProps) {
    // Fetch wards data from API once (contains county/subcounty -> wards mapping)
    const { data: wardsData, isLoading } = useGetDkhisWardsQuery();

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

    if (isLoading) {
        return (
            <Stack direction={direction} spacing={spacing} sx={countyWardSelectStyles.loadingStack(spacing)}>
                <Box sx={countyWardSelectStyles.loadingBox(maxWidth)}>
                    <CircularProgress size={20} />
                    <TextField size="small" label={countyLabel} disabled placeholder="Loading..." sx={countyWardSelectStyles.loadingTextField} />
                </Box>
                <Box sx={countyWardSelectStyles.loadingBox(maxWidth)}>
                    <CircularProgress size={20} />
                    <TextField size="small" label={wardLabel} disabled placeholder="Loading..." sx={countyWardSelectStyles.loadingTextField} />
                </Box>
            </Stack>
        );
    }

    return (
        <Stack direction={direction} spacing={spacing} sx={countyWardSelectStyles.stack(spacing)}>
            {/* County Filter */}
            {availableCounties.length > 0 && (
                <Autocomplete
                    size="small"
                    options={['', ...availableCounties]}
                    value={selectedCounty || ''}
                    onChange={(_, newValue) => {
                        const optionValue = Array.isArray(newValue) ? newValue[0] || '' : newValue || '';
                        onCountyChange(optionValue);
                    }}
                    getOptionLabel={(option) => {
                        const optionStr = Array.isArray(option) ? option[0] || '' : option || '';
                        return optionStr === '' ? `All ${countyLabel}s` : toTitleCase(removeLocationSuffix(optionStr));
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label={countyLabel} placeholder={countyPlaceholder} />
                    )}
                    style={{ marginLeft: 0 }}
                    sx={countyWardSelectStyles.autocomplete(maxWidth)}
                    disableClearable={false}
                    disablePortal={disablePortal}
                    ListboxProps={{
                        style: { zIndex: zIndex || undefined },
                    }}
                    slotProps={{
                        popper: {
                            style: { zIndex: zIndex || undefined },
                            placement: 'bottom-start',
                        },
                        paper: {
                            style: { zIndex: zIndex || undefined },
                        },
                    }}
                />
            )}

            {/* Ward Filter */}
            {availableWards.length > 0 && (
                <Autocomplete
                    size="small"
                    options={['', ...availableWards]}
                    value={selectedWard || ''}
                    onChange={(_, newValue) => {
                        const optionValue = Array.isArray(newValue) ? newValue[0] || '' : newValue || '';
                        onWardChange(optionValue);
                    }}
                    getOptionLabel={(option) => {
                        const optionStr = Array.isArray(option) ? option[0] || '' : option || '';
                        return optionStr === '' ? `All ${wardLabel}s` : toTitleCase(removeLocationSuffix(optionStr));
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label={wardLabel} placeholder={wardPlaceholder} />
                    )}
                    style={{ marginLeft: 0 }}
                    sx={countyWardSelectStyles.autocomplete(maxWidth)}
                    disableClearable={false}
                    disablePortal={disablePortal}
                    ListboxProps={{
                        style: { zIndex: zIndex || undefined },
                    }}
                    slotProps={{
                        popper: {
                            style: { zIndex: zIndex || undefined },
                            placement: 'bottom-start',
                        },
                        paper: {
                            style: { zIndex: zIndex || undefined },
                        },
                    }}
                />
            )}
        </Stack>
    );
}

