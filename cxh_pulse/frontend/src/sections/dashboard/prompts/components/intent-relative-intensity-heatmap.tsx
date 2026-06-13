import { useMemo, useState } from 'react';
import { Card, Typography, Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, InputAdornment } from '@mui/material';
import { useGetPromptsIntentRelativeIntensityQuery } from '@/api';
import { DATE_RANGE_MIN_YEAR, DATE_RANGE_MIN_MONTH, DATE_RANGE_MAX_YEAR, DATE_RANGE_MAX_MONTH } from '@/store/constants';
import { Iconify } from '@/components/iconify';
import getCellColors from '../../overview/utils/gradient-color';

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
    const [filterName, setFilterName] = useState('');
    const [sortColumn, setSortColumn] = useState<number | null>(null); // tempBin number or null
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // 'asc' or 'desc'

    // Use provided date range or default to full range
    const fromDate = dateRange?.from || new Date(DATE_RANGE_MIN_YEAR, DATE_RANGE_MIN_MONTH, 1);
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

    // Get all unique bins
    const bins = useMemo(() => Array.from(new Set(data.map((item) => item.tempBin))).sort(), [data]);

    // Search and sort intents
    const filteredAndSortedIntents = useMemo(() => {
        const search = filterName.trim().toLowerCase();

        const allIntents = Array.from(
            new Set(data.map((item) => item?.rawIntent))
        );

        let filtered = allIntents;
        if (search) {
            filtered = allIntents.filter((intent) =>
                intent?.toLowerCase().includes(search)
            );
        }

        // Sort if a column is selected
        if (sortColumn !== null && sortOrder) {
            filtered = [...filtered].sort((a, b) => {
                const aData = data.find((item) => item.rawIntent === a && item.tempBin === sortColumn);
                const bData = data.find((item) => item.rawIntent === b && item.tempBin === sortColumn);

                const aValue = aData?.intensityPercent ?? 0;
                const bValue = bData?.intensityPercent ?? 0;

                if (sortOrder === 'asc') {
                    return aValue - bValue;
                } else {
                    return bValue - aValue;
                }
            });
        }

        return filtered;
    }, [data, filterName, sortColumn, sortOrder]);

    // Handle column header click for sorting
    // Cycle through: unsorted -> desc -> asc -> unsorted
    const handleSort = (bin: number) => {
        if (sortColumn === bin) {
            // If clicking the same column, cycle through states
            if (sortOrder === 'desc') {
                // desc -> asc
                setSortOrder('asc');
            } else if (sortOrder === 'asc') {
                // asc -> unsorted (reset)
                setSortColumn(null);
                setSortOrder('desc');
            }
        } else {
            // Set new sort column and default to descending
            setSortColumn(bin);
            setSortOrder('desc');
        }
    };


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
        <Card sx={{ p: 0.5, margin: 0 }}>
            <Box sx={{ m: 1, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Intent Relative Intensity by Temperature
                </Typography>
                <TextField
                    value={filterName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterName(e.target.value)}
                    placeholder="Search topic..."
                    label="Search"
                    size="small"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Iconify width={18} icon="eva:search-fill" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: { xs: 140, sm: 180, md: 220 } }}
                />
            </Box>
            <TableContainer component={Paper} sx={{ height: 400, overflow: 'auto' }}>
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
                            {bins.map((bin) => {
                                const binItem = data.find((item) => item.tempBin === bin);
                                const isSorted = sortColumn === bin;
                                return (
                                    <TableCell
                                        key={bin}
                                        align="center"
                                        sx={{
                                            fontWeight: 700,
                                            backgroundColor: 'background.paper',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                            },
                                        }}
                                        onClick={() => handleSort(bin)}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 0.5,
                                            }}
                                        >
                                            <Typography variant="body2" component="span" sx={{ fontWeight: 700 }}>
                                                {binItem ? `${binItem.tempRangeStart} - ${binItem.tempRangeEnd}°C` : `Bin ${bin}`}
                                            </Typography>
                                            {isSorted && (
                                                <Iconify
                                                    icon={sortOrder === 'asc' ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
                                                    width={16}
                                                    sx={{ color: 'primary.main' }}
                                                />
                                            )}
                                            {!isSorted && (
                                                <Iconify
                                                    icon="carbon:chevron-sort"
                                                    width={16}
                                                    sx={{ color: 'text.disabled', opacity: 0.5 }}
                                                />
                                            )}
                                        </Box>
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAndSortedIntents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={10} align="center">
                                    No matching health topics found
                                </TableCell>
                            </TableRow>
                        )}
                        {filteredAndSortedIntents.map((intent) => {
                            const intentData = data.filter((item) => item.rawIntent === intent);

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
                                                <TableCell key={bin} align="center">
                                                    -
                                                </TableCell>
                                            );
                                        }
                                        
                                        const { cellColor, textColor } = getCellColors(binData, data);

                                        return (
                                            <TableCell
                                                key={bin}
                                                align="left"
                                                sx={{
                                                    backgroundColor: cellColor,
                                                    color: textColor,
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