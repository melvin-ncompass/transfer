import { baseApi } from "../../../../../api/base.api";
import type { ProjectParams, ProjectResponse } from "../types/project.types";

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<ProjectResponse[], void>({
      query: () => "/projects",
      transformResponse: (response: any) => response.data,
      providesTags: ["Project"],
    }),
    getProject: builder.query<ProjectResponse, number>({
      query: (id) => `/projects/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Project", id }],
    }),
    createProject: builder.mutation<ProjectResponse, ProjectParams>({
      query: (body) => ({
        url: "/projects",
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ["Project"],
    }),
    updateProject: builder.mutation<
      ProjectResponse,
      { id: number; body: Partial<ProjectParams> }
    >({
      query: ({ id, body }) => ({
        url: `/projects/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Project", id }, "Project"],
    }),
    archiveProject: builder.mutation<ProjectResponse, { id: number; toggle: boolean }>({
      query: ({ id, toggle }) => ({
        url: `/projects/${id}/archive?toggle=${toggle}`,
        method: "PATCH",
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: "Project", id }, "Project"],
    }),
    deleteProject: builder.mutation<void, number>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Project"],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useArchiveProjectMutation,
  useDeleteProjectMutation,
} = projectApi;
