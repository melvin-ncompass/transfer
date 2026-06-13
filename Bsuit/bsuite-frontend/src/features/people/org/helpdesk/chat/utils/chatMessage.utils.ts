import type { TicketComment } from "../types/ticketChat.types";

const SYSTEM_MESSAGE_PREFIXES = [
  "Ticket closed:",
  "Ticket Reopened:",
  "Reassignment Requested:",
] as const;

export function isSystemMessage(message: string): boolean {
  const trimmed = message.trim();
  return SYSTEM_MESSAGE_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

export function getMessageKey(comment: TicketComment): string {
  if (comment.id) return comment.id;
  return `${comment.createdAt}-${comment.authorName}-${comment.message}`;
}

export function dedupeMessages(comments: TicketComment[]): TicketComment[] {
  const byKey = new Map<string, TicketComment>();

  for (const comment of comments) {
    byKey.set(getMessageKey(comment), comment);
  }

  return [...byKey.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function filterVisibleMessages(
  comments: TicketComment[],
  canViewInternalNotes: boolean,
): TicketComment[] {
  if (canViewInternalNotes) return comments;
  return comments.filter((comment) => !comment.isInternal);
}
