import type { ExpenseClaimEmployee, ExpenseClaimResponse } from "./api/expenseClaim.api";

export function getExpenseClaimPersonName(
  emp: ExpenseClaimEmployee | null | undefined
): string {
  if (!emp) return "—";
  const name = emp.contact?.name?.trim();
  return name || emp.employeeId || "—";
}

export function formatExpenseClaimAmount(amount: string | number): string {
  return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Tooltip text for rejected claims; null when not applicable. */
export function getExpenseClaimRejectionTooltip(row: ExpenseClaimResponse): string | null {
  if (row.status !== "rejected") return null;
  const reason = row.rejectionReason?.trim();
  return reason || null;
}

export function getExpenseClaimApprovedOrRejectedBy(row: ExpenseClaimResponse): string {
  if (row.status === "draft" || row.status === "pending") return "—";
  return getExpenseClaimPersonName(row.approvedOrRejectedBy);
}

export function getExpenseClaimPaidBy(row: ExpenseClaimResponse): string {
  if (row.status !== "paid") return "—";
  return getExpenseClaimPersonName(row.paymentBy);
}
