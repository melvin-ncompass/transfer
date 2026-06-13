import { Box, CircularProgress, Stack } from '@mui/material';

import { MonthlyTemperaturePrecipitationChart } from '../climate/components/monthly-temperature-precipitation-chart';
import { PromptFilterProvider } from '../prompts/components/prompt-filter-context';
import {
    useGetDkhsSubcountiesGeoJSONQuery,
    useGetDkhisWardsQuery,
    useGetDkhisIndicatorDateFilterQuery,
    useGetKhisFacilityQuery,
} from '../../../api';
import DateRangeSlider from '../../../components/custom-date-range-picker/date-range-picker';
import { LocationSelector } from '../../../../src/components/location-selector/location-selector-v1';
import { IndicatorSelect } from '../../../components/location-filters/indicator-select';
import { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { DATE_RANGE_MAX_MONTH, DATE_RANGE_MIN_MONTH, DATE_RANGE_MAX_YEAR, DATE_RANGE_MIN_YEAR, getDateRangeMaxDate, getDateLastYearDate } from '../../../store/constants';
import { IndicatorTrendsTable, PromptsTrendTableV1, ChoroplethMap } from './components';
import { ChartHoverProvider, useChartHover } from '../climate/contexts/chart-hover-context';
import { useLocationHandlers } from './hooks/use-location-handlers';
import { useDateRangeHandlers } from './hooks/use-date-range-handlers';
import { useIndicatorManagement } from './hooks/use-indicator-management';
import { useLocationData } from './hooks/use-location-data';
import { useAnimationStateSync } from './hooks/use-animation-state-sync';
import { useClimateData } from './hooks/use-climate-data';
import { useIndicatorData } from './hooks/use-indicator-data';
import { useDebouncedLocation } from './hooks/use-debounced-location';
import { overviewViewStyles } from '../../../styles/layouts/overview-view.styles';
import type { InsightsDataProps } from '../../../types/insights.types';

// ----------------------------------------------------------------------

export enum SelectionMode {
    SUBCOUNTY = 'subcounty',
    WARD = 'ward',
}

/**
 * Helper function to get the full date range (from start to end)
 * Returns the complete valid range (Jan 2022 - Oct 2025)
 */
const getFullDateRange = (): { from: Date; to: Date } => {
    const minDate = getDateLastYearDate();
    const maxDate = getDateRangeMaxDate();
    return { from: minDate, to: maxDate };
};

/**
 * OverviewView - Overview dashboard component
 * 
 * Displays 4 quadrants:
 * - Q1 (Top Left): Monthly Temperature Line Chart
 * - Q2 (Top Right): Monthly Rainfall Line Chart
 * - Q3 (Bottom Left): Monthly Indicator Trend Line Chart
 * - Q4 (Bottom Right): Monthly Priority Trend Line Chart
 */

export function OverviewView(props: InsightsDataProps) {
    return (
        <ChartHoverProvider>
            <OverviewViewInner {...props} />
        </ChartHoverProvider>
    );
}


/* Inner Overview View Component */
function OverviewViewInner({
    wardsGeoJSON,
    navigateToClimateTab,
    navigateToPromptsTab,
    hasClimatePermission,
    hasPromptsPermission,
}: InsightsDataProps) {

    // Location state
    const [ward, setWard] = useState<string>('');
    const [county, setCounty] = useState<string>('');
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(getFullDateRange());
    const [selectionMode, setSelectionMode] = useState<SelectionMode.WARD | SelectionMode.SUBCOUNTY>(SelectionMode.WARD);
    // Animation state (only for indicators, not population)
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(true);
    const [showAll, setShowAll] = useState(true); // Show all data by default
    const [speed] = useState<number>(1); // Can be made configurable later
    const [hasPlayed, setHasPlayed] = useState(false);

    // Map click sync
    const { clickedDate, highlightMode, resetHover, setClickedDate } = useChartHover();

    // Track previous clickedDate to detect when selection is explicitly cleared
    const previousClickedDateRef = useRef<number | null>(null);
    // Track last synced timestamp to avoid unnecessary updates
    const lastSyncedTimestampRef = useRef<number | null>(null);
    // Track if we're in the middle of an automatic sync to prevent pause effect from running
    const isAutoSyncingRef = useRef<boolean>(false);
    // Track if we're preserving a frame during date range change to prevent auto-sync from interfering
    const isPreservingFrameRef = useRef<boolean>(false);
    // Store timestamp to set when preserving frame (to ensure it happens after currentFrameDate updates)
    const pendingClickedDateRef = useRef<number | null>(null);

    // Fetch wards data for location selector
    const { data: wardsData, isLoading: isLoadingWards } = useGetDkhisWardsQuery();

    // // Check for MANAGE_KHIS permission
    // const hasKhisPermission = usePermission(PermissionName.KHIS);

    // Fetch indicators data for IndicatorSelect - skip if no KHIS permission
    const { data: indicatorsData } = useGetDkhisIndicatorDateFilterQuery();

    // Indicator management
    const {
        selectedIndicator,
        setSelectedIndicator,
        isPopulationMode,
        indicatorDisplayName,
        previousIndicatorRef,
    } = useIndicatorManagement({ indicatorsData });

    // Reset location selector and map when indicator changes
    const mapResetRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        // Only reset if indicator actually changed (not on initial load)
        if (previousIndicatorRef.current && previousIndicatorRef.current !== selectedIndicator) {
            setWard('');
            setCounty('');
            // Reset map view when indicator changes
            if (mapResetRef.current) {
                mapResetRef.current();
            }
        }
    }, [selectedIndicator, previousIndicatorRef]);

    // Debounce location values to prevent rapid API calls when clicking quickly
    // Must be declared before useIndicatorData which uses these values
    const { debouncedWard, debouncedCounty } = useDebouncedLocation(ward, county, 500);

    // Indicator data and animation
    const {
        isLoadingIndicator,
        isFetchingIndicator,
        setFrameIdx,
        playing,
        setPlaying,
        frames,
        frameDates,
        currentFrameDate,
        filteredData,
        indicatorValueMap,
        indicatorColorScale,
    } = useIndicatorData({
        selectedIndicator,
        isPopulationMode,
        dateRange,
        speed,
        isLooping,
        showAll,
        county: debouncedCounty,
        ward: debouncedWard,
        wardsGeoJSON,
    });

    // Sync animation state
    useAnimationStateSync({
        playing,
        showAll,
        setPlaying,
        setShowAll,
        setFrameIdx,
        setIsPlaying,
    });

    // Preserve current frame when date range changes
    // If current frame is still in the new range, keep it; otherwise clear selection
    const previousFrameDateRef = useRef<Date | null>(null);
    const previousFrameDatesRef = useRef<Date[]>([]);

    // Store current frame date before frameDates changes
    useEffect(() => {
        if (currentFrameDate && !showAll) {
            previousFrameDateRef.current = currentFrameDate;
        }
    }, [currentFrameDate, showAll]);

    // Watch for frameDates changes (which happens when date range changes)
    useEffect(() => {
        // Skip on initial mount
        if (previousFrameDatesRef.current.length === 0) {
            previousFrameDatesRef.current = frameDates;
            return;
        }

        // Check if frameDates actually changed
        const prevFrames = previousFrameDatesRef.current;
        if (prevFrames.length === frameDates.length &&
            prevFrames.every((f, i) => frameDates[i]?.getTime() === f.getTime())) {
            previousFrameDatesRef.current = frameDates;
            return;
        }

        // frameDates changed - try to preserve the previous frame
        const frameToPreserve = previousFrameDateRef.current;

        // If we have a stored frame and it's still in the new frames array, preserve it
        if (frameToPreserve && !showAll && frameDates.length > 0) {
            const frameYear = frameToPreserve.getFullYear();
            const frameMonth = frameToPreserve.getMonth();

            // Find the index of stored frame in the new frameDates array
            const newFrameIndex = frameDates.findIndex((d) => {
                const dYear = d.getFullYear();
                const dMonth = d.getMonth();
                return dYear === frameYear && dMonth === frameMonth;
            });

            if (newFrameIndex !== -1) {
                // Frame still exists in new range - preserve it
                // Set flag to prevent auto-sync from interfering
                isPreservingFrameRef.current = true;
                // Use the actual frame date from the new frameDates array to ensure exact match
                const preservedFrameDate = frameDates[newFrameIndex];
                const preservedFrameYear = preservedFrameDate.getFullYear();
                const preservedFrameMonth = preservedFrameDate.getMonth();
                const frameTimestamp = new Date(Date.UTC(preservedFrameYear, preservedFrameMonth, 1)).getTime();

                // CRITICAL: Use flushSync to ensure frameIdx updates synchronously
                // This prevents currentFrameDate from being calculated with the old frameIdx
                flushSync(() => {
                    // Ensure showAll is false first to prevent useAnimationStateSync from resetting frameIdx
                    if (showAll) {
                        setShowAll(false);
                    }
                    // Set frame index synchronously
                    setFrameIdx(newFrameIndex);
                });

                // Update the stored frame date
                previousFrameDateRef.current = preservedFrameDate;
                previousFrameDatesRef.current = frameDates;

                // Store timestamp to set clickedDate after currentFrameDate updates
                pendingClickedDateRef.current = frameTimestamp;

                return;
            }
        }

        // Current frame is not in the new range - clear selection
        if (!showAll) {
            setShowAll(true);
            previousFrameDateRef.current = null;
        }

        // Update ref
        previousFrameDatesRef.current = frameDates;
    }, [frameDates, showAll, setFrameIdx, setShowAll, setClickedDate]);

    // Set clickedDate after currentFrameDate updates when preserving frame
    // Also verify that currentFrameDate matches the preserved frame
    useLayoutEffect(() => {
        if (pendingClickedDateRef.current !== null && currentFrameDate) {
            const timestamp = pendingClickedDateRef.current;
            // Verify that currentFrameDate matches the timestamp we're trying to set
            const currentYear = currentFrameDate.getFullYear();
            const currentMonth = currentFrameDate.getMonth();
            const currentTimestamp = new Date(Date.UTC(currentYear, currentMonth, 1)).getTime();

            // Only proceed if currentFrameDate matches the preserved frame (or close enough)
            if (currentTimestamp === timestamp || Math.abs(currentTimestamp - timestamp) < 1000 * 60 * 60 * 24) {
                pendingClickedDateRef.current = null;
                isAutoSyncingRef.current = true;
                lastSyncedTimestampRef.current = timestamp;
                setClickedDate(timestamp);
                // Clear the flag after state updates
                setTimeout(() => {
                    isPreservingFrameRef.current = false;
                }, 0);
            } else {
                // currentFrameDate doesn't match yet - wait for it to update
            }
        }
    }, [currentFrameDate, setClickedDate]);

    // Force ward mode when indicator is selected (not population)
    useEffect(() => {
        if (!isPopulationMode && selectedIndicator) {
            setSelectionMode(SelectionMode.WARD);
        }
    }, [isPopulationMode, selectedIndicator]);

    // Location data processing
    const { countyData, availableSubcounties, availableWards, hierarchyData } = useLocationData({
        wardsData
    });

    // Location handlers
    const { handleCountyChange, handleWardChange } = useLocationHandlers({
        setCounty,
        setWard,
        setSelectionMode,
        isPopulationMode,
        wards: availableWards,
    });

    // Build filter info for export
    const filterInfo = useMemo(() => {
        if (ward) {
            const wardData = availableWards.find((w) => w.id === ward);
            return { ward: wardData?.name || ward };
        }
        if (county) {
            const subcountyData = availableSubcounties.find((s) => s.id === county);
            return { subcounty: subcountyData?.name || county };
        }
        if (countyData?.label) {
            return { location: countyData.label };
        }
        return undefined;
    }, [ward, county, availableWards, availableSubcounties, countyData]);

    // Date range handlers
    const { handlePlayToggle, handleFrameChange: baseHandleFrameChange, handleShowAllToggle, handleLoopToggle } = useDateRangeHandlers({
        showAll,
        setIsPlaying,
        isPlaying,
        setPlaying,
        setShowAll,
        setFrameIdx,
        frameDates,
        setIsLooping,
        setHasPlayed,
        resetHover,
    });

    // Wrap handleFrameChange to sync clickedDate when dragging thumb
    const handleFrameChange = useCallback((frame: Date) => {
        // Update frame index
        baseHandleFrameChange(frame);

        // Also sync clickedDate so charts update during drag
        const frameYear = frame.getFullYear();
        const frameMonth = frame.getMonth();
        const frameTimestamp = new Date(Date.UTC(frameYear, frameMonth, 1)).getTime();

        // Mark as manual drag (not auto-sync)
        isAutoSyncingRef.current = false;
        lastSyncedTimestampRef.current = frameTimestamp;
        setClickedDate(frameTimestamp);

        // Pause animation if playing during drag
        if (isPlaying) {
            setIsPlaying(false);
            setPlaying(false);
        }
    }, [baseHandleFrameChange, isPlaying, setIsPlaying, setPlaying, setClickedDate]);

    // Handle when the entire date range is shifted (middle drag) - reset to "show all" mode
    const handleRangeShift = useCallback(() => {
        // Reset to show all data when dragging the entire range
        setShowAll(true);
        setHasPlayed(false);
        setClickedDate(null);
        resetHover();
    }, [setShowAll, setClickedDate, resetHover]);

    // Fetch subcounty GeoJSON with date range
    // In subcounty mode, don't filter by subcountyId to show all subcounties
    // Only filter when in ward mode and a ward is selected (to show wards of that subcounty)
    const shouldFilterSubcounty = selectionMode === SelectionMode.WARD && debouncedWard && debouncedCounty;
    const { data: subcountiesGeoJSON, isLoading: isLoadingSubcountiesGeoJSON } = useGetDkhsSubcountiesGeoJSONQuery(
        {
            startYear: dateRange.from.getFullYear(),
            startMonth: dateRange.from.getMonth() + 1,
            endYear: dateRange.to.getFullYear(),
            endMonth: dateRange.to.getMonth() + 1,
            ...(shouldFilterSubcounty && debouncedCounty && { subcountyId: debouncedCounty }),
        },
        { skip: !dateRange }
    );

    // In subcounty mode, show all facilities (don't filter by subcounty)
    // Only filter facilities when a ward is selected
    const { data: facilityData } = useGetKhisFacilityQuery(
        {
            countyId: countyData.id,
            ...(selectionMode === SelectionMode.WARD && debouncedWard && { wardId: debouncedWard }),
            // Only filter by subcounty when in ward mode and ward is selected
            ...(selectionMode === SelectionMode.WARD && debouncedWard && debouncedCounty && { subCountyId: debouncedCounty }),
        },
        {
            refetchOnMountOrArgChange: true,
            skip: !countyData.id
        });

    // Climate data - use debounced values
    const {
        temperatureData,
        rainfallData,
        isLoadingTemperature,
        isLoadingRainfall,
        temperatureError,
        rainfallError,
        isFetchingTemperature,
        isFetchingRainfall,
    } = useClimateData({
        ward: debouncedWard,
        county: debouncedCounty,
        dateRange,
        // skip: !hasClimatePermission // skip if no climate permission
    });

    const resetLocation = useCallback(() => {
        setWard('');
        setCounty('');
        setSelectionMode(SelectionMode.WARD);

        // reset Leaflet map
        mapResetRef.current?.();
    }, []);

    /* Keeping log of month and year */
    const mapDateRange = useMemo(() => {
        if (!isPopulationMode && !!selectedIndicator && frames.length > 0 && !showAll && currentFrameDate) {
            // Playing or paused: show the current month
            return { from: currentFrameDate, to: currentFrameDate };
        }
        // Otherwise: use the selected range
        return { from: dateRange.from, to: dateRange.to };
    }, [dateRange, currentFrameDate, isPopulationMode, selectedIndicator, frames, showAll]);

    /* Sync thumb position to chart selection when playing/paused (automatic sync) */
    useEffect(() => {
        // When showAll is true, clear the selection
        if (showAll) {
            if (lastSyncedTimestampRef.current !== null) {
                setClickedDate(null);
                lastSyncedTimestampRef.current = null;
                isAutoSyncingRef.current = false; // Reset flag when clearing
            }
            return;
        }

        // CRITICAL: Only sync when actively playing - don't sync when paused
        // When paused, the user has manually selected a frame, so we should not override it
        if (!isPlaying) {
            isAutoSyncingRef.current = false; // Reset flag when not playing
            return;
        }

        // Additional checks
        if (!currentFrameDate || !frameDates || frameDates.length === 0) return;

        // Skip auto-sync if we're currently preserving a frame (to prevent overwriting clickedDate)
        if (isPreservingFrameRef.current) {
            return;
        }

        // Convert currentFrameDate to UTC timestamp (matching chart data format)
        // Chart data uses Date.UTC(year, month - 1, 1).getTime()
        // So we need to create the timestamp in the same way
        const frameYear = currentFrameDate.getFullYear();
        const frameMonth = currentFrameDate.getMonth(); // getMonth() returns 0-11, Date.UTC expects 0-11
        const frameTimestamp = new Date(Date.UTC(frameYear, frameMonth, 1)).getTime();

        // Only update if different from last synced value to avoid unnecessary re-renders
        // Use ref to track previous value to avoid dependency loop
        if (lastSyncedTimestampRef.current !== frameTimestamp) {
            // CRITICAL: Set flag BEFORE updating clickedDate to ensure pause effect sees it
            isAutoSyncingRef.current = true;
            lastSyncedTimestampRef.current = frameTimestamp;
            setClickedDate(frameTimestamp);
            // Keep flag true while playing - only reset when paused or stopped
            // This ensures pause effect always sees the flag during animation
        } else if (isPlaying) {
            // If timestamp hasn't changed but we're still playing, keep flag true
            // This handles the case where the effect runs multiple times for the same frame
            isAutoSyncingRef.current = true;
        }
    }, [currentFrameDate, showAll, isPlaying, frameDates, setClickedDate]);

    /* Sync map indicator and chart data on manual click only */
    useEffect(() => {
        if (!clickedDate || highlightMode !== 'click') return;
        if (!frameDates || frameDates.length === 0) return;

        // If we don't have currentFrameDate yet, wait (might be initial state)
        // But if we're not playing, it could be a manual click, so proceed
        if (!currentFrameDate && isPlaying) return;

        // If we're not playing and clickedDate matches the current frame, it's already synced - skip
        // This prevents the pause effect from running when we're already paused at the correct frame
        // IMPORTANT: Only skip if showAll is false (we're already in frame mode)
        // If showAll is true, we need to transition to frame mode even if clicking on the same frame
        if (!isPlaying && currentFrameDate && !showAll) {
            const currentYear = currentFrameDate.getFullYear();
            const currentMonth = currentFrameDate.getMonth();
            const currentFrameTimestamp = new Date(Date.UTC(currentYear, currentMonth, 1)).getTime();
            if (clickedDate === currentFrameTimestamp) {
                // Already at the correct frame and paused - no need to do anything
                // Skipping: already paused at correct frame
                return;
            }

            // If clickedDate matches lastSyncedTimestampRef, it's a stale auto-sync value - skip
            // This prevents the pause effect from running with stale values after pausing
            if (lastSyncedTimestampRef.current !== null && clickedDate === lastSyncedTimestampRef.current) {
                // Skipping: clickedDate is stale auto-sync value (not playing)
                return;
            }

            // If we're not playing and clickedDate doesn't match current frame, it could be:
            // 1. A stale auto-sync value (already handled above)
            // 2. A manual click while paused (should proceed to jump to that frame)
            // So we continue to the pause/jump logic below
        }

        // CRITICAL: If we're currently playing, we need to be VERY careful
        // Only proceed if we can definitively prove this is a manual click
        if (isPlaying) {
            if (!currentFrameDate) {
                // Can't determine if it's auto-sync without currentFrameDate - skip to be safe
                // Skipping: no currentFrameDate while playing
                return;
            }

            // Convert currentFrameDate to UTC timestamp for comparison (same way as sync effect)
            const currentYear = currentFrameDate.getFullYear();
            const currentMonth = currentFrameDate.getMonth(); // 0-11
            const currentFrameTimestamp = new Date(Date.UTC(currentYear, currentMonth, 1)).getTime();

            // PRIMARY CHECK: If clickedDate matches currentFrameDate, it's definitely auto-sync - skip
            if (clickedDate === currentFrameTimestamp) {
                return;
            }

            // SECONDARY CHECK: If clickedDate matches lastSyncedTimestampRef, it's also auto-sync - skip
            // This is CRITICAL to catch stale clickedDate values from previous auto-syncs
            // When auto-sync updates clickedDate, there can be a timing issue where the pause effect
            // runs with the old clickedDate value, so we check against lastSyncedTimestampRef
            if (lastSyncedTimestampRef.current !== null && clickedDate === lastSyncedTimestampRef.current) {
                return;
            }

            // TERTIARY CHECK: If auto-sync flag is set, check for stale values
            // This catches cases where React state hasn't updated yet or when animation loops back
            // BUT: We should only block if it's actually a stale value, not a manual click on a past frame
            if (isAutoSyncingRef.current) {
                // LOOPING CHECK: When looping, the animation can jump from last frame to first frame
                // At that moment, clickedDate might still have the last frame's timestamp (stale)
                // We detect this by checking if clickedDate matches lastSyncedTimestampRef
                // OR if clickedDate is from the last frame and currentFrameTimestamp is from the first frame (loop wrap)
                if (isLooping) {
                    // If clickedDate matches lastSyncedTimestampRef, it's definitely stale from before loop
                    if (lastSyncedTimestampRef.current !== null && clickedDate === lastSyncedTimestampRef.current) {
                        return;
                    }

                    // Check if this is a loop wrap: clickedDate is from last frame, currentFrameTimestamp is from first frame
                    if (frameDates.length > 1) {
                        const firstFrame = frameDates[0];
                        const lastFrame = frameDates[frameDates.length - 1];
                        const firstFrameTimestamp = new Date(Date.UTC(firstFrame.getFullYear(), firstFrame.getMonth(), 1)).getTime();
                        const lastFrameTimestamp = new Date(Date.UTC(lastFrame.getFullYear(), lastFrame.getMonth(), 1)).getTime();

                        // If clickedDate is from last frame and currentFrameTimestamp is from first frame, it's a loop wrap
                        if (clickedDate === lastFrameTimestamp && currentFrameTimestamp === firstFrameTimestamp) {
                            return;
                        }
                    }

                    // If clickedDate is very close to currentFrameTimestamp (within 1 month), it's likely stale
                    // This catches the case where the loop just wrapped and clickedDate hasn't updated yet
                    const timeDiff = Math.abs(clickedDate - currentFrameTimestamp);
                    const oneMonthInMs = 30 * 24 * 60 * 60 * 1000; // Approximate 1 month
                    if (timeDiff < oneMonthInMs) {
                        return;
                    }

                    // If clickedDate is significantly different (more than 1 month), it's likely a manual click
                    // Allow it to proceed to pause
                }

                // Case 1: clickedDate is older than currentFrameDate
                // Only treat as stale if it matches lastSyncedTimestampRef (definitely from auto-sync)
                // OR if it's very close to currentFrameTimestamp (within 1-2 frames, likely stale)
                if (clickedDate < currentFrameTimestamp) {
                    // Check if it matches lastSyncedTimestampRef - if so, it's definitely stale
                    if (lastSyncedTimestampRef.current !== null && clickedDate === lastSyncedTimestampRef.current) {
                        return;
                    }

                    // Check if it's very close to currentFrameTimestamp (within 2 months) - likely stale
                    const timeDiff = Math.abs(clickedDate - currentFrameTimestamp);
                    const twoMonthsInMs = 60 * 24 * 60 * 60 * 1000; // Approximate 2 months
                    if (timeDiff < twoMonthsInMs) {
                        return;
                    }

                    // If clickedDate is significantly older (more than 2 months), it's likely a manual click on a past frame
                    // Allow it to proceed
                }

                // Case 2: clickedDate is newer than currentFrameDate
                // This could be:
                // 1. A stale value from before animation looped back (should skip)
                // 2. A manual click on a future frame (should proceed)
                // We can distinguish by checking if clickedDate matches lastSyncedTimestampRef
                // If it matches, it's definitely stale. If it doesn't match and is close to currentFrame,
                // it might be stale. If it's significantly different from both, it's likely a manual click.
                if (clickedDate > currentFrameTimestamp) {
                    // If clickedDate matches lastSyncedTimestampRef, it's definitely stale (from before loop)
                    if (lastSyncedTimestampRef.current !== null && clickedDate === lastSyncedTimestampRef.current) {
                        return;
                    }

                    // If clickedDate is very close to currentFrameTimestamp (within 2 months), it might be stale
                    // This catches cases where React state hasn't updated yet
                    const timeDiffFromCurrent = Math.abs(clickedDate - currentFrameTimestamp);
                    const twoMonthsInMs = 60 * 24 * 60 * 60 * 1000; // Approximate 2 months
                    if (timeDiffFromCurrent < twoMonthsInMs) {
                        return;
                    }

                    // If clickedDate is significantly newer than currentFrameTimestamp (more than 2 months),
                    // it's likely a manual click on a future frame - allow it to proceed
                }
            }

            // If we get here and we're playing, it means:
            // - clickedDate doesn't match currentFrameDate (different frame clicked)
            // - clickedDate doesn't match lastSyncedTimestampRef (not a stale value)
            // - Either auto-sync flag is false, or clickedDate is significantly different
            // This is a genuine manual click while playing - proceed to pause
        }

        // Calculate frame index from clickedDate FIRST (before animation can advance further)
        const clickedMonth = new Date(clickedDate);
        const clickedYear = clickedMonth.getUTCFullYear();
        const clickedMonthNum = clickedMonth.getUTCMonth(); // 0-11

        // This is a manual click (user clicked on chart) - proceed with pause/jump logic
        const frameIndex = frameDates.findIndex((d) => {
            const date = new Date(d);
            return (
                date.getFullYear() === clickedYear &&
                date.getMonth() === clickedMonthNum
            );
        });

        if (frameIndex === -1) return;

        // This is a manual click - immediately update frame index and stop animation
        isAutoSyncingRef.current = false;
        // Don't clear lastSyncedTimestampRef here - we want to keep it so the pause effect
        // can still detect if clickedDate matches it (to prevent re-triggering)
        setHasPlayed(true);
        // Stop animation immediately to prevent it from advancing while we set the frame
        setIsPlaying(false);   // pause
        setPlaying(false);     // sync indicator animation
        setShowAll(false);
        // Set frame index immediately (no delay)
        setFrameIdx(frameIndex);
    }, [
        clickedDate,
        highlightMode,
        frameDates,
        currentFrameDate,
        isPlaying,
        isLooping,
        showAll,
        setFrameIdx,
        setPlaying,
        setShowAll,
    ]);

    // When selection is cleared (second click / deselect), exit frame mode so the
    // choropleth map and date slider return to the full selected range.
    // Only trigger when clickedDate transitions from a value to null/undefined (explicit clear),
    // not when it's null/undefined from the start (to avoid interfering with play button)
    useEffect(() => {
        const previousValue = previousClickedDateRef.current;
        const currentValue = clickedDate;

        previousClickedDateRef.current = currentValue;
        // == instead of === to handle null/undefined cases

        const wasCleared = previousValue != null && currentValue == null;

        if (wasCleared && highlightMode === 'click' && !isPlaying) {
            setShowAll(true);
            setHasPlayed(false);  // Reset hasPlayed to hide the date label on the map
            resetHover();
        }
    }, [clickedDate, highlightMode, isPlaying, setShowAll, resetHover]);


    return (
        <PromptFilterProvider>
            {/* Date Range Slider and Location Selector - Sticky to page, above content */}
            <Box sx={overviewViewStyles.stickyFilterBar}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    {/* Indicator Select */}
                    <Box sx={overviewViewStyles.indicatorSelectBox}>
                        <IndicatorSelect
                            value={selectedIndicator}
                            onChange={setSelectedIndicator}
                            label="Indicator"
                            placeholder="Select indicator..."
                            enablePopulationOption
                            maxWidth={300}
                        />
                    </Box>
                    <Box sx={overviewViewStyles.locationSelectorBox}>
                        {isLoadingWards && (
                            <Box>
                                <CircularProgress size={20} />
                            </Box>
                        )}
                        <LocationSelector
                            level1Option={countyData}
                            level2Options={availableSubcounties}
                            selectedSubcountyId={county}
                            onSubcountyChange={(id) => {
                                setCounty(id)
                            }}
                            level3Options={availableWards}
                            selectedWardId={ward}
                            onWardChange={(id) => setWard(id)}
                            hierarchyData={hierarchyData}
                            onLocationSelect={({ subcountyId, wardId }) => {
                                setCounty(subcountyId || '');
                                setWard(wardId || '');
                            }}
                            size="small"
                            onResetLocation={resetLocation}
                            selectionMode={isPopulationMode ? selectionMode : SelectionMode.WARD}
                        />
                    </Box>

                    <Box sx={overviewViewStyles.dateRangeSliderBox}>
                        <DateRangeSlider
                            minYear={DATE_RANGE_MIN_YEAR}
                            maxYear={DATE_RANGE_MAX_YEAR}
                            minMonth={DATE_RANGE_MIN_MONTH}
                            maxMonth={DATE_RANGE_MAX_MONTH}
                            initialFrom={dateRange.from}
                            initialTo={dateRange.to}
                            onChange={setDateRange}
                            playable={!isPopulationMode && !!selectedIndicator && frames.length > 0}
                            isPlaying={isPlaying}
                            currentFrame={showAll ? null : currentFrameDate}
                            onPlayToggle={handlePlayToggle}
                            onFrameChange={handleFrameChange}
                            frames={frameDates}
                            isLooping={isLooping}
                            onLoopToggle={handleLoopToggle}
                            showAll={showAll}
                            onShowAllToggle={handleShowAllToggle}
                            isLoading={isLoadingIndicator || isFetchingIndicator}
                            onRangeShift={handleRangeShift}
                        />
                    </Box>
                </Stack>
            </Box>
            <Stack direction="column" spacing={0} sx={overviewViewStyles.mainContentStack}>
                <Box sx={overviewViewStyles.topRowContainer}>
                    <Box sx={overviewViewStyles.mapBox}>
                        {(isLoadingIndicator || isFetchingIndicator) && !isPopulationMode && (
                            <Box sx={overviewViewStyles.mapLoadingOverlay}>
                                <CircularProgress />
                            </Box>
                        )}
                        <ChoroplethMap
                            hasPlayed={hasPlayed}
                            mapDateRange={mapDateRange}
                            wardsGeoJSON={wardsGeoJSON}
                            subcountiesGeoJSON={subcountiesGeoJSON}
                            facilityData={facilityData}
                            selectedWard={ward}
                            selectedCounty={county}
                            selectionMode={selectionMode}
                            onSelectionModeChange={useCallback((mode: SelectionMode.SUBCOUNTY | SelectionMode.WARD) => setSelectionMode(mode), [])}
                            dateRange={useMemo(() => ({ from: dateRange.from, to: dateRange.to }), [dateRange.from, dateRange.to])}
                            isLoadingGeoJSON={selectionMode === SelectionMode.WARD ? isLoadingWards : isLoadingSubcountiesGeoJSON}
                            onReset={useCallback(() => {
                                setWard('');
                                setCounty('');
                            }, [])}
                            onResetMap={resetLocation}
                            onResetRef={useCallback((resetFn: () => void) => {
                                mapResetRef.current = resetFn;
                            }, [])}
                            dataMode={isPopulationMode ? 'population' : 'indicator'}
                            indicatorData={!isPopulationMode ? filteredData : undefined}
                            indicatorValueMap={!isPopulationMode ? indicatorValueMap : undefined}
                            indicatorColorScale={!isPopulationMode ? indicatorColorScale : undefined}
                            title={indicatorDisplayName}
                            showSelectionModeToggle={isPopulationMode}
                            filterInfo={filterInfo}
                            onFeatureClick={useCallback((params: { wardId?: string; subcountyId?: string }) => {
                                if (params.wardId) {
                                    // Clear county first when selecting a ward to ensure clean selection
                                    setCounty('');
                                    handleWardChange(params.wardId);
                                } else if (params.subcountyId) {
                                    // Clear ward first when selecting a subcounty to ensure clean selection
                                    setWard('');
                                    handleCountyChange(params.subcountyId);
                                }
                            }, [handleWardChange, handleCountyChange, setCounty, setWard])}
                        />
                    </Box>
                    <Box sx={overviewViewStyles.chartBox}>
                        {(isLoadingTemperature || isLoadingRainfall || isFetchingTemperature || isFetchingRainfall) ? (
                            <Box sx={overviewViewStyles.chartLoadingBox}>
                                <CircularProgress />
                            </Box>
                        ) : (temperatureError || rainfallError) ? (
                            <Box sx={overviewViewStyles.chartErrorBox}>
                                Error loading climate data
                            </Box>
                        ) : (
                            <Box sx={overviewViewStyles.chartContentBox}>
                                <MonthlyTemperaturePrecipitationChart
                                    temperatureData={temperatureData}
                                    precipitationData={rainfallData}
                                    onTitleClick={navigateToClimateTab}
                                    isTitleClickable={hasClimatePermission && !!navigateToClimateTab}
                                    filterInfo={filterInfo}
                                    dateRange={dateRange}
                                    isPlaying={isPlaying}
                                />
                            </Box>
                        )}
                    </Box>
                </Box>
                <Box sx={overviewViewStyles.bottomRowContainer}>
                    <Box sx={overviewViewStyles.indicatorTrendsTableBox(isPopulationMode)}>
                        <IndicatorTrendsTable
                            dateRange={dateRange}
                            ward={ward || undefined}
                            county={county || undefined}
                            selectedIndicator={selectedIndicator}
                            selectedIndicatorDisplayName={indicatorDisplayName}
                            hasPromptsPermission={hasPromptsPermission}
                            isPlaying={isPlaying}
                        />
                    </Box>
                    {/* Prompts Trends Table */}
                    <Box sx={overviewViewStyles.promptsTrendTableBox}>
                        <PromptsTrendTableV1
                            dateRange={useMemo(() => ({ from: dateRange.from, to: dateRange.to }), [dateRange.from, dateRange.to])}
                            ward={ward || undefined}
                            county={county || undefined}
                            onTitleClick={navigateToPromptsTab}
                            isPlaying={isPlaying}
                            isTitleClickable={hasPromptsPermission && !!navigateToPromptsTab}
                            hasPromptsPermission={hasPromptsPermission}
                        />
                    </Box>
                </Box>
            </Stack>
        </PromptFilterProvider>
    )
}
