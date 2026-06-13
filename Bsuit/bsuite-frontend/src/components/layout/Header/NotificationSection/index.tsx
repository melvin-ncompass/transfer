import {
  Box,
  IconButton,
  Badge,
  Menu,
  Typography,
  Stack,
  useTheme,
  Chip,
  CircularProgress,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DraftsOutlinedIcon from "@mui/icons-material/DraftsOutlined";
import MailIcon from "@mui/icons-material/Mail";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Tooltip } from "../../../atom/tooltip";
import {
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useToggleReadMutation,
} from "./notification.api";
import { formatDateTimeShort } from "../../../../utils/numberFormatter";
import { PrimaryButton } from "../../../atom/button";
import { Snackbar } from "../../../atom/snackbar";
import { NotificationPopupCard } from "./NotificationPopupCard";
import { useNotificationSSE } from "./useNotificationSSE";
import { useAppSelector } from "../../../../store/store";
import {
  EMPTY_GROUPED,
  markAllReadInGrouped,
  toggleReadInGrouped,
  toGrouped,
  type GroupedNotifications,
  type NormalizedNotification,
} from "./notification.types";
import {
  NOTIFICATION_FEATURE_MAP,
  buildEmployeeDocumentsRoute,
} from "./notification.feature-map";
import { approvalsApi } from "../../../../features/people/approvals/api/approvals.api";
import { useGetHeaderDataQuery } from "../../../../features/company/api/company.api";

// ---------------------------------------------------------------------------
// Route resolution — driven by NOTIFICATION_FEATURE_MAP (edit that file to
// change where each feature navigates, not this function).
// ---------------------------------------------------------------------------

function getNotificationRoute(notif: NormalizedNotification): string | null {
  const featureKey = notif.feature?.toLowerCase() ?? "";

  if (featureKey === "employee_exit") {
    return "/people/home?tab=4&subtab=4";
  }

  if (
    featureKey === "employee_documents" ||
    featureKey === "employee_documents_verification" ||
    featureKey === "organisation_documents"
  ) {
    return buildEmployeeDocumentsRoute(notif);
  }

  if (notif.redirectionId == null || notif.redirectionId === "") return null;

  let config = NOTIFICATION_FEATURE_MAP[featureKey];
  if (!config) return null;

  const isHistory = featureKey.endsWith("history");
  const isRequest = featureKey.endsWith("request");
  if (!isHistory && !isRequest) return null;

  if (isRequest && !notif.actionRequired) {
    // If it's a request notification but no action is required from the user,
    // it is a status update notification (e.g. approved/rejected) meant for the employee,
    // so we redirect them to their history view instead.
    const historyKey = featureKey.replace("_request", "_history");
    const historyConfig = NOTIFICATION_FEATURE_MAP[historyKey];
    if (historyConfig) {
      config = historyConfig;
    }
  } else if (isRequest && notif.wasActionTaken === true) {
    return null;
  }

  const base = `/people/home?tab=${config.peopleTab}&${config.paramKey}=${config.innerTab}`;
  const params = new URLSearchParams({
    redirectId: String(notif.redirectionId),
  });
  if (notif.timestamp) {
    params.set("notifDate", notif.timestamp);
  }
  return `${base}&${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationSection() {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const { data: headerData } = useGetHeaderDataQuery();
  const companyId = headerData?.data?.companyId;

  const {
    unreadCount,
    decrementCount,
    incrementCount,
    resetCount,
    toastNotif,
    clearToastNotif,
  } = useNotificationSSE(Boolean(accessToken), companyId);
  const count = unreadCount ?? 0;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const [cursor, setCursor] = useState<(string | number)[] | undefined>(undefined);
  const [accumulated, setAccumulated] = useState<GroupedNotifications>(EMPTY_GROUPED);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data, isFetching, refetch } = useGetNotificationsQuery(cursor, { skip: !open });

  const [toggleRead] = useToggleReadMutation();
  const [markAllRead] = useMarkAllReadMutation();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });
  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  useEffect(() => {
    if (!open) {
      setCursor(undefined);
      setAccumulated(EMPTY_GROUPED);
      setHasMore(false);
      setLoadingMore(false);
      return;
    }
    // Only set initial data when menu opens AND there is no cursor
    if (cursor === undefined && data?.data?.grouped) {
      setAccumulated(toGrouped(data.data.grouped));
      setHasMore(data.data.hasMore ?? false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !data?.data?.grouped) return;
    const incoming = toGrouped(data.data.grouped);
    
    setAccumulated((prev) => {
      // If it's the first page (no cursor), just take the incoming data directly
      // This prevents duplicating the first page due to React strict mode / re-renders
      if (cursor === undefined) {
        return incoming;
      }

      // Safe de-duplication for pagination
      const existingIds = new Set([
        ...prev.today.map((n) => n.id),
        ...prev.yesterday.map((n) => n.id),
        ...prev.older.map((n) => n.id),
      ]);

      const dedupe = (items: NormalizedNotification[]) =>
        items.filter((item) => !existingIds.has(item.id));

      return {
        today: [...prev.today, ...dedupe(incoming.today)],
        yesterday: [...prev.yesterday, ...dedupe(incoming.yesterday)],
        older: [...prev.older, ...dedupe(incoming.older)],
      };
    });

    setHasMore(data.data.hasMore ?? false);
    setLoadingMore(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, cursor, open]);

  // Reset local state when company switches
  useEffect(() => {
    if (companyId) {
      setAccumulated(EMPTY_GROUPED);
      setCursor(undefined);
    }
  }, [companyId]);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  // Fetch fresh notifications every time the menu opens (skip is false only when open).
  useEffect(() => {
    if (!open) return;
    void refetch();
  }, [open, refetch]);

  const handleClose = () => setAnchorEl(null);

  const handleLoadMore = () => {
    if (!data?.data?.nextCursor || loadingMore) return;
    setLoadingMore(true);
    setCursor(data.data.nextCursor);
  };

  const handleToggleRead = async (
    e: React.MouseEvent,
    notif: NormalizedNotification,
  ) => {
    e.stopPropagation();
    const nextRead = !notif.read;

    try {
      await toggleRead({ id: notif.id, read: nextRead }).unwrap();
      setAccumulated((prev) => toggleReadInGrouped(prev, notif.id, nextRead));
      if (nextRead) decrementCount();
      else incrementCount();
    } catch (err: any) {
      showSnack(
        err?.data?.message ||
          `Failed to mark as ${nextRead ? "read" : "unread"}`,
        "error",
      );
    }
  };

  const handleNotificationNavigate = (notif: NormalizedNotification) => {
    const route = getNotificationRoute(notif);
    if (route) {
      dispatch(approvalsApi.util.invalidateTags(["EmployeeRequest"]));
      handleClose();
      navigate(route);
    }
  };

  const renderSection = (label: string, items: NormalizedNotification[]) =>
    items.length > 0 && (
      <Box>
        <Typography
          variant="caption"
          sx={{
            px: 2, py: 0.5, fontWeight: 600,
            color: "text.secondary", display: "block",
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {label}
        </Typography>
        {items.map((notif) => {
          const route = getNotificationRoute(notif);
          return (
          <Box
            key={notif.id}
            onClick={() => handleNotificationNavigate(notif)}
            sx={{
              px: 2, py: 1.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
              backgroundColor: notif.read ? "transparent" : "action.hover",
              cursor: route ? "pointer" : "default",
              "&:hover": { backgroundColor: "action.selected" },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {notif.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTimeShort(notif.timestamp)}
                  </Typography>
                </Stack>
              </Box>
              <Tooltip
                title={notif.read ? "Mark as unread" : "Mark as read"}
                arrow
              >
                <IconButton
                  size="small"
                  onClick={(e) => handleToggleRead(e, notif)}
                  sx={{
                    mt: 0.25,
                    p: 0.5,
                    flexShrink: 0,
                    color: notif.read ? "text.disabled" : "primary.main",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  {notif.read ? (
                    <DraftsOutlinedIcon sx={{ fontSize: 20 }} />
                  ) : (
                    <MailIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          );
        })}
      </Box>
    );

  const isEmpty =
    !isFetching &&
    accumulated.today.length === 0 &&
    accumulated.yesterday.length === 0 &&
    accumulated.older.length === 0;

  return (
    <Box>
      {accessToken && (
        <IconButton
          onClick={handleClick}
          sx={{
            color: theme.palette.text.primary,
            "&:hover": { backgroundColor: theme.palette.action.hover },
          }}
        >
          <Badge
            badgeContent={count}
            color="error"
            invisible={count === 0}
            showZero={false}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: { xs: 320, sm: 480 }, maxHeight: 560 } } }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Notifications</Typography>
            {count > 0 && (
              <Stack alignItems="center" direction="row" gap={1}>
                <PrimaryButton
                  size="small"
                  sx={{ height: 30 }}
                  onClick={async () => {
                    try {
                      await markAllRead().unwrap();
                      resetCount();
                      setAccumulated((prev) => markAllReadInGrouped(prev));
                      showSnack("Marked all as read", "success");
                    } catch (e: any) {
                      showSnack(e?.data?.message, "error");
                    }
                  }}
                >
                  Mark All as Read
                </PrimaryButton>
                <Chip label={count} size="small" color={count === 0 ? "info" : "error"} />
              </Stack>
            )}
          </Stack>
        </Box>

        <Box sx={{ maxHeight: 450, overflowY: "auto" }}>
          {isFetching && accumulated.today.length === 0 && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          )}

          {isEmpty && (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary" variant="body2">
                No notifications yet
              </Typography>
            </Box>
          )}

          {renderSection("Today", accumulated.today)}
          {renderSection("Yesterday", accumulated.yesterday)}
          {renderSection("Older", accumulated.older)}

          {hasMore && (
            <Box sx={{
              display: "flex", justifyContent: "center",
              py: 1.5, borderTop: `1px solid ${theme.palette.divider}`,
            }}>
              {loadingMore
                ? <CircularProgress size={22} />
                : (
                  <Typography
                    variant="caption" color="primary"
                    sx={{ cursor: "pointer", fontWeight: 600 }}
                    onClick={handleLoadMore}
                  >
                    Load more
                  </Typography>
                )}
            </Box>
          )}
        </Box>
      </Menu>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        />
      )}

      {toastNotif ? (
        <NotificationPopupCard
          notification={toastNotif}
          open
          onClose={clearToastNotif}
          onOpen={
            getNotificationRoute(toastNotif)
              ? handleNotificationNavigate
              : undefined
          }
        />
      ) : null}
    </Box>
  );
}
