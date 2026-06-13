
// interfaces for api responses

import { baseApi } from "../../../../../api/base.api";

export interface BirthdayPerson {
  employeeId: number;
  name: string;
  date: string;
  profileUrl?: string | null;
  contact?: {
    profileUrl?: string | null;
  } | null;
}

export interface WishEmployee {
  id: number;
  name?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profileUrl?: string | null;
}

export interface WishLike {
  id: number;
  likedBy?: WishEmployee | null;
}

export interface EmployeeWish {
  id: number;
  date: string;
  message: string;
  occasionType: "birthday" | "work_anniversary";
  status: string;
  likes: WishLike[];
  wishedBy?: WishEmployee | null;
  createdAt: string;
}

export const birthdaysApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all salary templates
// / get salary template by id
    getBirthdays: builder.query<any, void>({
      query: () => ({
        url: `/employee_portal/birthday/`,
        method: "GET",
      }),
      providesTags: ["Holidays"],
    }),

    getWorkAnniversaries: builder.query<any, void>({
      query: () => ({
        url: `/employee_portal/work_anniversary/`,
        method: "GET",
      }),
      providesTags: ["Holidays"],
    }),
    getEmployeeWishes: builder.query<
      { message?: string; data: { wishes: EmployeeWish[]; hasWished: boolean } },
      { employeeId: number; occasionType: "birthday" | "work_anniversary" }
    >({
      query: ({ employeeId, occasionType }) => ({
        url: `/employee_portal/wishes/${employeeId}?occasion=${occasionType}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { employeeId }) => [
        "Holidays",
        { type: "Employee", id: `wish-${employeeId}` } as never,
      ],
    }),
    createWish: builder.mutation<
      { message?: string; data?: unknown },
      { employeeId: number; message: string; occasionType: "birthday" | "work_anniversary" }
    >({
      query: ({ employeeId, message, occasionType }) => ({
        url: `/employee_portal/wish/${employeeId}`,
        method: "POST",
        body: { message, occasionType },
      }),
      invalidatesTags: (_result, _error, args) => [
        "Holidays",
        { type: "Employee", id: `wish-${args.employeeId}` } as never,
      ],
    }),
    likeWish: builder.mutation<
      { message?: string; data?: { liked?: boolean } },
      { wishId: number; employeeId: number }
    >({
      query: ({ wishId }) => ({
        url: `/employee_portal/wish/like/${wishId}`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, args) => [
        { type: "Employee", id: `wish-${args.employeeId}` } as never,
      ],
    }),
  }),
});

// Export Hooks
export const {
  useGetBirthdaysQuery,
  useGetWorkAnniversariesQuery,
  useGetEmployeeWishesQuery,
  useCreateWishMutation,
  useLikeWishMutation,
} = birthdaysApi;
