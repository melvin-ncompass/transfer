import { baseApi } from "../../../api/base.api";

const PROFILE = {
  PROFILE: "/user/profile",
  CHANGE_DISPLAY_NAME: "/user/change_displayName",
  DELETE_SESSION: "/auth/session",
  LOGOUT_OF_ALL_SESSIONS: "/auth/allSessions",
  PROFILE_PICTURE: "/user/image",
  REMOVE_IMAGE:"/user/remove_profile_image"
};
// const withAuthHeader = (headers: HeadersInit = {}) => {
//   const token = sessionStorage.getItem("access_token");
//   if (token) {
//     return {
//       ...headers,
//       Authorization: `Bearer ${token}`,
//     };
//   }
//   return headers;
// };
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // LOGOUT

    getDetails: builder.query<any, void>({
      query: () => ({
        url: PROFILE.PROFILE,
        method: "GET",
      }),
      providesTags: ["Profile"],
    }),
    changeDisplayName: builder.mutation<any, { displayName: string }>({
      query: (body) => ({
        url: PROFILE.CHANGE_DISPLAY_NAME,
        method: "POST",
        body,
        // headers: withAuthHeader(),
      }),
      invalidatesTags: ["Profile", "Header"],
    }),
    deleteSession: builder.mutation<any, { sessionId: string }>({
      query: (body) => ({
        url: PROFILE.DELETE_SESSION,
        method: "DELETE",
        body,
        // headers: withAuthHeader(),
      }),
      invalidatesTags: ["Profile"],
    }),
    removeProfilePic: builder.mutation<any, void>({
      query: () => ({
        url: PROFILE.REMOVE_IMAGE,
        method: "PATCH",
        // headers: withAuthHeader(),
      }),
      invalidatesTags: ["Header","Profile"],
    }),
    uploadProfilePic: builder.mutation<any, FormData>({
      query: (body) => ({
        url: PROFILE.PROFILE_PICTURE,
        method: "POST",
        body,
        // headers: withAuthHeader(),
      }),
      invalidatesTags: ["Header","Profile"],
    }),
    logoutOfAllSessions: builder.mutation<any, void>({
      query: () => ({
        url: PROFILE.LOGOUT_OF_ALL_SESSIONS,
        method: "DELETE",
        // headers: withAuthHeader(),
      }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetDetailsQuery,
  useChangeDisplayNameMutation,
  useDeleteSessionMutation,
  useLogoutOfAllSessionsMutation,
  useUploadProfilePicMutation,
  useRemoveProfilePicMutation,
} = authApi;
