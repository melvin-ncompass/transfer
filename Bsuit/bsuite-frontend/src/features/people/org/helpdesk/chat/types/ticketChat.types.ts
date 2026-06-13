export interface TicketComment {
  id?: string;
  ticketId: string;
  companyId: string;
  employeeAuthorId?: number;
  adminAuthorId?: number;
  authorName: string;
  message: string;
  isInternal: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketParticipant {
  id: number;
  username: string;
}

export interface SendMessagePayload {
  ticketId: string;
  message: string;
  isInternal?: boolean;
  ticketNumber?: string;
  participants?: TicketParticipant[];
}

export interface EditMessagePayload {
  messageId: string;
  ticketId: string;
  newMessage: string;
}

export interface SocketErrorPayload {
  message: string;
}

export type TicketChatServerEvent =
  | "loadHistory"
  | "receiveMessage"
  | "messageUpdated"
  | "error";

export type TicketChatClientEvent = "sendMessage" | "editMessage" | "joinTicket";
