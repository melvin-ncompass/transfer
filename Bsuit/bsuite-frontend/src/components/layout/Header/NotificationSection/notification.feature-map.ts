/**
 * Notification feature → navigation mapping.
 *
 * Edit this file to change where a notification takes the user.
 * Keys are the exact `feature` strings sent by the backend (lowercase).
 *
 * peopleTab  – the ?tab= value on /people/home
 * innerTab   – the index of the sub-tab to open inside the destination page
 * paramKey   – the URL param name used to communicate the innerTab
 */

export interface NotifRouteConfig {
  peopleTab: number;
  innerTab: number;
  paramKey: "approvalTab" | "mainTab";
}

export const NOTIFICATION_FEATURE_MAP: Record<string, NotifRouteConfig> = {
  // ── Approvals (manager/admin view) ──────────────────────────────────────
  leave_request:        { peopleTab: 10, innerTab: 0, paramKey: "approvalTab" },
  regularize_request:   { peopleTab: 10, innerTab: 1, paramKey: "approvalTab" },
  comp_off_request:     { peopleTab: 10, innerTab: 2, paramKey: "approvalTab" },
  /** @deprecated legacy API spelling with a space */
  // "comp off_request":   { peopleTab: 10, innerTab: 2, paramKey: "approvalTab" },

  // ── Me → My requests (employee own history) ─────────────────────────────
  // innerTab 5 = My requests when attendance is enabled
  // (Profile=0, Documents=1, Investment=2, Attendance=3, Leave=4, My requests=5)
  // If your tab order differs, update innerTab here.
  leave_history:        { peopleTab: 3, innerTab: 5, paramKey: "mainTab" },
  regularize_history:   { peopleTab: 3, innerTab: 5, paramKey: "mainTab" },
  comp_off_history:       { peopleTab: 3, innerTab: 5, paramKey: "mainTab" },
  /** Backend spelling for employee comp-off status updates */
  "compoff credit_history": { peopleTab: 3, innerTab: 5, paramKey: "mainTab" },
};

/** Me sidebar tab + Documents → Employee Documents (MeDocumentsView subtab 0). */
export const EMPLOYEE_DOCUMENTS_PEOPLE_TAB = 3;
export const EMPLOYEE_DOCUMENTS_SUBTAB = 0;
export const ME_ORGANIZATION_DOCUMENTS_SUBTAB = 1;

/** Org sidebar tab + Documents → Employee Documents (EmployeeDocumentsView subtab 1). */
export const ORG_PEOPLE_TAB = 4;
export const ORG_DOCUMENTS_MAIN_TAB = 1;
export const ORG_EMPLOYEE_DOCUMENTS_SUBTAB = 1;
export const ORG_ORGANIZATION_DOCUMENTS_SUBTAB = 2;

/**
 * Route for `employee_documents`, `employee_documents_verification` and `organisation_documents` notifications.
 * Navigate only when wasActionTaken is false.
 * Optional folderId / documentTypeId deep-link to highlight folder and document type.
 */
export function buildEmployeeDocumentsRoute(notif: {
  feature?: string;
  wasActionTaken: boolean;
  folderId?: number | null;
  documentTypeId?: number | null;
  documentId?: number | null;
  employeeId?: number | null;
}): string | null {
  if (notif.wasActionTaken) return null;

  const feature = notif.feature?.toLowerCase() ?? "";

  // ── Admin/Manager Verification ──
  if (feature === "employee_documents_verification") {
    let url = `/people/home?tab=${ORG_PEOPLE_TAB}&mainTab=${ORG_DOCUMENTS_MAIN_TAB}&documentsSubTab=${ORG_EMPLOYEE_DOCUMENTS_SUBTAB}&employeeDocsTab=1`;
    if (notif.employeeId != null) url += `&highlightId=${notif.employeeId}`;
    if (notif.documentTypeId != null) url += `&documentTypeId=${notif.documentTypeId}`;
    return url;
  }

  // ── Organization Documents (Self/Employee View in 'Me') ──
  if (feature === "organisation_documents") {
    let url = `/people/home?tab=${EMPLOYEE_DOCUMENTS_PEOPLE_TAB}&subtab=${ME_ORGANIZATION_DOCUMENTS_SUBTAB}`;
    if (notif.folderId != null) url += `&folderId=${notif.folderId}`;
    if (notif.documentId != null) url += `&documentId=${notif.documentId}`;
    return url;
  }

  // ── Employee Own Documents ──
  let url = `/people/home?tab=${EMPLOYEE_DOCUMENTS_PEOPLE_TAB}&subtab=${EMPLOYEE_DOCUMENTS_SUBTAB}`;
  if (notif.folderId != null) url += `&folderId=${notif.folderId}`;
  if (notif.documentTypeId != null) url += `&documentTypeId=${notif.documentTypeId}`;
  return url;
}
