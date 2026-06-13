import type { TicketParticipant } from "../types/ticketChat.types";

export interface ParticipantUserRef {
  id?: number;
  username?: string;
}

export interface ParticipantPersonRef {
  id?: number;
  username?: string;
  user?: ParticipantUserRef;
}

export interface TicketParticipantsSource {
  requester?: ParticipantPersonRef | null;
  assignee?: ParticipantPersonRef | null;
  followers?: Array<{ user?: ParticipantUserRef }>;
}

function resolveParticipant(
  person?: ParticipantPersonRef | null,
): TicketParticipant | null {
  if (!person) return null;

  const user = person.user ?? person;
  const id = user.id ?? person.id;
  if (id == null || Number.isNaN(Number(id))) return null;

  const username =
    user.username?.trim() ||
    person.username?.trim() ||
    `user-${id}`;

  return { id: Number(id), username };
}

export function buildParticipants(
  ticket: TicketParticipantsSource,
): TicketParticipant[] {
  const candidates: TicketParticipant[] = [];

  const requester = resolveParticipant(ticket.requester);
  if (requester) candidates.push(requester);

  const assignee = resolveParticipant(ticket.assignee);
  if (assignee) candidates.push(assignee);

  for (const follower of ticket.followers ?? []) {
    const participant = resolveParticipant(follower.user ?? follower);
    if (participant) candidates.push(participant);
  }

  const seen = new Set<number>();
  return candidates.filter((participant) => {
    if (seen.has(participant.id)) return false;
    seen.add(participant.id);
    return true;
  });
}
