import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Skeleton,
  Button,
  CircularProgress,
  Alert,
  Avatar,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import BusinessIcon from "@mui/icons-material/Business";
import BadgeIcon from "@mui/icons-material/Badge";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useGetEmployeeInfoQuery } from "../../../api/people.api";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import { useGetEmployeeTimelineQuery } from "../api/timeline.api";
import type { TimelineDataItem } from "../types/timeline.types";

const ITEMS_PER_PAGE = 10;
const DOT = 40;

// ── event config ──────────────────────────────────────────────────────────────
interface EventConfig {
  label: string;
  dotColor: string;
  icon: React.ReactNode;
}

const EVENT_MAP: Record<string, EventConfig> = {
  salary_revision: {
    label: "Salary Revised",
    dotColor: "#3B82F6",
    icon: <AttachMoneyIcon sx={{ fontSize: 16 }} />,
  },
  reporting_manager: {
    label: "Reporting Manager Changed",
    dotColor: "#3B82F6",
    icon: <ManageAccountsIcon sx={{ fontSize: 16 }} />,
  },
  department: {
    label: "Department Changed",
    dotColor: "#10B981",
    icon: <BusinessIcon sx={{ fontSize: 16 }} />,
  },
  designation: {
    label: "Designation Changed",
    dotColor: "#8B5CF6",
    icon: <BadgeIcon sx={{ fontSize: 16 }} />,
  },
  job_title: {
    label: "Designation Changed",
    dotColor: "#8B5CF6",
    icon: <BadgeIcon sx={{ fontSize: 16 }} />,
  },
  employee_type: {
    label: "Employee Type Changed",
    dotColor: "#10B981",
    icon: <SwapHorizIcon sx={{ fontSize: 16 }} />,
  },
  employment_type: {
    label: "Employment Type Changed",
    dotColor: "#10B981",
    icon: <SwapHorizIcon sx={{ fontSize: 16 }} />,
  },
  joining: {
    label: "Joined",
    dotColor: "#06B6D4",
    icon: <HowToRegIcon sx={{ fontSize: 16 }} />,
  },
  work_anniversary: {
    label: "Work Anniversary",
    dotColor: "#F59E0B",
    icon: <EmojiEventsIcon sx={{ fontSize: 16 }} />,
  },
  probation_completed: {
    label: "Probation Completed",
    dotColor: "#8B5CF6",
    icon: <TaskAltIcon sx={{ fontSize: 16 }} />,
  },
};

function getEventConfig(area: string): EventConfig {
  return (
    EVENT_MAP[area] ?? {
      label: area
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      dotColor: "#6B7280",
      icon: <WorkHistoryIcon sx={{ fontSize: 16 }} />,
    }
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function extractYear(dateStr: string): number {
  return new Date(dateStr).getFullYear();
}

function renderValue(data: Record<string, unknown>): string {
  if (data.name) return String(data.name);
  if (data.amount) return String(data.amount);
  if (data.value) return String(data.value);
  const entries = Object.entries(data).filter(([k]) => k !== "id");
  if (entries.length === 0) return "-";
  return entries.map(([, v]) => String(v)).join(", ");
}

type FlatEntry =
  | { kind: "year"; year: number }
  | { kind: "event"; item: TimelineDataItem; isLast: boolean };

function buildFlatList(
  items: TimelineDataItem[],
  hasMore: boolean
): FlatEntry[] {
  const map = new Map<number, TimelineDataItem[]>();
  for (const item of items) {
    const year = extractYear(item.date);
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(item);
  }
  const groups = Array.from(map.entries()).sort(([a], [b]) => b - a);
  const flat: FlatEntry[] = [];
  groups.forEach(([year, groupItems], gi) => {
    flat.push({ kind: "year", year });
    groupItems.forEach((item, idx) => {
      const isLast =
        !hasMore && gi === groups.length - 1 && idx === groupItems.length - 1;
      flat.push({ kind: "event", item, isLast });
    });
  });
  return flat;
}

// ── shared rail line segment ───────────────────────────────────────────────────
function RailLine({ minHeight = 16 }: { minHeight?: number }) {
  return (
    <Box
      sx={{
        width: 2,
        flex: 1,
        minHeight,
        bgcolor: "divider",
      }}
    />
  );
}

// ── year badge row (line passes through left column) ─────────────────────────
function YearBadgeRow({ year, showTopLine }: { year: number; showTopLine: boolean }) {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      {/* Left: continuous line through the badge row */}
      <Box
        sx={{
          width: DOT,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {showTopLine && <RailLine minHeight={8} />}
        <RailLine minHeight={8} />
      </Box>

      {/* Right: year pill */}
      <Box sx={{ display: "flex", alignItems: "center", py: 0.75 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.5,
            py: 0.25,
            borderRadius: 99,
            bgcolor: "action.selected",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{ color: "text.secondary", lineHeight: 1.6, fontSize: "0.75rem" }}
          >
            {year}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ── event row (dot + inline line below unless last) ───────────────────────────
function EventRow({
  item,
  isLast,
  companyName,
}: {
  item: TimelineDataItem;
  isLast: boolean;
  companyName?: string;
}) {
  const cfg = getEventConfig(item.area_of_change);
  
  const hasData = (data?: Record<string, unknown>) =>
    data && Object.keys(data).filter((k) => k !== "id").length > 0;

  const hasInitial = hasData(item.initial_data);
  const hasFinal = hasData(item.final_data);
  const hasVisualChange = hasInitial || hasFinal;

  let label = cfg.label;
  if (item.area_of_change === "date_of_joining") {
    label = companyName ? `Joined ${companyName}` : "Joined";
  } else if (
    !["work_anniversary", "probation_completed"].includes(item.area_of_change)
  ) {
    if (hasFinal && !hasInitial) {
      if (label.endsWith(" Changed")) label = label.replace(" Changed", " Assigned");
      else if (label.endsWith(" Revised")) label = label.replace(" Revised", " Assigned");
      else label = `${label} Assigned`;
    } else if (hasFinal && hasInitial) {
      if (!label.endsWith(" Changed") && !label.endsWith(" Revised")) {
        label = `${label} Changed`;
      }
    }
  }

  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      {/* Left: dot + line below */}
      <Box
        sx={{
          width: DOT,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar
          sx={{
            width: DOT,
            height: DOT,
            flexShrink: 0,
            bgcolor: cfg.dotColor,
            color: "#fff",
          }}
        >
          {cfg.icon}
        </Avatar>
        {!isLast && <RailLine />}
      </Box>

      {/* Right: content */}
      <Box sx={{ flex: 1, minWidth: 0, pb: isLast ? 0 : 2.5 }}>
        <Box
          sx={{
            width: "100%",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            px: 1.5,
            py: 1.25,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="body2" fontWeight={600} lineHeight={1.3}>
            {label}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.25, mb: hasVisualChange ? 1 : 0 }}
          >
            {formatDisplayDate(item.date)}
          </Typography>

          {hasVisualChange && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                px: 1.25,
                py: 0.5,
                bgcolor: "action.hover",
                maxWidth: "100%",
              }}
            >
              {hasInitial && (
                <Typography variant="caption" fontWeight={500} noWrap>
                  {renderValue(item.initial_data!)}
                </Typography>
              )}
              {hasInitial && hasFinal && (
                <ArrowForwardIcon
                  sx={{ fontSize: 13, color: "text.disabled", flexShrink: 0 }}
                />
              )}
              {hasFinal && (
                <Typography variant="caption" fontWeight={600} noWrap>
                  {renderValue(item.final_data!)}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ── skeleton ──────────────────────────────────────────────────────────────────
function TimelineSkeleton() {
  return (
    <Box>
      {Array.from({ length: 5 }).map((_, i) => (
        <Box key={i} sx={{ display: "flex", gap: 2 }}>
          <Box
            sx={{
              width: DOT,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Skeleton variant="circular" width={DOT} height={DOT} />
            {i < 4 && (
              <Box sx={{ width: 2, flex: 1, minHeight: 40, bgcolor: "divider", opacity: 0.3 }} />
            )}
          </Box>
          <Box sx={{ flex: 1, pb: i < 4 ? 2.5 : 0 }}>
            <Skeleton width="45%" height={16} />
            <Skeleton width="25%" height={12} sx={{ mt: 0.5 }} />
            {i % 2 === 0 && (
              <Skeleton width="50%" height={28} sx={{ mt: 1, borderRadius: 1.5 }} />
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// ── main export ───────────────────────────────────────────────────────────────
export default function TimelineView({
  employeeId: employeeIdProp,
  parentPanelVisible,
}: {
  employeeId?: string | number;
  /** When set, refetches when the user returns to this tab after profile edits. */
  parentPanelVisible?: boolean;
} = {}) {
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<TimelineDataItem[]>([]);
  const loadedPagesRef = useRef<Set<number>>(new Set());
  const prevParentVisibleRef = useRef<boolean | null>(null);

  const { data: headerData } = useGetHeaderDataQuery();
  const companyName = headerData?.data?.companyName;

  const { data: empInfo } = useGetEmployeeInfoQuery(undefined, {
    skip: employeeIdProp != null,
  });
  const employeeId = String(
    employeeIdProp ?? empInfo?.data?.employeeId ?? ""
  );

  useEffect(() => {
    setPage(1);
    setAllItems([]);
    loadedPagesRef.current = new Set();
  }, [employeeId]);

  const {
    data: pageItems,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetEmployeeTimelineQuery(
    { employeeId, page, limit: ITEMS_PER_PAGE },
    { skip: !employeeId }
  );

  useEffect(() => {
    if (isFetching || pageItems == null) return;

    if (page === 1) {
      loadedPagesRef.current = new Set([1]);
      setAllItems(pageItems);
      return;
    }

    if (!loadedPagesRef.current.has(page)) {
      loadedPagesRef.current.add(page);
      setAllItems((prev) => [...prev, ...pageItems]);
    }
  }, [pageItems, page, isFetching]);

  useEffect(() => {
    if (parentPanelVisible === undefined || !employeeId) return;
    if (prevParentVisibleRef.current === null) {
      prevParentVisibleRef.current = parentPanelVisible;
      return;
    }
    if (parentPanelVisible && !prevParentVisibleRef.current) {
      setPage(1);
      setAllItems([]);
      loadedPagesRef.current = new Set();
      void refetch();
    }
    prevParentVisibleRef.current = parentPanelVisible;
  }, [parentPanelVisible, employeeId, refetch]);

  const hasMore = (pageItems?.length ?? 0) === ITEMS_PER_PAGE;
  const isInitialLoad = isLoading && allItems.length === 0;

  if (isInitialLoad) {
    return (
      <Box sx={{ p: 1 }}>
        <TimelineSkeleton />
      </Box>
    );
  }

  if (isError && allItems.length === 0) {
    return (
      <Box sx={{ p: 1 }}>
        <Alert severity="error">Failed to load timeline. Please try again.</Alert>
      </Box>
    );
  }

  if (!isInitialLoad && allItems.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          py: 8,
        }}
      >
        <WorkHistoryIcon sx={{ fontSize: 52, color: "text.disabled" }} />
        <Typography variant="body2" color="text.secondary">
          No timeline events found.
        </Typography>
      </Box>
    );
  }

  const flat = buildFlatList(allItems, hasMore);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h6" fontWeight={700} mb={3}>
        Timeline
      </Typography>

      <Box sx={{ flex: 1, overflow: "auto" }}>
        {flat.map((entry, i) => {
          if (entry.kind === "year") {
            return (
              <YearBadgeRow
                key={`year-${entry.year}`}
                year={entry.year}
                showTopLine={i > 0}
              />
            );
          }
          return (
            <EventRow
              key={`${entry.item.timestamp}-${entry.item.area_of_change}-${i}`}
              item={entry.item}
              isLast={entry.isLast}
              companyName={companyName}
            />
          );
        })}

        {hasMore && (
          <Box sx={{ display: "flex", gap: 2 }}>
            {/* Keep left column consistent */}
            <Box
              sx={{
                width: DOT,
                flexShrink: 0,
                display: "flex",
                justifyContent: "center",
                pt: 1,
              }}
            >
              <Box sx={{ width: 2, height: 24, bgcolor: "divider" }} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", py: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPage((p) => p + 1)}
                disabled={isFetching}
                startIcon={
                  isFetching ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <KeyboardArrowDownIcon />
                  )
                }
                sx={{ borderRadius: 99, textTransform: "none", px: 2.5 }}
              >
                {isFetching ? "Loading…" : "Load more"}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
