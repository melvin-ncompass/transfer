import { baseApi } from '../../../api/baseApi';

export type WardLevelDataRecord = {
    id: string;
    ward: string;
    subcounty: string;
    avgTemp: number;
    precip: number;
    maternalMortality: number;
    malariaCases: number;
};

export type WardLevelDataResponse = {
    data: {
        data: WardLevelDataRecord[];
        total?: number;
        period?: {
            start: string;
            end: string;
        };
    };
    message?: string;
    statusCode?: number;
};

/**
 * Data & Config API - Configuration and data table endpoints
 * 
 * Handles application configuration and data exports
 */
export const dataConfigApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getConfiguration: builder.query<any, void>({
            query: () => ({
                url: 'visualization/config',
            }),
            transformResponse: (response: any) => response.data[0],
            providesTags: [{ type: 'Settings', id: 'CONFIGURATION' }],
        }),

        updateConfiguration: builder.mutation<any, any>({
            query: (data) => ({
                url: 'visualization/config',
                method: 'POST',
                body: {
                    name: 'config',
                    ...data,
                },
            }),
            transformResponse: (response: any) => response.data,
            invalidatesTags: [{ type: 'Settings', id: 'CONFIGURATION' }],
        }),

        getDataTable: builder.query<
            WardLevelDataRecord[],
            {
                startYear: number;
                startMonth: number;
                endYear: number;
                endMonth: number;
            }
        >({
            query: (params) => ({
                url: 'visualization/dataTable',
                params: {
                    startYear: params.startYear,
                    startMonth: params.startMonth,
                    endYear: params.endYear,
                    endMonth: params.endMonth,
                },
            }),
            transformResponse: (response: WardLevelDataResponse | any) => {
                const data = response.data?.data ?? response.data ?? response ?? [];
                if (!Array.isArray(data)) return [];

                // Helper function to normalize ward and subcounty names
                const normalizeWardName = (ward: string): string =>
                    String(ward || '')
                        .replace(/\s+Ward$/i, '')
                        .trim();

                const normalizeSubcountyName = (subcounty: string): string =>
                    String(subcounty || '')
                        .replace(/\s+Sub\s+County$/i, '')
                        .trim();

                // Group data by ward and subcounty
                const groupedData = new Map<
                    string,
                    {
                        ward: string;
                        subcounty: string;
                        avgTempValues: number[];
                        precipValues: number[];
                        maternalMortalitySum: number;
                        malariaCasesSum: number;
                    }
                >();

                // Process each item and group by ward+subcounty
                data.forEach((item: any) => {
                    const avgTemp = item.avgTemp;
                    const precip = item.precip;
                    const maternalMortality = item.maternalMortality;
                    const malariaCases = item.malariaCases;
                    const ward = normalizeWardName(item.ward);
                    const subcounty = normalizeSubcountyName(item.subcounty);

                    if (!ward || !subcounty) return;

                    const key = `${ward}|${subcounty}`;

                    const avgTempNum =
                        typeof avgTemp === 'number' ? avgTemp : parseFloat(String(avgTemp || 0)) || 0;
                    const precipNum =
                        typeof precip === 'number' ? precip : parseFloat(String(precip || 0)) || 0;
                    const maternalMortalityNum =
                        typeof maternalMortality === 'number'
                            ? maternalMortality
                            : parseInt(String(maternalMortality || 0), 10) || 0;
                    const malariaCasesNum =
                        typeof malariaCases === 'number'
                            ? malariaCases
                            : parseInt(String(malariaCases || 0), 10) || 0;

                    if (!groupedData.has(key)) {
                        groupedData.set(key, {
                            ward,
                            subcounty,
                            avgTempValues: [],
                            precipValues: [],
                            maternalMortalitySum: 0,
                            malariaCasesSum: 0,
                        });
                    }

                    const group = groupedData.get(key)!;
                    group.avgTempValues.push(avgTempNum);
                    group.precipValues.push(precipNum);
                    group.maternalMortalitySum += maternalMortalityNum;
                    group.malariaCasesSum += malariaCasesNum;
                });

                // Convert grouped data to final format
                return Array.from(groupedData.values()).map((group, index) => {
                    const avgTemp =
                        group.avgTempValues.length > 0
                            ? group.avgTempValues.reduce((sum, val) => sum + val, 0) / group.avgTempValues.length
                            : 0;
                    const precip =
                        group.precipValues.length > 0
                            ? group.precipValues.reduce((sum, val) => sum + val, 0)
                            : 0;

                    return {
                        id: `${group.ward}-${group.subcounty}-${index}`,
                        ward: group.ward,
                        subcounty: group.subcounty,
                        avgTemp: Math.round(avgTemp * 100) / 100,
                        precip: Math.round(precip * 100) / 100,
                        maternalMortality: group.maternalMortalitySum,
                        malariaCases: group.malariaCasesSum,
                    };
                });
            },
            providesTags: [{ type: 'Settings', id: 'DATA_TABLE' }],
        }),
    }),
});

export const {
    useGetConfigurationQuery,
    useUpdateConfigurationMutation,
    useGetDataTableQuery,
} = dataConfigApi;

