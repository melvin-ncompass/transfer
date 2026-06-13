import { baseApi } from './baseApi';

/**
 * User interface
 */
export interface User {
  id: string;
  type: string;
  userInfo: UserInfo;
  info?: UserInfo;
  roleMappings?: RoleMapping[];
  updatedAt?: string;
  isArchived?: boolean;
  createdAt?: string;
  status?: 'pending' | 'approved' | 'denied' | 'active' | 'inactive';
  isAccountSetUp?: boolean;
}

export interface UserInfo {
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  avatarUrl?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  role: RoleDetails;
  lastLogin?: string;
  roles?: RoleDetails[];
}

export interface RoleDetails {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  permissions?: Array<{
    id: string;
    name: string;
    slug?: string;
  }>;
}

export interface RoleMapping {
  id: string;
  roleId: string;
  role: RoleDetails;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Invite user request
 */
export interface InviteUserRequest {
  email: string;
  name: string;
  roleNames: string[];
}

/**
 * Update user role request
 */
export interface UpdateUserRoleRequest {
  userId: string;
  email: string;
  roleName: string;
}

/**
 * Get all users request parameters
 */
export interface GetAllUsersParams {
  page?: number;
  limit?: number;
  status?: 'Get All' | 'Active';
}

/**
 * RTK Query API for User Management
 *
 * Provides auto-generated hooks for:
 * - useGetAllUsersQuery - Fetch all users
 * - useInviteUserMutation - Invite a new user
 * - useChangePasswordMutation - Change user password
 */
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get all users
     * By default fetches only active users. Pass status: 'Get All' to fetch both active and inactive users.
     * @param params - Optional query parameters (page, limit, status)
     * @returns Array of users
     */
    getAllUsers: builder.query<User[], GetAllUsersParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.status) queryParams.append('status', params.status);
        
        const queryString = queryParams.toString();
        return `users/getAllUsers${queryString ? `?${queryString}` : ''}`;
      },
      transformResponse: (response: { data: User[] }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    /**
     * Invite a new user
     * @param data - User invitation data
     * @returns Invitation response
     */
    inviteUser: builder.mutation<any, InviteUserRequest>({
      query: (data) => ({
        url: '/users/invite',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'User', id: 'INVITED' }],
    }),

    /**
     * Change user password
     * @param data - Current and new password
     * @returns Success response
     */
    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (data) => ({
        url: '/users/change-password',
        method: 'PUT',
        body: data,
      }),
    }),
    getAvatar: builder.query<string, void>({
      query: () => ({
        url: 'users/profile-pic',
        responseHandler: async (response) => {
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        },
      }),
      providesTags: [{ type: 'User', id: 'AVATAR' }],
    }),
    updateAvatar: builder.mutation<void, FormData>({
      query: (data) => ({
        url: '/users/change-profile-pic',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'User', id: 'AVATAR' }],
    }),

    /**
     * Update user role
     * @param data - User ID and role names
     * @returns Success response
     */
    updateUserRole: builder.mutation<void, UpdateUserRoleRequest>({
      query: ({ email, roleName, userId }) => ({
        url: `/users/role`,
        method: 'PUT',
        body: { email, roleName },
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    /**
     * Deactivate a user
     * @param email - User email
     * @returns Success response
     */
    deactivateUser: builder.mutation<void, string>({
      query: (email) => ({
        url: `/users/deactivate/${email}`,
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    /**
     * Activate a user
     * @param email - User email
     * @returns Success response
     */
    activateUser: builder.mutation<void, string>({
      query: (email) => ({
        url: `/users/activate/${email}`,
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
  }),
});

/**
 * Auto-generated hooks for user operations
 */
export const {
  useGetAllUsersQuery,
  useInviteUserMutation,
  useChangePasswordMutation,
  useUpdateAvatarMutation,
  useGetAvatarQuery,
  useUpdateUserRoleMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
} = userApi;
