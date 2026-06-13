# Helpdesk Frontend API Documentation

This document is intended for frontend developers implementing the helpdesk module UI.
It describes the available API endpoints, request/response contracts, and recommended UI flows.

> Note: All helpdesk endpoints are protected by authentication and company scoping. The frontend should send a valid JWT in `Authorization: Bearer <token>` and preserve any company/session cookie behavior required by the backend.

---

## Summary

The helpdesk module supports:
- Ticket creation, listing, viewing, and lifecycle actions
- Ticket categories, priorities, and statuses
- SLA mappings and ticket SLA assignments
- Ticket feedback and closure handling
- Business hour policies
- Canned responses
- Escalation rules
- Ticket history and report endpoints

Most endpoints return either:
- `{ data: ..., message: ... }`
- `{ data: ... }`
- raw entity objects

---

## Common Request Requirements

- Header: `Authorization: Bearer <jwt-token>`
- Content-Type: `application/json`
- Company guard is active for almost all routes, so session and company cookies must be preserved if used.

---

## Tickets

### Base route
`/tickets`

### Endpoints

#### `POST /tickets`
Create a new ticket.

Body schema:
```json
{
  "ticketNumber": "string",
  "requesterId": 123,
  "subject": "string",
  "description": "string",
  "categoryId": 1,
  "priorityId": 2,
  "statusId": 1,
  "assigneeId": 5,            // optional
  "isConfidential": true,     // optional
  "closureId": 3,             // optional
  "slaId": 0,                 // required in DTO, but backend currently ignores this value
  "followerIds": [2, 4]       // optional
}
```

Important:
- The backend auto-creates the SLA record based on the selected `categoryId` and `priorityId`.
- `slaId` is currently still required by the request DTO validation, but the ticket creation code does not use it.
- If there is no SLA mapping for the selected category/priority pair, request creation will fail.

Response:
- Typically returns `{ data: {...ticket object...}, change_of_data: {...} }`

#### `GET /tickets`
Fetch all tickets.

Response:
- `{ data: [ ...tickets... ], message: "Tickets fetched" }`

#### `GET /tickets/me`
Fetch tickets requested by the current user.

#### `GET /tickets/assigned/me`
Fetch tickets assigned to the current user.

#### `GET /tickets/:id`
Fetch detailed ticket information.

Response:
- `{ data: {...ticket object...}, message: "Ticket details fetched" }`

#### `PATCH /tickets/:id`
Update a ticket with partial payload.
- Body can be a partial `CreateTicketDto`.

#### `PATCH /tickets/:id/accept`
Accept a ticket for the current user.

#### `PATCH /tickets/:id/request-reassignment`
Request a reassignment for a ticket.
Body:
```json
{ "reason": "string" }
```

#### `PATCH /tickets/:id/assign`
Assign a ticket to a user.
Body: `AssignTicketDto` (ticket assignment payload).

#### `PATCH /tickets/:id/reopen`
Reopen a ticket.
Body:
```json
{ "message": "string" }
```

#### `PATCH /tickets/:id/close`
Close a ticket.
Body:
```json
{ "reasonId": 2, "message": "string" }
```

#### `PATCH /tickets/:id/hold`
Put a ticket on hold.

#### `PATCH /tickets/:id/resume`
Resume a held ticket.

#### `PATCH /tickets/:id/confidential`
Mark a ticket confidential.

#### `PATCH /tickets/:id/follow`
Follow a ticket as the current user.

#### `PATCH /tickets/:id/unfollow`
Unfollow a ticket.

#### `DELETE /tickets/:id`
Delete a ticket.

---

## Ticket Categories

### Base route
`/ticket_category`

### Endpoints

#### `GET /ticket_category`
List all ticket categories.

#### `GET /ticket_category/:id`
Get a single category.

#### `POST /ticket_category`
Create a category.
Request body example:
```json
{
  "categoryName": "IT Support",
  "description": "Hardware and software help",
  "isSubCategory": false,
  "parentId": null,
  "members": [10, 11],
  "categoryLead": 9,
  "defaultPriority": 1,
  "businessHourPolicyId": 2,
  "isActive": true
}
```

#### `PATCH /ticket_category/:id`
Update a category.
Request body can be partial.

#### `DELETE /ticket_category/:id`
Soft-delete a category.

### Suggestion for FE
- Use category list for ticket creation filter.
- Include category lead and business hour policy data when available.

---

## Ticket Priority

### Base route
`/ticket-priority`

### Endpoints

#### `GET /ticket-priority`
List all priorities.

Priority object shape:
```json
{
  "id": 1,
  "name": "High",
  "level": 3,
  "color": "#f44336"
}
```

---

## Ticket Status

### Base route
`/ticket-status`

### Endpoints

#### `GET /ticket-status`
List all ticket statuses.

#### `GET /ticket-status/:id`
Get a single status.

#### `PATCH /ticket-status/:id`
Update a status.

Status slugs include:
- `open`
- `assigned`
- `reopened`
- `closed`
- `in_progress`
- `on_hold`
- `resolved`

---

## SLA Mapping

### Base route
`/sla-mapping`

### Endpoints

#### `GET /sla-mapping`
List all SLA category-priority mappings.

#### `GET /sla-mapping/:id`
Get mapping details.

#### `POST /sla-mapping`
Create mapping.
Request body:
```json
{
  "categoryId": 1,
  "priorityId": 2,
  "defaultResponseTimeMinutes": 30,
  "defaultResolutionTimeMinutes": 120
}
```

#### `PATCH /sla-mapping/:id`
Update mapping.
Payload may contain any subset of the same fields.

#### `DELETE /sla-mapping/:id`
Delete mapping.

### SLA mapping object shape
```json
{
  "id": 1,
  "category": { "id": 1, "categoryName": "IT Support" },
  "priority": { "id": 2, "name": "High" },
  "defaultResponseTimeMinutes": 30,
  "defaultResolutionTimeMinutes": 120,
  "createdAt": "2026-05-17T..."
}
```

### FE usage
- Use this data to populate SLA table and create/edit forms.
- Use category + priority selection to determine SLA behavior when creating new tickets.

---

## Ticket SLA

### Base route
`/ticket-sla`

### Endpoints

#### `GET /ticket-sla`
List all ticket SLA records.

#### `GET /ticket-sla/:id`
Get a ticket SLA by ID.

#### `POST /ticket-sla`
Create a ticket SLA record.
Request body:
```json
{
  "ticketId": 123,
  "slaMappingId": 1
}
```

#### `PATCH /ticket-sla/:id`
Update a ticket SLA record.
Partial fields are accepted.

#### `DELETE /ticket-sla/:id`
Delete a ticket SLA record.

### Ticket SLA object shape
```json
{
  "id": 10,
  "ticket": { "id": 123, "title": "Password reset" },
  "slaMapping": {
    "id": 1,
    "category": { "categoryName": "IT Support" },
    "priority": { "name": "High" }
  },
  "actualResponseAt": "2026-05-18T...",
  "actualResolutionAt": null,
  "responseDueAt": "2026-05-18T...",
  "resolutionDueAt": "2026-05-19T...",
  "responseBreached": false,
  "resolutionBreached": false,
  "lastPausedAt": null,
  "createdAt": "2026-05-17T..."
}
```

### FE usage
- Primary use case: show SLA details on ticket view.
- Most tickets are created with SLA auto-generated from category/priority mapping, so this endpoint is mainly for explicit SLA management or admin overrides.

---

## Ticket Closing Reasons and Closure

### Closing Reasons
Base route: `/ticket_closing_reason`

#### `GET /ticket_closing_reason`
List closing reasons.

#### `GET /ticket_closing_reason/:id`
Get a single closing reason.

#### `POST /ticket_closing_reason`
Create a closing reason.

#### `PATCH /ticket_closing_reason/:id`
Update a closing reason.

#### `DELETE /ticket_closing_reason/:id`
Delete a closing reason.

### Ticket Closure
Base route: `/ticket_closure`

#### `POST /ticket_closure/:ticketId`
Create a closure record for a ticket.

#### `GET /ticket_closure/:ticketId`
Get closure info for a ticket.

#### `GET /ticket_closure`
List all closures.

#### `PATCH /ticket_closure/:ticketId`
Update ticket closure.

#### `DELETE /ticket_closure/:ticketId`
Delete ticket closure.

---

## Ticket Feedback

### Base route
`/ticket_feedback`

### Endpoints

#### `POST /ticket_feedback/:ticketId`
Add feedback for a ticket.

#### `PATCH /ticket_feedback/:id`
Update feedback.

#### `DELETE /ticket_feedback/:id`
Delete feedback.

---

## Business Hour Policies

### Base route
`/business-hour-policies`

### Endpoints

#### `POST /business-hour-policies`
Create a business hour policy.

#### `GET /business-hour-policies`
List all policies.

#### `GET /business-hour-policies/:id`
Get a policy by ID.

#### `PATCH /business-hour-policies/:id`
Update a policy.

#### `DELETE /business-hour-policies/:id`
Delete a policy.

### FE usage
- Business hours are used when the backend calculates SLA due dates.
- Ensure category and SLA mapping screens can expose the chosen business hour policy.

---

## Canned Responses

### Base route
`/canned-responses`

### Endpoints

#### `GET /canned-responses`
List all canned responses.

#### `GET /canned-responses/:id`
Get a canned response.

#### `POST /canned-responses`
Create a canned response.

#### `PATCH /canned-responses/:id`
Update a canned response.

#### `PATCH /canned-responses/:id/toggle-active`
Toggle active status.

#### `PATCH /canned-responses/:id/toggle-internal`
Toggle internal visibility.

#### `DELETE /canned-responses/:id`
Delete a canned response.

---

## Escalation Rules

### Base route
`/escalation-rules`

### Endpoints

#### `GET /escalation-rules`
List escalation rules.
Optional query param: `categoryId`.

#### `POST /escalation-rules`
Create a rule.

#### `PATCH /escalation-rules/:id`
Update a rule.

#### `DELETE /escalation-rules/:id`
Delete a rule.

---

## Ticket History

### Base route
`/ticket_history/:id`

#### `GET /ticket_history/:id`
Fetch ticket history for the given ticket ID.

> Note: this request also relies on company context via cookies or session.

---

## Helpdesk Reports

### Base route
`/helpdesk/reports`

### Endpoints

- `GET /helpdesk/reports/all-tickets?start=<date>&end=<date>`
- `GET /helpdesk/reports/closed-tickets?start=<date>&end=<date>`
- `GET /helpdesk/reports/aggregates-by-category`
- `GET /helpdesk/reports/aggregates-by-assignee`
- `GET /helpdesk/reports/monthly-trends`
- `GET /helpdesk/reports/avg-first-response`
- `GET /helpdesk/reports/avg-resolution-time`
- `GET /helpdesk/reports/on-hold-stats`

### FE usage
- Use these endpoints for dashboards and SLA performance reports.
- `start` and `end` must be passed as query parameters in ISO date format.

---

## Recommended UI Pages / Screens

### 1. Helpdesk Dashboard
- Summary stats: total tickets, open tickets, breached SLAs, average response/resolution times.
- Quick links to SLA management, ticket list, reports.

### 2. Ticket List
- Columns: ticket number, subject, requester, assignee, category, priority, status, due dates, SLA breach indicators.
- Actions: view, assign, accept, hold/resume, close, follow/unfollow.

### 3. Ticket Detail
- Ticket metadata and full description.
- SLA summary: mapping, due dates, response/resolution breach flags.
- History feed from `/ticket_history/:id`.
- Feedback section.
- Closure section.

### 4. Create / Edit Ticket
- Required fields:
  - `ticketNumber`
  - `requesterId`
  - `subject`
  - `description`
  - `categoryId`
  - `priorityId`
  - `statusId`
  - `slaId` (required in request body but backend auto-generates SLA from category/priority)
- Optional fields: `assigneeId`, `isConfidential`, `closureId`, `followerIds`
- Provide dropdowns for category, priority, status, assignee, closure reason, follower selection.
- When category + priority change, frontend should either auto-select the matching SLA mapping or show a warning if no mapping exists.

### 5. SLA Mapping Management
- Table of existing mappings.
- Create / edit form with category and priority dropdowns.
- Response/resolution time fields in minutes.
- Prevent duplicate category+priority combinations on the UI.

### 6. Ticket SLA Summary / Management
- Show ticket-level SLA details from `/ticket-sla` or ticket detail payload.
- Support manual creation/edit of a ticket SLA record if needed.

### 7. Category / Priority / Status Settings
- Category list and metadata.
- Priority list and color/level display.
- Status list and selection.

### 8. Business Hour Policy Settings
- Policy management UI for business hour definitions.
- Used for SLA deadline calculations.

### 9. Canned Responses
- List, create, update, toggle active/internal.
- Useful for ticket comments and agent replies.

### 10. Reports
- Display report cards and charts for SLA health, ticket trends, category aggregates, and response/resolution metrics.

---

## Important Notes for Frontend Implementation

- `slaId` is required by the `CreateTicketDto` validation but the ticket creation flow currently derives SLA from `categoryId` + `priorityId` and auto-creates the `TicketSLA` record.
- Ensure `categoryId` and `priorityId` are valid and mapped in `/sla-mapping` before ticket creation.
- The backend uses business hours when computing SLA deadlines, so UI screens should expose the selected business hour policy where applicable.
- Many endpoints return `data` inside an object. Always inspect the response shape before rendering.
- Most routes are guarded and may require valid cookies / company session context in addition to JWT.

---

## Example FE API Flow

1. Load lookup data:
   - `GET /ticket_category`
   - `GET /ticket-priority`
   - `GET /ticket-status`
   - `GET /sla-mapping`
   - `GET /ticket_closing_reason`
   - `GET /canned-responses`

2. Create SLA mapping if needed:
   - `POST /sla-mapping`

3. Create a ticket:
   - `POST /tickets`
   - Required: categoryId, priorityId, statusId, requesterId, slaId

4. Use ticket lifecycle actions:
   - `PATCH /tickets/:id/accept`
   - `PATCH /tickets/:id/assign`
   - `PATCH /tickets/:id/close`
   - `PATCH /tickets/:id/hold`
   - `PATCH /tickets/:id/resume`

5. Show SLA and history:
   - `GET /ticket-sla`
   - `GET /ticket_history/:id`

6. Report and dashboard data:
   - `GET /helpdesk/reports/aggregates-by-category`
   - `GET /helpdesk/reports/avg-first-response`

---

## Recommended FE Data Contracts

### Category item
```ts
interface TicketCategory {
  id: number;
  categoryName: string;
  description?: string;
  isSubCategory?: boolean;
  parentId?: number | null;
  members: number[];
  categoryLead: number;
  defaultPriority: number;
  businessHourPolicyId?: number;
  isActive?: boolean;
}
```

### Priority item
```ts
interface TicketPriority {
  id: number;
  name: string;
  level: number;
  color: string | null;
}
```

### Ticket status item
```ts
interface TicketStatus {
  id: number;
  name: string;
  slug: string;
  description?: string;
  order: number;
}
```

### SLA mapping item
```ts
interface SLACategoryMapping {
  id: number;
  category: { id: number; categoryName: string };
  priority: { id: number; name: string };
  defaultResponseTimeMinutes: number;
  defaultResolutionTimeMinutes: number;
  createdAt: string;
}
```

### Ticket SLA item
```ts
interface TicketSLA {
  id: number;
  ticket: { id: number; title: string };
  slaMapping: SLACategoryMapping | null;
  actualResponseAt: string | null;
  actualResolutionAt: string | null;
  responseDueAt: string | null;
  resolutionDueAt: string | null;
  responseBreached: boolean;
  resolutionBreached: boolean;
  lastPausedAt: string | null;
  createdAt: string;
}
```

---

## Contact / Next Step
If you need additional backend fields, extra endpoints, or clarification on SLA business rules, please ask the backend owner before implementing the UI.
integrate with proper ui and use of atom components 
if a module is already implemented dont edit it
