import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { approvalsApi } from "../approvals/api/approvals.api";

/**
 * When a notification adds `redirectId` to the URL (including while already on
 * Approvals / My requests), invalidate cached employee-request lists so the
 * new row exists before scroll + highlight run.
 */
export function useNotificationDeepLinkRefresh(
  redirectId: string | null,
  options?: { onNewRedirectId?: () => void },
) {
  const dispatch = useDispatch();
  const onNewRedirectIdRef = useRef(options?.onNewRedirectId);
  onNewRedirectIdRef.current = options?.onNewRedirectId;
  const lastHandledRedirectRef = useRef<string | null>(null);

  useEffect(() => {
    if (!redirectId) {
      lastHandledRedirectRef.current = null;
      return;
    }
    if (lastHandledRedirectRef.current === redirectId) return;
    lastHandledRedirectRef.current = redirectId;

    onNewRedirectIdRef.current?.();
    dispatch(approvalsApi.util.invalidateTags(["EmployeeRequest"]));
  }, [redirectId, dispatch]);
}
