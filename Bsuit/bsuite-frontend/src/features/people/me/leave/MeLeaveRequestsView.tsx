import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/system";
import { CircularProgress, Stack, Typography } from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";
import { useSearchParams } from "react-router-dom";
import { useGetEmployeeInfoQuery } from "../../api/people.api";
import {
  useGetEmployeeRequestsByEmpIdQuery,
  splitGroupedEmployeeRequestsToLeaveAndAttendance,
  type AttendanceApprovalRequest,
  type LeaveApprovalRequest,
} from "../../approvals/api/approvals.api";
import { DateRangePicker } from "../../../../components/atom/custom-date-range-picker";
import { MeLeaveRequestCard } from "./components/MeLeaveRequestCard";
import { MeAttendanceCard } from "./components/MeAttendanceCard";
import { TabsAtom } from "../../../../components/tabs";
import {
  NOTIFICATION_DEEP_LINK_DOM_READY_MS,
  NOTIFICATION_ROW_HIGHLIGHT_CLEAR_MS,
} from "../../utils/notificationRowHighlight";
import { useNotificationDeepLinkRefresh } from "../../utils/useNotificationDeepLinkRefresh";
import {
  defaultWideRangeForDeepLink,
  expandRangeToIncludeNotificationDate,
  NOTIF_DATE_URL_PARAM,
} from "../../utils/notificationDateRange";

type MeRequestListItem =
  | { kind: "leave"; request: LeaveApprovalRequest }
  | { kind: "attendance"; request: AttendanceApprovalRequest };

function combineEmployeeRequests(
  leaves: LeaveApprovalRequest[],
  attendance: AttendanceApprovalRequest[],
): MeRequestListItem[] {
  const items: MeRequestListItem[] = [
    ...leaves.map((request) => ({ kind: "leave" as const, request })),
    ...attendance.map((request) => ({ kind: "attendance" as const, request })),
  ];
  return items.sort((a, b) => {
    const dateA = dayjs(a.request.requestedOn);
    const dateB = dayjs(b.request.requestedOn);
    if (!dateA.isValid() && !dateB.isValid()) return 0;
    if (!dateA.isValid()) return 1;
    if (!dateB.isValid()) return -1;
    return dateB.valueOf() - dateA.valueOf();
  });
}
function requestMatchesRedirectId(
  request: { groupReqId?: string | number | null; id: string | number },
  redirectId: string,
): boolean {
  return (
    String(request.groupReqId) === redirectId ||
    String(request.id) === redirectId
  );
}

function getMeRequestCardId(
  kind: MeRequestListItem["kind"],
  tab: "pending" | "history",
  request: { groupReqId?: string | number | null; id: string | number },
): string {
  const prefix = kind === "leave" ? "me-leave" : "me-att";
  return `${prefix}-${tab}-${request.groupReqId ?? request.id}-${request.id}`;
}

type MeLeaveRequestsViewProps = {
  id?: number;
  /** Defaults to "My requests". */
  title?: string;
  /**
   * When set (e.g. Me home), refetches both queries whenever this becomes true after being false —
   * e.g. user returns from Leave after applying, without unmounting this panel.
   */
  parentPanelVisible?: boolean;
};

/**
 * All employee requests for the signed-in user (or `id` on directory profile): leave, regularization, comp off, etc.
 */
export default function MeLeaveRequestsView({
  id,
  title = "My Requests",
  parentPanelVisible,
}: MeLeaveRequestsViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const redirectId = searchParams.get("redirectId");
  const notifDateParam = searchParams.get(NOTIF_DATE_URL_PARAM);

  const [requestTab, setRequestTab] = useState(0);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [highlightTargetId, setHighlightTargetId] = useState<string | null>(null);
  const [highlightPulse, setHighlightPulse] = useState(0);

  const { data: info } = useGetEmployeeInfoQuery();
  const employeeId = id ?? info?.data?.employeeId ?? null;

  const [appliedRangeStart, setAppliedRangeStart] = useState<Dayjs | null>(() =>
    redirectId
      ? dayjs().subtract(3, "month").startOf("month")
      : dayjs().startOf("year"),
  );
  const [appliedRangeEnd, setAppliedRangeEnd] = useState<Dayjs | null>(() =>
    redirectId ? dayjs().endOf("day") : dayjs().endOf("year"),
  );
  const [draftRangeStart, setDraftRangeStart] = useState<Dayjs | null>(() =>
    redirectId
      ? dayjs().subtract(3, "month").startOf("month")
      : dayjs().startOf("year"),
  );
  const [draftRangeEnd, setDraftRangeEnd] = useState<Dayjs | null>(() =>
    redirectId ? dayjs().endOf("day") : dayjs().endOf("year"),
  );

  const requestRange = useMemo(() => {
    if (appliedRangeStart == null || appliedRangeEnd == null) return null;
    const a = appliedRangeStart.isBefore(appliedRangeEnd) ? appliedRangeStart : appliedRangeEnd;
    const b = appliedRangeStart.isBefore(appliedRangeEnd) ? appliedRangeEnd : appliedRangeStart;
    return {
      fromDate: a.startOf("day").format("YYYY-MM-DD"),
      toDate: b.startOf("day").format("YYYY-MM-DD"),
    };
  }, [appliedRangeStart, appliedRangeEnd]);

  const requestRangeRef = useRef({
    draftStart: draftRangeStart,
    draftEnd: draftRangeEnd,
    appliedStart: appliedRangeStart,
    appliedEnd: appliedRangeEnd,
  });
  useEffect(() => {
    requestRangeRef.current = {
      draftStart: draftRangeStart,
      draftEnd: draftRangeEnd,
      appliedStart: appliedRangeStart,
      appliedEnd: appliedRangeEnd,
    };
  }, [draftRangeStart, draftRangeEnd, appliedRangeStart, appliedRangeEnd]);

  const handleRequestRangeChange = useCallback((dates: [Dayjs | null, Dayjs | null]) => {
    const [start, end] = dates;
    setDraftRangeStart(start);
    setDraftRangeEnd(end);

    const cur = requestRangeRef.current;
    requestRangeRef.current = { ...cur, draftStart: start, draftEnd: end };

    if (start != null && end != null && start.isValid() && end.isValid()) {
      const lo = start.isBefore(end) ? start : end;
      const hi = start.isBefore(end) ? end : start;
      const loDay = lo.startOf("day");
      const hiDay = hi.startOf("day");
      setAppliedRangeStart(loDay);
      setAppliedRangeEnd(hiDay);
      requestRangeRef.current = {
        draftStart: loDay,
        draftEnd: hiDay,
        appliedStart: loDay,
        appliedEnd: hiDay,
      };
    }
  }, []);

  const handleRequestRangePickerClose = useCallback(() => {
    const { draftStart, draftEnd, appliedStart, appliedEnd } = requestRangeRef.current;
    if (draftStart != null && draftEnd != null && draftStart.isValid() && draftEnd.isValid()) {
      const a = draftStart.isBefore(draftEnd) ? draftStart : draftEnd;
      const b = draftStart.isBefore(draftEnd) ? draftEnd : draftStart;
      const aDay = a.startOf("day");
      const bDay = b.startOf("day");
      setAppliedRangeStart(aDay);
      setAppliedRangeEnd(bDay);
      setDraftRangeStart(aDay);
      setDraftRangeEnd(bDay);
    } else {
      setDraftRangeStart(appliedStart);
      setDraftRangeEnd(appliedEnd);
    }
  }, []);

  const widenRequestRangeForDeepLink = useCallback(() => {
    const { appliedStart, appliedEnd } = requestRangeRef.current;
    
    if (notifDateParam != null) {
      const expanded = expandRangeToIncludeNotificationDate(
        notifDateParam,
        appliedStart,
        appliedEnd,
      );
      if (expanded) {
        setAppliedRangeStart(expanded.start);
        setAppliedRangeEnd(expanded.end);
        setDraftRangeStart(expanded.start);
        setDraftRangeEnd(expanded.end);
        requestRangeRef.current = {
          draftStart: expanded.start,
          draftEnd: expanded.end,
          appliedStart: expanded.start,
          appliedEnd: expanded.end,
        };
      }
      // If expanded is null, the notification date is already inside the current range.
      // We keep the current range unchanged, so do nothing.
    } else {
      const { start, end } = defaultWideRangeForDeepLink();
      setAppliedRangeStart(start);
      setAppliedRangeEnd(end);
      setDraftRangeStart(start);
      setDraftRangeEnd(end);
      requestRangeRef.current = {
        draftStart: start,
        draftEnd: end,
        appliedStart: start,
        appliedEnd: end,
      };
    }
  }, [notifDateParam]);

  useNotificationDeepLinkRefresh(redirectId, {
    onNewRedirectId: widenRequestRangeForDeepLink,
  });

  /** Keep picker display aligned with applied query range when switching Pending / History. */
  useEffect(() => {
    if (appliedRangeStart == null || appliedRangeEnd == null) return;
    setDraftRangeStart(appliedRangeStart);
    setDraftRangeEnd(appliedRangeEnd);
    requestRangeRef.current = {
      ...requestRangeRef.current,
      draftStart: appliedRangeStart,
      draftEnd: appliedRangeEnd,
      appliedStart: appliedRangeStart,
      appliedEnd: appliedRangeEnd,
    };
  }, [requestTab, appliedRangeStart, appliedRangeEnd]);

  const skipRequests = employeeId == null || requestRange == null;

  const {
    data: pendingResponse,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useGetEmployeeRequestsByEmpIdQuery(
    {
      employeeId: employeeId ?? 0,
      ...(requestRange ?? { fromDate: "", toDate: "" }),
      status: "pending",
    },
    {
      skip: skipRequests,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    },
  );
  const {
    data: historyResponse,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetEmployeeRequestsByEmpIdQuery(
    {
      employeeId: employeeId ?? 0,
      ...(requestRange ?? { fromDate: "", toDate: "" }),
      status: "history",
    },
    {
      skip: skipRequests,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    },
  );

  const skipInitialSubTabRefetch = useRef(true);
  useEffect(() => {
    if (skipRequests) return;
    if (skipInitialSubTabRefetch.current) {
      skipInitialSubTabRefetch.current = false;
      return;
    }
    void refetchPending();
    void refetchHistory();
  }, [requestTab, skipRequests, refetchPending, refetchHistory]);

  const prevParentVisible = useRef<boolean | null>(null);
  useEffect(() => {
    if (skipRequests || parentPanelVisible === undefined) return;
    if (prevParentVisible.current === null) {
      prevParentVisible.current = parentPanelVisible;
      return;
    }
    if (parentPanelVisible && !prevParentVisible.current) {
      void refetchPending();
      void refetchHistory();
    }
    prevParentVisible.current = parentPanelVisible;
  }, [parentPanelVisible, skipRequests, refetchPending, refetchHistory]);

  const pendingRequests = useMemo(() => {
    const pending = splitGroupedEmployeeRequestsToLeaveAndAttendance(pendingResponse?.data);
    return combineEmployeeRequests(pending.leave, pending.attendance);
  }, [pendingResponse]);

  const historyRequests = useMemo(() => {
    const history = splitGroupedEmployeeRequestsToLeaveAndAttendance(historyResponse?.data);
    return combineEmployeeRequests(history.leave, history.attendance);
  }, [historyResponse]);

  const pendingCount = pendingRequests.length;
  const historyCount = historyRequests.length;

  const toggleCard = useCallback(
    (cardId: string) =>
      setOpenCardId((prev) => (prev === cardId ? null : cardId)),
    [],
  );

  /**
   * Deep-link from notification: find card by redirectId, open Pending/History tab,
   * scroll into view and pulse-highlight the matching card.
   */
  useEffect(() => {
    if (!redirectId || skipRequests || pendingLoading || historyLoading) return;

    type DeepLinkTarget = { cardId: string; tab: 0 | 1 };

    const findInLeaves = (
      items: LeaveApprovalRequest[],
      prefix: string,
      tab: 0 | 1,
    ): DeepLinkTarget | null => {
      for (const req of items) {
        if (!requestMatchesRedirectId(req, redirectId)) continue;
        return {
          cardId: `${prefix}-${req.groupReqId ?? req.id}-${req.id}`,
          tab,
        };
      }
      return null;
    };

    const findInAttendance = (
      items: AttendanceApprovalRequest[],
      prefix: string,
      tab: 0 | 1,
    ): DeepLinkTarget | null => {
      for (const req of items) {
        if (!requestMatchesRedirectId(req, redirectId)) continue;
        return {
          cardId: `${prefix}-${req.groupReqId ?? req.id}-${req.id}`,
          tab,
        };
      }
      return null;
    };

    const target =
      findInLeaves(pendingRequests.filter((item) => item.kind === "leave").map((item) => item.request), "me-leave-pending", 0) ??
      findInAttendance(pendingRequests.filter((item) => item.kind === "attendance").map((item) => item.request), "me-att-pending", 0) ??
      findInLeaves(historyRequests.filter((item) => item.kind === "leave").map((item) => item.request), "me-leave-history", 1) ??
      findInAttendance(historyRequests.filter((item) => item.kind === "attendance").map((item) => item.request), "me-att-history", 1);

    if (!target) return;

    if (requestTab !== target.tab) {
      setRequestTab(target.tab);
      return;
    }

    let clearHighlightTimer: ReturnType<typeof setTimeout> | undefined;

    const scrollTimer = setTimeout(() => {
      document.getElementById(target.cardId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setHighlightTargetId(target.cardId);
      setHighlightPulse((n) => n + 1);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("redirectId");
          next.delete(NOTIF_DATE_URL_PARAM);
          return next;
        },
        { replace: true },
      );
      clearHighlightTimer = setTimeout(() => {
        setHighlightTargetId(null);
      }, NOTIFICATION_ROW_HIGHLIGHT_CLEAR_MS);
    }, NOTIFICATION_DEEP_LINK_DOM_READY_MS);

    return () => {
      clearTimeout(scrollTimer);
      if (clearHighlightTimer != null) clearTimeout(clearHighlightTimer);
    };
  }, [
    redirectId,
    skipRequests,
    pendingLoading,
    historyLoading,
    requestTab,
    pendingRequests,
    historyRequests,
    setSearchParams,
  ]);

  const rangeLabel =
    requestRange != null
      ? `${dayjs(requestRange.fromDate).format("MMM DD, YYYY")} – ${dayjs(requestRange.toDate).format("MMM DD, YYYY")}`
      : "";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        // gap: 1,
        width: "100%",
        height: "100%",
        // overflow: "auto",
      }}
    >
      {/* 
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "flex-start" },
          justifyContent: "space-between",
          gap: { xs: 1.5, sm: 2 },
          mb: 1,
          flexShrink: 0,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            flex: { sm: "1 1 auto" },
            minWidth: 0,
            maxWidth: { sm: "min(100%, 520px)" },
            pt: { sm: 0.5 },
          }}
        >
          Leave, attendance regularization, compensatory off, and other requests in the selected range.
        </Typography>
   
      </Box> */}
      {/* 
      {rangeLabel ? (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
          Showing: {rangeLabel}
        </Typography>
      ) : null} */}

      <Box display='flex' justifyContent="space-between" alignItems="center">
        <TabsAtom
          value={requestTab}
          onChange={(newValue: number) => setRequestTab(newValue)}
          tabs={[
            { label: "Pending" },
            { label: "History" }
          ]}
        // variant="fullWidth"
        // sx={{ borderBottom: 1, borderColor: "divider" }}
        >
        </TabsAtom>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "stretch", sm: "flex-end" },
            gap: 0.5,
            flexShrink: 0,
            width: { xs: "100%", sm: "auto" },
            minWidth: { xs: "100%", sm: 280 },
            maxWidth: { xs: "100%", sm: 400 },
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: { xs: "flex-start", sm: "flex-end" } }}>
            Request date range
          </Typography>
          <DateRangePicker
            label="From – To"
            startValue={draftRangeStart}
            endValue={draftRangeEnd}
            onChange={handleRequestRangeChange}
            onClose={handleRequestRangePickerClose}
            months={2}
            width="100%"
          />
        </Box>

      </Box>

      {skipRequests ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {employeeId == null ? "Employee profile not loaded." : "Choose a valid date range."}
        </Typography>
      ) : requestTab === 0 ? (
        pendingLoading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={32} />
          </Box>
        ) : pendingCount === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No pending requests
          </Typography>
        ) : (
          <Stack spacing={1.5} mt={2}>
            {pendingRequests.map((item) => {
              const cardId = getMeRequestCardId(item.kind, "pending", item.request);
              return (
                <Box key={cardId} id={cardId}>
                  {item.kind === "leave" ? (
                    <MeLeaveRequestCard
                      request={item.request}
                      showActions={false}
                      hideEmployeeName
                      hideStatus
                      hideUpdatedBy
                      highlightPulse={highlightTargetId === cardId ? highlightPulse : 0}
                    />
                  ) : (
                    <MeAttendanceCard
                      request={item.request}
                      showActions={false}
                      hideEmployeeName
                      hideStatus
                      hideUpdatedBy
                      highlightPulse={highlightTargetId === cardId ? highlightPulse : 0}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>
        )
      ) : historyLoading ? (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={32} />
        </Box>
      ) : historyCount === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No approved or rejected requests in this period
        </Typography>
      ) : (
        <Stack spacing={1.5} mt={2}>
          {historyRequests.map((item) => {
            const cardId = getMeRequestCardId(item.kind, "history", item.request);
            return (
              <Box key={cardId} id={cardId}>
                {item.kind === "leave" ? (
                  <MeLeaveRequestCard
                    request={item.request}
                    showActions={false}
                    hideEmployeeName
                    highlightPulse={highlightTargetId === cardId ? highlightPulse : 0}
                  />
                ) : (
                  <MeAttendanceCard
                    request={item.request}
                    showActions={false}
                    hideEmployeeName
                    highlightPulse={highlightTargetId === cardId ? highlightPulse : 0}
                  />
                )}
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
