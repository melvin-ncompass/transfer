import { useMemo } from 'react';
import { Box, Card, Stack, Typography } from '@mui/material';
import { Chart, useChart } from '../../../../components/chart';
import { getGradientColors } from '../../../../utils/color-gradient';
import { WardPieChart } from './ward-pie-chart';

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

// Type for choropleth feature (GeoJSON feature with properties)
type ChoroplethFeature = {
    properties?: {
        ward?: string;
        Ward?: string;
        subCounty?: string;
        subcounty?: string;
        Subcounty?: string;
        totalValue?: number | string;
    };
};

type HealthIndicatorsProps = {
    /** Filtered choropleth data (GeoJSON features) to aggregate */
    data?: ChoroplethFeature[];
    /** Original unfiltered choropleth data (by disease/period only, no location filters) for color calculation */
    originalData?: ChoroplethFeature[];
    /** Selected disease name for display */
    diseaseName?: string;
    /** Height of each chart */
    chartHeight?: number;
    /** Function to set subcounty filter */
    setSubCountyFilter?: (subcounty: string) => void;
    /** Function to set ward filter */
    setWardFilter?: (ward: string) => void;
};

/**
 * HealthIndicators - Displays disease occurrence counts by subcounty and ward
 *
 * This component aggregates filtered KHIS data and displays:
 * - Subcounty-level counts as a bar chart
 * - Ward-level counts as a bar chart
 *
 * Updates in real-time based on filter selections.
 */
export function HealthIndicators({
    data,
    originalData,
    diseaseName,
    // chartHeight = 300,
    setSubCountyFilter,
    setWardFilter,
}: HealthIndicatorsProps) {
    // Helper to get subcounty from feature properties
    const getSubcounty = (feature: ChoroplethFeature): string => {
        const props = feature.properties || {};
        return props.subCounty || props.subcounty || props.Subcounty || 'Unknown';
    };

    // Helper to get ward from feature properties
    const getWard = (feature: ChoroplethFeature): string => {
        const props = feature.properties || {};
        return props.ward || props.Ward || 'Unknown';
    };

    // Helper to get value from feature properties
    const getValue = (feature: ChoroplethFeature): number => {
        const props = feature.properties || {};
        const value = props.totalValue;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseFloat(value) || 0;
        return 0;
    };

    // Aggregate data by Subcounty
    const subcountyData = useMemo(() => {
        if (!data || data.length === 0) return { categories: [], values: [] };

        const counts = new Map<string, number>();

        data.forEach((feature) => {
            const subcounty = getSubcounty(feature);
            const value = getValue(feature);
            counts.set(subcounty, (counts.get(subcounty) || 0) + value);
        });

        // Sort by count (descending) and limit to top 10 for readability
        const sorted = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
        // .slice(0, 10);

        return {
            categories: sorted.map(([name]) => name),
            values: sorted.map(([, count]) => count),
        };
    }, [data]);

    // Aggregate data by Ward
    const wardData = useMemo(() => {
        if (!data || data.length === 0) return { categories: [], values: [] };

        const counts = new Map<string, number>();

        data.forEach((feature) => {
            const ward = getWard(feature);
            const value = getValue(feature);
            counts.set(ward, (counts.get(ward) || 0) + value);
        });

        // Sort by count (descending) and limit to top 10 for readability
        const sorted = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        return {
            categories: sorted.map(([name]) => name),
            values: sorted.map(([, count]) => count),
        };
    }, [data]);

    // Calculate total count
    const totalCount = useMemo(
        () =>
            (data || []).reduce((sum, feature) => {
                const value = getValue(feature);
                return sum + value;
            }, 0),
        [data]
    );

    // Calculate original (unfiltered) data for color preservation
    const originalSubcountyData = useMemo(() => {
        const dataToUse = originalData || data;
        if (!dataToUse || dataToUse.length === 0) return { categories: [], values: [] };

        const counts = new Map<string, number>();
        dataToUse.forEach((feature) => {
            const subcounty = getSubcounty(feature);
            const value = getValue(feature);
            counts.set(subcounty, (counts.get(subcounty) || 0) + value);
        });

        const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
        return {
            categories: sorted.map(([name]) => name),
            values: sorted.map(([, count]) => count),
        };
    }, [originalData, data]);

    const originalWardData = useMemo(() => {
        const dataToUse = originalData || data;
        if (!dataToUse || dataToUse.length === 0) return { categories: [], values: [] };

        const counts = new Map<string, number>();
        dataToUse.forEach((feature) => {
            const ward = getWard(feature);
            const value = getValue(feature);
            counts.set(ward, (counts.get(ward) || 0) + value);
        });

        const sorted = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
        return {
            categories: sorted.map(([name]) => name),
            values: sorted.map(([, count]) => count),
        };
    }, [originalData, data]);

    // Generate colors based on original unfiltered data
    // const originalSubcountyColors = useMemo(
    //     () => getGradientColors(originalSubcountyData.values),
    //     [originalSubcountyData.values]
    // );
    const originalWardColors = useMemo(() => getGradientColors(originalWardData.values), [originalWardData.values]);

    // Create color maps by name for consistent color assignment
    // const subcountyColorMap = useMemo(() => {
    //     const map = new Map<string, string>();
    //     originalSubcountyData.categories.forEach((name, index) => {
    //         map.set(name, originalSubcountyColors[index]);
    //     });
    //     return map;
    // }, [originalSubcountyData.categories, originalSubcountyColors]);

    const wardColorMap = useMemo(() => {
        const map = new Map<string, string>();
        originalWardData.categories.forEach((name, index) => {
            map.set(name, originalWardColors[index]);
        });
        return map;
    }, [originalWardData.categories, originalWardColors]);

    const wardColors = useMemo(
        () => wardData.categories.map((name) => wardColorMap.get(name) || '#808080'),
        [wardData.categories, wardColorMap]
    );

    // Handle subcounty bar click
    const handleSubcountyBarClick = (dataPointIndex: number) => {
        if (dataPointIndex >= 0 && subcountyData.categories[dataPointIndex]) {
            setSubCountyFilter?.(subcountyData.categories[dataPointIndex]);
            // Clear ward filter when clicking a subcounty
            setWardFilter?.('');
        }
    };

    // Handle ward bar click
    const handleWardBarClick = (dataPointIndex: number) => {
        if (dataPointIndex >= 0 && wardData.categories[dataPointIndex]) {
            setWardFilter?.(wardData.categories[dataPointIndex]);
        }
    };

    // Subcounty chart options
    const subcountyChartOptions = useChart({
        chart: {
            type: 'bar',
            toolbar: { show: false },
            width: '100%',
            height: '100%',
            events: {
                dataPointSelection: (event: any, chartContext: any, config: any) => {
                    handleSubcountyBarClick(config.dataPointIndex);
                },
            },
        },
        dataLabels: {
            enabled: true,
            offsetX: 10,
            style: {
                fontSize: '10px',
                // fontWeight: 'bold',
                colors: ['#000000'], // Black color for count labels on top of bars
            } as any,
            formatter: (val: number) => Math.round(val).toString(),
        },
        tooltip: {
            enabled: false,
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 4,
                barHeight: '95%',
                distributed: false,
            },
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent'],
        },
    });

    // Ward chart options
    const wardChartOptions = useChart({
        chart: {
            type: 'bar',
            toolbar: { show: false },
            width: '100%',
            height: '100%',
            events: {
                dataPointSelection: (event: any, chartContext: any, config: any) => {
                    handleWardBarClick(config.dataPointIndex);
                },
            },
        },
        dataLabels: {
            enabled: true,
            style: {
                fontSize: '10px',
                // fontWeight: 'bold',
                colors: ['#000000'], // Black color for count labels on top of bars
            } as any,
            formatter: (val: number) => Math.round(val).toString(),
        },
        tooltip: {
            enabled: false,
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 4,
                barHeight: '95%',
                distributed: false,
            },
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent'],
        },
    });



    if (!data || data.length === 0) {
        return (
            <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    {diseaseName ? `No data available for ${diseaseName}` : 'No data available'}
                </Typography>
            </Stack>
        );
    }


    const getWardBarChartHeight = () => {
        if (wardData.values.length > 5) {
            return 300;
        }
        if (wardData.values.length > 2) {
            return 200;
        }
        else {
            return 100;
        }
    }

    return (
        <Stack spacing={3}>
            {/* Summary Card */}
            <Card sx={{ p: 2 }}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                        {diseaseName || 'Selected Indicators'}
                    </Typography>
                    <Typography variant="h4">{totalCount.toLocaleString()}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Total Cases
                    </Typography>
                </Stack>
            </Card>

            {/* Subcounty Chart */}
            {subcountyData.categories.length > 0 && (
                <Card sx={{ p: 2, width: '100%' }}>
                    <Stack spacing={2} sx={{ width: '100%' }}>
                        <Typography variant="h6">Cases By Subcounty</Typography>
                        <Box sx={{ width: '100%', minHeight: "100%" }}>
                            <Chart
                                type="bar"
                                series={[
                                    {
                                        name: 'Cases',
                                        data: subcountyData.values.map((value, index) => ({
                                            x: toTitleCase(removeLocationSuffix(subcountyData.categories[index])),
                                            y: value,
                                        })),
                                    },
                                ]}
                                options={{
                                    ...subcountyChartOptions,
                                    colors: ['#87CEEB'], // Light blue for all subcounty bars
                                    plotOptions: {
                                        ...subcountyChartOptions?.plotOptions,
                                        bar: {
                                            ...(subcountyChartOptions?.plotOptions?.bar as any),
                                            barHeight: '100%',
                                            distributed: false, // Use single color instead of distributed
                                        },
                                    },
                                    xaxis: {
                                        ...(subcountyChartOptions?.xaxis || {}),
                                        categories: subcountyData.categories.map(cat => toTitleCase(removeLocationSuffix(cat))),
                                    },
                                }}
                            />
                        </Box>
                    </Stack>
                </Card>
            )}

            {/* Ward Charts */}
            {wardData.categories.length > 0 && (
                <Stack spacing={3}>
                    {/* Ward Bar Chart */}
                    <Card
                        sx={{ p: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                        <Stack
                            spacing={2}
                            sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}
                        >
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Cases By Ward
                            </Typography>
                            <Box sx={{ width: '100%', height: '100%', minHeight: "100%", flex: 1 }}>
                                <Chart
                                    type="bar"
                                    series={[
                                        {
                                            name: 'Cases',
                                            data: wardData.values.map((value, index) => ({
                                                x: toTitleCase(removeLocationSuffix(wardData.categories[index])),
                                                y: value,
                                                fillColor: wardColors[index],
                                            })),
                                        },
                                    ]}
                                    options={{
                                        ...wardChartOptions,
                                        colors: wardColors,
                                        plotOptions: {
                                            ...wardChartOptions?.plotOptions,
                                            bar: {
                                                ...(wardChartOptions?.plotOptions?.bar as any),
                                                barHeight: '95%',
                                                distributed: true,
                                            },
                                        },
                                        chart: {
                                            ...wardChartOptions?.chart,
                                            width: '100%',
                                            height: getWardBarChartHeight(),
                                        },
                                        xaxis: {
                                            ...(wardChartOptions?.xaxis || {}),
                                            categories: wardData.categories.map(cat => toTitleCase(removeLocationSuffix(cat))),
                                        },
                                    }}
                                />
                            </Box>
                        </Stack>
                    </Card>

                    {/* Ward Pie Chart */}
                    <Card sx={{ p: 2, width: '100%', display: 'flex', flexDirection: 'column' }}>
                        <WardPieChart
                            categories={wardData.categories.map(cat => toTitleCase(removeLocationSuffix(cat)))}
                            values={wardData.values}
                            colors={wardColors}
                            chartHeight={170}
                            onWardClick={handleWardBarClick}
                        />
                    </Card>

                </Stack>
            )}

            {subcountyData.categories.length === 0 && wardData.categories.length === 0 && (
                <Card sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No location data available
                    </Typography>
                </Card>
            )}
        </Stack>
    );
}
