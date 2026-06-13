import { getTabInstanceId } from "../../company/utils/companyCrossTabSync";

/** Set before redirect to Google OAuth; cleared after successful return so other tabs can sync. */
export const OAUTH_LOGIN_PENDING_KEY = "bsuite_oauth_login_pending";

const CHANNEL_NAME = "bsuite-session-replaced";
const LS_KEY = "bsuite_session_replaced_sync";

export type SessionReplacedPayload = {
  type: "sessionReplaced";
  sessionId?: string;
  ts: number;
  senderTabId: string;
};

let sharedChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!sharedChannel) {
    sharedChannel = new BroadcastChannel(CHANNEL_NAME);
  }
  return sharedChannel;
}

/** Call after a successful login so other tabs pick up the new cookie session without a manual refresh. */
export function notifySessionReplaced(sessionId?: string): void {
  const payload: SessionReplacedPayload = {
    type: "sessionReplaced",
    sessionId,
    ts: Date.now(),
    senderTabId: getTabInstanceId(),
  };

  const ch = getBroadcastChannel();
  if (ch) {
    ch.postMessage(payload);
    return;
  }

  try {
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

function parseMessage(data: unknown): SessionReplacedPayload | null {
  if (!data || typeof data !== "object") return null;
  const m = data as Record<string, unknown>;
  if (m.type !== "sessionReplaced") return null;
  if (typeof m.senderTabId !== "string") return null;
  return data as SessionReplacedPayload;
}

export function subscribeSessionReplaced(
  handler: (payload: SessionReplacedPayload) => void,
): () => void {
  const ch = getBroadcastChannel();
  if (ch) {
    const onMessage = (ev: MessageEvent) => {
      const msg = parseMessage(ev.data);
      if (!msg) return;
      handler(msg);
    };
    ch.addEventListener("message", onMessage);
    return () => ch.removeEventListener("message", onMessage);
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key !== LS_KEY || !e.newValue) return;
    try {
      const msg = parseMessage(JSON.parse(e.newValue));
      if (!msg) return;
      handler(msg);
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
