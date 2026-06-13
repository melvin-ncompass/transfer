import { io, type Socket } from "socket.io-client";
import { resolveSocketIoPath, resolveSocketIoUrl } from "../config/socketConnection";
import type {
  EditMessagePayload,
  SendMessagePayload,
  SocketErrorPayload,
  TicketComment,
} from "../types/ticketChat.types";

type EventHandler = (...args: unknown[]) => void;
type ConnectionListener = (connected: boolean) => void;

class TicketChatSocketService {
  private socket: Socket | null = null;
  private apiBaseUrl = "";
  private accessToken = "";
  private ticketId = "";
  private readonly handlerRegistry = new Map<string, EventHandler>();
  private readonly connectionListeners = new Set<ConnectionListener>();
  private readonly internalHandlers = new Map<string, EventHandler>();

  private notifyConnection(connected: boolean) {
    this.connectionListeners.forEach((listener) => listener(connected));
  }

  private bindInternal(event: string, handler: EventHandler) {
    if (!this.socket) return;
    const existing = this.internalHandlers.get(event);
    if (existing) this.socket.off(event, existing);
    this.internalHandlers.set(event, handler);
    this.socket.on(event, handler);
  }

  private clearInternalHandlers() {
    if (!this.socket) return;
    this.internalHandlers.forEach((handler, event) => {
      this.socket?.off(event, handler);
    });
    this.internalHandlers.clear();
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    listener(this.socket?.connected ?? false);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  connect(
    _apiBaseUrl: string,
    accessToken: string,
    ticketId: string,
    companyId: string,
  ): Socket {
    this.disconnect();

    const socketUrl = resolveSocketIoUrl();
    this.apiBaseUrl = socketUrl;
    this.accessToken = accessToken;
    this.ticketId = ticketId;

    const bearer = `Bearer ${accessToken}`;

    // Polling first: Authorization + cookies apply on the initial XHR handshake.
    this.socket = io(socketUrl, {
      path: resolveSocketIoPath(),
      transports: ["polling", "websocket"],
      withCredentials: true,
      auth: {
        token: accessToken,
        authorization: bearer,
        companyId,
      },
      extraHeaders: {
        Authorization: bearer,
      },
      query: {
        ticketId: String(ticketId),
        companyId,
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.bindInternal("connect", () => this.notifyConnection(true));
    this.bindInternal("disconnect", () => this.notifyConnection(false));

    return this.socket;
  }

  disconnect(): void {
    if (!this.socket) return;

    this.handlerRegistry.forEach((handler, event) => {
      this.socket?.off(event, handler);
    });
    this.handlerRegistry.clear();
    this.clearInternalHandlers();
    this.socket.disconnect();
    this.socket = null;
    this.notifyConnection(false);
  }

  reconnect(
    newTicketId?: string,
    newAccessToken?: string,
    companyId?: string,
  ): Socket | null {
    const ticketId = newTicketId ?? this.ticketId;
    const token = newAccessToken ?? this.accessToken;

    if (!ticketId || !token || !this.apiBaseUrl || !companyId) {
      return null;
    }

    return this.connect(this.apiBaseUrl, token, ticketId, companyId);
  }

  on(event: string, handler: EventHandler): void {
    if (!this.socket) return;

    const wrapped = handler;
    const existing = this.handlerRegistry.get(event);
    if (existing) {
      this.socket.off(event, existing);
    }

    this.handlerRegistry.set(event, wrapped);
    this.socket.on(event, wrapped);
  }

  off(event: string): void {
    const handler = this.handlerRegistry.get(event);
    if (this.socket && handler) {
      this.socket.off(event, handler);
      this.handlerRegistry.delete(event);
    }
  }

  sendMessage(payload: SendMessagePayload): void {
    console.log(payload)
    this.socket?.emit("sendMessage", payload);
  }

  editMessage(payload: EditMessagePayload): void {
    this.socket?.emit("editMessage", payload);
  }

  joinTicket(ticketId: string): void {
    this.socket?.emit("joinTicket", ticketId);
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getTicketId(): string {
    return this.ticketId;
  }
}

export const ticketChatSocket = new TicketChatSocketService();

export type {
  TicketComment,
  SendMessagePayload,
  EditMessagePayload,
  SocketErrorPayload,
};
