import { baseApi } from "../../../../../api/base.api";

export interface CannedResponse {
  id: number;
  title: string;
  content: string;
  isActive: boolean;
  isInternal: boolean;
  updatedBy: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
  } | null;
}

export interface CreateCannedResponsePayload {
  title: string;
  content: string;
  categoryId?: number;
  isActive?: boolean;
  isInternal?: boolean;
}

export interface UpdateCannedResponsePayload
  extends Partial<CreateCannedResponsePayload> {}

export const cannedResponsesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCannedResponses: builder.query<
      {
        data: CannedResponse[];
        message: string;
      },
      void
    >({
      query: () => ({
        url: "/canned-responses",
        method: "GET",
      }),
      providesTags: ["CANNED_RESPONSES"],
    }),

    getCannedResponseById: builder.query<
      {
        data: CannedResponse;
        message: string;
      },
      number
    >({
      query: (id) => ({
        url: `/canned-responses/${id}`,
        method: "GET",
      }),
      providesTags: ["CANNED_RESPONSES"],
    }),

    createCannedResponse: builder.mutation<
      any,
      CreateCannedResponsePayload
    >({
      query: (body) => ({
        url: "/canned-responses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CANNED_RESPONSES"],
    }),

    updateCannedResponse: builder.mutation<
      any,
      {
        id: number;
        body: UpdateCannedResponsePayload;
      }
    >({
      query: ({ id, body }) => ({
        url: `/canned-responses/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CANNED_RESPONSES"],
    }),

    toggleCannedResponseActive: builder.mutation<any, number>({
      query: (id) => ({
        url: `/canned-responses/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: ["CANNED_RESPONSES"],
    }),

    toggleCannedResponseInternal: builder.mutation<any, number>({
      query: (id) => ({
        url: `/canned-responses/${id}/toggle-internal`,
        method: "PATCH",
      }),
      invalidatesTags: ["CANNED_RESPONSES"],
    }),

    deleteCannedResponse: builder.mutation<any, number>({
      query: (id) => ({
        url: `/canned-responses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CANNED_RESPONSES"],
    }),
  }),
});

export const {
  useGetCannedResponsesQuery,
  useGetCannedResponseByIdQuery,
  useCreateCannedResponseMutation,
  useUpdateCannedResponseMutation,
  useToggleCannedResponseActiveMutation,
  useToggleCannedResponseInternalMutation,
  useDeleteCannedResponseMutation,
} = cannedResponsesApi;