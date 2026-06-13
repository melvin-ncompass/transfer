import { Box, Button, Stack } from '@mui/material';
import { Iconify } from '../../../components/iconify';
// import { LocationSelector } from '../../../components/location-selector';
import { IndicatorSelect } from '../../../components/location-filters';
import { FacilityToggle } from '../../../components/secured-components/insights-layout/facility-toggle';
import DateRangeSlider from '../../../components/custom-date-range-picker/date-range-picker';
import { DATE_RANGE_MIN_YEAR, DATE_RANGE_MAX_YEAR, DATE_RANGE_MIN_MONTH, DATE_RANGE_MAX_MONTH, getDateLastYearDate, getDateRangeMaxDate } from '../../../store/constants';
import { PermissionName } from '../../../types/permissions';
import { insightsLayoutComponentStyles } from '../../../styles/layouts/insights-layout.styles';
import type { InsightsDataProps } from '../../../types/insights.types';
import type { UseDashboardFiltersReturn } from './dashboard-filters-section.types';

type DashboardFiltersSectionProps = {
    filters: UseDashboardFiltersReturn;
    insightsData: InsightsDataProps;
    isFullscreen: boolean;
    hideIndicatorSelector?: boolean;
    hideLocationSelector?: boolean;
    enablePopulationOption?: boolean;
    enableAnimation?: boolean;
    dateRangeConfig?: {
        minYear?: number;
        maxYear?: number;
        minMonth?: number;
        maxMonth?: number;
    };
    parentPermission?: PermissionName;
    onFullscreen: () => void;
    onResetFilters: () => void;
};

export function DashboardFiltersSection({
    filters,
    insightsData,
    isFullscreen,
    hideIndicatorSelector = false,
    hideLocationSelector = false,
    enablePopulationOption = false,
    enableAnimation = false,
    dateRangeConfig,
    parentPermission,
    onFullscreen,
    onResetFilters,
}: DashboardFiltersSectionProps) {
    const {
        selectedIndicator,
        setSelectedIndicator,
        selectedSubcounty,
        setSelectedSubcounty,
        selectedWard,
        setSelectedWard,
        dateRange,
        setDateRange,
        selectedMonthRange,
        setSelectedMonthRange,
        showFacilities,
        setShowFacilities,
        isLoadingTemperature,
        isPopulationMode,
        isPlaying,
        setIsPlaying,
        isLooping,
        setIsLooping,
        playing,
        setPlaying,
        frameDates,
        currentFrameDate,
        frameIdx,
        setFrameIdx,
        frames,
        availableSubcounties,
        availableWards,
    } = filters;

    return (
        <Box sx={insightsLayoutComponentStyles.filtersRow(isFullscreen)}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems="flex-start"
                justifyContent="space-between"
                sx={insightsLayoutComponentStyles.filtersStack}
            >
                {/* LEFT: All Filters */}
                <Stack
                    direction={{ xs: 'column', sm: 'row', md: 'row' }}
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    spacing={2}
                    sx={insightsLayoutComponentStyles.leftFiltersStack}
                >
                    {/* Indicator - Optional */}
                    {!hideIndicatorSelector && (
                        <IndicatorSelect
                            value={selectedIndicator}
                            onChange={setSelectedIndicator}
                            label="Indicator"
                            placeholder="No indicator selected"
                            disablePortal={false}
                            zIndex={isFullscreen ? 10001 : undefined}
                            maxWidth={250}
                            enablePopulationOption={enablePopulationOption}
                        />
                    )}

                    {/* Location Selector - Optional */}
                    {/* {!hideLocationSelector && (availableSubcounties.length > 0 || availableWards.length > 0) && (
                        <LocationSelector
                            level2Options={availableSubcounties as string[]}
                            level2Selected={selectedSubcounty}
                            onLevel2Change={setSelectedSubcounty}
                            level3Options={availableWards as string[]}
                            level3Selected={selectedWard}
                            onLevel3Change={setSelectedWard}
                            hierarchyData={insightsData.wardsData}
                            size="small"
                            maxWidth={280}
                            isFullscreen={isFullscreen}
                            label="Location"
                            placeholder="Select location..."
                        />
                    )} */}

                    {/* Month Range */}
                    <Box sx={insightsLayoutComponentStyles.dateRangeContainer}>
                        <DateRangeSlider
                            minYear={dateRangeConfig?.minYear ?? DATE_RANGE_MIN_YEAR}
                            maxYear={dateRangeConfig?.maxYear ?? DATE_RANGE_MAX_YEAR}
                            minMonth={dateRangeConfig?.minMonth ?? DATE_RANGE_MIN_MONTH}
                            maxMonth={dateRangeConfig?.maxMonth ?? DATE_RANGE_MAX_MONTH}
                            initialFrom={dateRange?.from ?? getDateLastYearDate()}
                            initialTo={dateRange?.to ?? getDateRangeMaxDate()}
                            onChange={(range) => {
                                setDateRange(range);
                                const fromMonth = `${range.from.getFullYear()}-${String(range.from.getMonth() + 1).padStart(2, '0')}`;
                                const toMonth = `${range.to.getFullYear()}-${String(range.to.getMonth() + 1).padStart(2, '0')}`;
                                setSelectedMonthRange([fromMonth, toMonth]);
                            }}
                            playable={enableAnimation && !isPopulationMode && !!selectedIndicator && frames.length > 0}
                            isPlaying={isPlaying}
                            currentFrame={currentFrameDate}
                            onPlayToggle={() => setPlaying(!playing)}
                            onFrameChange={(frame) => {
                                const index = frameDates.findIndex(d => d.getTime() === frame.getTime());
                                if (index !== -1) setFrameIdx(index);
                            }}
                            frames={frameDates}
                            isLooping={isLooping}
                            onLoopToggle={() => setIsLooping((l: boolean) => !l)}
                        />
                    </Box>

                    {/* Temperature / Precipitation / Facilities */}
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={insightsLayoutComponentStyles.togglesStack}
                    >
                        {selectedMonthRange && (
                            <FacilityToggle
                                parentPermission={parentPermission}
                                showFacilities={showFacilities}
                                setShowFacilities={setShowFacilities}
                                isLoadingTemperature={isLoadingTemperature}
                            />
                        )}
                    </Stack>
                </Stack>

                {/* RIGHT: Action Buttons */}
                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={insightsLayoutComponentStyles.actionButtonsStack}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Iconify icon={'solar:restart-bold' as any} width={18} />}
                        onClick={onResetFilters}
                    >
                        Reset Filters
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={onFullscreen}
                        startIcon={
                            <Iconify
                                icon={
                                    isFullscreen
                                        ? ('solar:minimize-bold' as any)
                                        : ('solar:maximize-bold' as any)
                                }
                                width={18}
                            />
                        }
                    >
                        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}

