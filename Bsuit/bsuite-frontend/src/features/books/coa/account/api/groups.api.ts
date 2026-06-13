import { baseApi } from "../../../../../api/base.api";

export const groupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all groups (optional groupType filter)
    getGroups: builder.query({
      query: (groupType) => {
        const queryParam = groupType ? `?groupType=${groupType}` : "";
        return `/group${queryParam}`;
      },
      providesTags: ["Group"],
    }),

    // Get a single group by ID
    // getGroupById: builder.query({
    //   query: (id) => `/group/${id}`,
    //   providesTags: (result, error, id) => [{ type: "Group", id }],
    // }),

    // Add a new group
    addGroup: builder.mutation({
      query: (newGroup) => ({
        url: `/group`,
        method: "POST",
        body: newGroup,
      }),
      invalidatesTags: ["Group"],
    }),

    // Update existing group
    // API slice
    updateGroup: builder.mutation<
      any,
      { id: string | number; groupName: string; groupType: string }
    >({
      query: ({ id, groupName, groupType }) => ({
        url: `/group/${id}`,
        method: "PATCH",
        body: { groupName, groupType }, // make sure body matches backend
      }),
      invalidatesTags: ["Group"],
    }),

    // Delete a group
    deleteGroup: builder.mutation({
      query: (id) => ({
        url: `/group/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Group"],
    }),
  }),
});

export const {
  useGetGroupsQuery,
  // useGetGroupByIdQuery,
  useAddGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} = groupsApi;
