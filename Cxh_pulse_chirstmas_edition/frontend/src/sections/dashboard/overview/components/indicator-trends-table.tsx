import { useState, useMemo, useCallback, memo } from 'react';
import { Box, CircularProgress, Typography, Tooltip, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Iconify } from '../../../../components/iconify';
import { DataTable } from '../../../../components/tables/data-table';
import type { DataTableColumn } from '../../../../types';
import { useGetKhisEachIndicatorTrendQuery, useGetDkhisIndicatorDateFilterQuery } from '../../../../api';
import { TrendSparkline } from './trend-sparkline';
import type { IndicatorTrendRow } from './types';
import { POPULATION_INDICATOR_VALUE } from '../../../../components/location-filters/indicator-select';
import { indicatorTrendsTableStyles } from '../../../../styles/sections/indicator-trends-table.styles';
import type { IndicatorTrendsTableProps } from '../../../../types/sections.types';

/**
 * Indicator Trends Table Component
 * Displays indicator trends with sparklines, change percentages, and counts
 */
export const IndicatorTrendsTable = memo(function IndicatorTrendsTable({
    dateRange,
    ward,
    county,
    selectedIndicator,
    hideTitle = false,
}: IndicatorTrendsTableProps) {
    const [filterName, setFilterName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // Check if Population is selected
    const isPopulationMode = selectedIndicator === POPULATION_INDICATOR_VALUE;

    // Fetch indicator metadata to get categories
    const { data: indicatorsData } = useGetDkhisIndicatorDateFilterQuery();

    // Fetch indicator trends data from API
    const {
        data: indicatorTrendsData = [],
        isLoading,
        isFetching,
        error,
    } = useGetKhisEachIndicatorTrendQuery({
        startYear: dateRange.from.getFullYear(),
        startMonth: dateRange.from.getMonth() + 1,
        endYear: dateRange.to.getFullYear(),
        endMonth: dateRange.to.getMonth() + 1,
        ...(ward && { ward }),
        ...(county && { subcounty: county }),
    });

    // Create a map of indicator to category from metadata
    // Check both 'category' and 'section' fields as the API might use either
    const indicatorCategoryMap = useMemo(() => {
        const map: Record<string, string> = {};
        if (indicatorsData && Array.isArray(indicatorsData)) {
            indicatorsData.forEach((ind: any) => {
                if (ind.indicator) {
                    // Try category first, then section as fallback
                    const category = ind.category || ind.section;
                    if (category) {
                        map[ind.indicator] = category;
                    }
                }
            });
        }

        return map;
    }, [indicatorsData]);

    // Transform API response to IndicatorTrendRow format
    const tableData: IndicatorTrendRow[] = useMemo(() => {
        if (!indicatorTrendsData || indicatorTrendsData.length === 0) return [];

        return indicatorTrendsData.map((item: any, index: number) => {
            // Sort trendData by year and month, then extract totalValue
            // Use a more efficient sort by creating a single comparison value
            const trendData = item.trendData || [];
            const sortedTrendData = trendData.length > 0
                ? [...trendData].sort((a, b) => {
                    const aValue = a.comYear * 12 + a.comMonth;
                    const bValue = b.comYear * 12 + b.comMonth;
                    return aValue - bValue;
                })
                : [];

            const trend = sortedTrendData.map((d) => d.totalValue);
            // Use Date.UTC to create timestamps in UTC, ensuring timezone-independent date matching
            // comMonth is 1-indexed (1-12), Date.UTC expects 0-indexed (0-11), so subtract 1
            const trendDates = sortedTrendData.map((d) => new Date(Date.UTC(d.comYear, d.comMonth - 1, 1)).getTime());

            // Check if category is directly in the response, otherwise use the map
            const category = (item as any).category || indicatorCategoryMap[item.indicator] || '';

            return {
                id: `${index + 1}`,
                indicator: item.indicator || 'Unknown Indicator',
                category,
                trend,
                trendDates,
                overallChange: item.changeData?.overallPercentChange || 0,
                indicatorCount: item.totalCount || 0,
            };
        });
    }, [indicatorTrendsData, indicatorCategoryMap]);

    // Extract unique categories from tableData
    const uniqueCategories = useMemo(() => {
        const categories = new Set<string>();
        tableData.forEach((row) => {
            if (row.category) {
                categories.add(row.category);
            }
        });
        return Array.from(categories).sort();
    }, [tableData]);

    const columns: DataTableColumn[] = useMemo(() => [
        { id: 'indicator', label: 'Indicator', align: 'left', width: '20%' },
        { id: 'trend', label: 'Trend', align: 'center', sortable: false, width: '80%' },
        // { id: 'overallChange', label: 'Change %', align: 'right' },
        // { id: 'indicatorCount', label: 'Count', align: 'right' },
    ], []);

    const renderCells = useCallback((row: IndicatorTrendRow) => [
        <Tooltip title={row.indicator} key="indicator" arrow>
            <Typography
                variant="body2"
                sx={indicatorTrendsTableStyles.indicatorText}
            >
                {row.indicator}
            </Typography>
        </Tooltip>,
        <Box
            key="trend"
            className="trend-sparkline-cell"
            sx={indicatorTrendsTableStyles.trendCell}
        >
            <TrendSparkline data={row.trend} dates={row.trendDates} />
        </Box>,
        // <Box
        //     key="change"
        //     sx={{
        //         display: 'flex',
        //         alignItems: 'center',
        //         justifyContent: 'flex-end',
        //         gap: 0.5,
        //     }}
        // >
        //     {row.overallChange >= 0 ? (
        //         <Iconify icon="eva:arrow-ios-upward-fill" width={16} />
        //     ) : (
        //         <Iconify icon="eva:arrow-ios-downward-fill" width={16} />
        //     )}
        //     <Typography
        //         variant="body2"
        //         sx={{
        //             fontWeight: 500,
        //         }}
        //     >
        //         {row.overallChange >= 0 ? '+' : ''}
        //         {row.overallChange.toFixed(1)}%
        //     </Typography>
        // </Box>,
        // <Typography key="count" variant="body2">
        //     {row.indicatorCount.toLocaleString()}
        // </Typography>,
    ], []);

    // Filter table data by selected indicator or by search/category (if Population mode)
    const filteredTableData = useMemo(() => {
        let filtered = tableData;

        // If Population is selected, use search and category filters
        if (isPopulationMode) {
            // First filter by category
            if (selectedCategory) {
                filtered = filtered.filter((row) => row.category === selectedCategory);
            }
            // Then filter by search (if provided)
            if (filterName && filterName.trim().length > 0) {
                const searchLower = filterName.toLowerCase();
                filtered = filtered.filter((row) => row.indicator.toLowerCase().includes(searchLower));
            }
            return filtered;
        }

        // If an indicator is selected (not Population), filter by that indicator
        if (selectedIndicator && selectedIndicator.trim() !== '') {
            return filtered.filter((row) => row.indicator === selectedIndicator);
        }

        // If no indicator selected, show all
        return filtered;
    }, [tableData, selectedIndicator, isPopulationMode, selectedCategory, filterName]);

    // Filter function for DataTable (used when Population mode with search)
    const filterFn = (row: IndicatorTrendRow, filter: string) => {
        if (isPopulationMode && filter && filter.trim().length > 0) {
            const searchLower = filter.toLowerCase();
            return row.indicator.toLowerCase().includes(searchLower);
        }
        return true;
    };

    // Sort function to extract sortable values from row data
    const sortFn = (row: IndicatorTrendRow, columnId: string): string | number => {
        switch (columnId) {
            case 'indicator':
                return row.indicator || '';
            case 'overallChange':
                return row.overallChange || 0;
            case 'indicatorCount':
                return row.indicatorCount || 0;
            case 'trend':
                // Trend column is not sortable, but return 0 as fallback
                return 0;
            default:
                return '';
        }
    };

    // Show loading only on initial load or when fetching with no data
    if ((isLoading || isFetching) && tableData.length === 0 && !error) {
        return (
            <Box sx={indicatorTrendsTableStyles.stateContainer}>
                <CircularProgress />
            </Box>
        );
    }

    // Show error only if we have no data at all
    if (error && tableData.length === 0) {
        return (
            <Box sx={indicatorTrendsTableStyles.stateContainer}>
                <Typography variant="body2" color="error">
                    Error loading indicator trends data
                </Typography>
            </Box>
        );
    }

    if (tableData.length === 0) {
        return (
            <Box sx={indicatorTrendsTableStyles.stateContainer}>
                <Typography variant="body2" color="text.secondary">
                    No indicator trends data available
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={indicatorTrendsTableStyles.container}>
            {!hideTitle && (
                <Box sx={indicatorTrendsTableStyles.headerContainer}>
                    <Box sx={indicatorTrendsTableStyles.titleContainer}>
                        <Typography
                            variant="h6"
                            sx={indicatorTrendsTableStyles.title}
                        >
                            Health Outcome Trends
                        </Typography>
                        {(isLoading || isFetching) && (
                            <CircularProgress size={16} />
                        )}
                    </Box>
                    <Box sx={indicatorTrendsTableStyles.hiddenFiltersContainer}>
                        <FormControl size="small" sx={indicatorTrendsTableStyles.formControl}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={selectedCategory}
                                label="Category"
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>All Categories</em>
                                </MenuItem>
                                {uniqueCategories.map((category) => (
                                    <MenuItem key={category} value={category}>
                                        {category}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            size="small"
                            placeholder="Search indicators..."
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            sx={indicatorTrendsTableStyles.searchTextField}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Iconify icon="eva:search-fill" width={20} sx={indicatorTrendsTableStyles.searchIcon} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </Box>
            )}
            {hideTitle && isPopulationMode && (
                <Box sx={indicatorTrendsTableStyles.filtersRow}>
                    <FormControl size="small" sx={indicatorTrendsTableStyles.formControl}>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={selectedCategory}
                            label="Category"
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>All Categories</em>
                            </MenuItem>
                            {uniqueCategories.map((category) => (
                                <MenuItem key={category} value={category}>
                                    {category}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        placeholder="Search indicators..."
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        sx={indicatorTrendsTableStyles.searchTextField}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Iconify icon="eva:search-fill" width={20} sx={indicatorTrendsTableStyles.searchIcon} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            )}
            <Box sx={indicatorTrendsTableStyles.tableContainer}>
                <DataTable
                    hideToolbar
                    columns={columns}
                    rows={filteredTableData}
                    getRowId={(row) => row.id}
                    renderCells={renderCells}
                    filterName={isPopulationMode ? filterName : ''}
                    onFilterName={isPopulationMode ? (e) => setFilterName(e.target.value) : () => { }}
                    filterFn={filterFn}
                    sortFn={sortFn}
                    disablePagination // Disable pagination - show all rows
                    defaultSortBy="overallChange"
                    defaultSortOrder="desc"
                    isLoading={isLoading || isFetching}
                />
            </Box>
        </Box>
    );
});

