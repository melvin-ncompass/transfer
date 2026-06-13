import { useMemo } from 'react';
import {
    useGetPromptsMonthlyTemperatureQuery,
    useGetPromptsMonthlyRainfallQuery,
} from '../../../../api';
import { buildTemperatureParams, buildRainfallParams } from '../utils/query-params';

type UseClimateDataProps = {
    ward: string;
    county: string;
    dateRange: { from: Date; to: Date };
};

export function useClimateData({ ward, county, dateRange }: UseClimateDataProps) {
    const temperatureParams = useMemo(
        () => buildTemperatureParams(ward, county, dateRange),
        [ward, county, dateRange]
    );

    const rainfallParams = useMemo(
        () => buildRainfallParams(ward, county, dateRange),
        [ward, county, dateRange]
    );

    const {
        data: temperatureData = [],
        isLoading: isLoadingTemperature,
        error: temperatureError,
        isFetching: isFetchingTemperature,
        refetch: refetchTemperature,
    } = useGetPromptsMonthlyTemperatureQuery(temperatureParams);

    const {
        data: rainfallData = [],
        isLoading: isLoadingRainfall,
        error: rainfallError,
        isFetching: isFetchingRainfall,
        refetch: refetchRainfall,
    } = useGetPromptsMonthlyRainfallQuery(rainfallParams);

    return {
        temperatureData,
        rainfallData,
        isLoadingTemperature,
        isLoadingRainfall,
        temperatureError,
        rainfallError,
        isFetchingTemperature,
        isFetchingRainfall,
        refetchTemperature,
        refetchRainfall,
    };
}

