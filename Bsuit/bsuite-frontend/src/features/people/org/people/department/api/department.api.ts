import { baseApi } from "../../../../../../api/base.api";
import type {
  IAllDepartmentResponse,
  ICreateDepartmentRequest,
  IDepartmentResponse,
  IUpdateDepartmentRequest,
} from "../types/department.types";

export const departmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllDepartments: builder.query<IAllDepartmentResponse, void>({
      query: () => ({
        url: "/department",
        method: "GET",
      }),
      providesTags: [{ type: "Department", id: "LIST" }],
    }),
    createDepartment: builder.mutation<IDepartmentResponse, ICreateDepartmentRequest>({
      query: (data) => ({
        url: "/department",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),
    updateDepartment: builder.mutation<IDepartmentResponse, IUpdateDepartmentRequest>({
      query: ({ id, ...data }) => ({
        url: `/department/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Department", id: "LIST" },
        { type: "Department", id: `employees-${id}` },
      ],
    }),
    deleteDepartment: builder.mutation<void, number>({
      query: (id) => ({
        url: `/department/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Department", id: "LIST" },
        { type: "Department", id: `employees-${id}` },
        { type: "SubDepartment", id: `dept-${id}` },
      ],
    }),
    getDepartmentEmployees: builder.query<any, string | number>({
      query: (id) => ({
        url: `/department/employee/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "Department", id: `employees-${id}` },
      ],
    }),
  }),
});

export const {
  useGetAllDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDepartmentEmployeesQuery,
} = departmentApi;
