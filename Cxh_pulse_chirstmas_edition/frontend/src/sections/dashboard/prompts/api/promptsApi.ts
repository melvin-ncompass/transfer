import { baseApi } from '../../../../api/baseApi';

type PromptsTrendApiResponse = {
    data: Array<{
        intent: string;
        category: string;
        priorityLevel: string;
        trendData: Array<{
            comYear: number;
            comMonth: number;
            rawWard: string | null;
            rawSubcounty: string | null;
            totalValue: number;
        }>;
        changeData: {
            initialValue: number;
            finalValue: number;
            overallPercentChange: number;
        };
        totalCount: number;
    }>;
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        category: string | null;
        search: string | null;
    };
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    category: string | null;
    search: string | null;
};

type ApiResponseWrapper = {
    data: PromptsTrendApiResponse;
    message: string;
    statusCode: number;
};

/**
 * Prompts API - PROMPTS conversational data endpoints
 * 
 * Handles data from pregnant women's conversations
 */
export const promptsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getPromptsMonthlyRainfall: builder.query<
            Array<{ monthdate: string; precipitation: number }>,
            {
                ward?: string;
                subcounty?: string;
                startYear?: number;
                startMonth?: number;
                endYear?: number;
                endMonth?: number;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/prompts/monthlyRainfall',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    ...(params.subcounty && { subcounty: params.subcounty }),
                    ...(params.ward && { ward: params.ward }),
                },
            }),
            transformResponse: (response: any) => response.data || [],
            providesTags: [{ type: 'Settings', id: 'PROMPTS_MONTHLY_RAINFALL' }],
        }),

        getPromptsMonthlyTemperature: builder.query<
            Array<{ monthdate: string; temperature: number }>,
            {
                ward?: string;
                subcounty?: string;
                startYear?: number;
                startMonth?: number;
                endYear?: number;
                endMonth?: number;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/prompts/monthlyTemperature',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    ...(params.subcounty && { subcounty: params.subcounty }),
                    ...(params.ward && { ward: params.ward }),
                },
            }),
            transformResponse: (response: any) => response.data || [],
            providesTags: [{ type: 'Settings', id: 'PROMPTS_MONTHLY_TEMPERATURE' }],
        }),

        getPromptsTrend: builder.query<
            PromptsTrendApiResponse,
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
                category?: string;
                search?: string;
                page?: number;
                limit?: number;
                ward?: string;
                subcounty?: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/prompts/trend',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    ...(params.category && { category: params.category }),
                    ...(params.search && { search: params.search }),
                    ...(params.page !== undefined && { page: params.page }),
                    ...(params.limit !== undefined && { limit: params.limit }),
                    ...(params.ward && { ward: params.ward }),
                    ...(params.subcounty && { subcounty: params.subcounty }),
                },
            }),
            transformResponse: (response: ApiResponseWrapper): PromptsTrendApiResponse => ({
                data: response.data?.data ?? [],
                meta: response.data?.meta ?? {
                    total: response.data?.total ?? 0,
                    page: response.data?.page ?? 1,
                    limit: response.data?.limit ?? 10,
                    totalPages: response.data?.totalPages ?? 0,
                    category: response.data?.category ?? null,
                    search: response.data?.search ?? null,
                },
                total: response.data?.total ?? 0,
                page: response.data?.page ?? 1,
                limit: response.data?.limit ?? 10,
                totalPages: response.data?.totalPages ?? 0,
                category: response.data?.category ?? null,
                search: response.data?.search ?? null,
            }),
            providesTags: [{ type: 'Settings', id: 'PROMPTS_TREND' }],
        }),

        getPromptsEachIntentTrend: builder.query<
            PromptsTrendApiResponse,
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
                page?: number;
                limit?: number;
                search?: string;
                category?: string;
                intent?: string;
                ward?: string;
                subcounty?: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/prompts/eachIntentTrend',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    ...(params.limit && { limit: params.limit }),
                    ...(params.page && { page: params.page }),
                    ...(params.search && { search: params.search }),
                    ...(params.category && { category: params.category }),
                    ...(params.intent && { intent: params.intent }),
                    ...(params.ward && { ward: params.ward }),
                    ...(params.subcounty && { subcounty: params.subcounty }),
                },
            }),
            transformResponse: (response: ApiResponseWrapper): PromptsTrendApiResponse => ({
                data: response.data?.data ?? [],
                meta: response.data?.meta ?? {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    category: null,
                    search: null,
                },
                total: response.data?.total ?? 0,
                page: response.data?.page ?? 1,
                limit: response.data?.limit ?? 10,
                totalPages: response.data?.totalPages ?? 0,
                category: response.data?.category ?? null,
                search: response.data?.search ?? null,
            }),
        }),
        getPromptsEachIntentTrendAll: builder.query<
            Array<{
                intent: string;
                category: string;
                priorityLevel: string;
                trendData: Array<{
                    comYear: number;
                    comMonth: number;
                    rawWard: string | null;
                    rawSubcounty: string | null;
                    totalValue: number;
                }>;
                changeData: {
                    initialValue: number;
                    finalValue: number;
                    overallPercentChange: number;
                };
                totalCount: number;
            }>,
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
                intent?: string;
                ward?: string;
                subcounty?: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/prompts/eachIntentTrend',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    ...(params.intent && { intent: params.intent }),
                    ...(params.ward && { ward: params.ward }),
                    ...(params.subcounty && { subcounty: params.subcounty }),
                },
            }),
            transformResponse: (response: ApiResponseWrapper | any): Array<any> => {
                if (response?.data?.data && Array.isArray(response.data.data)) {
                    return response.data.data;
                }
                if (Array.isArray(response?.data)) {
                    return response.data;
                }
                if (Array.isArray(response)) {
                    return response;
                }
                return [];
            },
        }),

        getPromptsMonthlyTemperaturePrecipitation: builder.query<
            Array<{ monthdate: string; sumprecipitation: number; sumtemperature: number }>,
            void
        >({
            query: () => ({
                url: 'visualizationV1/prompts/monthlyTemperaturePrecipitation',
            }),
            transformResponse: (response: any) => response.data || [],
        }),

        getPromptsRiskTreemap: builder.query<
            Array<{ category: string; priorityLevel: string; intent: string; intentCount: number }>,
            { category: 'maternal_risk' | 'baby_risk' }
        >({
            query: (params) => ({
                url: 'visualizationV1/prompts/riskTreeMap',
                params: {
                    category: params.category,
                },
            }),
            transformResponse: (response: any) => response.data || [],
        }),

        getPromptsCategoryByPriorityLevelBar: builder.query<
            Array<{ category: string; priorityLevel: string; intentCount: number }>,
            void
        >({
            query: () => ({
                url: 'visualizationV1/prompts/categoryByPriorityLevelBar',
            }),
            transformResponse: (response: any) => response.data || [],
        }),

        getPromptsCategoryByPriorityLevelHeatmap: builder.query<
            Array<{ category: string; priorityLevel: string; intentCount: number }>,
            void
        >({
            query: () => ({
                url: 'visualizationV1/prompts/categoryByPriorityLevelHeatmap',
            }),
            transformResponse: (response: any) => response.data || [],
        }),

        getPromptsMonthlyPriorityTrend: builder.query<
            Array<{ monthdate: string; prioritylevel: string; intentCount: number }>,
            { category?: string; priorityLevel?: string }
        >({
            query: (params = {}) => {
                const queryParams = new URLSearchParams();
                if (params.category) {
                    queryParams.append('category', params.category);
                }
                if (params.priorityLevel) {
                    queryParams.append('priorityLevel', params.priorityLevel);
                }
                const queryString = queryParams.toString();
                return {
                    url: `visualizationV1/prompts/monthlyPriorityTrend${queryString ? `?${queryString}` : ''}`,
                };
            },
            transformResponse: (response: any) => response.data || [],
        }),

        getPromptsIntentRelativeIntensity: builder.query<
            Array<{
                rawIntent: string;
                tempBin: number;
                tempRangeStart: number;
                tempRangeEnd: number;
                intentCount: number;
                intensityRatio: number;
                intensityPercent?: number;
            }>,
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
                ward?: string;
                subcounty?: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/prompts/intentRelativeIntensity',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    ...(params.ward && { ward: params.ward }),
                    ...(params.subcounty && { subcounty: params.subcounty }),
                },
            }),
            transformResponse: (response: any) => response.data || [],
        }),

        getPromptsIntentPriorityFrequency: builder.query<
            Array<{
                tempBin: number;
                tempRangeStart: number;
                tempRangeEnd: number;
                priorityLevel: string;
                priorityCount: number;
                frequencyRatio: number;
                intensityRatio?: number;
                intensityPercent: number;
            }>,
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
                ward?: string;
                subcounty?: string;
                category?: string;
            }
        >({
            query: (params) => ({
                url: 'visualizationV1/prompts/intentPriorityFrequency',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                    ...(params.ward && { ward: params.ward }),
                    ...(params.subcounty && { subcounty: params.subcounty }),
                    ...(params.category && { category: params.category }),
                },
            }),
            transformResponse: (response: any) => response.data || [],
        }),
    }),
});

export const {
    useGetPromptsMonthlyRainfallQuery,
    useGetPromptsMonthlyTemperatureQuery,
    useGetPromptsTrendQuery,
    useLazyGetPromptsEachIntentTrendQuery,
    useGetPromptsEachIntentTrendQuery,
    useGetPromptsEachIntentTrendAllQuery,
    useGetPromptsMonthlyTemperaturePrecipitationQuery,
    useGetPromptsRiskTreemapQuery,
    useGetPromptsCategoryByPriorityLevelBarQuery,
    useGetPromptsCategoryByPriorityLevelHeatmapQuery,
    useGetPromptsMonthlyPriorityTrendQuery,
    useGetPromptsIntentRelativeIntensityQuery,
    useGetPromptsIntentPriorityFrequencyQuery,
} = promptsApi;

