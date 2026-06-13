import { baseApi } from "../../../../../api/base.api";

/* ============================================================================
   ESCALATION RULE TYPES
============================================================================ */

export interface EscalationRulePayload {
  categoryId: number;
  priorityId: number;
  level: number;
  escalateToEmployeeId: number;
  triggerAfterMinutes: number;
  timeBreachType?: "response" | "resolution";
  isActive?: boolean;
}

export interface EscalationRule {
  id: number;
  categoryId: number;
  priorityId?: number;
  escalateToEmployeeId?: number;
  level?: number;
  category?: {
    id: number;
    categoryName: string;
  };
  priority?: {
    id: number;
    name: string;
  };
  escalateToEmployee?: {
    id: number;
    name?: string;
  };
  triggerAfterMinutes: number;
  timeBreachType?: "response" | "resolution";
  isActive?: boolean;
  createdAt?: string;
}

export interface EscalationRuleResponse {
  data: EscalationRule;
  message?: string;
}

export interface EscalationRuleListResponse {
  data: EscalationRule[];
  message?: string;
}

/* ============================================================================
   API
============================================================================ */

export const escalationRulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* ============================================================================
       ESCALATION RULES
    ============================================================================ */

    createEscalationRule: builder.mutation<
      EscalationRuleResponse,
      EscalationRulePayload
    >({
      query: (body) => ({
        url: "/escalation-rules",
        method: "POST",
        body,
      }),
      invalidatesTags: ["EscalationRules"],
    }),

    getAllEscalationRules: builder.query<
      EscalationRuleListResponse,
      { categoryId?: number } | void
    >({
      query: (params) => {
        const queryObj: any = {
          url: "/escalation-rules",
          method: "GET",
        };
        if (params && typeof params === "object") {
          queryObj.params = params;
        }
        return queryObj;
      },
      providesTags: ["EscalationRules"],
    }),

    getOneEscalationRule: builder.query<EscalationRuleResponse, number>({
      query: (id) => ({
        url: `/escalation-rules/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "EscalationRules", id },
      ],
    }),

    updateEscalationRule: builder.mutation<
      EscalationRuleResponse,
      {
        id: number;
        body: Partial<EscalationRulePayload>;
      }
    >({
      query: ({ id, body }) => ({
        url: `/escalation-rules/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "EscalationRules",
        { type: "EscalationRules", id },
      ],
    }),

    deleteEscalationRule: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/escalation-rules/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EscalationRules"],
    }),
  }),
});

/* ============================================================================
   HOOKS
============================================================================ */

export const {
  useCreateEscalationRuleMutation,
  useGetAllEscalationRulesQuery,
  useLazyGetAllEscalationRulesQuery,
  useGetOneEscalationRuleQuery,
  useLazyGetOneEscalationRuleQuery,
  useUpdateEscalationRuleMutation,
  useDeleteEscalationRuleMutation,
} = escalationRulesApi;
