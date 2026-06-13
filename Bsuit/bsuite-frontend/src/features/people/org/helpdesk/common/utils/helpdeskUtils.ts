import type { TicketPerson, TicketSlaSummary } from "../../api/ticket.types";

export const getBackendMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") return fallback;
  const err = error as {
    data?: { message?: string };
    error?: string;
    message?: string;
  };
  return err.data?.message ?? err.error ?? err.message ?? fallback;
};

export const getPersonDisplayName = (
  person?: TicketPerson | null,
): string => {
  if (!person) return "—";
  const contact = person.contact;
  if (contact?.name?.trim()) return contact.name.trim();
  const contactParts = [contact?.firstName, contact?.lastName]
    .filter((x) => x != null && String(x).trim() !== "")
    .map(String);
  if (contactParts.length) return contactParts.join(" ").trim();
  if (person.name?.trim()) return person.name.trim();
  const full = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  if (full) return full;
  if (person.employeeId?.trim()) return person.employeeId.trim();
  return "—";
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export const getTicketSla = (ticket: {
  SLA?: TicketSlaSummary | null;
  sla?: TicketSlaSummary | null;
  ticketSla?: TicketSlaSummary | null;
}): TicketSlaSummary | null =>
  ticket.SLA ?? ticket.ticketSla ?? ticket.sla ?? null;

export const getSlaStatusLabel = (sla: TicketSlaSummary | null): string => {
  if (!sla) return "—";
  if (sla.responseBreached || sla.resolutionBreached) {
    return "Breached";
  }
  if (sla.responseDueAt || sla.resolutionDueAt) {
    return "On track";
  }
  return "—";
};
