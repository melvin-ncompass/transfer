import { Box, CircularProgress, Stack } from '@mui/material';
import DateRangeSlider from '../../../../components/custom-date-range-picker/date-range-picker';
import { LocationSelector } from '../../../../components/location-selector';
import { IndicatorSelect } from '../../../../components/location-filters/indicator-select';
import { DATE_RANGE_MAX_MONTH, DATE_RANGE_MIN_MONTH, DATE_RANGE_MAX_YEAR, DATE_RANGE_MIN_YEAR } from '../../../../store/constants';
import { overviewFiltersStyles } from '../../../../styles/sections/overview-filters.styles';
import type { OverviewFiltersProps } from '../../../../types/sections.types';

export function OverviewFilters({
    selectedIndicator,
    setSelectedIndicator,
    county,
    setCounty,
    ward,
    setWard,
    dateRange,
    setDateRange,
    availableSubcounties,
    availableWards,
    hierarchyData,
    isLoadingWards,
    isPopulationMode,
    selectionMode,
    setSelectionMode,
    wardsData,
    isPlaying,
    setIsPlaying,
    currentFrameDate,
    frameDates,
    setFrameIdx,
    isLooping,
    setIsLooping,
    showAll,
    setShowAll,
    framesLength,
    isLoadingIndicator,
    isFetchingIndicator,
    onCountyChange,
    onWardChange,
    onPlayToggle,
    onLoopToggle,
    onShowAllToggle,
}: OverviewFiltersProps) {
    return (
        <Box sx={overviewFiltersStyles.container}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                <Box sx={overviewFiltersStyles.indicatorSelectBox}>
                    <IndicatorSelect
                        value={selectedIndicator}
                        onChange={setSelectedIndicator}
                        label="Indicator"
                        placeholder="Select indicator..."
                        enablePopulationOption
                        maxWidth={300}
                    />
                </Box>
                <Box sx={overviewFiltersStyles.locationSelectorBox}>
                    {isLoadingWards && (
                        <Box sx={overviewFiltersStyles.loadingIndicatorOverlay}>
                            <CircularProgress size={20} />
                        </Box>
                    )}
                    <LocationSelector
                        level2Options={availableSubcounties}
                        level2Selected={county}
                        onLevel2Change={onCountyChange}
                        level3Options={availableWards}
                        level3Selected={ward}
                        onLevel3Change={onWardChange}
                        hierarchyData={hierarchyData}
                        size="small"
                        maxWidth="100%"
                        filterMode="all"
                    />
                </Box>
                <Box sx={overviewFiltersStyles.dateRangeSliderBox}>
                    <DateRangeSlider
                        minYear={DATE_RANGE_MIN_YEAR}
                        maxYear={DATE_RANGE_MAX_YEAR}
                        minMonth={DATE_RANGE_MIN_MONTH}
                        maxMonth={DATE_RANGE_MAX_MONTH}
                        initialFrom={dateRange.from}
                        initialTo={dateRange.to}
                        onChange={setDateRange}
                        playable={!isPopulationMode && !!selectedIndicator && framesLength > 0}
                        isPlaying={isPlaying}
                        currentFrame={showAll ? null : currentFrameDate}
                        onPlayToggle={onPlayToggle}
                        onFrameChange={(frame: Date) => {
                            const index = frameDates.findIndex(d => d.getTime() === frame.getTime());
                            if (index !== -1) setFrameIdx(index);
                        }}
                        frames={frameDates}
                        isLooping={isLooping}
                        onLoopToggle={onLoopToggle}
                        showAll={showAll}
                        onShowAllToggle={onShowAllToggle}
                        isLoading={isLoadingIndicator || isFetchingIndicator}
                    />
                </Box>
            </Stack>
        </Box>
    );
}

