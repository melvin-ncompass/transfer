import { useState, useMemo, useCallback, memo, useEffect } from 'react';

import { Box, CircularProgress, Typography, Tooltip, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, IconButton, Chip, Badge, Stack } from '@mui/material';
import { Iconify } from '../../../../components/iconify';
import { TrendSparkline } from './trend-sparkline';
import { LazyDataTable } from '../../../../components/tables/lazy-data-table'

import { createUTCTimestampForMonth } from '../../../../utils/date-parsing';
import { useGetPromptsIntentCSVMutation, useLazyGetPromptsEachIntentTrendQuery } from '../../../../api';
import { debounce } from 'lodash';
import type { PromptsTrendRow } from './types';
import type { DataTableColumn } from '../../../../types';
import { promptsTrendTableV1Styles } from '../../../../styles/sections/prompts-trend-table-v1.styles';
import type { PromptsTrendTableV1Props } from '../../../../types/sections.types';
import { ReportGuard } from '../../components/protected-components/permission-guard';
import { WithPermission } from '../../../../components/utils/with-permission';
import { PermissionName } from '../../../../types/permissions';

/**
 * Prompts Trends Table V1 Component
 * Implements lazy loading
 */
export const PromptsTrendTableV1Internal = memo(function PromptsTrendTableV1Internal({
    dateRange,
    intent,
    ward,
    county,
    onTitleClick,
    isTitleClickable = false,
    hideTitle = false,
    hasPromptsPermission,
    isPlaying = false,
}: PromptsTrendTableV1Props & { isPlaying?: boolean }) {
    const [filterName, setFilterName] = useState('');
    const [debouncedFilterName, setDebouncedFilterName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [promptsTrendsData, setPromptsTrendsData] = useState<PromptsTrendRow[]>([]);
    const hasSearch = true;

    const [totalCountPrompts, setTotalCountPrompts] = useState(0);
    const [page, setPage] = useState(1);
    const [fetching, setFetching] = useState(false);
    const ROWS_PER_PAGE = 10;

    // for sorting of table data
    // const [orderBy, setOrderBy] = useState<string>(defaultSortBy || '');
    // const [order, setOrder] = useState<'asc' | 'desc'>(
    //   defaultSortBy ? defaultSortOrder : 'asc'
    // );

    const [exportCSV, { isLoading: isLoadingCsv }] = useGetPromptsIntentCSVMutation();

    const debouncedSetFilter = useMemo(
        () => debounce((value: string) => {
            setDebouncedFilterName(value);
            setPage(1); // reset page only after debounce
        }, 500),
        []
    );

    useEffect(() => {
        debouncedSetFilter(filterName);
        return () => {
            debouncedSetFilter.cancel();
        };
    }, [filterName, debouncedSetFilter]);

    /** 
     * FetchData: Call with pagination for lazy api fetching 
    **/
    const [triggerFetch, { isLoading, isFetching, error }] = useLazyGetPromptsEachIntentTrendQuery();

    const fetchData = useCallback(async (pageNum: number, searchFilter: string, categoryName: string, isNewSearch = false) => {
        try {
            // if (!hasPromptsPermission) return; // Do not fetch if no prompts permission granted

            const result = await triggerFetch({
                startYear: dateRange.from.getFullYear(),
                startMonth: dateRange.from.getMonth() + 1,
                endYear: dateRange.to.getFullYear(),
                endMonth: dateRange.to.getMonth() + 1,
                page: pageNum,
                limit: ROWS_PER_PAGE,
                search: searchFilter,
                category: categoryName,
                // sortBy: orderBy || undefined,
                // sortOrder: orderBy ? order : undefined,
                ...(intent && { intent }),
                ...(ward ? { wardId: ward } : ''),
                ...(county && { subcountyId: county }),
            }).unwrap();

            // Transform API response to PromptsTrendRow format
            const transformedChunk = (result.data || []).map((item: any) => {
                const trendData = item.trendData || [];
                const sortedTrendData = trendData.length > 0
                    ? [...trendData].sort((a: any, b: any) => (a.comYear * 12 + a.comMonth) - (b.comYear * 12 + b.comMonth))
                    : [];

                return {
                    id: `${item.intent}-${item.category || ''}-${Math.random()}`,
                    intent: item.intent || 'Unknown Intent',
                    category: item.category || '',
                    priorityLevel: item.priorityLevel || '',
                    trend: sortedTrendData.map((d: any) => d.totalValue),
                    trendDates: sortedTrendData.map((d: any) => createUTCTimestampForMonth(d.comYear, d.comMonth)),
                    overallChange: item.changeData?.overallPercentChange || 0,
                    totalCount: item.totalCount || 0,
                };
            });
            if (isNewSearch) {
                setPromptsTrendsData(transformedChunk);
            } else {
                setPromptsTrendsData(prev => [...prev, ...transformedChunk]);
            }
            setTotalCountPrompts(result.meta.total || 0);

        } catch (err) {
            console.error("Failed to fetch trends:", err);
        }
    }, [dateRange, intent, ward, county, triggerFetch]);

    useEffect(() => {
        setFilterName('');
    }, [selectedCategory]);

    // reset page on filter change
    useEffect(() => {
        setPage(1);
        fetchData(1, debouncedFilterName, selectedCategory, true);
    }, [debouncedFilterName, selectedCategory, dateRange, fetchData]);

    // FetchData: load next page
    const handleLoadMore = useCallback(() => {
        setFetching(true);
        const nextPage = page + 1;
        setPage(nextPage);
        fetchData(nextPage, debouncedFilterName, selectedCategory, false);
        setFetching(false);
    }, [page, fetchData, debouncedFilterName, selectedCategory])


    const columns: DataTableColumn[] = useMemo(() => [
        { id: 'intent', label: 'Intent', align: 'left', width: '20%' },
        { id: 'trend', label: 'Trend', align: 'center', sortable: false, width: '80%' },
    ], []);

    const renderCells = useCallback((row: PromptsTrendRow) => [
        <Tooltip title={row.intent} key="intent" arrow>
            <Typography
                variant="body2"
                sx={promptsTrendTableV1Styles.intentText}
            >
                {row.intent}
            </Typography>
        </Tooltip>,
        <Box
            key="trend"
            className="trend-sparkline-cell"
            sx={promptsTrendTableV1Styles.trendCell}
        >
            <TrendSparkline data={row.trend} dates={row.trendDates} />
        </Box>,
    ], []);

    // Frontend sort function
    const sortFn = useCallback((row: PromptsTrendRow, columnId: string): string | number => {
        switch (columnId) {
            case 'intent':
                return row.intent || '';
            case 'overallChange':
                return row.overallChange || 0;
            case 'totalCount':
                return row.totalCount || 0;
            case 'trend':
                return 0;
            default:
                return '';
        }
    }, []);

    const handleExport = async () => {
        try {
            const blob = await exportCSV({
                startYear: dateRange.from.getFullYear(),
                startMonth: dateRange.from.getMonth() + 1,
                endYear: dateRange.to.getFullYear(),
                endMonth: dateRange.to.getMonth() + 1,
                wardId: ward,
                subcountyId: county,
                category: selectedCategory,
                search: debouncedFilterName,
            }).unwrap();

            const url = window.URL.createObjectURL(blob);

            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'CxH P - Community Reported Trends.csv';

            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            // Cleanup Blob URL from memory
            setTimeout(() => URL.revokeObjectURL(url), 0);

        } catch (err) {
            console.error('CSV export failed', err);
        }
    };

    // Show loading only on initial load or when fetching
    if ((isLoading && fetching) && promptsTrendsData.length === 0 && !error) {
        return (
            <Box sx={promptsTrendTableV1Styles.stateContainer}>
                <CircularProgress />
            </Box>
        );
    }

    // Show error only if we have no data at all
    if (error && promptsTrendsData.length === 0) {
        return (
            <Box sx={promptsTrendTableV1Styles.stateContainer}>
                <Typography variant="body2" color="error">
                    Error loading prompts trends data
                </Typography>
            </Box>
        );
    }

    /* calculate if next page is available */
    const hasMore = promptsTrendsData.length < totalCountPrompts;

    const handleCategoryChange = (e: any) => {
        setPage(1);
        setSelectedCategory(e.target.value);
    };

    return (
        <Box sx={promptsTrendTableV1Styles.container}>
            {!hideTitle && (
                <Box
                    sx={promptsTrendTableV1Styles.headerContainer}
                >
                    <Box sx={promptsTrendTableV1Styles.titleContainer}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                            <Typography
                                variant="h6"
                                sx={promptsTrendTableV1Styles.title(isTitleClickable)}
                                onClick={isTitleClickable ? onTitleClick : undefined}
                            >
                                Community Reported Trends
                            </Typography>
                            {(isLoading || isFetching) && (
                                <CircularProgress size={16} />
                            )}
                        </Box>
                        <Stack direction="row" spacing={1}>
                            <Badge badgeContent={totalCountPrompts} color='primary' max={999}>
                                <Chip
                                    label='All'
                                    color='primary'
                                    variant='filled'
                                    sx={{ fontWeight: 600 }}
                                />
                            </Badge>
                            <ReportGuard>
                                <IconButton
                                    aria-label="export"
                                    title="Export"
                                    color="default"
                                    disabled={isLoadingCsv || isPlaying}
                                    onClick={handleExport}
                                    sx={{ display: { xs: 'block', sm: 'none' } }}
                                >
                                    {isLoadingCsv ? (
                                        <CircularProgress size={18} />
                                    ) : (
                                        <Iconify icon={"solar:download-minimalistic-bold" as any} width={18} />
                                    )}
                                </IconButton>
                            </ReportGuard>
                        </Stack>
                    </Box>
                    {/* Search and filter - Next to title */}
                    <Box sx={promptsTrendTableV1Styles.filtersContainer}>
                        <FormControl size="small" sx={promptsTrendTableV1Styles.formControl}>
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
                            sx={promptsTrendTableV1Styles.searchTextField}
                            inputProps={{ maxLength: 150 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Iconify icon="eva:search-fill" width={20} sx={promptsTrendTableV1Styles.searchIcon} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ReportGuard>
                                <IconButton
                                    aria-label="export"
                                    title="Export"
                                    color="default"
                                    disabled={isLoadingCsv || isPlaying}
                                    onClick={handleExport}
                                    sx={{ display: { xs: 'none', sm: 'block' } }}
                                >
                                    {isLoadingCsv ? (
                                        <CircularProgress size={18} />
                                    ) : (
                                        <Iconify icon={"solar:download-minimalistic-bold" as any} width={18} />
                                    )}
                                </IconButton>
                            </ReportGuard>
                        </Box>
                    </Box>
                </Box>
            )}
            {hideTitle && (
                <Box sx={promptsTrendTableV1Styles.filtersRow}>
                    <FormControl size="small" sx={promptsTrendTableV1Styles.formControlHidden}>
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
                        sx={promptsTrendTableV1Styles.searchTextFieldHidden}
                        slotProps={{ htmlInput: { maxLength: 100 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Iconify icon="eva:search-fill" width={20} sx={promptsTrendTableV1Styles.searchIcon} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            )}
            <Box sx={promptsTrendTableV1Styles.tableContainer}>
                <LazyDataTable
                    hideToolbar
                    columns={columns}
                    rows={promptsTrendsData}
                    getRowId={(row: PromptsTrendRow) => row.id}
                    renderCells={renderCells}
                    filterName={filterName}
                    debouncedFilterName={debouncedFilterName}
                    onFilterName={(e) => setFilterName(e.target.value)}
                    isLoading={isLoading || isFetching}
                    isFetchingNextPage={fetching}
                    hasMore={hasMore}
                    onLoadMore={handleLoadMore}
                    sortFn={sortFn}
                    defaultSortBy="overallChange"
                    defaultSortOrder="desc"
                    page={page}
                    isLazy={hasSearch}
                // order={order}
                // orderBy={orderBy}
                // setOrder={setOrder}
                // setOrderBy={setOrderBy}
                />
            </Box>
        </Box>
    );
});

export const PromptsTrendTableV1 = (props: PromptsTrendTableV1Props & { isPlaying?: boolean }) =>
    WithPermission(PromptsTrendTableV1Internal, {
        allowedPermissions: [PermissionName.OVERVIEW, PermissionName.PROMPTS],
        showFallback: true,
    })(props);