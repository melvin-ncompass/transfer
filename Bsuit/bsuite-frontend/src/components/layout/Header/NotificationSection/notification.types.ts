export interface RawNotification {
  id: string;
  timestamp: string;
  subject: string;
  feature: string;
  redirection_id: number | string | null;
  actionRequired: boolean;
  wasActionTaken: boolean;
  isRead: boolean;
  folderId?: number | null;
  documentTypeId?: number | null;
  documentId?: number | null;
  employeeId?: number | null;
}

export interface NormalizedNotification {
  id: string;
  title: string;
  type: "success" | "error" | "info" | "warning";
  timestamp: string;
  read: boolean;
  feature: string;
  redirectionId: number | string | null;
  actionRequired: boolean;
  wasActionTaken: boolean;
  folderId: number | null;
  documentTypeId: number | null;
  documentId: number | null;
  employeeId: number | null;
}

export interface GroupedNotifications {
  today: NormalizedNotification[];
  yesterday: NormalizedNotification[];
  older: NormalizedNotification[];
}

export const EMPTY_GROUPED: GroupedNotifications = {
  today: [],
  yesterday: [],
  older: [],
};

export function mapSection(items: RawNotification[]): NormalizedNotification[] {
  return items.map((item) => ({
    id: item.id,
    title: item.subject,
    type: "info" as const,
    timestamp: item.timestamp,
    read: item.isRead,
    feature: item.feature ?? "",
    redirectionId: item.redirection_id ?? null,
    actionRequired: item.actionRequired ?? false,
    wasActionTaken: item.wasActionTaken ?? false,
    folderId: item.folderId ?? null,
    documentTypeId: item.documentTypeId ?? null,
    documentId: item.documentId ?? null,
    employeeId: item.employeeId ?? null,
  }));
}

export function toGrouped(grouped: {
  today?: RawNotification[];
  yesterday?: RawNotification[];
  older?: RawNotification[];
}): GroupedNotifications {
  return {
    today: mapSection(grouped?.today ?? []),
    yesterday: mapSection(grouped?.yesterday ?? []),
    older: mapSection(grouped?.older ?? []),
  };
}

export function toggleReadInGrouped(
  grouped: GroupedNotifications,
  id: string,
  read: boolean,
): GroupedNotifications {
  const mark = (items: NormalizedNotification[]) =>
    items.map((n) => (n.id === id ? { ...n, read } : n));

  return {
    today: mark(grouped.today),
    yesterday: mark(grouped.yesterday),
    older: mark(grouped.older),
  };
}

export function markReadInGrouped(
  grouped: GroupedNotifications,
  id: string,
): GroupedNotifications {
  return toggleReadInGrouped(grouped, id, true);
}

export function markAllReadInGrouped(
  grouped: GroupedNotifications,
): GroupedNotifications {
  const mark = (items: NormalizedNotification[]) =>
    items.map((n) => ({ ...n, read: true }));

  return {
    today: mark(grouped.today),
    yesterday: mark(grouped.yesterday),
    older: mark(grouped.older),
  };
}

/** Composite pagination cursor `[timestamp, id]` from the notification API. */
export type NotificationCursor = (string | number)[];

/**
 * Normalizes cursor values for GET /notification?cursor=...
 * Accepts `[1779195159437,626]`, `"1779780929159,980"`, or JSON string arrays.
 */
export function normalizeNotificationCursor(
  cursor: NotificationCursor | string | undefined | null,
): NotificationCursor | undefined {
  if (cursor == null) return undefined;

  if (Array.isArray(cursor)) {
    return cursor.length > 0 ? cursor : undefined;
  }

  if (typeof cursor !== "string") return undefined;

  const trimmed = cursor.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as NotificationCursor;
      }
    } catch {
      /* fall through */
    }
  }

  const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return undefined;

  return parts.map((part) => {
    const num = Number(part);
    return Number.isFinite(num) ? num : part;
  });
}

/** Serializes cursor for the `cursor` query param (always a JSON array). */
export function serializeNotificationCursorParam(
  cursor: NotificationCursor | string | undefined | null,
): string | undefined {
  const normalized = normalizeNotificationCursor(cursor);
  if (!normalized) return undefined;
  return JSON.stringify(normalized);
}
