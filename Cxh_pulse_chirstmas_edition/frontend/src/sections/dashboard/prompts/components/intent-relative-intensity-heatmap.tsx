import { Card, Typography, Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useGetPromptsIntentRelativeIntensityQuery } from '../../../../api';
import { DATE_RANGE_MIN_YEAR, DATE_RANGE_MIN_MONTH, DATE_RANGE_MAX_YEAR, DATE_RANGE_MAX_MONTH } from '../../../../store/constants';

// ----------------------------------------------------------------------

type IntentRelativeIntensityHeatmapProps = {
    dateRange?: { from: Date; to: Date };
    ward?: string;
    subcounty?: string;
};

/**
 * IntentRelativeIntensityHeatmap - Table-based heatmap showing intent intensity by temperature bins
 * 
 * Displays:
 * - Health Topics (intents) as rows
 * - Three temperature bins as columns (0-30°C, 30-35°C, 35-40°C)
 * - Color intensity based on intensityPercentage
 */
export function IntentRelativeIntensityHeatmap({
    dateRange,
    ward,
    subcounty,
}: IntentRelativeIntensityHeatmapProps) {
    // Use provided date range or default to full range
    const fromDate = dateRange?.from || new Date(DATE_RANGE_MIN_YEAR, DATE_RANGE_MIN_MONTH - 1, 1);
    const toDate = dateRange?.to || new Date(DATE_RANGE_MAX_YEAR, DATE_RANGE_MAX_MONTH - 1, 1);

    const {
        data = [],
        isLoading,
        error,
    } = useGetPromptsIntentRelativeIntensityQuery({
        startYear: fromDate.getFullYear(),
        startMonth: fromDate.getMonth() + 1,
        endYear: toDate.getFullYear(),
        endMonth: toDate.getMonth() + 1,
        ...(ward && { ward }),
        ...(subcounty && { subcounty }),
    });

    if (isLoading) {
        return (
            <Card sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                    <CircularProgress />
                </Box>
            </Card>
        );
    }

    if (error) {
        return (
            <Card sx={{ p: 3 }}>
                <Alert severity="error">Error loading intent relative intensity data</Alert>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card sx={{ p: 3 }}>
                <Alert severity="info">No data available</Alert>
            </Card>
        );
    }

    return (
        <Card sx={{ p:0.5, margin: 0 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Intent Relative Intensity by Temperature
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Table
                    stickyHeader
                    size="small"
                    sx={{
                        "& td, & th": {
                            py: { xs: 0.25, sm: 0.5, md: 1 },
                            px: { xs: 0.25, sm: 0.5, md: 1 },
                            fontSize: { xs: "0.65rem", sm: "0.75rem", md: "0.875rem" },
                        },
                        "& th": { fontWeight: 600 }
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 3,
                                    backgroundColor: 'background.paper',
                                    fontWeight: 600,
                                    borderRight: 1,
                                    borderColor: 'divider',
                                    width: { xs: 70, sm: 110, md: 280 },
                                    maxWidth: { xs: 70, sm: 110, md: 280 },
                                }}
                            >
                                Health Topic
                            </TableCell>
                            {Array.from(new Set(data.map((item) => item.tempBin))).sort().map((bin) => {
                                const binItem = data.find((item) => item.tempBin === bin);
                                return (
                                    <TableCell
                                        key={bin}
                                        align="left"
                                        sx={{
                                            fontWeight: 600,
                                            backgroundColor: 'background.paper',
                                            textAlign: { xs: 'center' }
                                        }}
                                    >
                                        {binItem ? `${binItem.tempRangeStart} - ${binItem.tempRangeEnd}°C` : `Bin ${bin}`}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Array.from(new Set(data.map((item) => item.rawIntent))).map((intent) => {
                            const intentData = data.filter((item) => item.rawIntent === intent);
                            const bins = Array.from(new Set(data.map((item) => item.tempBin))).sort();

                            return (
                                <TableRow key={intent} hover>
                                    <TableCell
                                        sx={{
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 2,
                                            backgroundColor: 'background.paper',
                                            borderRight: 1,
                                            borderColor: 'divider',
                                            fontWeight: 500,
                                            width: { xs: 70, sm: 120, md: 280 },
                                            maxWidth: { xs: 70, sm: 120, md: 280 },

                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',

                                        }}
                                        title={intent}
                                    >
                                        {intent}
                                    </TableCell>
                                    {bins.map((bin) => {
                                        const binData = intentData.find((item) => item.tempBin === bin);

                                        if (!binData) {
                                            return (
                                                <TableCell key={bin} align="right">
                                                    -
                                                </TableCell>
                                            );
                                        }

                                        // Calculate color based on intensityPercentage
                                        // Find min and max intensityPercentage for normalization
                                        const intensityRatios = data.map((item) => item.intensityPercent!);
                                        const minIntensityRatio = Math.min(...intensityRatios);
                                        const maxIntensityRatio = Math.max(...intensityRatios);
                                        const range = maxIntensityRatio - minIntensityRatio || 1;

                                        // Normalize to 0-1 range, then apply exponential scaling to amplify small differences
                                        const normalizedRatio = (binData.intensityPercent || 0 - minIntensityRatio) / range;
                                        // Apply square root to amplify differences in the lower range
                                        const amplifiedRatio = Math.pow(normalizedRatio, 0.5);

                                        // Darker red gradient: light pink (low) to dark red (high)
                                        // More muted colors: from light pink (255, 200, 200) to dark red (139, 0, 0)
                                        const r = Math.round(255 - 116 * amplifiedRatio); // From 255 to 139
                                        const g = Math.round(200 * (1 - amplifiedRatio)); // From 200 to 0
                                        const b = Math.round(200 * (1 - amplifiedRatio)); // From 200 to 0
                                        const cellColor = `rgb(${r}, ${g}, ${b})`;

                                        return (
                                            <TableCell
                                                key={bin}
                                                align="left"
                                                sx={{
                                                    backgroundColor: cellColor,
                                                    fontWeight: 500,
                                                    minWidth: { xs: 55, sm: 70, md: 100 },
                                                    textAlign: { xs: "center", md: "center" },
                                                }}
                                            >
                                                {binData.intensityPercent || 0}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>
    );
}