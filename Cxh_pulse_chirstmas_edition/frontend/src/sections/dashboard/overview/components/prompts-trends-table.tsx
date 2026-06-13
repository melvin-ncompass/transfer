import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Tooltip, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Iconify } from '../../../../components/iconify';
import { DataTable } from '../../../../components/tables/data-table';
import type { DataTableColumn } from '../../../../types';
import { useGetPromptsEachIntentTrendQuery } from '../../../../api';
import { TrendSparkline } from './trend-sparkline';
import type { PromptsTrendRow } from './types';
import { RISK_CATEGORY_DISPLAY_NAMES } from '../../prompts/components/constants';
import { debounce } from 'lodash';
import { useChartHover } from '../../climate/contexts/chart-hover-context';

type PromptsTrendsTableProps = {
    dateRange: { from: Date; to: Date };
    intent?: string;
    ward?: string;
    county?: string;
    onTitleClick?: () => void;
    isTitleClickable?: boolean;
    hideTitle?: boolean;
};

/**
 * Prompts Trends Table Component
 * Displays prompts intent trends with sparklines, change percentages, and counts
 */
export const PromptsTrendsTable = memo(function PromptsTrendsTable({
    dateRange,
    intent,
    ward,
    county,
    onTitleClick,
    isTitleClickable = false,
    hideTitle = false,
}: PromptsTrendsTableProps) {
    const [filterName, setFilterName] = useState('');
    const [debouncedFilterName, setDebouncedFilterName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [loaderRequired, setLoaderRequired] = useState(true);
    const { setClickedDate } = useChartHover();

    const [allRows, setAllRows] = useState<PromptsTrendRow[]>([]);

    // Debounce search input - update debouncedFilterName after 500ms of no typing
    const debouncedSetFilter = useRef(
        debounce((value: string) => {
            setDebouncedFilterName(value);
        }, 500)
    ).current;

    // Update debounced value when filterName changes
    useEffect(() => {
        debouncedSetFilter(filterName);
        // Cleanup on unmount
        return () => {
            debouncedSetFilter.cancel();
        };
    }, [filterName, debouncedSetFilter]);

    // Fetch prompts trends data from API - use debouncedFilterName for API call
    const {
        data: { data: promptsTrendsData = [], meta } = {},
        isLoading,
        isFetching,
        error,
        refetch,
    } = useGetPromptsEachIntentTrendQuery({
        startYear: dateRange.from.getFullYear(),
        startMonth: dateRange.from.getMonth() + 1,
        endYear: dateRange.to.getFullYear(),
        endMonth: dateRange.to.getMonth() + 1,
        ...(debouncedFilterName && debouncedFilterName.trim() && { search: debouncedFilterName }), // Only include search if it has a value
        ...(selectedCategory && { category: selectedCategory }),
        page,
        limit,
        ...(intent && { intent }),
        ...(ward && { ward }),
        ...(county && { subcounty: county }),
    }, {
        // Force refetch when parameters change to avoid stale cache
        refetchOnMountOrArgChange: true,
    });

    // Transform API response to PromptsTrendRow format
    const tableData: PromptsTrendRow[] = useMemo(() => {
        if (!promptsTrendsData || promptsTrendsData.length === 0) return [];

        return promptsTrendsData.map((item, index) => {
            const trendData = item.trendData || [];

            const sortedTrendData = trendData.length > 0
                ? [...trendData].sort((a, b) => (a.comYear * 12 + a.comMonth) - (b.comYear * 12 + b.comMonth))
                : [];

            const trend = sortedTrendData.map((d) => d.totalValue);
            // Use Date.UTC to create timestamps in UTC, ensuring timezone-independent date matching
            // comMonth is 1-indexed (1-12), Date.UTC expects 0-indexed (0-11), so subtract 1
            const trendDates = sortedTrendData.map((d) => new Date(Date.UTC(d.comYear, d.comMonth - 1, 1)).getTime());

            return {
                id: `${item.intent}-${item.category || ''}`,    // ensure unique id across pages
                intent: item.intent || 'Unknown Intent',
                category: item.category || '',
                priorityLevel: item.priorityLevel || '',
                trend,
                trendDates,
                overallChange: item.changeData?.overallPercentChange || 0,
                totalCount: item.totalCount || 0,
            };
        });
    }, [promptsTrendsData, page]);


    useEffect(() => {
        setPage(1);
        setAllRows([]);     // reset accumulated rows
        setLoaderRequired(true); // Show loader when filters change
        // setClickedDate(null);
    }, [
        selectedCategory,
        dateRange.from, // Use timestamp to detect date changes reliably
        dateRange.to
    ]);

    // Separate effect to clear search when category or date range changes
    useEffect(() => {
        setFilterName('');
    }, [selectedCategory, dateRange.from, dateRange.to]);

    // Update loaderRequired based on fetching state for infinite scroll
    useEffect(() => {
        if (isFetching) {
            // Show loader when fetching (both initial load and infinite scroll)
            setLoaderRequired(true);
        } else if (!isLoading && !isFetching) {
            // When not fetching, check if we need to keep loader for infinite scroll
            if (meta?.totalPages && page < meta.totalPages) {
                // There are more pages, but we're not fetching yet
                // Keep loader hidden so sentinel is visible for infinite scroll
                // The loader will show when fetching starts
                setLoaderRequired(false);
            } else if (meta?.totalPages && page >= meta.totalPages) {
                // Reached last page, hide loader
                setLoaderRequired(false);
            } else {
                // No meta data or unknown state, hide loader
                setLoaderRequired(false);
            }
        }
    }, [isFetching, isLoading, page, meta?.totalPages]);

    // Reset page and clear accumulated rows when debouncedFilterName changes (search)
    // This ensures we start from page 1 when user searches or clears search, but don't clear the input
    useEffect(() => {
        // Reset state when search changes (including when cleared to empty string)
        setPage(1);
        setAllRows([]);
        setLoaderRequired(true); // Enable loader to allow infinite scroll to work
        // Force refetch when search is cleared to ensure fresh data
        if (debouncedFilterName === '') {
            refetch();
        }
    }, [debouncedFilterName, refetch]);

    // Helper function to get category display label - memoized
    const getCategoryLabel = useCallback((category: string): string => {
        if (category in RISK_CATEGORY_DISPLAY_NAMES) {
            return RISK_CATEGORY_DISPLAY_NAMES[category as keyof typeof RISK_CATEGORY_DISPLAY_NAMES];
        }
        return category;
    }, []);

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
        { id: 'intent', label: 'Intent', align: 'left', width: '20%' },
        { id: 'trend', label: 'Trend', align: 'center', sortable: false, width: '80%' },
        // { id: 'overallChange', label: 'Change %', align: 'right' },
        // { id: 'totalCount', label: 'Count', align: 'right' },
    ], []);

    const renderCells = useCallback((row: PromptsTrendRow) => [
        <Tooltip title={row.intent} key="intent" arrow>
            <Typography
                variant="body2"
                sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 200,
                }}
            >
                {row.intent}
            </Typography>
        </Tooltip>,
        <Box
            key="trend"
            className="trend-sparkline-cell"
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                minWidth: 200,
            }}
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
        //     {row.totalCount.toLocaleString()}
        // </Typography>,
    ], []);

    // Filter table data by category first (before passing to DataTable)
    const filteredTableData = useMemo(() => {
        if (!selectedCategory) {
            return tableData;
        }
        return tableData.filter((row) => row.category === selectedCategory);
    }, [tableData, selectedCategory]);

    // Filter function for search only (category is already filtered)
    const filterFn = (row: PromptsTrendRow, filter: string) => {
        if (filter && filter.trim().length > 0) {
            const searchLower = filter.toLowerCase();
            return row.intent.toLowerCase().includes(searchLower);
        }
        return true;
    };

    // useEffect(() => {
    //     if (filteredTableData.length > 0) {
    //         setAllRows(prev => [...prev, ...filteredTableData]);
    //     }
    // }, [filteredTableData]);

    useEffect(() => {
        // If we have data, accumulate it
        if (filteredTableData?.length > 0) {
            setAllRows(prev => {
                // If we're on page 1 and allRows was just cleared (length is 0), start fresh
                // This handles both initial load and when search is cleared
                if (page === 1 && prev.length === 0) {
                    // Start with fresh data (either initial load or after clearing search)
                    return filteredTableData;
                }
                // Otherwise, accumulate unique rows (for pagination/infinite scroll)
                const seen = new Set(prev.map(r => r.id));
                const unique = filteredTableData.filter(r => !seen.has(r.id));
                return [...prev, ...unique];
            });
        }

        // If loading is complete and we have no data (empty array from API), hide loader
        // This handles both initial load and search with no results
        if (!isLoading && !isFetching && filteredTableData?.length === 0 && page === 1) {
            setLoaderRequired(false);
        }

        // If we have data and loading is complete, manage loader state
        // Only show loader when actually fetching, not just because more pages exist
        // The infinite scroll will trigger based on sentinel visibility, not loader state
        if (!isLoading && !isFetching && filteredTableData?.length > 0) {
            // If we've reached the last page, hide loader
            if (meta?.totalPages && page >= meta.totalPages) {
                setLoaderRequired(false);
            } else {
                // There are more pages, but we're not fetching yet
                // Hide loader so sentinel can be visible for infinite scroll
                // Loader will show again when fetching starts (handled by isFetching effect)
                setLoaderRequired(false);
            }
        }
    }, [filteredTableData, isLoading, isFetching, page, meta]);

    // Hide loader when loading completes with no data
    // This ensures loader stops even if filteredTableData effect doesn't trigger
    useEffect(() => {
        if (!isLoading && !isFetching && !error && allRows.length === 0 && page === 1) {
            setLoaderRequired(false);
        }
    }, [isLoading, isFetching, error, allRows.length, page]);

    // Sort function to extract sortable values from row data
    const sortFn = (row: PromptsTrendRow, columnId: string): string | number => {
        switch (columnId) {
            case 'intent':
                return row.intent || '';
            case 'overallChange':
                return row.overallChange || 0;
            case 'totalCount':
                return row.totalCount || 0;
            case 'trend':
                // Trend column is not sortable, but return 0 as fallback
                return 0;
            default:
                return '';
        }
    };

    // Show loading only on initial load when we have no rows yet
    if ((isLoading || isFetching) && allRows.length === 0 && !error) {
        return (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    // Show error only if we have no data at all
    if (error && allRows.length === 0) {
        return (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <Typography variant="body2" color="error">
                    Error loading prompts trends data
                </Typography>
            </Box>
        );
    }
    const handleCategoryChange = (e: any) => {
        setLoaderRequired(true);
        setSelectedCategory(e.target.value);
        setPage(1);
    }

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {!hideTitle && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row', md: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center', md: 'center' },
                        justifyContent: 'space-between',
                        gap: 2,
                        px: 2,
                        pt: 2,
                        pb: 1,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, textWrap: 'nowrap' }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                ...(isTitleClickable && {
                                    cursor: 'pointer',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                    },
                                }),
                            }}
                            onClick={isTitleClickable ? onTitleClick : undefined}
                        >
                            Community Reported Trends
                        </Typography>
                        {(isLoading || isFetching) && (
                            <CircularProgress size={16} />
                        )}
                    </Box>
                    {/* Search and filter - Next to title */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FormControl size="small" sx={{ width: 150 }}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={selectedCategory}
                                label="Category"
                                onChange={handleCategoryChange}
                            >
                                <MenuItem value="">
                                    <em>All Categories</em>
                                </MenuItem>
                                <MenuItem value='baby_risk'>Baby Risk</MenuItem>
                                <MenuItem value='maternal_risk'>Maternal Risk</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            size="small"
                            placeholder="Search intents..."
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            sx={{ width: { xs: 150, sm: 200, md: 200, lg: 210 } }}
                            inputProps={{ maxLength: 150 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </Box>
            )}
            {hideTitle && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 2, gap: 2, px: 2, pt: 2 }}>
                    <FormControl size="small" sx={{ minWidth: { xs: 120, md: 180 }, width: { xs: 100 } }}>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={selectedCategory}
                            label="Category"
                            onChange={handleCategoryChange}
                        >
                            <MenuItem value="">
                                <em>All Categories</em>
                            </MenuItem>
                            <MenuItem value='baby_risk'>Baby Risk</MenuItem>
                            <MenuItem value='maternal_risk'>Maternal Risk</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        placeholder="Search intents..."
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        sx={{ width: { xs: 200, sm: 200, md: 250 }, minWidth: { xs: 200 } }}
                        slotProps={{ htmlInput: { maxLength: 100 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            )}
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', px: 2, pb: 2, mt: 1 }}>
                <DataTable
                    hideToolbar
                    columns={columns}
                    rows={allRows}
                    getRowId={(row) => row.id}
                    renderCells={renderCells}
                    filterName={filterName}
                    onFilterName={(e) => setFilterName(e.target.value)}
                    filterFn={filterFn}
                    sortFn={sortFn}
                    disablePagination // Disable pagination - show all rows
                    defaultSortBy="overallChange"
                    defaultSortOrder="desc"
                />
            </Box>
        </Box>
    );
});

