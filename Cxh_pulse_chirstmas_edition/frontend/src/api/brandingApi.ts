import { Branding } from '../types';
import { baseApi } from './baseApi';

export const brandingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBranding: builder.query<Branding, void>({
      query: () => ({
        url: 'settings/branding',
        method: 'GET',
      }),
      transformResponse: (response: Branding) => {
        // Extract the first item from the data array if it exists
        const brandingData = response;
        return {  
          fgcolor: brandingData?.fgcolor,
          bgcolor: brandingData?.bgcolor,
          logo: brandingData?.logo,
        } as any;
      },
      // Cache the branding data for 1 hour
      keepUnusedDataFor: 3600,
      providesTags: [{ type: 'Settings', id: 'BRANDING' }],
    }),
    updateBranding: builder.mutation<Branding, { logo?: string; fgcolor?: string; bgcolor?: string }>({
      query: (data) => ({
        url: 'settings',
        method: 'PUT',
        body: {
          name: 'branding',
          config: {
            ...data,
            logo: "CxH Pulse"
          },
        },
      }),
      invalidatesTags: [{ type: 'Settings', id: 'BRANDING' }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetBrandingQuery, useUpdateBrandingMutation } = brandingApi;
