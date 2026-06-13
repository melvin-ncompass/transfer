import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import { debounce } from 'lodash';
import { DATE_RANGE_MIN_YEAR, DATE_RANGE_MAX_YEAR, DATE_RANGE_MIN_MONTH, DATE_RANGE_MAX_MONTH } from '../../store/constants';
import { calculateTotalMonths, getMonthIndex, getDateFromIndex, formatDate, MONTHS } from './utils/date-calculations';
import { DatePickerPopover } from './components/date-picker-popover';
import { SliderTrack } from './components/slider-track';
import { PlayableControls } from './components/playable-controls';
import { useDateRangeDrag } from './hooks/use-date-range-drag';
import { useKeyboardNavigation } from './hooks/use-keyboard-navigation';
import { dateRangePickerStyles } from '../../styles/components/date-range-picker.styles';
import type { DateRangeSliderProps, DateRange } from './types';

const DateRangeSlider: React.FC<DateRangeSliderProps> = ({
    minYear = DATE_RANGE_MIN_YEAR,
    maxYear = DATE_RANGE_MAX_YEAR,
    minMonth = DATE_RANGE_MIN_MONTH,
    maxMonth = DATE_RANGE_MAX_MONTH,
    initialFrom,
    initialTo,
    onChange,
    playable = false,
    isPlaying = false,
    currentFrame = null,
    onPlayToggle,
    onFrameChange,
    frames = [],
    isFullscreen = false,
    isLooping = true,
    onLoopToggle,
    showAll = true,
    onShowAllToggle,
    isLoading = false,
    start,
    end,
}) => {
    const effectiveMinMonth = start?.month !== undefined ? start.month : minMonth;
    const effectiveMaxMonth = end?.month !== undefined ? end.month : maxMonth;

    const [dateRange, setDateRange] = useState<DateRange>({
        from: initialFrom,
        to: initialTo,
    });

    const [anchorElStart, setAnchorElStart] = useState<HTMLButtonElement | null>(null);
    const [anchorElEnd, setAnchorElEnd] = useState<HTMLButtonElement | null>(null);
    const [startMonth, setStartMonth] = useState<number>(initialFrom.getMonth());
    const [startYear, setStartYear] = useState<number>(initialFrom.getFullYear());
    const [endMonth, setEndMonth] = useState<number>(initialTo.getMonth());
    const [endYear, setEndYear] = useState<number>(initialTo.getFullYear());

    const trackRef = useRef<HTMLDivElement>(null);

    const totalMonths = useMemo(
        () => calculateTotalMonths(minYear, maxYear, effectiveMinMonth, effectiveMaxMonth),
        [minYear, maxYear, effectiveMinMonth, effectiveMaxMonth]
    );

    const getMonthIndexMemo = useMemo(
        () => (date: Date) => getMonthIndex(date, minYear, maxYear, effectiveMinMonth, effectiveMaxMonth),
        [minYear, maxYear, effectiveMinMonth, effectiveMaxMonth]
    );

    const getDateFromIndexMemo = useMemo(
        () => (index: number) => getDateFromIndex(index, minYear, maxYear, effectiveMinMonth, effectiveMaxMonth, totalMonths),
        [minYear, maxYear, effectiveMinMonth, effectiveMaxMonth, totalMonths]
    );

    const startIndex = getMonthIndexMemo(dateRange.from);
    const endIndex = getMonthIndexMemo(dateRange.to);

    const isEndAtMax = dateRange.to.getFullYear() === maxYear && dateRange.to.getMonth() === effectiveMaxMonth;
    const startPercent = (startIndex / totalMonths) * 100;
    const endPercent = isEndAtMax ? 100 : (endIndex / totalMonths) * 100;

    const debouncedOnChange = useRef(
        debounce((range: DateRange) => {
            onChange?.(range);
        }, 500)
    ).current;

    const { isDragging, dragTarget, handleMouseDown, setIsDragging, setDragTarget } = useDateRangeDrag({
        trackRef,
        totalMonths,
        getDateFromIndex: getDateFromIndexMemo,
        getMonthIndex: getMonthIndexMemo,
        dateRange,
        setDateRange,
        debouncedOnChange,
        playable,
        isPlaying,
        frames,
        onFrameChange,
        minYear,
        maxYear,
        effectiveMinMonth,
        effectiveMaxMonth,
    });

    const { containerRef, isFocused, setIsFocused } = useKeyboardNavigation({
        dateRange,
        setDateRange,
        debouncedOnChange,
        getMonthIndex: getMonthIndexMemo,
        getDateFromIndex: getDateFromIndexMemo,
        totalMonths,
    });

    useEffect(() => {
        setStartMonth(dateRange.from.getMonth());
        setStartYear(dateRange.from.getFullYear());
        setEndMonth(dateRange.to.getMonth());
        setEndYear(dateRange.to.getFullYear());
    }, [dateRange]);

    const applyStartDate = () => {
        const newFrom = new Date(startYear, startMonth, 1);
        const isValid =
            newFrom <= dateRange.to &&
            startYear >= minYear &&
            startYear <= maxYear &&
            (startYear > minYear || startMonth >= effectiveMinMonth) &&
            (startYear < maxYear || startMonth <= effectiveMaxMonth);

        if (isValid) {
            setDateRange({ ...dateRange, from: newFrom });
            debouncedOnChange({ ...dateRange, from: newFrom });
        }
        setAnchorElStart(null);
    };

    const applyEndDate = () => {
        const newTo = new Date(endYear, endMonth, 1);
        const isValid =
            newTo >= dateRange.from &&
            endYear >= minYear &&
            endYear <= maxYear &&
            (endYear > minYear || endMonth >= effectiveMinMonth) &&
            (endYear < maxYear || endMonth <= effectiveMaxMonth);

        if (isValid) {
            setDateRange({ ...dateRange, to: newTo });
            debouncedOnChange({ ...dateRange, to: newTo });
        }
        setAnchorElEnd(null);
    };

    const currentFramePercent = currentFrame ? (getMonthIndexMemo(currentFrame) / totalMonths) * 100 : null;
    const isFrameInRange = currentFrame
        ? getMonthIndexMemo(currentFrame) >= startIndex && getMonthIndexMemo(currentFrame) <= endIndex
        : false;

    return (
        <Box
            ref={containerRef}
            display="flex"
            alignItems="center"
            gap={2}
            sx={dateRangePickerStyles.container}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            tabIndex={0}
        >
                <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                        if (playable && isPlaying) return;
                        setAnchorElStart(e.currentTarget);
                    }}
                    disabled={playable && isPlaying}
                    style={{
                    justifyContent: 'space-between',
                    textTransform: 'none',
                    }}
                >
                    {formatDate(dateRange.from)}
                </Button>

            <DatePickerPopover
                    open={Boolean(anchorElStart)}
                    anchorEl={anchorElStart}
                    onClose={() => setAnchorElStart(null)}
                title="Start Date"
                month={startMonth}
                year={startYear}
                onMonthChange={setStartMonth}
                onYearChange={setStartYear}
                onApply={applyStartDate}
                minYear={minYear}
                maxYear={maxYear}
                effectiveMinMonth={effectiveMinMonth}
                effectiveMaxMonth={effectiveMaxMonth}
                maxDate={{ year: endYear, month: endMonth }}
                isFullscreen={isFullscreen}
            />

            <SliderTrack
                trackRef={trackRef}
                startPercent={startPercent}
                endPercent={endPercent}
                startIndex={startIndex}
                endIndex={endIndex}
                playable={playable}
                isPlaying={isPlaying}
                currentFrame={currentFrame}
                currentFramePercent={currentFramePercent}
                isFrameInRange={isFrameInRange}
                dragTarget={dragTarget}
                onMouseDown={handleMouseDown}
                onFrameChange={onFrameChange}
                frames={frames}
                onPlayToggle={onPlayToggle}
                getMonthIndex={getMonthIndexMemo}
                totalMonths={totalMonths}
                setIsDragging={setIsDragging}
                setDragTarget={setDragTarget}
            />

                <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                        if (playable && isPlaying) return;
                        setAnchorElEnd(e.currentTarget);
                    }}
                    disabled={playable && isPlaying}
                    style={{
                    justifyContent: 'space-between',
                    textTransform: 'none',
                    }}
                >
                    {formatDate(dateRange.to)}
                </Button>

            <DatePickerPopover
                    open={Boolean(anchorElEnd)}
                    anchorEl={anchorElEnd}
                    onClose={() => setAnchorElEnd(null)}
                title="End Date"
                month={endMonth}
                year={endYear}
                onMonthChange={setEndMonth}
                onYearChange={setEndYear}
                onApply={applyEndDate}
                minYear={minYear}
                maxYear={maxYear}
                effectiveMinMonth={effectiveMinMonth}
                effectiveMaxMonth={effectiveMaxMonth}
                minDate={{ year: startYear, month: startMonth }}
                isFullscreen={isFullscreen}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            />

            {playable && (
                <PlayableControls
                    isPlaying={isPlaying}
                    isLooping={isLooping}
                    showAll={showAll}
                    isLoading={isLoading}
                    framesLength={frames.length}
                    onPlayToggle={onPlayToggle || (() => {})}
                    onLoopToggle={onLoopToggle}
                    onShowAllToggle={onShowAllToggle}
                />
                        )}
                    </Box>
    );
};

export default DateRangeSlider;
