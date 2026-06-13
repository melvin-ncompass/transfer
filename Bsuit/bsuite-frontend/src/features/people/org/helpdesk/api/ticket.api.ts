import { baseApi } from "../../../../../api/base.api";
import type {
  AssignTicketPayload,
  CloseTicketPayload,
  CreateTicketPayload,
  ReopenTicketPayload,
  SetTicketConfidentialPayload,
  TicketLifecycleResponse,
  TicketListResponse,
  TicketResponse,
  UpdateTicketStatusPayload,
  UpdateTicketPriorityPayload,
  RejectAndCancelPayload,
  RejectAndReassignPayload,
} from "./ticket.types";

export type {
  Ticket,
  TicketPerson,
  TicketSlaSummary,
  CreateTicketPayload,
  CloseTicketPayload,
  ReopenTicketPayload,
  AssignTicketPayload,
  UpdateTicketStatusPayload,
  UpdateTicketPriorityPayload,
  SetTicketConfidentialPayload,
} from "./ticket.types";

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllTickets: builder.query<TicketListResponse, void>({
      query: () => ({
        url: "/tickets",
        method: "GET",
      }),
      providesTags: ["Tickets"],
    }),

    getMyTickets: builder.query<TicketListResponse, void>({
      query: () => ({
        url: "/tickets/me",
        method: "GET",
      }),
      providesTags: ["Tickets"],
    }),

    getAssignedTickets: builder.query<TicketListResponse, void>({
      query: () => ({
        url: "/tickets/assigned/me",
        method: "GET",
      }),
      providesTags: ["Tickets"],
    }),

    getFollowingTickets: builder.query<TicketListResponse, void>({
      query: () => ({
        url: "/tickets/following/me",
        method: "GET",
      }),
      providesTags: ["Tickets"],
    }),

    getTicketById: builder.query<TicketResponse, number>({
      query: (id) => ({
        url: `/tickets/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "TicketDetails", id },
      ],
    }),

    createTicket: builder.mutation<TicketResponse, CreateTicketPayload>({
      query: (body) => ({
        url: "/tickets",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tickets"],
    }),

    deleteTicket: builder.mutation<{ message?: string }, number>({
      query: (id) => ({
        url: `/tickets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tickets"],
    }),

    updateTicketStatus: builder.mutation<
      TicketResponse,
      { id: number; body: UpdateTicketStatusPayload }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    updateTicketPriority: builder.mutation<
      TicketResponse,
      { id: number; body: UpdateTicketPriorityPayload }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${id}/priority`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    moveInProgress: builder.mutation<TicketLifecycleResponse, number>({
      query: (id) => ({
        url: `/tickets/${id}/in-progress`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    assignTicket: builder.mutation<
      TicketResponse,
      { id: number; body: AssignTicketPayload }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${id}/assign`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    assignFollower: builder.mutation<
      TicketResponse,
      { id: number; employeeId: number }
    >({
      query: ({ id, employeeId }) => ({
        url: `/tickets/${id}/assign_follow/${employeeId}`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    removeFollower: builder.mutation<
      TicketResponse,
      { id: number; employeeId: number }
    >({
      query: ({ id, employeeId }) => ({
        url: `/tickets/${id}/remove_follow/${employeeId}`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    reopenTicket: builder.mutation<
      TicketLifecycleResponse,
      { id: number; body: ReopenTicketPayload }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${id}/reopen`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    closeTicket: builder.mutation<
      TicketLifecycleResponse,
      { id: number; body: CloseTicketPayload }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${id}/close`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    resolveTicket: builder.mutation<
      TicketLifecycleResponse,
      { id: number; body: CloseTicketPayload }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${id}/resolve`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    holdTicket: builder.mutation<TicketLifecycleResponse, number>({
      query: (id) => ({
        url: `/tickets/${id}/hold`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    resumeTicket: builder.mutation<TicketLifecycleResponse, number>({
      query: (id) => ({
        url: `/tickets/${id}/resume`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    setTicketConfidential: builder.mutation<
      TicketResponse,
      { id: number; body?: SetTicketConfidentialPayload }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${id}/confidential`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    followTicket: builder.mutation<TicketResponse, number>({
      query: (id) => ({
        url: `/tickets/${id}/follow`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    unfollowTicket: builder.mutation<TicketResponse, number>({
      query: (id) => ({
        url: `/tickets/${id}/unfollow`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    acceptTicket: builder.mutation<TicketResponse, number>({
      query: (id) => ({
        url: `/tickets/${id}/accept`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    rejectAndCancelTicket: builder.mutation<
      TicketLifecycleResponse,
      { id: number; body: RejectAndCancelPayload }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${id}/reject-cancel`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),

    rejectAndReassignTicket: builder.mutation<
      TicketLifecycleResponse,
      { id: number; body: RejectAndReassignPayload }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${id}/reject-reassign`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Tickets",
        { type: "TicketDetails", id },
      ],
    }),
  }),
});

export const {
  useGetAllTicketsQuery,
  useGetMyTicketsQuery,
  useGetAssignedTicketsQuery,
  useGetFollowingTicketsQuery,
  useGetTicketByIdQuery,
  useLazyGetTicketByIdQuery,
  useCreateTicketMutation,
  useDeleteTicketMutation,
  useUpdateTicketStatusMutation,
  useUpdateTicketPriorityMutation,
  useMoveInProgressMutation,
  useAssignTicketMutation,
  useAssignFollowerMutation,
  useRemoveFollowerMutation,
  useReopenTicketMutation,
  useCloseTicketMutation,
  useResolveTicketMutation,
  useHoldTicketMutation,
  useResumeTicketMutation,
  useSetTicketConfidentialMutation,
  useFollowTicketMutation,
  useUnfollowTicketMutation,
  useAcceptTicketMutation,
  useRejectAndCancelTicketMutation,
  useRejectAndReassignTicketMutation,
} = ticketApi;
