import { baseApi } from './baseApi';
import type { Permission } from './permissionApi';
import type { User } from './userApi';

/**
 * Permission Mapping interface
 */
export interface PermissionMapping {
  permission: Permission;
}

/**
 * User Mapping interface
 */
export interface UserMapping {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    [key: string]: any;
  };
}


/**
 * Role interface matching the backend response
 */
export interface Role {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  systemPermissions: Permission[];
  businessPermissions: Permission[];
  users: User[];
}

/**
 * Permission node structure for hierarchical permissions
 */
export interface PermissionNode {
  name: string;
  children?: PermissionNode[];
}

/**
 * Request payload for creating a role
 */
export interface CreateRoleRequest {
  roleName: string;
  permission: PermissionNode[];
}

/**
 * Request payload for updating a role
 */
export interface UpdateRoleRequest {
  id: string;
  name?: string;
  permission: PermissionNode[];
}

/**
 * Get all roles request parameters
 */
export interface GetAllRolesParams {
  page?: number;
  limit?: number;
  status?: 'Get All' | 'Active';
}

/**
 * RTK Query API for Role Management
 * 
 * Provides auto-generated hooks for:
 * - useGetRolesQuery - Fetch all roles with automatic caching
 * - useGetRoleQuery - Fetch a single role by ID
 * - useCreateRoleMutation - Create a new role
 * - useUpdateRoleMutation - Update an existing role
 * - useDeleteRoleMutation - Delete a role
 * 
 * Features:
 * - Automatic caching and refetching
 * - Optimistic updates
 * - Cache invalidation on mutations
 * - Loading and error states
 */
export const roleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all roles
     * By default fetches only active users in user mapping. Pass status: 'Get All' to fetch both active and inactive users.
     * @param params - Optional query parameters (page, limit, status)
     * @returns Array of roles
     */
    getRoles: builder.query<Role[], GetAllRolesParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.status) queryParams.append('status', params.status);
        
        const queryString = queryParams.toString();
        return `users/roles/getAll${queryString ? `?${queryString}` : ''}`;
      },
      transformResponse: (response: { data: { roles: Role[]} }) => response.data.roles,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Role' as const, id })),
              { type: 'Role', id: 'LIST' },
            ]
          : [{ type: 'Role', id: 'LIST' }],
    }),

    /**
     * Get a single role by ID
     * @param id - Role ID
     * @returns Role object
     */
    getRole: builder.query<Role, string>({
      query: (id) => `users/roles/${id}`,
      transformResponse: (response: { data: Role }) => response.data,
      providesTags: (result, error, id) => [{ type: 'Role', id }],
    }),

    /**
     * Create a new role
     * @param data - Role creation data
     * @returns Created role
     */
    createRole: builder.mutation<Role, CreateRoleRequest>({
      query: (data) => ({
        url: 'users/roles/permissions',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: { data: Role }) => response.data,
      // Invalidate the roles list cache to trigger refetch
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    /**
     * Update an existing role
     * @param data - Role update data with ID
     * @returns Updated role
     */
    updateRole: builder.mutation<Role, UpdateRoleRequest>({
      query: ({ id, ...data }) => ({
        url: `users/roles/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: { data: Role }) => response.data,
      // Invalidate specific role and list cache
      invalidatesTags: (result, error, { id }) => [
        { type: 'Role', id },
        { type: 'Role', id: 'LIST' },
      ],
    }),

    /**
     * Delete a role
     * @param id - Role ID to delete
     * @returns Deletion confirmation
     */
    deleteRole: builder.mutation<void, string>({
      query: (id) => ({
        url: `users/roles/${id}`,
        method: 'DELETE',
      }),
      // Invalidate specific role and list cache
      invalidatesTags: (result, error, id) => [
        { type: 'Role', id },
        { type: 'Role', id: 'LIST' },
      ],
    }),
  }),
});

/**
 * Auto-generated hooks for role operations
 * 
 * Query hooks:
 * - useGetRolesQuery() - Fetch all roles
 * - useGetRoleQuery(id) - Fetch single role
 * 
 * Mutation hooks:
 * - useCreateRoleMutation() - Returns [createRole, { isLoading, error }]
 * - useUpdateRoleMutation() - Returns [updateRole, { isLoading, error }]
 * - useDeleteRoleMutation() - Returns [deleteRole, { isLoading, error }]
 */
export const {
  useGetRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleApi;
