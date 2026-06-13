import { Chip } from "../../../../components/atom/chips";
import {
  useGetActivitiesQuery,
  useGetDisplayNamesQuery,
} from "../api/activity.api";
import { CircularProgress, Box, Typography } from "@mui/material";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";

import { convertUtcToTimezone } from "../utils/utcToTimezone";
import { DenseTableAtom } from "../../../../components/tables/standard-table/DenseTableAtom";
import type { FlexibleColumn } from "../../../../types/types";
import type { ActivityItem, ActivityFilterParams } from "../types/activity.types";
import {
  useGetEmployeeDraftByIdQuery,
  useGetEmployeeQuery,
} from "../../../people/org/people/directory/api/directory.api";
import { Tooltip } from "../../../../components/atom/tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  collectActivityEmployeeIds,
  collectDraftActivityEmployeeIds,
  generateDescription,
} from "./DescriptionGenerator";
import { ActivityDescriptionText } from "./ActivityDescriptionText";

// ---------------------------------------------------------------------------
// Helper: chip color
// ---------------------------------------------------------------------------

const getStatusColor = (
  status: string,
): "success" | "info" | "error" | "primary" | "warning" | "secondary" => {
  switch (status?.toLowerCase()) {
    case "create":
    case "approve":
      return "success";
    case "update":
    case "edit":
      return "info";
    case "delete":
      return "error";
    case "generate":
      return "primary";
    default:
      return "secondary";
  }
};

interface EmployeeFetcherProps {
  id: number;
  onResolved: (id: number, name: string) => void;
}

function EmployeeFetcher({ id, onResolved }: EmployeeFetcherProps) {
  const { data } = useGetEmployeeQuery(id);

  useEffect(() => {
    if (data?.data) {
      const contact = data.data.contact;
      const name =
        contact?.name?.trim() ||
        `${contact?.firstName ?? ""} ${contact?.lastName ?? ""}`.trim() ||
        data.data.name?.trim() ||
        "";
      if (name) onResolved(id, name);
    }
  }, [data, id, onResolved]);

  return null;
}

function DraftEmployeeFetcher({ id, onResolved }: EmployeeFetcherProps) {
  const { data } = useGetEmployeeDraftByIdQuery(id);

  useEffect(() => {
    const draft = data?.data;
    if (!draft) return;
    const contact = draft.contact;
    const name =
      draft.name?.trim() ||
      contact?.name?.trim() ||
      [draft.middleName, draft.lastName].filter(Boolean).join(" ").trim() ||
      `${contact?.firstName ?? ""} ${contact?.lastName ?? ""}`.trim() ||
      "";
    if (name) onResolved(id, name);
  }, [data, id, onResolved]);

  return null;
}

// ---------------------------------------------------------------------------
// Description helpers
// ---------------------------------------------------------------------------

const resolveDateList = (row: ActivityItem): string[] | null => {
  const candidates = [
    row.LeaveDates,
    row.leaveDates,
    row.rejectedDates,
    row.approvedDates,
    row.compOffDates,
  ] as (unknown[] | undefined)[];

  for (const list of candidates) {
    if (Array.isArray(list) && list.length > 0) return list as string[];
  }
  return null;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const humanize = (str?: string): string => {
  if (!str) return "";
  return str.replace(/-/g, " ");
};

// ---------------------------------------------------------------------------
// Row type
// ---------------------------------------------------------------------------

interface ActivityRow extends ActivityItem {
  _description: string;
  _displayUser: string;
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const columns: FlexibleColumn<ActivityRow>[] = [
  {
    field: "timestamp",
    headerName: "Time",
    flex: 1,
    minWidth: 180,
    renderCell: (params) => {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return convertUtcToTimezone(params.value, userTimezone);
    },
  },
  { field: "_displayUser", headerName: "User", flex: 1, minWidth: 150 },
  {
    field: "module",
    headerName: "Module",
    flex: 0.8,
    minWidth: 150,
    renderCell: (params): React.ReactNode => humanize(params.value),
  },
  {
    field: "feature",
    headerName: "Feature",
    flex: 0.8,
    minWidth: 150,
    renderCell: (params): React.ReactNode => humanize(params.value),
  },
  {
    field: "status",
    headerName: "Status",
    flex: 0.8,
    minWidth: 110,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => (
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="xs"
          sx={{ width: "6vw", minWidth: 110 }}
        />
      </Box>
    ),
  },
  {
    field: "_description",
    headerName: "Description",
    flex: 2,
    minWidth: 280,
    renderCell: (params) => {
      const dates = resolveDateList(params.row);
      const full: string = params.value;

      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, width: "100%", overflow: "hidden" }}>
          <ActivityDescriptionText text={full} />
          {dates && (
            <Tooltip
              title={
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, p: 0.5 }}>
                  {dates.map((d, i) => (
                    <Typography key={i} variant="caption" sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(d)}
                    </Typography>
                  ))}
                </Box>
              }
              arrow
              placement="top"
            >
              <InfoOutlinedIcon
                sx={{ fontSize: 14, color: "text.disabled", flexShrink: 0, cursor: "pointer" }}
              />
            </Tooltip>
          )}
        </Box>
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ActivityTableProps {
  height?: string;
  type: string;
  filters: ActivityFilterParams;
}

export function ActivityTable({ height, type = "full", filters }: ActivityTableProps) {
  const limit = type === "card" ? 10 : 50;
  const [page, setPage] = useState(1);
  const [allRows, setAllRows] = useState<ActivityItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Map of numeric employee id -> resolved display name
  const [employeeNameMap, setEmployeeNameMap] = useState<Record<number, string>>({});

  const handleEmployeeResolved = useCallback((id: number, name: string) => {
    setEmployeeNameMap((prev) => {
      if (prev[id] === name) return prev; // avoid unnecessary re-render
      return { ...prev, [id]: name };
    });
  }, []);

  const draftEmployeeIds = useMemo(
    () => new Set(collectDraftActivityEmployeeIds(allRows)),
    [allRows],
  );

  const numericEmployeeIds = useMemo(() => {
    return collectActivityEmployeeIds(allRows).filter((id) => !draftEmployeeIds.has(id));
  }, [allRows, draftEmployeeIds]);

  const draftIdsToFetch = useMemo(
    () => Array.from(draftEmployeeIds),
    [draftEmployeeIds],
  );

  const queryArgs = useMemo(
    () => ({
      page,
      limit,
      startTime: filters?.startTime ?? null,
      endTime: filters?.endTime ?? null,
      users: filters?.users ?? [],
      modules: filters?.modules ?? [],
      features: filters?.features ?? [],
      _refresh: filters?._refresh ?? 0,
      _pageKey: page,
    }),
    [page, limit, filters],
  );

  const { data, isError, isFetching } = useGetActivitiesQuery(queryArgs, {
    refetchOnMountOrArgChange: true,
  });

  const {
    data: displayNamesData,
    refetch: refetchDisplayNames,
  } = useGetDisplayNamesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const userIdToNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    (displayNamesData?.data ?? []).forEach((item) => {
      const match = item.match(/^(.*)\((.*)\)$/);
      if (match) map[match[2].trim()] = match[1].trim();
    });
    return map;
  }, [displayNamesData]);

  const isInitialLoading = isFetching && page === 1 && allRows.length === 0;

  const rows: ActivityRow[] = useMemo(() => {
    return allRows.map((row) => ({
      ...row,
      _displayUser:
        userIdToNameMap[row.username] ??
        userIdToNameMap[String(row.userId)] ??
        row.username,
      _description: generateDescription(row, employeeNameMap),
    }));
  }, [allRows, userIdToNameMap, employeeNameMap]);

  useEffect(() => {
    if (!data?.data) return;
    if (type === "card") {
      setAllRows(data.data);
      setHasMore(false);
      return;
    }
    setAllRows((prev) => {
      if (page === 1) return data.data;
      const existingIds = new Set(prev.map((r) => r.timestamp + r.username));
      return [
        ...prev,
        ...data.data.filter((r) => !existingIds.has(r.timestamp + r.username)),
      ];
    });
    setHasMore(data.data.length === limit);
  }, [data, page, type, limit]);

  useEffect(() => {
    setPage(1);
    setAllRows([]);
    setHasMore(true);
    setEmployeeNameMap({});
  }, [filters]);

  useEffect(() => {
    if (filters?._refresh && refetchDisplayNames) {
      refetchDisplayNames();
    }
  }, [filters?._refresh, refetchDisplayNames]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 100 && !isFetching && hasMore) {
        setPage((prev) => prev + 1);
      }
    };
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [isFetching, hasMore]);

  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [filters]);

  if (isInitialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height || 200}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box textAlign="center" p={2}>
        <Typography color="error">Failed to load activity logs.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      flex: 1, height: height || "auto",
      overflow: "visible",
    }}>
      {numericEmployeeIds.map((id) => (
        <EmployeeFetcher key={`emp-${id}`} id={id} onResolved={handleEmployeeResolved} />
      ))}
      {draftIdsToFetch.map((id) => (
        <DraftEmployeeFetcher key={`draft-${id}`} id={id} onResolved={handleEmployeeResolved} />
      ))}

      <DenseTableAtom
        ref={scrollContainerRef}
        sx={{ height: "100%" }}
        columns={columns}
        rows={rows}
        loadingDown={isFetching && page > 1}
      />
    </Box>
  );
}

export default ActivityTable;