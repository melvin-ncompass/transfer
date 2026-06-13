import { useMemo, useState, useRef, useCallback } from 'react';
import { Card, Typography, Box, CircularProgress, Alert, Stack, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Chart, useChart, ChartExportMenu } from '../../../../components/chart';
import { Iconify } from '../../../../components/iconify';
import { useGetPromptsIntentPriorityFrequencyQuery } from '../../../../api';
import { DATE_RANGE_MIN_YEAR, DATE_RANGE_MIN_MONTH, DATE_RANGE_MAX_YEAR, DATE_RANGE_MAX_MONTH } from '../../../../store/constants';
import { PRIORITY_LEVEL_DISPLAY_NAMES, RISK_CATEGORY_DISPLAY_NAMES, RISK_CATEGORIES } from './constants';
import { promptStyles } from '../../../../styles/components/prompt.styles';
import { useBrandedChartExport } from '../../../../hooks';
import { ReportGuard } from '../../components/protected-components/permission-guard';
import { BASE_COLOR } from '../../overview/utils/gradient-color';

// ----------------------------------------------------------------------

type TemperaturePriorityDistributionChartProps = {
    dateRange?: { from: Date; to: Date };
    ward?: string;
    subcounty?: string;
};

/**
 * TemperaturePriorityDistributionChart - Bar chart showing temperature distribution by priority level
 * 
 * Displays:
 * - X-axis: Priority levels (Low, Medium, High, Urgent)
 * - Y-axis: Percentage (%)
 * - Bars grouped by temperature bins (0-30°C, 30-35°C, 35-40°C)
 * - Each temperature bin has a different color
 */
export function TemperaturePriorityDistributionChart({
    dateRange,
    ward,
    subcounty,
}: TemperaturePriorityDistributionChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const legendRef = useRef<HTMLDivElement>(null);
    // Mode toggle: false = temperature mode (default), true = priority mode
    const [isPriorityMode, setIsPriorityMode] = useState(false);


    // Category filter state: '' = All, 'maternal_risk' = Maternal Risk, 'baby_risk' = Baby Risk, 'other' = Other
    // Default to 'All Categories' (empty string)
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // Dynamic chart title based on mode
    const chartTitle = isPriorityMode
        ? 'Message Priority by Temperature Range'
        : 'Risk Distribution by Temperature';

    // Use provided date range or default to full range
    const fromDate = dateRange?.from || new Date(DATE_RANGE_MIN_YEAR, DATE_RANGE_MIN_MONTH, 1);
    const toDate = dateRange?.to || new Date(DATE_RANGE_MAX_YEAR, DATE_RANGE_MAX_MONTH - 1, 1);

    const {
        data = [],
        isLoading,
        isFetching,
        error,
    } = useGetPromptsIntentPriorityFrequencyQuery({
        startYear: fromDate.getFullYear(),
        startMonth: fromDate.getMonth() + 1,
        endYear: toDate.getFullYear(),
        endMonth: toDate.getMonth() + 1,
        ...(ward && { ward }),
        ...(subcounty && { subcounty }),
        // Only include category if not 'All' (empty string)
        ...(selectedCategory && selectedCategory !== '' && { category: selectedCategory }),
    });

    // Helper to get display name for priority
    const getPriorityDisplayName = (priority: string): string => {
        const lower = priority.toLowerCase();
        if (lower.includes('urgent') || lower.includes('danger')) {
            return 'Urgent';
        }
        if (lower.includes('high')) {
            return 'High';
        }
        if (lower.includes('medium')) {
            return 'Medium';
        }
        if (lower.includes('low')) {
            return 'Low';
        }
        // Fallback to display name from constants or capitalize first letter
        return PRIORITY_LEVEL_DISPLAY_NAMES[priority as keyof typeof PRIORITY_LEVEL_DISPLAY_NAMES] ||
            priority.charAt(0).toUpperCase() + priority.slice(1);
    };

    // Calculate color for each bin based on intensity ratio (same as heatmap)
    // Use the same red gradient: light pink (low) to dark red (high)
    const getBinColor = (binIndex: number, totalBins: number): string => {
        // Normalize bin index to 0-1 range
        const normalizedRatio = binIndex / (totalBins - 1 || 1);
        // Apply square root to amplify differences
        const amplifiedRatio = Math.pow(normalizedRatio, 0.5);

        const r = BASE_COLOR;
        const g = Math.round(140 - 85 * amplifiedRatio);
        const b = Math.round(140 - 85 * amplifiedRatio);
        return `rgb(${r}, ${g}, ${b})`;
    };

    // Transform data for chart
    const { chartData, tempBinRanges, priorityLevels, legendItems } = useMemo(() => {
        if (!data || data.length === 0) {
            return { chartData: [], tempBinRanges: [], priorityLevels: [], legendItems: [] };
        }

        // Get unique temperature bins and their ranges
        const binMap = new Map<number, { start: number; end: number }>();
        data.forEach((item) => {
            if (!binMap.has(item.tempBin)) {
                binMap.set(item.tempBin, {
                    start: item.tempRangeStart,
                    end: item.tempRangeEnd,
                });
            }
        });

        // Sort bins and create range labels
        const sortedBins = Array.from(binMap.keys()).sort((a, b) => a - b);
        const binRanges = sortedBins.map((bin) => {
            const range = binMap.get(bin)!;
            return {
                bin,
                label: `${range.start}-${range.end}°C`,
                start: range.start,
                end: range.end,
            };
        });

        // Get unique priority levels
        const uniquePriorities = Array.from(new Set(data.map((item) => item.priorityLevel)));

        // Order priority levels: low, medium, high, danger sign/urgent
        const priorityOrder = ['low', 'medium', 'high', 'danger sign/urgent', 'urgent'];
        const sortedPriorities = uniquePriorities.sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();
            const aIndex = priorityOrder.findIndex(p => aLower.includes(p));
            const bIndex = priorityOrder.findIndex(p => bLower.includes(p));
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });

        const priorityDisplayNames = sortedPriorities.map(getPriorityDisplayName);

        // Calculate temperature bin colors (consistent across modes)
        const tempBinColors = binRanges.map((_, index) => getBinColor(index, binRanges.length));

        if (isPriorityMode) {
            // Priority mode: X-axis = Temperature bins, Series = Priority levels
            const series = sortedPriorities.map((priority) => {
                const seriesData = binRanges.map((binRange) => {
                    const item = data.find(
                        (d) => d.tempBin === binRange.bin && d.priorityLevel === priority
                    );
                    return item ? (item.intensityRatio ?? item.frequencyRatio) : 0;
                });

                return {
                    name: getPriorityDisplayName(priority),
                    data: seriesData,
                };
            });

            return {
                chartData: series,
                tempBinRanges: binRanges,
                priorityLevels: binRanges.map(b => b.label),
                legendItems: sortedPriorities.map((priority, index) => ({
                    label: getPriorityDisplayName(priority),
                    color: tempBinColors[index % tempBinColors.length], // Use temperature bin colors to match bars
                })),
                tempBinColors, // Store for consistent coloring
            };
        } else {
            // Temperature mode (default): X-axis = Priority levels, Series = Temperature bins
            const series = binRanges.map((binRange) => {
                const seriesData = sortedPriorities.map((priority) => {
                    const item = data.find(
                        (d) => d.tempBin === binRange.bin && d.priorityLevel === priority
                    );
                    return item ? (item.intensityRatio ?? item.frequencyRatio) : 0;
                });

                return {
                    name: binRange.label,
                    data: seriesData,
                };
            });

            return {
                chartData: series,
                tempBinRanges: binRanges,
                priorityLevels: priorityDisplayNames,
                legendItems: binRanges.map((binRange, index) => ({
                    label: binRange.label,
                    color: tempBinColors[index],
                })),
                tempBinColors, // Store for consistent coloring
            };
        }
    }, [data, isPriorityMode]);

    // Calculate colors - always use temperature bin colors for bars to maintain consistency
    const colors = useMemo(() => {
        // Calculate temperature bin colors (consistent across modes)
        const tempBinColors = tempBinRanges.map((_, index) => getBinColor(index, tempBinRanges.length));

        if (isPriorityMode) {
            // In priority mode, we have priority level series
            // Use temperature bin colors cycled to maintain visual consistency
            return legendItems.map((_, index) => tempBinColors[index % tempBinColors.length]);
        } else {
            // Temperature mode: use red gradient for temperature bins
            return tempBinColors;
        }
    }, [isPriorityMode, legendItems, tempBinRanges]);

    // Legend items - use the colors from the data transformation
    const finalLegendItems = useMemo(() => legendItems, [legendItems]);

    // Callback to get series data for CSV export
    const getSeriesData = useCallback(() => ({
        type: 'bar' as const,
        series: chartData,
        categories: priorityLevels,
    }), [chartData, priorityLevels]);

    // Build filter info for export - include location and category filters
    const filterInfo = useMemo(() => {
        const filterParts: string[] = [];

        // Add location filter if available
        if (ward) {
            filterParts.push(`Ward: ${ward}`);
        } else if (subcounty) {
            filterParts.push(`Subcounty: ${subcounty}`);
        }

        // Add category filter if selected (not "All Categories")
        if (selectedCategory && selectedCategory !== '') {
            const categoryDisplayName = selectedCategory === 'other'
                ? 'Other'
                : RISK_CATEGORY_DISPLAY_NAMES[selectedCategory as keyof typeof RISK_CATEGORY_DISPLAY_NAMES] || selectedCategory;
            filterParts.push(`Category: ${categoryDisplayName}`);
        }

        // Add Mode to filter info
        filterParts.push(`Mode: ${isPriorityMode ? 'Priority Mode' : 'Temperature Mode'}`);

        // Return as location string if we have any filters
        if (filterParts.length > 0) {
            return { location: filterParts.join(', ') };
        }

        return undefined;
    }, [ward, subcounty, selectedCategory]);

    // Branded export hook
    const { exportPNG, exportSVG, exportCSV, isReady } = useBrandedChartExport({
        chartTitle,
        chartRef,
        legendRef,
        getSeriesData,
        filterInfo,
        dateRange: dateRange ? { from: fromDate, to: toDate } : undefined,
        customFooterText: undefined,
    });

    const chartOptions = useChart({
        chart: {
            type: 'bar',
            toolbar: {
                show: false, // Using custom branded export menu instead
            },
            height: 350,
            width: '100%',
        },
        // Fix visibility: chartRef.current (isReady) doesn't trigger re-render, so relying on it hides the button initially.
        // We know the chart renders when !isLoading, and the export function checks for ref existence anyway.
        responsive: [
            {
                breakpoint: 600,
                options: {
                    chart: {
                        height: 300,
                    },
                    plotOptions: {
                        bar: {
                            columnWidth: '70%',
                        },
                    },
                },
            },
        ],
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 4,
            },
        },
        dataLabels: {
            enabled: false, // Don't show percentage
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent'],
        },
        xaxis: {
            categories: priorityLevels,
            title: {
                text: isPriorityMode ? 'Temperature Range (°C)' : 'Priority Level',
            },
        },
        yaxis: {
            title: {
                text: 'Intensity Ratio',
            },
            min: 0,
        },
        fill: {
            opacity: 1,
        },
        legend: {
            show: false, // Hide default legend, we'll use custom
        },
        colors,
        tooltip: {
            theme: 'dark',
            y: {
                formatter: (val: number) => val.toFixed(4),
            },
        },
    });

    if (isLoading) {
        return (
            <Card sx={promptStyles.card}>
                <Box sx={promptStyles.loadingContainer}>
                    <CircularProgress />
                </Box>
            </Card>
        );
    }

    const showLoadingOverlay = isFetching && !isLoading;

    if (error) {
        return (
            <Card sx={promptStyles.card}>
                <Alert severity="error">Error loading temperature priority distribution data</Alert>
            </Card>
        );
    }

    if (chartData.length === 0) {
        return (
            <Card sx={promptStyles.card}>
                <Alert severity="info">No data available</Alert>
            </Card>
        );
    }

    return (
        <Card sx={promptStyles.chartCard}>
            <Box sx={promptStyles.headerContainer}>
                {/* Header row with Title, Legend, Category, and Toggle */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                    sx={promptStyles.headerStack}
                >
                    {/* Title and Description - Left side */}
                    <Box sx={promptStyles.titleContainer}>
                        <Typography
                            variant="h6"
                            sx={promptStyles.title}
                        >
                            {chartTitle}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={promptStyles.description}
                        >
                            {isPriorityMode
                                ? 'Distribution of message urgency level across temperature bins'
                                : 'How temperature ranges vary across different priority levels'}
                        </Typography>
                    </Box>

                    {/* Legend, Category Filter, and Toggle - Right side, same line as header */}
                    {finalLegendItems.length > 0 && (
                        <Box sx={promptStyles.legendContainer}>
                            {/* Legend Items - First (Wrapped for export capture) */}
                            <Box ref={legendRef} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                {finalLegendItems.map((item, index) => (
                                    <Stack
                                        key={index}
                                        direction="row"
                                        spacing={0.5}
                                        alignItems="center"
                                        sx={promptStyles.legendItem}
                                    >
                                        <Box
                                            sx={{
                                                ...promptStyles.legendColorBox,
                                                backgroundColor: item.color,
                                            }}
                                        />
                                        <Typography
                                            variant="caption"
                                            sx={promptStyles.legendText}
                                        >
                                            {item.label}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Box>

                            {/* Category Filter Dropdown - Second */}
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={selectedCategory}
                                    label="Category"
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    renderValue={(value) => {
                                        if (value === '') return 'All Categories';
                                        if (value === 'other') return 'Other';
                                        return RISK_CATEGORY_DISPLAY_NAMES[value as keyof typeof RISK_CATEGORY_DISPLAY_NAMES] || value;
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>All Categories</em>
                                    </MenuItem>
                                    {RISK_CATEGORIES.map((category) => (
                                        <MenuItem key={category} value={category}>
                                            {RISK_CATEGORY_DISPLAY_NAMES[category]}
                                        </MenuItem>
                                    ))}
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Mode Toggle Icon */}
                            <Tooltip title={isPriorityMode ? 'Switch to Priority Mode' : 'Switch to Temperature Mode'}>
                                <IconButton
                                    onClick={() => setIsPriorityMode(!isPriorityMode)}
                                    size="small"
                                    sx={{
                                        ml: { xs: 0.5, sm: 1 },
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        width: { xs: 32, sm: 40 },
                                        height: { xs: 32, sm: 40 },
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: { xs: 16, sm: 20 },
                                            height: { xs: 16, sm: 20 },
                                        }}
                                    >
                                        <Iconify
                                            icon={(isPriorityMode ? 'solar:temperature-bold' : 'solar:list-check-bold') as any}
                                            width="100%"
                                            height="100%"
                                        />
                                    </Box>
                                </IconButton>
                            </Tooltip>

                            {/* Export Menu - Last */}
                            <ReportGuard>
                                <ChartExportMenu
                                    onExportPNG={exportPNG}
                                    onExportSVG={exportSVG}
                                    onExportCSV={exportCSV}
                                    visible={!isLoading && !isFetching && chartData.length > 0}
                                />
                            </ReportGuard>
                        </Box>
                    )}
                </Stack>

                {/* Border separator */}
                <Box
                    sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        mb: { xs: 1.5, sm: 2 },
                    }}
                />
            </Box>

            {/* Loading Overlay */}
            {showLoadingOverlay && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        zIndex: 1000,
                        borderRadius: 1,
                    }}
                >
                    <CircularProgress />
                </Box>
            )}

            <Box
                ref={chartRef}
                sx={{
                    width: '100%',
                    overflow: 'hidden',
                }}
            >
                <Chart type="bar" series={chartData} options={chartOptions} />
            </Box>
        </Card>
    );
}