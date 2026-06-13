import { baseApi } from './baseApi';

/**
 * Permission interface matching the backend response
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  parentId?: string | null;
  children?: Permission[];
}

/**
 * Permission Response interface matching the backend response
 */
export interface PermissionResponse {
  system: Permission[];
  business: Permission[];
}


const flatten = (items: Permission[]): Permission[] =>
  items.flatMap(i => [i, ...flatten(i.children ?? [])]);


/**
 * RTK Query API for Permission Management
 */
export const permissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all permissions
     * @returns Array of permissions
     */
    getPermissions: builder.query<PermissionResponse, void>({
      query: () => 'users/permissions',
      transformResponse: (response: { data: PermissionResponse }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.system.map(p => ({ type: 'Permission' as const, id: p.id })),
              ...flatten(result.business).map(p => ({ type: 'Permission' as const, id: p.id })),
              { type: 'Permission', id: 'LIST' },
            ]
          : [{ type: 'Permission', id: 'LIST' }],
    }),
  }),
});

/**
 * Auto-generated hooks for permission operations
 */
export const {
  useGetPermissionsQuery,
} = permissionApi;
