const CHANNEL_NAME = "bsuite-current-company";
const LS_KEY = "bsuite_current_company_sync";
const TAB_STORAGE_KEY = "bsuite_tab_instance_id";

type CompanyChangedMessage = {
  type: "companyChanged";
  companyId: string;
  ts: number;
  senderTabId: string;
};

export type CompanyChangedMeta = {
  /** False when this tab sent the message (e.g. user switched company here). */
  fromForeignTab: boolean;
};

let sharedChannel: BroadcastChannel | null = null;

/** Stable id per browser tab (sessionStorage), used to ignore own BroadcastChannel messages for navigation. */
export function getTabInstanceId(): string {
  try {
    let id = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      sessionStorage.setItem(TAB_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "fallback-tab";
  }
}

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!sharedChannel) {
    sharedChannel = new BroadcastChannel(CHANNEL_NAME);
  }
  return sharedChannel;
}

/** Notify other tabs that the active company changed (cookie + server context updated). */
export function notifyCompanyChanged(companyId: string): void {
  const payload: CompanyChangedMessage = {
    type: "companyChanged",
    companyId,
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

function parseMessage(data: unknown): CompanyChangedMessage | null {
  if (!data || typeof data !== "object") return null;
  const m = data as Record<string, unknown>;
  if (m.type !== "companyChanged") return null;
  if (typeof m.companyId !== "string") return null;
  if (typeof m.senderTabId !== "string") return null;
  return data as CompanyChangedMessage;
}

/** Subscribe to company changes from other tabs (or same tab via BroadcastChannel). Returns unsubscribe. */
export function subscribeCompanyChanged(
  handler: (companyId: string, meta: CompanyChangedMeta) => void,
): () => void {
  const ch = getBroadcastChannel();
  if (ch) {
    const onMessage = (ev: MessageEvent) => {
      const msg = parseMessage(ev.data);
      if (!msg) return;
      const fromForeignTab = msg.senderTabId !== getTabInstanceId();
      handler(msg.companyId, { fromForeignTab });
    };
    ch.addEventListener("message", onMessage);
    return () => ch.removeEventListener("message", onMessage);
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key !== LS_KEY || !e.newValue) return;
    try {
      const msg = parseMessage(JSON.parse(e.newValue));
      if (!msg) return;
      // storage event only fires in other tabs — always foreign
      handler(msg.companyId, { fromForeignTab: true });
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
