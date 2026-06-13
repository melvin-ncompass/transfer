import { baseApi } from '../../../../api/baseApi';
import type { GeoJSON } from 'geojson';

/**
 * Population API - Population data endpoints
 * 
 * Handles population data at ward and subcounty levels
 */
export const populationApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDkhsSubcountiesGeoJSON: builder.query<
            GeoJSON.FeatureCollection,
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
                subcountyId?: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/population/chloropeth/subcounty-geojson',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    ...(params.subcountyId && { subcountyId: params.subcountyId }),
                },
            }),
            transformResponse: (response: any) => response?.data || null,
        }),

        getWardPopulationData: builder.query<
            Array<{
                ward: string;
                latestPopulation: number;
            }>,
            {
                startYear?: number;
                startMonth?: number;
                endYear?: number;
                endMonth?: number;
                ward?: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/population/ward/chloropeth',
                params: {
                    ...(params.startYear && { startYear: params.startYear }),
                    ...(params.startMonth && { startMonth: params.startMonth }),
                    ...(params.endYear && { endYear: params.endYear }),
                    ...(params.endMonth && { endMonth: params.endMonth }),
                },
            }),
            transformResponse: (response: any) => response?.data || [],
        }),

        getSubcountyPopulationData: builder.query<
            Array<{
                subCounty: string;
                latestPopulation: number;
            }>,
            {
                startYear?: number;
                startMonth?: number;
                endYear?: number;
                endMonth?: number;
                subcounty?: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/population/subcounty/chloropeth',
                params: {
                    ...(params.startYear && { startYear: params.startYear }),
                    ...(params.startMonth && { startMonth: params.startMonth }),
                    ...(params.endYear && { endYear: params.endYear }),
                    ...(params.endMonth && { endMonth: params.endMonth }),
                },
            }),
            transformResponse: (response: any) => response?.data || [],
        }),
    }),
});

export const {
    useGetDkhsSubcountiesGeoJSONQuery,
    useGetWardPopulationDataQuery,
    useGetSubcountyPopulationDataQuery,
} = populationApi;

