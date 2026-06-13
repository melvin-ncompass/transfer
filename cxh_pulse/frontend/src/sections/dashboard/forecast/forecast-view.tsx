import { Box, Stack, Typography } from '@mui/material';
import { ForecastChart, ForecastClimateChart } from '../forecast/components';
import { useGetKhisPredictionQuery, useGetCopernicusPredictionQuery, useGetPredictionIndicatorQuery, useGetDkhisWardsQuery } from '../../../api';
import type { IndicatorName } from '../../../types/indicators';
import { useState, useCallback, useMemo } from 'react';

import { useLocationHandlers } from '../overview/hooks/use-location-handlers';
import { useLocationData } from '../overview/hooks/use-location-data';
import { SelectionMode } from '../overview/overview-view';
import { LocationSelector } from '../../../../src/components/location-selector/location-selector-v1';

// ----------------------------------------------------------------------

/**
 * ForecastView - Forecast visualization with 5 line charts
 * 
 * Displays forecast predictions for 5 indicators:
 * - Severe MUAC Percentage
 * - Stillbirth Rate
 * - Low Birth Weight Percentage
 * - Neonatal Mortality Rate
 * - Malaria Case Rate
 */

export interface PredictionIndicator {
    indicatorId: string;
    indicatorName: string;
    primaryIndicator: boolean;
    label?: string; // Y-axis label from API
}

export function ForecastView() {

    // --- Location state ---
    const [subCounty, setCounty] = useState('');
    const [ward, setWard] = useState('');
    const [selectionMode, setSelectionMode] = useState<SelectionMode>(SelectionMode.WARD);

    const { data: wardsData, isLoading: isLoadingWards } = useGetDkhisWardsQuery();

    const { countyData, availableSubcounties, availableWards, hierarchyData } =
        useLocationData({ wardsData });

    // Fetch climate prediction data
    const {
        data: climateData = [],
        isLoading: isClimateLoading,
        isFetching: isClimateFetching,
        error: climateError,
    } = useGetCopernicusPredictionQuery({
        countyId: countyData.id,
        subCountyId: subCounty,
        wardId: ward,
    });

    const {
        data: predictionIndicators = [],
        isLoading: isPredictionLoading,
        isFetching: isPredictionFetching,
    } = useGetPredictionIndicatorQuery();

    const { primaryIndicator, secondaryIndicators } = useMemo<{
        primaryIndicator: PredictionIndicator | null;
        secondaryIndicators: PredictionIndicator[];
    }>(() => {
        const indicators = predictionIndicators.reduce((acc, indicator) => {
            if (indicator.primaryIndicator) {
                acc.primaryIndicator = indicator;
            } else {
                acc.secondaryIndicators.push(indicator);
            }
            return acc;
        }, { primaryIndicator: null as PredictionIndicator | null, secondaryIndicators: [] as PredictionIndicator[] });

        return indicators
    }, [predictionIndicators]);


    const { handleCountyChange, handleWardChange } = useLocationHandlers({
        setCounty,
        setWard,
        setSelectionMode,
        isPopulationMode: false,
        wards: availableWards,
    });

    const resetLocation = useCallback(() => {
        setCounty('');
        setWard('');
        setSelectionMode(SelectionMode.WARD);
    }, []);

    // Build filter info for export
    const filterInfo = useMemo(() => {
        if (ward) {
            const wardData = availableWards.find((w) => w.id === ward);
            return { ward: wardData?.name || ward };
        }
        if (subCounty) {
            const subcountyData = availableSubcounties.find((s) => s.id === subCounty);
            return { subcounty: subcountyData?.name || subCounty };
        }
        if (countyData?.label) {
            return { location: countyData.label };
        }
        return undefined;
    }, [ward, subCounty, availableWards, availableSubcounties, countyData]);

    return (
        <>
            <Box
                sx={{
                    px: { xs: 2, sm: 2 },
                    pt: { xs: 2, sm: 2 },
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    zIndex: 10,
                    flexShrink: 0,
                    width: '100%',
                    minWidth: 0,
                    top: { xs: '56px', md: '60px' },
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 2,
                    alignItems: { xs: 'flex-start', md: 'center' },
                }}
            >
                {(availableSubcounties.length > 0 || availableWards.length > 0) && (
                    <Box
                        sx={{
                            width: { xs: '100%', md: 'auto' },
                            minWidth: "200px",
                            maxWidth: { xs: '100%', sm: 350, md: 350 },
                            flex: { xs: 'unset', md: '0 0 auto' },
                        }}
                    >
                        <LocationSelector
                            level1Option={countyData}
                            level2Options={availableSubcounties}
                            selectedSubcountyId={subCounty}
                            onSubcountyChange={handleCountyChange}
                            level3Options={availableWards}
                            selectedWardId={ward}
                            onWardChange={handleWardChange}
                            hierarchyData={hierarchyData}
                            onLocationSelect={({ subcountyId, wardId }) => {
                                setCounty(subcountyId || '');
                                setWard(wardId || '');
                            }}
                            size="small"
                            onResetLocation={resetLocation}
                        />
                    </Box>
                )}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flex: 1,
                    }}
                >
                    <Box
                        component="span"
                        sx={{
                            display: 'inline-flex',
                            color: 'error',
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                    </Box>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        Disclaimer: The predictions shown are experimental and provided
                        solely for demonstration purposes. They are not guaranteed to be
                        accurate and should not be interpreted as real-world forecasts or
                        recommendations.
                    </Typography>
                </Box>
            </Box>

            {/* Forecast content */}
            <Box sx={{ p: { xs: 2, sm: 2 }, width: '100%' }}>
                <Stack spacing={3}>
                    {/* Climate Forecast - Full width at top */}
                    <ForecastClimateChart
                        title="Climate: Temperature & Precipitation"
                        data={climateData}
                        isLoading={isClimateLoading || isPredictionLoading}
                        error={climateError}
                        isFetching={isClimateFetching || isPredictionFetching}
                        filterInfo={filterInfo}
                    />

                    {/* Malaria Case Rate - Full width */}
                    <ForecastChartWrapper
                        indicator={primaryIndicator?.indicatorId}
                        title={primaryIndicator?.indicatorName || 'Malaria Case Rate'}
                        yAxisLabel={primaryIndicator?.label || 'Confirmed Cases per 1000 Population'}
                        ward={ward}
                        subcounty={subCounty}
                        county={countyData.id}
                        filterInfo={filterInfo}
                    />

                    {/* Other indicators - 50% width each (2 per row) and 100% on small screens and tablets (1 per row) */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                sm: '1fr',
                                md: 'repeat(2, 1fr)',
                            },
                            gap: 3,
                        }}
                    >
                        {secondaryIndicators.map((indicator) => (
                            <ForecastChartWrapper
                                key={indicator.indicatorId}
                                indicator={indicator.indicatorId}
                                title={indicator.indicatorName}
                                yAxisLabel={indicator.label}
                                ward={ward}
                                subcounty={subCounty}
                                county={countyData.id}
                                filterInfo={filterInfo}
                            />
                        ))}
                    </Box>
                </Stack>
            </Box>
        </>
    );
}

// ----------------------------------------------------------------------

type ForecastChartWrapperProps = {
    indicator: IndicatorName;
    title: string;
    yAxisLabel?: string; // Y-axis label from API
    ward: string;
    subcounty: string;
    county: string | undefined;
    filterInfo?: { location?: string; subcounty?: string; ward?: string };
};

function ForecastChartWrapper({ indicator, title, yAxisLabel, ward, subcounty, county, filterInfo }: ForecastChartWrapperProps) {
    const {
        data = [],
        isLoading,
        isFetching,
        error
    } = useGetKhisPredictionQuery({ indicatorId: indicator, wardId: ward, subCountyId: subcounty, countyId: county }, { skip: !indicator });

    return (
        <ForecastChart
            title={title}
            data={data}
            isLoading={isLoading}
            error={error}
            indicator={indicator}
            isFetching={isFetching}
            yAxisLabel={yAxisLabel}
            filterInfo={filterInfo}
        />
    );
}

