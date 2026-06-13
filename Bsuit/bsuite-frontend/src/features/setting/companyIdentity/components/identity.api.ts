import { baseApi } from "../../../../api/base.api";

export const identityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIdentity: builder.query<any, void>({
      query: () => ({
        url: "/setting/identity",
        method: "GET",
      }),
        transformResponse: (res: any) => res.data, 
      providesTags: ["Identity"],
    }),

    updateIdentity: builder.mutation<
      any,
      {
        companyIdentity: {
          addressLine1: string;
          addressLine2?: string | null;
          city: string;
          state: string;
          pincode: string;
          country: string;
        };
        companyMetaData: {
          label: string;
          value: string;
        }[];
      }
    >({
      query: (body) => ({
        url: "/setting/identity",
        method: "PATCH",
        body,
      }),
       transformResponse: (res: any) => res.data, 
      invalidatesTags: ["Identity"], 
    }),

  }),
});

export const {
  useGetIdentityQuery,
  useUpdateIdentityMutation,
} = identityApi;
