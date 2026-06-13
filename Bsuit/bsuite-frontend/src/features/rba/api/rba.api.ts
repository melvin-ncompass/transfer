import { baseApi } from "../../../api/base.api";
import type {
  IRoleCreate,
  IUpdateRoles,
  IModulePermissionList,
  IGetRoleById,
  IGetRoleResponse,
  IPermissionAPiResponse,
} from "../types/rba.types";

// Define your sync user role endpoint
const AUTH = {
  LIST_PERMISSIONS: "/rba/list_permissions",
  CREATE_ROLE: "/rba/role/",
  UPDATE_ROLE: "/rba/role/:id",
  DELETE_ROLE: "/rba/role/:id",
  GET_ROLE_BY_ID: "/rba/role/:id",
  GET_ROLES: "/rba/role",
  SYNC_USER_ROLE: "/rba/sync_user_role", 
  REVOKE_ROLE: "/rba/revoke_role", 
};

export const rbaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET permissions
    getPermissions: builder.query<IPermissionAPiResponse, void>({
      query: () => AUTH.LIST_PERMISSIONS,
      providesTags: ["Permissions"],
    }),

    // CREATE role
    createRole: builder.mutation<any, IRoleCreate>({
      query: (body) => ({
        url: AUTH.CREATE_ROLE,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Roles" , "UsersRoleList"],
    }),

    // UPDATE role
    updateRole: builder.mutation<any, IUpdateRoles>({
      query: ({ id, ...body }) => ({
        url: `${AUTH.UPDATE_ROLE.replace(":id", id.toString())}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Roles"],
    }),

    // DELETE role
    deleteRole: builder.mutation<any, string>({
      query: (id) => ({
        url: `${AUTH.DELETE_ROLE.replace(":id", id.toString())}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Roles"],
    }),

    // GET roles list
    getRoles: builder.query<IGetRoleResponse, void>({
      query: () => AUTH.GET_ROLES,
      providesTags: ["Roles"],
    }),

    // GET role by ID
    getRoleById: builder.query<IGetRoleById, number>({
      query: (id) => `${AUTH.GET_ROLE_BY_ID.replace(":id", id.toString())}`,
      providesTags: ["Roles"],
    }),

    // SYNC user-role relationship
    syncUserRole: builder.mutation<any, { roleId: string; userIds: string[] }>({
      query: ({ roleId, userIds }) => ({
        url: AUTH.SYNC_USER_ROLE,
        method: "POST",
        body: { roleId, userIds },
      }),
      invalidatesTags: ["Roles"],
    }),

     revokeRole: builder.mutation<any, { roleId: string; userId: string }>({
      query: ({ roleId, userId }) => ({
        url: AUTH.REVOKE_ROLE,
        method: "POST",
        body: { roleId, userId },
      }),
      invalidatesTags: ["Roles"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useDeleteRoleMutation,
  useSyncUserRoleMutation,
  useRevokeRoleMutation
} = rbaApi;
