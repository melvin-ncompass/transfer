import { baseApi } from "../../../../api/base.api";

interface IAppToggleRequest {
  enable: boolean;
}

interface PeopleAccessResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: { isPeopleEnabled: boolean }[];
}

const APPS = {
  TOGGLE: "/company/manage_people_access",
  GET_PEOPLE_ACCESS: "/company/get_people_access",
};

export const appsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET query
    getPeopleAccess: builder.query<PeopleAccessResponse, void>({
      query: () => ({
        url: APPS.GET_PEOPLE_ACCESS,
        method: "GET",
      }),
      providesTags: ["Company"], // useful if toggle should refetch this
    }),

    // POST mutation
    toggleAppIntegration: builder.mutation<void, IAppToggleRequest>({
      query: (body) => ({
        url: APPS.TOGGLE,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Company"],
    }),
  }),
});

export const {
  useGetPeopleAccessQuery,
  useToggleAppIntegrationMutation,
} = appsApi;
