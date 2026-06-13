import { useMemo } from "react";
import { useGetDetailsQuery } from "../../../../../auth/api/profile.api";
import { useGetEmployeeInfoQuery } from "../../../../../people/api/people.api";
import type { TicketComment } from "../types/ticketChat.types";

export function useHelpdeskChatViewer() {
  const { data: employeeInfo } = useGetEmployeeInfoQuery();
  const { data: profileResponse } = useGetDetailsQuery();

  const employeeId = employeeInfo?.data?.employeeId ?? null;
  const isAdmin = employeeInfo?.data?.isAdmin === true;
  const isEmployee = employeeInfo?.data?.isEmployee === true;
  const profile = profileResponse?.data;
  const adminUserId = profile?.userId ? Number(profile.userId) : null;
  const displayName = profile?.displayName?.trim() ?? "";

  const canViewInternalNotes = isAdmin || !isEmployee;

  const isOwnMessage = useMemo(() => {
    return (comment: TicketComment) => {
      if (
        comment.employeeAuthorId != null &&
        employeeId != null &&
        comment.employeeAuthorId === employeeId
      ) {
        return true;
      }

      if (
        comment.adminAuthorId != null &&
        adminUserId != null &&
        !Number.isNaN(adminUserId) &&
        comment.adminAuthorId === adminUserId
      ) {
        return true;
      }

      if (displayName && comment.authorName.trim() === displayName) {
        return true;
      }

      return false;
    };
  }, [adminUserId, displayName, employeeId]);

  return {
    canViewInternalNotes,
    isAgent: canViewInternalNotes,
    isOwnMessage,
    employeeId,
    adminUserId,
    displayName,
  };
}
