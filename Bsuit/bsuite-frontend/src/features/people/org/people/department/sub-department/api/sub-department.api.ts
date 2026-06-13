import { baseApi } from "../../../../../../../api/base.api";
import type {
  IAllSubDepartmentResponse,
  ICreateSubDepartmentRequest,
  ISubDepartmentResponse,
  IUpdateSubDepartmentRequest,
} from "../types/sub-department.types";

export type DeleteSubDepartmentArg = {
  id: number;
  departmentId: number;
};

export const subDepartmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllSubDepartmentsByDepartmentId: builder.query<IAllSubDepartmentResponse, number>({
      query: (departmentId) => ({
        url: `/sub_department/all/${departmentId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, departmentId) => [
        { type: "SubDepartment", id: `dept-${departmentId}` },
      ],
    }),
    createSubDepartment: builder.mutation<ISubDepartmentResponse, ICreateSubDepartmentRequest>({
      query: (data) => ({
        url: "/sub_department",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { departmentId }) => [
        { type: "SubDepartment", id: `dept-${departmentId}` },
      ],
    }),
    updateSubDepartment: builder.mutation<ISubDepartmentResponse, IUpdateSubDepartmentRequest>({
      query: ({ id, ...data }) => ({
        url: `/sub_department/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result) =>
        result?.data?.department?.id != null
          ? [{ type: "SubDepartment", id: `dept-${result.data.department.id}` }]
          : [],
    }),
    deleteSubDepartment: builder.mutation<void, DeleteSubDepartmentArg>({
      query: ({ id }) => ({
        url: `/sub_department/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { departmentId, id }) => [
        { type: "SubDepartment", id: `dept-${departmentId}` },
        { type: "SubDepartment", id: `employees-${id}` },
      ],
    }),
    getSubDepartmentEmployees: builder.query<any, string | number>({
      query: (id) => ({
        url: `/sub_department/employee/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, subId) => [
        { type: "SubDepartment", id: `employees-${subId}` },
      ],
    }),
  }),
});

export const {
  useGetAllSubDepartmentsByDepartmentIdQuery,
  useLazyGetAllSubDepartmentsByDepartmentIdQuery,
  useCreateSubDepartmentMutation,
  useUpdateSubDepartmentMutation,
  useDeleteSubDepartmentMutation,
  useGetSubDepartmentEmployeesQuery,
} = subDepartmentApi;
