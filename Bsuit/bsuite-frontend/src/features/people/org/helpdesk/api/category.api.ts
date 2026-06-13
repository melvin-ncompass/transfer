import { baseApi } from "../../../../../api/base.api";
/* ============================================================================
   CATEGORY TYPES
============================================================================ */

export interface TicketCategoryPayload {
  categoryName: string;
  description?: string | null;
  isSubCategory?: boolean;
  parentId?: number | null;
  members?: number[];
  categoryLead: number;
  defaultPriority?: number; // optional — only sent when prioritizationEnabled is true
  businessHourPolicyId?: number;
  slaMappings?: SLAMappingPayload[];
  responseEscalationRules?: EscalationRulePayload[];
  resolutionEscalationRules?: EscalationRulePayload[];
  isActive?: boolean;
  enableOnHold?: boolean;
  notifyResponseBreach?: boolean;
  notifyResolutionBreach?: boolean;
  prioritizationEnabled: boolean; // required — drives BE conditional validation for defaultPriority
}

// isActive removed — handled automatically by the system
export interface SLAMappingPayload {
  categoryId: number;
  priorityId: number;
  defaultResponseTimeMinutes: number;
  defaultResolutionTimeMinutes: number;
}

// timeBreachType and isActive removed — not in CreateEscalationRuleDto
export interface EscalationRulePayload {
  categoryId: number;
  level: number;
  triggerAfterMinutes: number;
  escalateToEmployeeId: number;
}

export interface TicketCategory {
  id: number;
  categoryName: string;
  description?: string | null;
  isSubCategory?: boolean;
  isActive?: boolean;

  parent?: {
    id: number;
    categoryName: string;
  };

  defaultPriority?: {
    id: number;
    priorityName: string;
  };

  categoryLead?: {
    id: number;
    firstName?: string;
    lastName?: string;
  };

  categoryMembers?: Array<{
    id: number;
    employee: {
      id: number;
      firstName?: string;
      lastName?: string;
    };
  }>;

  businessHourPolicy?: {
    id: number;
    policyName?: string;
  };

  slaMappings?: Array<SLAMappingPayload & { id?: number }>;
  escalationRules?: Array<EscalationRulePayload & { id?: number }>;
  ticketEscalationRules?: Array<EscalationRulePayload & { id?: number }>;
  responseEscalationRules?: Array<EscalationRulePayload & { id?: number }>;
  resolutionEscalationRules?: Array<EscalationRulePayload & { id?: number }>;
  notifyResponseBreach?: boolean;
  notifyResolutionBreach?: boolean;
  enableOnHold?: boolean;
  prioritizationEnabled?: boolean;
}

export interface TicketCategoryResponse {
  data: TicketCategory;
  message: string;
}

export interface TicketCategoryListResponse {
  data: TicketCategory[];
  message: string;
}

/* ============================================================================
   STATUS TYPES
============================================================================ */

export interface TicketStatusPayload {
  name?: string;
  description?: string;
}

export interface TicketStatus {
  id: number;
  name: string;
  description?: string;
  slug?: string;
  order?: number;
}

export interface TicketStatusResponse {
  data: TicketStatus;
  message?: string;
}

export interface TicketStatusListResponse {
  data: TicketStatus[];
  message?: string;
}

// ============================================================================
// PRIORITY TYPES
// ============================================================================

export interface TicketPriority {
  id: number;
  name: string;
  description?: string;
  level?: number;
  color?: string;
}

export interface TicketPriorityResponse {
  data: TicketPriority;
  message?: string;
}

export interface TicketPriorityListResponse {
  data: TicketPriority[];
  message?: string;
}

/* ============================================================================
   API
============================================================================ */

export const helpdeskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* ============================================================================
       CATEGORY
    ============================================================================ */

    createCategory: builder.mutation<
      TicketCategoryResponse,
      TicketCategoryPayload
    >({
      query: (body) => ({
        url: "/ticket_category",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TicketCategories"],
    }),

    getAllCategories: builder.query<TicketCategoryListResponse, void>({
      query: () => ({
        url: "/ticket_category",
        method: "GET",
      }),
      providesTags: ["TicketCategories"],
    }),

    getOneCategory: builder.query<TicketCategoryResponse, number>({
      query: (id) => ({
        url: `/ticket_category/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "TicketCategories", id },
      ],
    }),

    updateCategory: builder.mutation<
      TicketCategoryResponse,
      {
        id: number;
        body: Partial<TicketCategoryPayload>;
      }
    >({
      query: ({ id, body }) => ({
        url: `/ticket_category/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "TicketCategories",
        { type: "TicketCategories", id },
      ],
    }),

    deleteCategory: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/ticket_category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TicketCategories"],
    }),

    /* ============================================================================
       STATUS
    ============================================================================ */

    getAllStatuses: builder.query<TicketStatusListResponse, void>({
      query: () => ({
        url: "/ticket-status",
        method: "GET",
      }),
      providesTags: ["TicketStatus"],
    }),

    getOneStatus: builder.query<TicketStatusResponse, number>({
      query: (id) => ({
        url: `/ticket-status/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "TicketStatus", id },
      ],
    }),

    updateStatus: builder.mutation<
      TicketStatusResponse,
      {
        id: number;
        body: TicketStatusPayload;
      }
    >({
      query: ({ id, body }) => ({
        url: `/ticket-status/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "TicketStatus",
        { type: "TicketStatus", id },
      ],
    }),

    // ============================================================================
    // PRIORITY
    // ============================================================================

    getAllPriorities: builder.query<TicketPriorityListResponse, void>({
      query: () => ({
        url: "/ticket-priority",
        method: "GET",
      }),
      providesTags: ["TicketPriority"],
    }),

    getOnePriority: builder.query<TicketPriorityResponse, number>({
      query: (id) => ({
        url: `/ticket-priority/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "TicketPriority", id },
      ],
    }),
  }),
});

/* ============================================================================
   HOOKS
============================================================================ */

export const {
  // Category
  useCreateCategoryMutation,
  useGetAllCategoriesQuery,
  useLazyGetAllCategoriesQuery,
  useGetOneCategoryQuery,
  useLazyGetOneCategoryQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,

  // Status
  useGetAllStatusesQuery,
  useLazyGetAllStatusesQuery,
  useGetOneStatusQuery,
  useLazyGetOneStatusQuery,
  useUpdateStatusMutation,

  // Priority
  useGetAllPrioritiesQuery,
  useLazyGetAllPrioritiesQuery,
  useGetOnePriorityQuery,
  useLazyGetOnePriorityQuery,
} = helpdeskApi;