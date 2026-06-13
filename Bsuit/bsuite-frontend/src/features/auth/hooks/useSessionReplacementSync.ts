import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { baseApi } from "../../../api/base.api";
import { TAGS } from "../../../api/tagTypes";
import { useLazyGetEmployeeInfoQuery } from "../../people/api/people.api";
import { setAccessToken } from "../authSlice";
import { setSessionId } from "../profilePage/profileSlice";
import {
  subscribeSessionReplaced,
  type SessionReplacedPayload,
} from "../utils/sessionCrossTabSync";
import { getTabInstanceId } from "../../company/utils/companyCrossTabSync";

/**
 * When another tab completes login, the cookie jar already holds the new session but Redux may
 * still hold the previous user's bearer token. Clear token, optionally sync session id,
 * invalidate caches, then route by role like CompanySwitcher.
 */
export function useSessionReplacementSync() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [fetchEmployeeInfo] = useLazyGetEmployeeInfoQuery();

  useEffect(() => {
    const handle = (msg: SessionReplacedPayload) => {
      if (msg.senderTabId === getTabInstanceId()) return;

      void (async () => {
        dispatch(setAccessToken(null));
        if (msg.sessionId) {
          dispatch(setSessionId(msg.sessionId));
        }
        dispatch(baseApi.util.invalidateTags([...TAGS]));

        try {
          const res = await fetchEmployeeInfo().unwrap();
          const info = res.data;
          const isEmployeeNonAdmin =
            info?.isEmployee === true && info?.isAdmin !== true;
          navigate(
            isEmployeeNonAdmin ? "/people/home?tab=2" : "/books/transact/home",
            { replace: true },
          );
        } catch {
          navigate("/books/transact/home", { replace: true });
        }
      })();
    };

    return subscribeSessionReplaced(handle);
  }, [dispatch, navigate, fetchEmployeeInfo]);
}
