import { baseApi } from "../../../../api/base.api";

// ─── Shared Types ──────────────────────────────────────────────────────────────

export interface DocumentListRow {
  doc_type?: "invoice" | "bill" | string;
  document_no?: string;
  transaction_type_id?: string;
  contact_name?: string;
  contact_id?: string | number | null;
  issue_date?: string;
  due_date?: string;
  total?: number | null;
  balance_due?: number | null;
  total_paid?: number | null;
  currency?: string | null;
  [key: string]: any;
}

export interface DocumentListResult {
  doc_scope?: "invoice" | "bill" | "both" | string;
  filter?: "all" | "due" | "settled" | string;
  n_requested?: number;
  contact_name?: string | null;
  rows?: DocumentListRow[];
  error?: string;
  [key: string]: any;
}

// Standard API envelope used by all backend responses
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: T;
}

// ─── GET /chatbot/conversation/ ────────────────────────────────────────────────

export interface ConversationListItem {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationListData {
  items: ConversationListItem[];
  total: number;
  limit: number;
  offset: number;
}

export type GetConversationsResponse = ApiResponse<ConversationListData>;

// ─── POST /chatbot/conversation/ ───────────────────────────────────────────────

interface CreateConversationData {
  id: number;
  userId: number;
  title: string;
  orchestratorState: null;
  createdAt: string;
  updatedAt: string;
}

export type CreateConversationResponse = ApiResponse<CreateConversationData>;

// ─── PUT /chatbot/conversation/:id ─────────────────────────────────────────────

export interface SendMessageRequest {
  id: number;
  message: string;
}

interface SendMessageData {
  conversationId: number;
  response: string;
  responses: string[];
  listResult: DocumentListResult | null;
  isComplete: boolean;
  title: string;
}

export type SendMessageResponse = ApiResponse<SendMessageData>;

// ─── GET /chatbot/conversation/:id ─────────────────────────────────────────────

export interface BackendMessage {
  id: number;
  role: "agent" | "user";
  text: string;
  listResult: DocumentListResult | null;
  createdAt: string;
}

interface GetConversationData {
  conversation: {
    id: number;
    userId: number;
    title: string;
    orchestratorState: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
  };
  messages: BackendMessage[];
}

export type GetConversationResponse = ApiResponse<GetConversationData>;

// ─── API Slice ─────────────────────────────────────────────────────────────────

export const financeAgentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query<GetConversationsResponse, { limit?: number }>({
      query: ({ limit = 20 }) => ({
        url: "/chatbot/conversation/",
        params: { limit },
      }),
      providesTags: ["FinanceConversations"],
    }),

    getConversation: builder.query<GetConversationResponse, number>({
      query: (id) => ({
        url: `/chatbot/conversation/${id}`,
      }),
      providesTags: (_, __, id) => [{ type: "FinanceConversation", id }],
    }),

    createConversation: builder.mutation<CreateConversationResponse, void>({
      query: () => ({
        url: "/chatbot/conversation/",
        method: "POST",
      }),
      invalidatesTags: ["FinanceConversations"],
    }),

    sendMessage: builder.mutation<SendMessageResponse, SendMessageRequest>({
      query: ({ id, message }) => ({
        url: `/chatbot/conversation/${id}`,
        method: "PUT",
        body: { message },
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "FinanceConversation", id },
        "FinanceConversations",
      ],
    }),

    deleteConversation: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `/chatbot/conversation/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, id) => [
        { type: "FinanceConversation", id },
        "FinanceConversations",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLazyGetConversationsQuery,
  useLazyGetConversationQuery,
  useCreateConversationMutation,
  useSendMessageMutation,
  useDeleteConversationMutation,
} = financeAgentApi;
