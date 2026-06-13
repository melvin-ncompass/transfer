export interface TicketPerson {
  id?: number;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  employeeId?: string | null;
  user?: {
    id?: number;
    username?: string;
  };
  contact?: {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface TicketSlaSummary {
  responseDueAt?: string | null;
  resolutionDueAt?: string | null;
  actualResolutionAt?: string | null;
  responseBreached?: boolean;
  resolutionBreached?: boolean;
  isPaused?: boolean;
  lastPausedAt?: string | null;
  totalPausedMinutes?: number;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  subject: string;
  description: string;

  requester?: TicketPerson;
  assignee?: TicketPerson | null;

  category?: {
    id: number;
    categoryName: string;
  };

  priority?: {
    id: number;
    name: string;
    color?: string | null;
  };

  status?: {
    id: number;
    name: string;
    slug: string;
  };

  isConfidential?: boolean;
  isFollowing?: boolean;
  followers?: TicketPerson[];
  createdAt?: string;
  updatedAt?: string;
  SLA?: TicketSlaSummary | null;
  sla?: TicketSlaSummary | null;
  ticketSla?: TicketSlaSummary | null;
}

export interface CreateTicketPayload {
  ticketNumber?: string;
  requesterId: number;
  subject: string;
  description?: string;
  categoryId: number;
  priorityId: number;
  statusId?: number;

  assigneeId?: number;
  isConfidential?: boolean;
  closureId?: number;
  followerIds?: number[];

  slaId?: number;
}

export type UpdateTicketPayload = Partial<CreateTicketPayload>;

export interface CloseTicketPayload {
  reasonId: number;
  message: string;
}

export interface ReopenTicketPayload {
  message: string;
}

export interface AssignTicketPayload {
  assigneeId: number;
}

export interface BulkAssignTicketPayload {
  ticketIds: number[];
  assigneeId: number;
}

export interface RequestReassignmentPayload {
  reason: string;
}

export interface UpdateTicketPriorityPayload {
  priorityId: number;
}

export interface UpdateTicketStatusPayload {
  statusId: number;
}

export interface SetTicketConfidentialPayload {
  isConfidential?: boolean;
}

export interface RejectAndCancelPayload {
  reason: string;
}

export interface RejectAndReassignPayload {
  reason: string;
}

export interface TicketResponse {
  data: Ticket;
  message?: string;
  change_of_data?: unknown;
}

export interface TicketLifecycleResponse {
  id?: number;
  ticketNumber?: string;
  status?: string;
  closureId?: number;
  data?: Ticket;
  message?: string;
  change_of_data?: unknown;
}

export interface BulkAssignTicketResponse {
  message: string;
  assigneeName?: string;
}

export interface TicketListResponse {
  data: Ticket[];
  message?: string;
}
