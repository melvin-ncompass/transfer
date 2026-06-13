import { baseApi } from "../../../../api/base.api";

interface ICustomDomainRequest {
  customDomain: string;
}

interface CustomDomainExistsResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: {
    noChange: boolean;
    value?: string;
  };
}

interface CustomDomainInfoResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: {
    customDomain: string;
    expectedCname: string;
    domainStatus: string;
    dnsValid: boolean;
  };
}

interface SaveCustomDomainResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: {
    type: string;
    host: string;
    value: string;
  };
}

interface VerifyCustomDomainResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: {
    verified: boolean;
  };
}

const CUSTOM_DOMAIN = {
  EXISTS: "/setting/custom_domain_exists",
  INFO: "/setting/custom_domain_info",
  SAVE: "/setting/save_custom_domain",
  VERIFY: "/setting/verify_custom_domain",
};

export const customDomainApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    checkCustomDomainExists: builder.query<CustomDomainExistsResponse, ICustomDomainRequest>({
      query: (params) => ({
        url: CUSTOM_DOMAIN.EXISTS,
        method: "GET",
        params,
      }),
      providesTags: ["CustomDomain"],
    }),

    getCustomDomainInfo: builder.query<CustomDomainInfoResponse, void>({
      query: () => ({
        url: CUSTOM_DOMAIN.INFO,
        method: "GET",
      }),
      providesTags: ["CustomDomain"],
    }),

    saveCustomDomain: builder.mutation<SaveCustomDomainResponse, ICustomDomainRequest>({
      query: (body) => ({
        url: CUSTOM_DOMAIN.SAVE,
        method: "POST",
        body,
      }),
      invalidatesTags: ["CustomDomain"],
    }),

    verifyCustomDomain: builder.query<VerifyCustomDomainResponse, void>({
      query: () => ({
        url: CUSTOM_DOMAIN.VERIFY,
        method: "GET",
      }),
      providesTags: ["CustomDomain"],
    }),
  }),
});

export const {
  useCheckCustomDomainExistsQuery,
  useLazyCheckCustomDomainExistsQuery,
  useGetCustomDomainInfoQuery,
  useSaveCustomDomainMutation,
  useVerifyCustomDomainQuery,
  useLazyVerifyCustomDomainQuery,
} = customDomainApi;