import { useCallback, useEffect, useRef, useState } from "react";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { useAppSelector } from "../../../../../../store/store";
import { ticketChatSocket } from "../services/ticketChat.socket";
import type {
  EditMessagePayload,
  SendMessagePayload,
  SocketErrorPayload,
  TicketComment,
  TicketParticipant,
} from "../types/ticketChat.types";
import { dedupeMessages } from "../utils/chatMessage.utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export interface UseTicketChatOptions {
  onError?: (message: string) => void;
}

export function useTicketChat(
  ticketId: number | null,
  ticketNumber?: string,
  participants?: TicketParticipant[],
  options?: UseTicketChatOptions,
) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { data: headerData } = useGetHeaderDataQuery();
  const companyId = headerData?.data?.companyId ?? "";
  const [messages, setMessages] = useState<TicketComment[]>([]);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const ticketIdRef = useRef(ticketId);
  const ticketNumberRef = useRef(ticketNumber);
  const participantsRef = useRef(participants);
  const onErrorRef = useRef(options?.onError);

  ticketIdRef.current = ticketId;
  ticketNumberRef.current = ticketNumber;
  participantsRef.current = participants;
  onErrorRef.current = options?.onError;

  const handleSocketError = useCallback((payload: SocketErrorPayload) => {
    setSending(false);
    const message = payload?.message ?? "Chat connection error";
    onErrorRef.current?.(message);
  }, []);

  const registerChatEventListeners = useCallback(() => {
    ticketChatSocket.on("loadHistory", (...args: unknown[]) => {
      const history = args[0] as TicketComment[] | undefined;
      setMessages(dedupeMessages(Array.isArray(history) ? history : []));
      setHistoryLoaded(true);
      setSending(false);
    });

    ticketChatSocket.on("receiveMessage", (...args: unknown[]) => {
      const comment = args[0] as TicketComment;
      setMessages((prev) => dedupeMessages([...prev, comment]));
      setSending(false);
    });

    ticketChatSocket.on("messageUpdated", (...args: unknown[]) => {
      const comment = args[0] as TicketComment;
      setMessages((prev) =>
        dedupeMessages(
          prev.map((item) =>
            item.id && comment.id && item.id === comment.id ? comment : item,
          ),
        ),
      );
      setSending(false);
    });

    ticketChatSocket.on("error", (...args: unknown[]) => {
      handleSocketError((args[0] as SocketErrorPayload) ?? { message: "Chat error" });
    });
  }, [handleSocketError]);

  const startConnection = useCallback(
    (resolvedTicketId: number, token: string, resolvedCompanyId: string) => {
      setHistoryLoaded(false);
      setMessages([]);

      const socket = ticketChatSocket.connect(
        API_BASE_URL,
        token,
        String(resolvedTicketId),
        resolvedCompanyId,
      );

      registerChatEventListeners();

      socket.off("connect_error");
      socket.on("connect_error", (error: Error & { description?: string; context?: unknown }) => {
        setConnected(false);
        const detail =
          error.description ??
          (typeof error.message === "string" ? error.message : "xhr poll error");
        onErrorRef.current?.(
          detail.includes("xhr poll")
            ? `${detail} — check VITE_SOCKET_USE_PROXY=true in .env and restart Vite, or confirm socket URL/CORS with backend.`
            : detail,
        );
      });
    },
    [registerChatEventListeners],
  );

  const disconnect = useCallback(() => {
    ticketChatSocket.disconnect();
    setConnected(false);
    setSending(false);
    setHistoryLoaded(false);
    setMessages([]);
  }, []);

  useEffect(() => ticketChatSocket.onConnectionChange(setConnected), []);

  useEffect(() => {
    if (!ticketId || !accessToken || !companyId || Number.isNaN(ticketId)) {
      disconnect();
      return;
    }

    startConnection(ticketId, accessToken, companyId);

    return () => {
      disconnect();
    };
  }, [ticketId, accessToken, companyId, startConnection, disconnect]);

  const prevAccessTokenRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (
      prevAccessTokenRef.current &&
      accessToken &&
      prevAccessTokenRef.current !== accessToken &&
      ticketId &&
      companyId &&
      !Number.isNaN(ticketId)
    ) {
      startConnection(ticketId, accessToken, companyId);
    }
    prevAccessTokenRef.current = accessToken;
  }, [accessToken, ticketId, companyId, startConnection]);

  const sendMessage = useCallback((message: string, isInternal = false) => {
    const currentTicketId = ticketIdRef.current;
    const trimmed = message.trim();

    if (!currentTicketId || !trimmed) return;

    setSending(true);

    const payload: SendMessagePayload = {
      ticketId: String(currentTicketId),
      message: trimmed,
      isInternal,
      ticketNumber: ticketNumberRef.current,
      participants: participantsRef.current,
    };

    ticketChatSocket.sendMessage(payload);
  }, []);

  const editMessage = useCallback((messageId: string, newMessage: string) => {
    const currentTicketId = ticketIdRef.current;
    const trimmed = newMessage.trim();

    if (!currentTicketId || !messageId || !trimmed) return;

    setSending(true);

    const payload: EditMessagePayload = {
      messageId,
      ticketId: String(currentTicketId),
      newMessage: trimmed,
    };

    ticketChatSocket.editMessage(payload);
  }, []);

  const reconnect = useCallback(
    (newTicketId?: number | null) => {
      const resolvedTicketId = newTicketId ?? ticketIdRef.current;

      if (!resolvedTicketId || !accessToken || !companyId) {
        disconnect();
        return;
      }

      ticketIdRef.current = resolvedTicketId;
      startConnection(resolvedTicketId, accessToken, companyId);
    },
    [accessToken, companyId, disconnect, startConnection],
  );

  return {
    messages,
    connected,
    sending,
    historyLoaded,
    sendMessage,
    editMessage,
    reconnect,
    socket: ticketChatSocket.getSocket(),
  };
}
