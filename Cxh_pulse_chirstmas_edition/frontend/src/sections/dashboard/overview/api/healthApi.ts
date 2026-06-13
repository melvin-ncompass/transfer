import { baseApi } from '../../../../api/baseApi';
import { COUNTY_NAME } from '../../../../store/constants';

export type DKKHISRecord = {
    uid_record: string;
    facility_name: string;
    orgUnit: string;
    orgUnit_level: string;
    dataElement_name: string;
    dataElement_code: string;
    dataElement: string;
    dx_type: string;
    period: string;
    value: string;
    County: string;
    Subcounty: string;
    Ward: string;
    Latitude: number;
    Longitude: number;
    computed_geom: string;
    computed_geojson: {
        type: 'Point';
        coordinates: [number, number];
    };
};

export type KHISLocations = {
    counties: {
        count: number;
        names: string[];
    };
    subcounties: {
        count: number;
        names: string[];
    };
    wards: {
        count: number;
        names: string[];
    };
};

export type DKKHISResponse = {
    data: {
        data: DKKHISRecord[];
    };
    locations?: KHISLocations;
};

/**
 * Health API - KHIS health indicator endpoints
 * 
 * Handles maternal and child health indicators from KHIS2
 */
export const healthApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDkhisWards: builder.query<any, void>({
            query: () => ({
                url: 'visualizationV1/khis/wardSubCounty',
            }),
            transformResponse: (response: any) => response.data,
        }),

        getDkhisIndicatorDateFilter: builder.query<any, void>({
            query: () => ({
                url: 'visualizationV1/khis/indicatorDateFilter',
            }),
            transformResponse: (response: any) => response.data,
        }),

        getDkhisIndicatorCount: builder.query<
            any,
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
                indicators: string;
                county: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/khis/indicatorCount',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    indicators: params.indicators,
                    county: params.county,
                },
            }),
            transformResponse: (response: any) => response.data,
        }),

        getDkhisIndicatorCountDateRange: builder.query<
            Array<{
                comYear: number;
                comMonth: number;
                rawWard: string;
                totalValue: number;
            }>,
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
                indicator: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/khis/indicatorCount/date-range',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    indicator: params.indicator,
                },
            }),
            transformResponse: (response: any) => response.data || [],
        }),

        getKhisEachIndicatorTrend: builder.query<
            any,
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
                indicator?: string;
                ward?: string;
                subcounty?: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/khis/eachIndicatorTrend',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    ...(params.indicator && { indicator: params.indicator }),
                    ...(params.ward && { ward: params.ward }),
                    ...(params.subcounty && { subcounty: params.subcounty }),
                },
            }),
            transformResponse: (response: any) => response.data || [],
        }),

        getDkhsWardsCounties: builder.query<any, any>({
            query: (params) => ({
                url: 'visualizationV1/khis/kajiadoWards',
                params: {
                    county: COUNTY_NAME,
                },
            }),
            transformResponse: (response: any) => response.data,
        }),

        getKhisIndicatorCountTrend: builder.query<
            Array<{ monthdate: string; indicatorCount: number }>,
            { indicator: string }
        >({
            query: (params) => ({
                url: 'visualizationV1/khis/indicatorCountTrend',
                params: {
                    indicator: params.indicator,
                },
            }),
            transformResponse: (response: any) => response.data || [],
        }),

        getKhisIndicatorCountByClimateTemperature: builder.query<
            Array<{ climateValue: number; totalCount: number }>,
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
                indicator: string;
                subcounty?: string;
                ward?: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/khis/indicatorCountByClimate/temperature',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    indicator: params.indicator,
                    ...(params.subcounty && { subcounty: params.subcounty }),
                    ...(params.ward && { ward: params.ward }),
                },
            }),
            transformResponse: (response: any) => response.data || [],
        }),

        getKhisIndicatorCountByClimatePrecipitation: builder.query<
            Array<{ climateValue: number; totalCount: number }>,
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
                indicator: string;
                subcounty?: string;
                ward?: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/khis/indicatorCountByClimate/precipitation',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    indicator: params.indicator,
                    ...(params.subcounty && { subcounty: params.subcounty }),
                    ...(params.ward && { ward: params.ward }),
                },
            }),
            transformResponse: (response: any) => response.data || [],
        }),

        getKhisPrediction: builder.query<
            Array<{
                rawDate: string;
                rawValue: number;
                rawCiLow: number | null;
                rawCiHigh: number | null;
                rawType: 'historical' | 'projected';
            }>,
            { indicatorName: string }
        >({
            query: ({ indicatorName }) => ({
                url: 'visualizationV1/khis/prediction',
                params: { indicatorName },
            }),
            transformResponse: (response: any) => response.data || [],
        }),
    }),
});

export const {
    useGetDkhisWardsQuery,
    useGetDkhisIndicatorDateFilterQuery,
    useGetDkhisIndicatorCountQuery,
    useGetDkhisIndicatorCountDateRangeQuery,
    useGetKhisEachIndicatorTrendQuery,
    useGetDkhsWardsCountiesQuery,
    useGetKhisIndicatorCountTrendQuery,
    useGetKhisIndicatorCountByClimateTemperatureQuery,
    useGetKhisIndicatorCountByClimatePrecipitationQuery,
    useGetKhisPredictionQuery,
} = healthApi;

