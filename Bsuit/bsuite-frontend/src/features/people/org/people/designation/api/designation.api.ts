import { baseApi } from "../../../../../../api/base.api";
import type {
  IAllDesignationResponse,
  ICreateDesignationRequest,
  IDesignationResponse,
  IUpdateDesignationRequest,
} from "../types/designation.types";

export const designationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllDesignations: builder.query<IAllDesignationResponse, void>({
      query: () => ({
        url: "/designation",
        method: "GET",
      }),
      providesTags: ["Designation"],
    }),
    createDesignation: builder.mutation<IDesignationResponse, ICreateDesignationRequest>({
      query: (data) => ({
        url: "/designation",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Designation"],
    }),
    updateDesignation: builder.mutation<IDesignationResponse, IUpdateDesignationRequest>({
      query: ({ id, ...data }) => ({
        url: `/designation/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Designation", "Employee"],
    }),
    deleteDesignation: builder.mutation<void, number>({
      query: (id) => ({
        url: `/designation/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Designation", "Employee"],
    }),
    getDesignationEmployees: builder.query<any, string | number>({
      query: (id) => ({
        url: `/designation/employee/${id}`,
        method: "GET",
      }),
      providesTags: ["Designation"],
    }),
  }),
});

export const {
  useGetAllDesignationsQuery,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,
  useGetDesignationEmployeesQuery,
} = designationApi;
