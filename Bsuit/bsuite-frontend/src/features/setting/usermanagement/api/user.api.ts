import { baseApi } from "../../../../api/base.api";

// -------------------------------- User Types --------------------------------
export interface IUser {
  id: string;
  userId: string;
  email: string;
  role: string;
  userName: string;
  status: string;
}

export interface IUserInviteRequest {
  email: string;
  roleId: number | number[] | null;
}

export interface IAllUsersResponse {
  message: string;
  data: IUser[];
}

// -------------------------------- Role Types --------------------------------
export interface IRole {
  id: number;
  roleName: string;
}

export interface IRolesResponse {
  success: boolean;
  message: string;
  data: IRole[];
}

// -------------------------------- Endpoints --------------------------------
const USER = {
  INVITE_USER: "/setting/users/invite_user",
  USERS_LIST: "/setting/users/list",
  USER_DELETE: "/setting/users",
  ROLE_LIST: "/rba/role_list/",
};

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Invite a User
    inviteUser: builder.mutation<{ success: boolean }, IUserInviteRequest>({
      query: (body) => ({
        url: USER.INVITE_USER,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),

    // Get all users
    getAllUsers: builder.query<IAllUsersResponse, void>({
      query: () => ({
        url: USER.USERS_LIST,
        method: "GET",
      }),
      providesTags: ["Users"],
    }),

    // Delete a user
    deleteUser: builder.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `${USER.USER_DELETE}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    // Get roles list
    getUserRolesList: builder.query<IRolesResponse, void>({
      query: () => ({
        url: USER.ROLE_LIST,
        method: "GET",
      }),
      providesTags : ["UsersRoleList"]
    }),
  }),
});

// ------------------------- Export Hooks -------------------------
export const {
  useInviteUserMutation,
  useGetAllUsersQuery,
  useDeleteUserMutation,
  useGetUserRolesListQuery,
} = userApi;
