import { baseApi } from '../../../../api/baseApi';

const DEFAULT_COPERNICUS_TIME = '2025-01-12T14:30:00Z';

export type CopernicusRecord = {
    id: number;
    raw_valid_time: string;
    raw_latitude: number;
    raw_longitude: number;
    raw_d2m?: number;
    raw_t2m?: number;
    raw_tp?: number;
    created_at?: string;
};

export type CopernicusResponse = {
    data: {
        requestedTime: string;
        roundedTime: string;
        totalRecords: number;
        data: CopernicusRecord[];
    };
    message: string;
    statusCode: number;
};

/**
 * Climate API - Copernicus climate data endpoints
 * 
 * Handles temperature and precipitation data from ERA5 reanalysis
 */
export const climateApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getCopernicusTemperature: builder.query<
            any,
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
                county: string;
                subcounty?: string;
                ward?: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/copernicus/temperature',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    county: params.county,
                    ...(params.subcounty && { subcounty: params.subcounty }),
                    ...(params.ward && { ward: params.ward }),
                },
            }),
            transformResponse: (response: any) => response.data,
        }),

        getCopernicusPrecipitation: builder.query<
            any,
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
                county: string;
                subcounty?: string;
                ward?: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/copernicus/precipitation',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    county: params.county,
                    ...(params.subcounty && { subcounty: params.subcounty }),
                    ...(params.ward && { ward: params.ward }),
                },
            }),
            transformResponse: (response: any) => response.data,
        }),

        getCopernicusRange: builder.query<CopernicusRecord[], { startDate: string; endDate: string }>({
            query: ({ startDate, endDate }) => ({
                url: 'visualization/copernicus/date-range',
                params: { startDate, endDate },
            }),
            transformResponse: (response: any) => response.data ?? [],
            providesTags: [{ type: 'Settings', id: 'COPERNICUS_RANGE' }],
        }),

        getCopernicusPrediction: builder.query<
            Array<{
                temperature: number;
                precipitation: number;
                comYear: number;
                comMonth: number;
                rawType: 'historical' | 'projected';
            }>,
            void
        >({
            query: () => ({
                url: 'visualizationV1/copernicus/prediction',
            }),
            transformResponse: (response: any) => response.data || [],
        }),
    }),
});

export const {
    useGetCopernicusTemperatureQuery,
    useGetCopernicusPrecipitationQuery,
    useGetCopernicusRangeQuery,
    useGetCopernicusPredictionQuery,
} = climateApi;


