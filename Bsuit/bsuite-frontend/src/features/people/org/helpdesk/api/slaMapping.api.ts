import { baseApi } from "../../../../../api/base.api";

/* ============================================================================
   SLA MAPPING TYPES
============================================================================ */

export interface SLACategoryMappingPayload {
  categoryId: number;
  priorityId: number;
  defaultResponseTimeMinutes: number;
  defaultResolutionTimeMinutes: number;
}

export interface SLACategoryMapping {
  id: number;
  category: {
    id: number;
    categoryName: string;
  };
  priority: {
    id: number;
    name: string;
  };
  defaultResponseTimeMinutes: number;
  defaultResolutionTimeMinutes: number;
  createdAt: string;
}

export interface SLAMappingResponse {
  data: SLACategoryMapping;
  message?: string;
}

export interface SLAMappingListResponse {
  data: SLACategoryMapping[];
  message?: string;
}

/* ============================================================================
   API
============================================================================ */

export const slaMappingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* ============================================================================
       SLA MAPPING
    ============================================================================ */

    createSlaMapping: builder.mutation<
      SLAMappingResponse,
      SLACategoryMappingPayload
    >({
      query: (body) => ({
        url: "/sla-mapping",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SLAMapping"],
    }),

    getAllSLAMappings: builder.query<SLAMappingListResponse, void>({
      query: () => ({
        url: "/sla-mapping",
        method: "GET",
      }),
      providesTags: ["SLAMapping"],
    }),

    getOneSLAMapping: builder.query<SLAMappingResponse, number>({
      query: (id) => ({
        url: `/sla-mapping/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "SLAMapping", id },
      ],
    }),

    updateSlaMapping: builder.mutation<
      SLAMappingResponse,
      {
        id: number;
        body: Partial<SLACategoryMappingPayload>;
      }
    >({
      query: ({ id, body }) => ({
        url: `/sla-mapping/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "SLAMapping",
        { type: "SLAMapping", id },
      ],
    }),

    deleteSlaMapping: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/sla-mapping/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SLAMapping"],
    }),
  }),
});

/* ============================================================================
   HOOKS
============================================================================ */

export const {
  useCreateSlaMappingMutation,
  useGetAllSLAMappingsQuery,
  useLazyGetAllSLAMappingsQuery,
  useGetOneSLAMappingQuery,
  useLazyGetOneSLAMappingQuery,
  useUpdateSlaMappingMutation,
  useDeleteSlaMappingMutation,
} = slaMappingApi;
