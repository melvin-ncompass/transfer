import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchEventSource,
  EventStreamContentType,
} from "@microsoft/fetch-event-source";
import { useAppSelector } from "../../../../store/store";
import {
  emitFeedActivity,
  isAnnouncementsStreamPayload,
  type FeedActivityPayload,
} from "../../../../features/people/home/PostPollsPraise/feedActivityBus";
import type { NormalizedNotification } from "./notification.types";

const BASE = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, "");
const SSE_URL = `${BASE}/notification-v2/stream`;

const MAX_RETRY_DELAY_MS = 30_000;

class FatalSSEError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FatalSSEError";
  }
}

interface SseNotificationFields {
  id?: string;
  timestamp?: string;
  subject?: string;
  feature?: string;
  redirection_id?: number | string | null;
  actionRequired?: boolean;
  wasActionTaken?: boolean;
  isRead?: boolean;
  folderId?: number | null;
  documentTypeId?: number | null;
  documentId?: number | null;
  employeeId?: number | null;
}

interface SsePayload extends SseNotificationFields {
  message?: string;
  count?: number;
  payloadType?: string;
  notification?: SseNotificationFields;
  action?: string;
  type?: string;
  companyId?: string;
  users?: unknown;
  targetId?: number;
  userId?: number;
  optionId?: number;
  voteCount?: number;
  post?: { id: number };
  poll?: { id: number };
  praise?: { id: number };
}

interface UseNotificationSSEReturn {
  unreadCount: number | null;
  decrementCount: () => void;
  incrementCount: () => void;
  resetCount: () => void;
  toastNotif: NormalizedNotification | null;
  clearToastNotif: () => void;
}

function parseSseData(raw: string): SsePayload | null {
  try {
    return JSON.parse(raw) as SsePayload;
  } catch {
    return null;
  }
}

function extractStreamNotification(
  payload: SsePayload,
): NormalizedNotification | null {
  const raw: SseNotificationFields = payload.notification ?? payload;
  if (!raw.subject) return null;

  const id = raw.id
    ? String(raw.id)
    : `sse-${raw.redirection_id ?? "n"}-${raw.timestamp ?? Date.now()}`;

  return {
    id,
    title: raw.subject,
    type: "info",
    timestamp: raw.timestamp ?? new Date().toISOString(),
    read: raw.isRead ?? false,
    feature: raw.feature ?? "",
    redirectionId: raw.redirection_id ?? null,
    actionRequired: raw.actionRequired ?? false,
    wasActionTaken: raw.wasActionTaken ?? false,
    folderId: raw.folderId ?? null,
    documentTypeId: raw.documentTypeId ?? null,
    documentId: raw.documentId ?? null,
    employeeId: raw.employeeId ?? null,
  };
}

function isNotificationEvent(payload: SsePayload): boolean {
  // Home feed events (payloadType "announcements") are not inbox notifications
  if (isAnnouncementsStreamPayload(payload as FeedActivityPayload)) {
    return false;
  }

  const raw = payload.notification ?? payload;
  return typeof raw.subject === "string" && raw.subject.length > 0;
}

export function useNotificationSSE(
  enabled: boolean,
  companyId?: string,
): UseNotificationSSEReturn {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [toastNotif, setToastNotif] = useState<NormalizedNotification | null>(
    null,
  );

  const retryRef = useRef(0);
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  useEffect(() => {
    if (companyId) {
      setUnreadCount(null);
    }
  }, [companyId]);

  useEffect(() => {
    if (!enabled || !accessToken) return;

    let destroyed = false;
    const controller = new AbortController();

    const nextRetryDelay = () => {
      const delay = Math.min(1000 * 2 ** retryRef.current, MAX_RETRY_DELAY_MS);
      retryRef.current += 1;
      return delay;
    };

    const handlePayload = (payload: SsePayload) => {
      if (payload.type === "heartbeat") return;

      if (typeof payload.count === "number") {
        setUnreadCount(payload.count);
        retryRef.current = 0;
        return;
      }

      if (isAnnouncementsStreamPayload(payload as FeedActivityPayload)) {
        emitFeedActivity(payload as FeedActivityPayload);
      }

      if (!isNotificationEvent(payload)) return;

      const item = extractStreamNotification(payload);
      if (item) {
        setToastNotif(item);
      }

      setUnreadCount((prev) => (prev !== null ? prev + 1 : 1));
    };

    const connect = async () => {
      try {
        await fetchEventSource(SSE_URL, {
          method: "GET",
          signal: controller.signal,
          credentials: "include",
          openWhenHidden: true,
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            Accept: "text/event-stream",
            "Cache-Control": "no-cache",
            ...(companyId ? { "X-Company-Id": companyId } : {}),
          },
          async onopen(response) {
            if (destroyed) {
              controller.abort();
              return;
            }

            if (response.status === 401) {
              throw new FatalSSEError("SSE unauthorized");
            }

            const contentType = response.headers.get("content-type") ?? "";
            if (response.ok && contentType.startsWith(EventStreamContentType)) {
              return;
            }

            if (response.status >= 400 && response.status < 500) {
              throw new FatalSSEError(`SSE failed: ${response.status}`);
            }

            throw new Error(`Unexpected SSE response: ${response.status}`);
          },
          onmessage(ev) {
            if (destroyed || !ev.data) return;
            const payload = parseSseData(ev.data);
            if (payload) handlePayload(payload);
          },
          onclose() {
            if (!destroyed) {
              throw new Error("SSE connection closed");
            }
          },
          onerror(err) {
            if (destroyed || controller.signal.aborted) {
              throw err;
            }
            if (err instanceof FatalSSEError) {
              throw err;
            }
            return nextRetryDelay();
          },
        });
      } catch (err) {
        if (
          err instanceof FatalSSEError ||
          (err instanceof Error && err.name === "AbortError") ||
          controller.signal.aborted ||
          destroyed
        ) {
          return;
        }
      }
    };

    connect();

    return () => {
      destroyed = true;
      controller.abort();
    };
  }, [enabled, accessToken, companyId]);

  const decrementCount = useCallback(() => {
    setUnreadCount((prev) => (prev !== null ? Math.max(0, prev - 1) : 0));
  }, []);

  const incrementCount = useCallback(() => {
    setUnreadCount((prev) => (prev !== null ? prev + 1 : 1));
  }, []);

  const resetCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearToastNotif = useCallback(() => setToastNotif(null), []);

  return {
    unreadCount,
    decrementCount,
    incrementCount,
    resetCount,
    toastNotif,
    clearToastNotif,
  };
}
