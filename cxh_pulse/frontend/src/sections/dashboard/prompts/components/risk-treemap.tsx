import { useMemo, useRef, useCallback, useState } from 'react';
import { Card, Typography, Box, CircularProgress, Alert, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Chart, useChart, ChartExportMenu } from '../../../../components/chart';
import { useGetPromptsRiskTreemapQuery } from '../../../../api';
import { PRIORITY_LEVELS, PriorityLevel, type RiskCategory } from './constants';
import { usePromptFilter } from './prompt-filter-context';
import { useBrandedChartExport } from '../../../../hooks';
import { ReportGuard } from '../../components/protected-components/permission-guard';
import { capitalize } from 'lodash';

// ----------------------------------------------------------------------

type RiskTreemapProps = {
    /** Category type: 'maternal_risk' or 'baby_risk' */
    category: RiskCategory;
    /** Title for the treemap */
    title: string;
};

/**
 * RiskTreemap - Treemap visualization for risk data
 * 
 * Displays hierarchical risk data:
 * - Category (maternal_risk/baby_risk)
 *   - Priority Level (high, danger sign/urgent, low)
 *     - Intent (specific conditions)
 * 
 * Color gradients:
 * - Maternal Risk: Yellow → Orange → Red
 * - Baby Risk: Light Blue → Teal → Dark Green
 */
export function RiskTreemap({ category, title, filterInfo, dateRange }: RiskTreemapProps & {
    filterInfo?: { location?: string; subcounty?: string; ward?: string };
    dateRange?: { from: Date; to: Date };
}) {
    const chartRef = useRef<HTMLDivElement>(null);

    const {
        data = [],
        isLoading,
        isFetching,
        error,
    } = useGetPromptsRiskTreemapQuery({ category });

    const { selectedCategory, selectedPriorityByCategory, setCategory, setPriority } = usePromptFilter();

    const selectedPriority = selectedPriorityByCategory[category] ?? null;

    // Hide treemap if category filter is active and doesn't match
    const shouldShow = !selectedCategory || selectedCategory === category;

    // Transform data into flat structure for treemap (showing intents grouped by priority)
    const treemapData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Filter data based on selected priority
        let filteredData = data;
        if (selectedPriority) {
            filteredData = filteredData.filter((item) => item.priorityLevel === selectedPriority);
        }

        // Group by priority level
        const priorityGroups = new Map<string, Array<{ intent: string; intentCount: number }>>();

        filteredData.forEach((item) => {
            const priority = item.priorityLevel || 'unknown';
            if (!priorityGroups.has(priority)) {
                priorityGroups.set(priority, []);
            }
            priorityGroups.get(priority)!.push({
                intent: item.intent,
                intentCount: item.intentCount,
            });
        });

        // Build series - one series per priority level containing all intents in that level
        // Order: danger sign/urgent (leftmost/highest), high (middle), low (end)
        const series: any[] = [];

        // Sort intents within each priority by count (descending) for better visual layout
        PRIORITY_LEVELS.forEach((priority) => {
            // If priority filter is active, only show that priority
            if (selectedPriority && priority !== selectedPriority) {
                return;
            }

            const intents = priorityGroups.get(priority);
            if (!intents || intents.length === 0) return;

            // Sort intents by count (descending) - highest count at top
            const sortedIntents = [...intents].sort((a, b) => b.intentCount - a.intentCount);

            // Create data points for all intents in this priority level
            const intentData = sortedIntents.map((item) => ({
                x: item.intent,
                y: item.intentCount,
            }));

            series.push({
                name: `${category} > ${priority}`,
                data: intentData,
            });
        });

        // Add any other priority levels that aren't in the standard order
        priorityGroups.forEach((intents, priority) => {
            if (!PRIORITY_LEVELS.includes(priority as any)) {
                const sortedIntents = [...intents].sort((a, b) => b.intentCount - a.intentCount);
                const intentData = sortedIntents.map((item) => ({
                    x: item.intent,
                    y: item.intentCount,
                }));

                series.push({
                    name: `${category} > ${priority}`,
                    data: intentData,
                });
            }
        });

        return series;
    }, [data, category, selectedPriority]);

    // Callback to get series data for CSV export
    const getSeriesData = useCallback(() => ({
        type: 'treemap' as const,
        series: treemapData,
    }), [treemapData]);

    // Build filter info for export - include selected priority if available
    const exportFilterInfo = useMemo(() => {
        // Build filter parts
        const filterParts: string[] = [];

        // Add location filter if available
        if (filterInfo?.ward) {
            filterParts.push(`Ward: ${filterInfo.ward}`);
        } else if (filterInfo?.subcounty) {
            filterParts.push(`Subcounty: ${filterInfo.subcounty}`);
        } else if (filterInfo?.location) {
            filterParts.push(`Location: ${filterInfo.location}`);
        }

        // Add priority level filter if selected
        if (selectedPriority) {
            filterParts.push(`Risk Level: ${capitalize(selectedPriority)}`);
        }

        // Return as location string if we have any filters
        if (filterParts.length > 0) {
            return { location: filterParts.join(', ') };
        }

        return undefined;
    }, [filterInfo, selectedPriority]);

    // Calculate summary stats
    const summaryStats = useMemo(() => {
        if (!data || data.length === 0) {
            return { total: 0, high: 0, dangerSign: 0, low: 0 };
        }

        const priorityGroups = new Map<string, number>();
        data.forEach((item) => {
            const priority = item.priorityLevel || 'unknown';
            const current = priorityGroups.get(priority) || 0;
            priorityGroups.set(priority, current + item.intentCount);
        });

        const total = data.reduce((sum, item) => sum + item.intentCount, 0);
        const dangerSign = priorityGroups.get(PRIORITY_LEVELS[0]) || 0; // danger sign/urgent (highest)
        const high = priorityGroups.get(PRIORITY_LEVELS[1]) || 0; // high
        const low = priorityGroups.get(PRIORITY_LEVELS[2]) || 0; // low

        return { total, high, dangerSign, low };
    }, [data]);

    // Custom footer text for export
    const customFooterText = `Danger Sign/Urgent: ${summaryStats.dangerSign.toLocaleString()}   High: ${summaryStats.high.toLocaleString()}   Low: ${summaryStats.low.toLocaleString()}`;

    // Branded export hook
    const { exportPNG, exportSVG, exportCSV, isReady } = useBrandedChartExport({
        chartTitle: `${title}: ${summaryStats.total.toLocaleString()}`,
        chartRef,
        getSeriesData,
        filterInfo: exportFilterInfo,
        dateRange,
        customFooterText,
    });

    // Color scheme based on category
    const colorScheme = useMemo(() => {
        if (category === 'maternal_risk') {
            // Yellow to Orange to Red gradient
            return ['#FFD700', '#FFA500', '#FF6347', '#FF4500', '#DC143C'];
        } else {
            // Light Blue to Dark Blue gradient only
            return ['#ADD8E6', '#87CEEB', '#4682B4', '#1E90FF', '#00008B'];
        }
    }, [category]);

    // Calculate min/max for color scale and category total
    const { minValue, maxValue, categoryTotal } = useMemo(() => {
        if (!data || data.length === 0) return { minValue: 0, maxValue: 0, categoryTotal: 0 };

        const values = data.map((item) => item.intentCount);
        const total = data.reduce((sum, item) => sum + item.intentCount, 0);
        return {
            minValue: Math.min(...values),
            maxValue: Math.max(...values),
            categoryTotal: total,
        };
    }, [data]);

    // Handle treemap tile clicks
    // const handleDataPointSelection = (event: any, chartContext: any, config: any) => {
    //     // Set category filter when clicking on treemap
    //     setCategory(category);

    //     // Extract priority from series name (format: "category > priority")
    //     const seriesName = config.w.globals.seriesNames[config.seriesIndex];
    //     if (seriesName) {
    //         const parts = seriesName.split(' > ');
    //         if (parts.length > 1) {
    //             const priority = parts[1];
    //             if (PRIORITY_LEVELS.includes(priority as any)) {
    //                 setPriority(category, priority as PriorityLevel);

    //             }
    //         }
    //     }
    // };

    const chartOptions = useChart({
        chart: {
            type: 'treemap',
            toolbar: {
                show: false, // Using custom branded export menu instead
            },
            height: 450,
            animations: {
                enabled: true,
                speed: 800,
            },
            // dataPointSelection: handleDataPointSelection,
        },
        // Fix visibility: chartRef.current (isReady) doesn't trigger re-render, so relying on it hides the button initially.
        // We know the chart renders when !isLoading, and the export function checks for ref existence anyway.
        stroke: {
            show: true,
            width: 2,
            colors: ['#FFFFFF'],
        },
        dataLabels: {
            enabled: true,
            style: {
                fontSize: '14px',
                fontWeight: 600,
                colors: ['#FFFFFF'],
            },
            offsetY: -2,
            formatter: (text: string, opts: any) => {
                const value = opts.value; // This is the count

                // Calculate percentage: (intent count / total category count) * 100
                const total = categoryTotal || 1;
                const percentage = ((value / total) * 100).toFixed(1);

                // Extract intent name from the data point
                // The x value in our data structure is the intent name
                const series = opts.w.globals.initialSeries[opts.seriesIndex];
                const dataPoint = series.data[opts.dataPointIndex];
                const intent = dataPoint?.x || text;

                // Truncate long intent names
                const maxLength = 25;
                const displayIntent = intent.length > maxLength
                    ? `${intent.substring(0, maxLength)}...`
                    : intent;

                return `${displayIntent}: ${percentage}%`;
            },
        },
        plotOptions: {
            treemap: {
                enableShades: false,
                shadeIntensity: 0.8,
                reverseNegativeShade: false,
                distributed: false,
                useFillColorAsStroke: false,
                borderRadius: 4,
                colorScale: {
                    ranges: (() => {
                        if (maxValue === minValue) {
                            // If all values are the same, use a single color
                            return [{
                                from: minValue,
                                to: maxValue,
                                color: colorScheme[2], // Middle color
                            }];
                        }

                        const range = maxValue - minValue;
                        const numRanges = 10; // More ranges for smoother gradient
                        const ranges = [];

                        for (let i = 0; i < numRanges; i++) {
                            const from = minValue + (range * i) / numRanges;
                            const to = minValue + (range * (i + 1)) / numRanges;

                            // Map to color scheme (5 colors)
                            const colorIndex = Math.floor((i / numRanges) * colorScheme.length);

                            // Use color from scheme
                            const color = colorScheme[Math.min(colorIndex, colorScheme.length - 1)];

                            ranges.push({
                                from: i === 0 ? from : from + 0.0001,
                                to: i === numRanges - 1 ? maxValue : to,
                                color,
                            });
                        }
                        return ranges;
                    })(),
                },
            },
        },
        tooltip: {
            enabled: true,
            custom: ({ seriesIndex, dataPointIndex, w }: any) => {
                const series = w.globals.initialSeries[seriesIndex];
                const dataPoint = series.data[dataPointIndex];
                const value = dataPoint?.y ?? 0;
                const intent = dataPoint?.x || 'Unknown';
                const seriesName = series.name; // Format: "category > priority"

                // Calculate percentage: (intent count / total category count) * 100
                // categoryTotal is the sum of all intentCount values in the category
                const total = categoryTotal || 1;
                const percentage = ((value / total) * 100).toFixed(2);

                return `
                    <div style="padding: 10px; background: var(--brand-bg); border-radius: 4px; color: var(--brand-text); font-size: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
                        <div style="font-weight: 600; margin-bottom: 4px;">${seriesName}</div>
                        <div style="margin-bottom: 2px;"><strong>Intent:</strong> ${intent}</div>
                        <div style="margin-bottom: 2px;"><strong>Count:</strong> ${value}</div>
                        <div><strong>Percentage:</strong> ${percentage}% (of total ${categoryTotal})</div>
                    </div>
                `;
            },
        },
        legend: {
            show: false,
        },
    });



    const availablePriorities = useMemo(
        () =>
            Array.from(
                new Set(
                    data
                        .filter((item) => item.category === category)
                        .map((item) => item.priorityLevel)
                )
            ).sort(
                (a, b) =>
                    PRIORITY_LEVELS.indexOf(a as any) -
                    PRIORITY_LEVELS.indexOf(b as any)
            ),
        [data, category]
    );

    if (isLoading || isFetching) {
        return (
            <Card sx={{ p: 3, flex: '1 1 48%', minWidth: 300 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    {title}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <CircularProgress />
                </Box>
            </Card>
        );
    }

    if (error) {
        return (
            <Card sx={{ p: 3, flex: '1 1 48%', minWidth: 300 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    {title}
                </Typography>
                <Alert severity="error">Failed to load data. Please try again later.</Alert>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card sx={{ p: 3, flex: '1 1 48%', minWidth: 300 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    {title}
                </Typography>
                <Alert severity="info">No data available.</Alert>
            </Card>
        );
    }

    // Show "No data found" if category filter doesn't match
    if (!shouldShow) {
        return (
            <Card sx={{ p: 3, flex: '1 1 48%', minWidth: 300 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    {title}
                </Typography>
                <Alert severity="info">No data found.</Alert>
            </Card>
        );
    }

    return (
        <Card sx={{ p: 3, flex: '1 1 48%', minWidth: 300 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6">
                    {title}: {summaryStats.total.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* Priority Filter - work in progress*/}
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Risk Level</InputLabel>
                        <Select
                            value={selectedPriority ?? ''}
                            label="Risk Level"
                            onChange={(e) =>
                                setPriority(category, (e.target.value as PriorityLevel) || null)
                            }
                        >
                            <MenuItem value="">
                                <em>All Levels</em>
                            </MenuItem>
                            {availablePriorities.map((priority) => (
                                <MenuItem key={priority} value={priority}>
                                    {capitalize(priority)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <ReportGuard>
                        <ChartExportMenu
                            onExportPNG={exportPNG}
                            onExportSVG={exportSVG}
                            onExportCSV={exportCSV}
                            visible={!isLoading && !isFetching && shouldShow}
                        />
                    </ReportGuard>
                </Box>
            </Stack>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                    Danger Sign/Urgent: {summaryStats.dangerSign.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    High: {summaryStats.high.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Low: {summaryStats.low.toLocaleString()}
                </Typography>
            </Box>
            <Box ref={chartRef}>
                <Chart type="treemap" series={treemapData} options={chartOptions} />
            </Box>
        </Card>
    );
}

