export { default as TicketChatPanel } from "./components/TicketChatPanel";
export { default as ChatMessage } from "./components/ChatMessage";
export { default as ChatComposer } from "./components/ChatComposer";
export { default as ChatHeader } from "./components/ChatHeader";
export { default as EmptyChat } from "./components/EmptyChat";
export { default as InternalNoteBadge } from "./components/InternalNoteBadge";

export { useTicketChat } from "./hooks/useTicketChat";
export { useHelpdeskChatViewer } from "./hooks/useHelpdeskChatViewer";

export { ticketChatSocket } from "./services/ticketChat.socket";
export { resolveSocketIoUrl, resolveSocketIoPath } from "./config/socketConnection";
export { buildParticipants } from "./utils/buildParticipants";
export {
  dedupeMessages,
  filterVisibleMessages,
  isSystemMessage,
} from "./utils/chatMessage.utils";

export type {
  TicketComment,
  TicketParticipant,
  SendMessagePayload,
  EditMessagePayload,
  SocketErrorPayload,
} from "./types/ticketChat.types";

export type { TicketParticipantsSource } from "./utils/buildParticipants";
