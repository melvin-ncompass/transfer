import { baseApi } from "../../../../../api/base.api";
import type {
  TechStackParams,
  TechStackResponse,
  ProjectTagParams,
  ProjectTagResponse,
} from "../types/projectSettings.types";

export const projectSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Tech Stack ──────────────────────────────────────────────────
    getTechStacks: builder.query<TechStackResponse[], void>({
      query: () => "/tech_stack",
      transformResponse: (response: any) => response.data,
      providesTags: ["TechStack"],
    }),
    getTechStack: builder.query<TechStackResponse, number>({
      query: (id) => `/tech_stack/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: (_result, _error, id) => [{ type: "TechStack", id }],
    }),
    createTechStack: builder.mutation<TechStackResponse, TechStackParams>({
      query: (body) => ({
        url: "/tech_stack",
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ["TechStack"],
    }),
    updateTechStack: builder.mutation<
      TechStackResponse,
      { id: number; body: TechStackParams }
    >({
      query: ({ id, body }) => ({
        url: `/tech_stack/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "TechStack", id }, "TechStack"],
    }),
    deleteTechStack: builder.mutation<void, number>({
      query: (id) => ({
        url: `/tech_stack/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TechStack"],
    }),

    // ── Project Tags ─────────────────────────────────────────────────
    getProjectTags: builder.query<ProjectTagResponse[], void>({
      query: () => "/tags",
      transformResponse: (response: any) => response.data,
      providesTags: ["ProjectTag"],
    }),
    getProjectTag: builder.query<ProjectTagResponse, number>({
      query: (id) => `/tags/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: (_result, _error, id) => [{ type: "ProjectTag", id }],
    }),
    createProjectTag: builder.mutation<ProjectTagResponse, ProjectTagParams>({
      query: (body) => ({
        url: "/tags",
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ["ProjectTag"],
    }),
    updateProjectTag: builder.mutation<
      ProjectTagResponse,
      { id: number; body: ProjectTagParams }
    >({
      query: ({ id, body }) => ({
        url: `/tags/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "ProjectTag", id }, "ProjectTag"],
    }),
    deleteProjectTag: builder.mutation<void, number>({
      query: (id) => ({
        url: `/tags/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ProjectTag"],
    }),
  }),
});

export const {
  useGetTechStacksQuery,
  useGetTechStackQuery,
  useCreateTechStackMutation,
  useUpdateTechStackMutation,
  useDeleteTechStackMutation,
  useGetProjectTagsQuery,
  useGetProjectTagQuery,
  useCreateProjectTagMutation,
  useUpdateProjectTagMutation,
  useDeleteProjectTagMutation,
} = projectSettingsApi;
