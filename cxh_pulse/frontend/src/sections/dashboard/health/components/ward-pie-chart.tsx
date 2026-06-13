import { useMemo } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { Chart, useChart } from '../../../../components/chart';
import { getGradientColors } from '../../../../utils/color-gradient';

// ----------------------------------------------------------------------

type WardPieChartProps = {
    /** Ward categories (names) */
    categories: string[];
    /** Ward values (counts) */
    values: number[];
    /** Preserved colors for wards (to maintain consistency when filtering) */
    colors?: string[];
    /** Chart height */
    chartHeight?: number;
    /** Function to handle ward selection */
    onWardClick?: (wardIndex: number) => void;
};

/**
 * WardPieChart - Displays ward data as a pie chart with external legend
 *
 * Features:
 * - Large pie chart visualization
 * - Legend displayed outside the chart area
 * - Clickable slices for filtering
 * - Gradient colors matching other charts
 */
export function WardPieChart({
    categories,
    values,
    colors,
    chartHeight = 100,
    onWardClick,
}: WardPieChartProps) {
    // Use provided colors or generate gradient colors for wards
    const wardColors = useMemo(() => {
        if (colors && colors.length === categories.length) {
            return colors;
        }
        return getGradientColors(values);
    }, [colors, categories.length, values]);

    // Handle pie slice click
    const handleSliceClick = (dataPointIndex: number) => {
        if (dataPointIndex >= 0 && categories[dataPointIndex]) {
            onWardClick?.(dataPointIndex);
        }
    };

    // Pie chart options
    const pieChartOptions = useChart({
        chart: {
            type: 'pie',
            toolbar: { show: false },
            width: '100%',
            height: '100%',
            events: {
                dataPointSelection: (event: any, chartContext: any, config: any) => {
                    handleSliceClick(config.dataPointIndex);
                },
            },
        },
        labels: categories,
        colors: wardColors,
        dataLabels: {
            enabled: false,
        },
        tooltip: {
            enabled: false,
        },
        legend: {
            show: false, // Legend is handled externally
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '0%',
                },
                expandOnClick: false,
            },
        },
        states: {
            active: {
                filter: {
                    type: 'none',
                },
            },
            hover: {
                filter: {
                    type: 'none',
                },
            },
        },
    });

    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack spacing={2} sx={{ width: '100%' }}>
                <Typography variant="h6">Cases By Ward</Typography>

                {/* Pie Chart - Large and focused */}
                <Box
                    sx={{
                        width: '100%',
                        height: chartHeight,
                        minHeight: chartHeight,
                        maxHeight: chartHeight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Chart
                        type="pie"
                        series={values}
                        options={{
                            ...pieChartOptions,
                            labels: categories,
                            colors: wardColors,
                            chart: {
                                ...(pieChartOptions?.chart || {}),
                                height: chartHeight,
                            },
                        }}
                    />
                </Box>

                {/* External Legend - Compact */}
                <Box sx={{ pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                    <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{
                            flexWrap: 'wrap',
                            gap: 0.5,
                        }}
                    >
                        {categories.map((category, index) => (
                            <Chip
                                key={category}
                                label={category}
                                size="small"
                                sx={{
                                    backgroundColor: 'transparent',
                                    color: 'text.primary',
                                    fontWeight: 400,
                                    fontSize: '11px',
                                    height: '24px',
                                    cursor: 'pointer',
                                    border: `1px solid ${wardColors[index]}`,
                                    '& .MuiChip-label': {
                                        paddingLeft: 0.5,
                                        paddingRight: 0.75,
                                    },
                                    '&:hover': {
                                        backgroundColor: wardColors[index],
                                        color: 'white',
                                    },
                                }}
                                icon={
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            backgroundColor: wardColors[index],
                                            marginLeft: 0.5,
                                        }}
                                    />
                                }
                                onClick={() => handleSliceClick(index)}
                            />
                        ))}
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
}

