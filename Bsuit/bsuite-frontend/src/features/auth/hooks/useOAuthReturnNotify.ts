import { useEffect } from "react";
import { useGetDetailsQuery } from "../api/profile.api";
import {
  notifySessionReplaced,
  OAUTH_LOGIN_PENDING_KEY,
} from "../utils/sessionCrossTabSync";

/**
 * After Google OAuth the SPA reloads with a new cookie session. We set OAUTH_LOGIN_PENDING_KEY
 * before leaving for `/auth/oauth/`; once profile loads, notify other tabs (same pattern as password login).
 */
export function useOAuthReturnNotify() {
  const { data } = useGetDetailsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (!data) return;

    let pending = false;
    try {
      pending = sessionStorage.getItem(OAUTH_LOGIN_PENDING_KEY) === "1";
    } catch {
      return;
    }
    if (!pending) return;

    try {
      sessionStorage.removeItem(OAUTH_LOGIN_PENDING_KEY);
    } catch {
      /* ignore */
    }

    const payload = data as { data?: { sessionId?: string }; sessionId?: string };
    const sid =
      payload?.data?.sessionId ??
      payload?.sessionId ??
      undefined;
    notifySessionReplaced(sid);
  }, [data]);
}
