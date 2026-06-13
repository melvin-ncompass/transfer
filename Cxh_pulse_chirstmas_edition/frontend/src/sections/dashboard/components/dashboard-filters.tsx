import { memo } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { Iconify } from '../../../components/iconify';
import { LocationSelector } from '../../../components/location-selector';
import { IndicatorSelect } from '../../../components/location-filters';
import DateRangeSlider from '../../../components/custom-date-range-picker/date-range-picker';
import { FacilityToggle } from '../../../components/secured-components/insights-layout/facility-toggle';
import { PermissionName } from '../../../types/permissions';
import { insightsLayoutComponentStyles } from '../../../styles/layouts/insights-layout.styles';

type DashboardFiltersProps = {
    // Indicator
    selectedIndicator: string;
    onIndicatorChange: (indicator: string) => void;
    hideIndicatorSelector?: boolean;
    enablePopulationOption?: boolean;

    // Location
    availableSubcounties: string[];
    availableWards: string[];
    selectedSubcounty: string;
    selectedWard: string;
    onSubcountyChange: (subcounty: string) => void;
    onWardChange: (ward: string) => void;
    wardsData: any;
    hideLocationSelector?: boolean;

    // Date Range
    dateRange: { from: Date; to: Date } | null;
    onDateRangeChange: (range: { from: Date; to: Date }) => void;
    dateRangeConfig?: {
        minYear?: number;
        maxYear?: number;
        minMonth?: number;
        maxMonth?: number;
    };

    // Animation
    enableAnimation?: boolean;
    isPopulationMode?: boolean;
    frames: Date[];
    frameDates: Date[];
    currentFrameDate: Date | null;
    isPlaying: boolean;
    onPlayToggle: () => void;
    onFrameChange: (frame: Date) => void;
    frameIdx: number;
    setFrameIdx: (idx: number) => void;
    isLooping: boolean;
    onLoopToggle: () => void;

    // Toggles
    selectedMonthRange: [string, string] | null;
    showFacilities: boolean;
    onShowFacilitiesChange: (show: boolean) => void;
    parentPermission?: PermissionName;
    isLoadingTemperature: boolean;

    // Actions
    onResetFilters: () => void;
    onFullscreen: () => void;
    isFullscreen: boolean;
};

/**
 * DashboardFilters - Extracted filter controls from DashboardLayout
 * 
 * Handles:
 * - Indicator selection
 * - Location selection (subcounty, ward)
 * - Date range picker with animation controls
 * - Layer toggles (facilities, temperature, precipitation)
 * - Reset and fullscreen actions
 */
export const DashboardFilters = memo(function DashboardFilters({
    selectedIndicator,
    onIndicatorChange,
    hideIndicatorSelector = false,
    enablePopulationOption = false,
    availableSubcounties,
    availableWards,
    selectedSubcounty,
    selectedWard,
    onSubcountyChange,
    onWardChange,
    wardsData,
    hideLocationSelector = false,
    dateRange,
    onDateRangeChange,
    dateRangeConfig,
    enableAnimation = false,
    isPopulationMode = false,
    frames,
    frameDates,
    currentFrameDate,
    isPlaying,
    onPlayToggle,
    onFrameChange,
    frameIdx,
    setFrameIdx,
    isLooping,
    onLoopToggle,
    selectedMonthRange,
    showFacilities,
    onShowFacilitiesChange,
    parentPermission,
    isLoadingTemperature,
    onResetFilters,
    onFullscreen,
    isFullscreen,
}: DashboardFiltersProps) {
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
                    {/* Indicator Selector */}
                    {!hideIndicatorSelector && (
                        <IndicatorSelect
                            value={selectedIndicator}
                            onChange={onIndicatorChange}
                            label="Indicator"
                            placeholder="No indicator selected"
                            disablePortal={false}
                            zIndex={isFullscreen ? 10001 : undefined}
                            maxWidth={250}
                            enablePopulationOption={enablePopulationOption}
                        />
                    )}

                    {/* Location Selector */}
                    {!hideLocationSelector && (availableSubcounties.length > 0 || availableWards.length > 0) && (
                        <LocationSelector
                            level2Options={availableSubcounties}
                            level2Selected={selectedSubcounty}
                            onLevel2Change={onSubcountyChange}
                            level3Options={availableWards}
                            level3Selected={selectedWard}
                            onLevel3Change={onWardChange}
                            hierarchyData={wardsData}
                            size="small"
                            maxWidth={280}
                            isFullscreen={isFullscreen}
                            label="Location"
                            placeholder="Select location..."
                        />
                    )}

                    {/* Date Range Slider */}
                    <Box sx={insightsLayoutComponentStyles.dateRangeContainer}>
                        <DateRangeSlider
                            minYear={dateRangeConfig?.minYear ?? 2022}
                            maxYear={dateRangeConfig?.maxYear ?? 2025}
                            minMonth={dateRangeConfig?.minMonth ?? 1}
                            maxMonth={dateRangeConfig?.maxMonth ?? 12}
                            initialFrom={dateRange?.from ?? new Date(2024, 0, 1)}
                            initialTo={dateRange?.to ?? new Date()}
                            onChange={onDateRangeChange}
                            playable={enableAnimation && !isPopulationMode && !!selectedIndicator && frames.length > 0}
                            isPlaying={isPlaying}
                            currentFrame={currentFrameDate}
                            onPlayToggle={onPlayToggle}
                            onFrameChange={(frame) => {
                                const index = frameDates.findIndex((d) => d.getTime() === frame.getTime());
                                if (index !== -1) setFrameIdx(index);
                            }}
                            frames={frameDates}
                            isLooping={isLooping}
                            onLoopToggle={onLoopToggle}
                        />
                    </Box>

                    {/* Toggles (Facilities, etc.) */}
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
                                setShowFacilities={onShowFacilitiesChange}
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
                                icon={isFullscreen ? ('solar:minimize-bold' as any) : ('solar:maximize-bold' as any)}
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
});
