import { baseApi } from "../../../../../api/base.api";

/* ============================================================================
   CLOSING REASON TYPES
============================================================================ */

export interface TicketClosingReasonPayload {
  reason: string;
  description?: string;
  isActive?: boolean;
}

export interface TicketClosingReason {
  id: number;
  reason: string;
  description?: string;
  isActive?: boolean;
}

export interface TicketClosingReasonResponse {
  data: TicketClosingReason;
  message?: string;
}

export interface TicketClosingReasonListResponse {
  data: TicketClosingReason[];
  message?: string;
}

/* ============================================================================
   TICKET CLOSURE TYPES
============================================================================ */

export interface TicketClosurePayload {
  reason: number;
  closedBy: number;
  notes: string;
}

export interface TicketClosure {
  id: number;
  notes: string;

  reason?: {
    id: number;
    reason: string;
  };

  closedBy?: {
    id: number;
    firstName?: string;
    lastName?: string;
  };

  ticket?: {
    id: number;
    subject?: string;
  };
}

export interface TicketClosureResponse {
  data: TicketClosure;
  message?: string;
}

export interface TicketClosureListResponse {
  data: TicketClosure[];
  message?: string;
}

/* ============================================================================
   API
============================================================================ */

export const ticketClosureApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* ============================================================================
       CLOSING REASONS
    ============================================================================ */

    createClosingReason: builder.mutation<
      TicketClosingReasonResponse,
      TicketClosingReasonPayload
    >({
      query: (body) => ({
        url: "/ticket_closing_reason",
        method: "POST",
        body,
      }),

      invalidatesTags: ["TicketClosingReason"],
    }),

    getAllClosingReasons: builder.query<
      TicketClosingReasonListResponse,
      void
    >({
      query: () => ({
        url: "/ticket_closing_reason",
        method: "GET",
      }),

      providesTags: ["TicketClosingReason"],
    }),

    getOneClosingReason: builder.query<
      TicketClosingReasonResponse,
      number
    >({
      query: (id) => ({
        url: `/ticket_closing_reason/${id}`,
        method: "GET",
      }),

      providesTags: (_result, _error, id) => [
        { type: "TicketClosingReason", id },
      ],
    }),

    updateClosingReason: builder.mutation<
      TicketClosingReasonResponse,
      {
        id: number;
        body: Partial<TicketClosingReasonPayload>;
      }
    >({
      query: ({ id, body }) => ({
        url: `/ticket_closing_reason/${id}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (_result, _error, { id }) => [
        "TicketClosingReason",
        { type: "TicketClosingReason", id },
      ],
    }),

    deleteClosingReason: builder.mutation<
      { message?: string },
      number
    >({
      query: (id) => ({
        url: `/ticket_closing_reason/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["TicketClosingReason"],
    }),

    /* ============================================================================
       TICKET CLOSURE
    ============================================================================ */

    createTicketClosure: builder.mutation<
      TicketClosureResponse,
      {
        ticketId: number;
        body: TicketClosurePayload;
      }
    >({
      query: ({ ticketId, body }) => ({
        url: `/ticket_closure/${ticketId}`,
        method: "POST",
        body,
      }),

      invalidatesTags: ["TicketClosure"],
    }),

    getAllTicketClosures: builder.query<
      TicketClosureListResponse,
      void
    >({
      query: () => ({
        url: "/ticket_closure",
        method: "GET",
      }),

      providesTags: ["TicketClosure"],
    }),

    getOneTicketClosure: builder.query<
      TicketClosureResponse,
      number
    >({
      query: (ticketId) => ({
        url: `/ticket_closure/${ticketId}`,
        method: "GET",
      }),

      providesTags: (_result, _error, id) => [
        { type: "TicketClosure", id },
      ],
    }),

    updateTicketClosure: builder.mutation<
      TicketClosureResponse,
      {
        ticketId: number;
        body: Partial<TicketClosurePayload>;
      }
    >({
      query: ({ ticketId, body }) => ({
        url: `/ticket_closure/${ticketId}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (_result, _error, { ticketId }) => [
        "TicketClosure",
        { type: "TicketClosure", id: ticketId },
      ],
    }),

    deleteTicketClosure: builder.mutation<
      { message?: string },
      number
    >({
      query: (ticketId) => ({
        url: `/ticket_closure/${ticketId}`,
        method: "DELETE",
      }),

      invalidatesTags: ["TicketClosure"],
    }),
  }),
});

/* ============================================================================
   HOOKS
============================================================================ */

export const {
  // Closing Reasons
  useCreateClosingReasonMutation,
  useGetAllClosingReasonsQuery,
  useLazyGetAllClosingReasonsQuery,
  useGetOneClosingReasonQuery,
  useLazyGetOneClosingReasonQuery,
  useUpdateClosingReasonMutation,
  useDeleteClosingReasonMutation,

  // Ticket Closure
  useCreateTicketClosureMutation,
  useGetAllTicketClosuresQuery,
  useLazyGetAllTicketClosuresQuery,
  useGetOneTicketClosureQuery,
  useLazyGetOneTicketClosureQuery,
  useUpdateTicketClosureMutation,
  useDeleteTicketClosureMutation,
} = ticketClosureApi;