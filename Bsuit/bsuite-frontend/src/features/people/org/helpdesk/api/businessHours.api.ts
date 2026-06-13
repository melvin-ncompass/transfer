import { baseApi } from "../../../../../api/base.api";

export interface BusinessHourSchedule {
    id?: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isDayOff?: boolean;
}

export interface BusinessHourPolicy {
    id: number;
    name: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    schedules: BusinessHourSchedule[];
}

export interface CreateBusinessHourPolicyPayload {
    name: string;
    schedule: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isDayOff?: boolean;
    }[];
}

export const businessHoursApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getBusinessHourPolicies: builder.query<
            {
                success: boolean;
                statusCode: number;
                message: string;
                data: BusinessHourPolicy[];
            },
            void
        >({
            query: () => ({
                url: "/business-hour-policies",
                method: "GET",
            }),
            providesTags: ["BusinessHourPolicies"],
        }),

        getBusinessHourPolicyById: builder.query<
            {
                success: boolean;
                statusCode: number;
                message: string;
                data: BusinessHourPolicy;
            },
            number
        >({
            query: (id) => ({
                url: `/business-hour-policies/${id}`,
                method: "GET",
            }),
            providesTags: ["BusinessHourPolicies"],
        }),

        createBusinessHourPolicy: builder.mutation<
            {
                success: boolean;
                statusCode: number;
                message: string;
                data: BusinessHourPolicy;
            },
            CreateBusinessHourPolicyPayload
        >({
            query: (body) => ({
                url: "/business-hour-policies",
                method: "POST",
                body,
            }),
            invalidatesTags: ["BusinessHourPolicies"],
        }),

        updateBusinessHourPolicy: builder.mutation<
            {
                success: boolean;
                statusCode: number;
                message: string;
                data: BusinessHourPolicy;
            },
            {
                id: number;
                body: Partial<CreateBusinessHourPolicyPayload>;
            }
        >({
            query: ({ id, body }) => ({
                url: `/business-hour-policies/${id}`,
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["BusinessHourPolicies"],
        }),

        deleteBusinessHourPolicy: builder.mutation<
            {
                success: boolean;
                statusCode: number;
                message: string;
            },
            number
        >({
            query: (id) => ({
                url: `/business-hour-policies/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["BusinessHourPolicies"],
        }),
    }),
});

export const {
    useGetBusinessHourPoliciesQuery,
    useGetBusinessHourPolicyByIdQuery,
    useCreateBusinessHourPolicyMutation,
    useUpdateBusinessHourPolicyMutation,
    useDeleteBusinessHourPolicyMutation,
} = businessHoursApi;