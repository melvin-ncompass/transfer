import { Stack, Box, Typography, useTheme, IconButton } from "@mui/material";
import {
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useToggleReadMutation,
  useGetUnreadCountQuery
} from "../../../components/layout/Header/NotificationSection/notification.api";
import {
  normalizeNotificationCursor,
  type NotificationCursor,
} from "../../../components/layout/Header/NotificationSection/notification.types";
import CardAtom from "../../../components/atom/card/Card";
import { Chip } from "../../../components/atom/chips";
import { useEffect, useMemo, useState } from "react";
import DraftsOutlinedIcon from "@mui/icons-material/DraftsOutlined";
import MailIcon from "@mui/icons-material/Mail";
import { Snackbar } from "../../../components/atom/snackbar";
import { formatDateTimeShort } from "../../../utils/numberFormatter";
import { SecondaryButton } from "../../../components/atom/button";
import { Tooltip } from "../../../components/atom/tooltip";
import { TabsAtom } from "../../../components/tabs";

interface NormalizedNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
  wasActionTaken: boolean;
}

export default function InboxHomeView() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [cursor, setCursor] = useState<NotificationCursor | undefined>(undefined);

  const { data: notificationsData, isLoading } = useGetNotificationsQuery(cursor);

  useEffect(() => {
    setCursor(undefined);
  }, [activeTab]);
  const [markAllRead] = useMarkAllReadMutation();
  const [toggleRead] = useToggleReadMutation();
  const { data: unreadCount } = useGetUnreadCountQuery();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  const notifications = useMemo(() => {
    const grouped = notificationsData?.data?.grouped;

    if (!grouped) {
      return { today: [], yesterday: [], older: [] };
    }

    const mapSection = (items: any[]): NormalizedNotification[] =>
      items.map((item) => ({
        id: item.id,
        title: item.subject,
        message: item.message || "",
        timestamp: item.timestamp,
        read: item.isRead,
        actionRequired: item.actionRequired || false,
        wasActionTaken: item.wasActionTaken || false,
      }));

    return {
      today: mapSection(grouped.today || []),
      yesterday: mapSection(grouped.yesterday || []),
      older: mapSection(grouped.older || []),
    };
  }, [notificationsData]);

  const filteredNotifications = useMemo(() => {
    const filterFn = (notif: NormalizedNotification) => {
      if (activeTab === 0) {
        // Take Action: Action required AND not yet taken
        return notif.actionRequired && !notif.wasActionTaken;
      }
      if (activeTab === 1) {
        // Notification: Not an action-required item
        return !notif.actionRequired;
      }
      if (activeTab === 2) {
        // Archived: Action required AND action was taken
        return notif.actionRequired && notif.wasActionTaken;
      }
      return true;
    };

    return {
      today: notifications.today.filter(filterFn),
      yesterday: notifications.yesterday.filter(filterFn),
      older: notifications.older.filter(filterFn),
    };
  }, [notifications, activeTab]);

  const handleToggleRead = async (e: React.MouseEvent, notif: NormalizedNotification) => {
    e.stopPropagation();
    try {
      await toggleRead({
        id: notif.id,
        read: !notif.read,
      }).unwrap();
      showSnack(!notif.read ? "Message marked as read" : "Message marked as unread", "success");
    } catch (err: any) {
      showSnack(err?.data?.message || "Failed to toggle message status", "error");
      console.error("Failed to toggle read state", err);
    }
  };

  const handleLoadMore = () => {
    if (!notificationsData?.data?.hasMore || !notificationsData.data.nextCursor) {
      return;
    }
    const next = normalizeNotificationCursor(
      notificationsData.data.nextCursor as NotificationCursor | string,
    );
    if (next) setCursor(next);
  };

  const renderSection = (label: string, items: NormalizedNotification[]) =>
    items.length > 0 && (
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{
            px: 2,
            py: 1,
            color: "text.secondary",
            display: "block",
            backgroundColor: theme.palette.background.default,
            borderRadius: 1,
            mb: 1
          }}
        >
          {label}
        </Typography>

        <CardAtom sx={{ borderRadius: 2 }}>
          {items.map((notif, index) => (
            <Box
              key={notif.id}
              sx={{
                px: 3,
                py: 2,
                borderBottom: index === items.length - 1 ? "none" : `1px solid ${theme.palette.divider}`,
                backgroundColor: notif.read ? "transparent" : "action.hover",
                transition: "background-color 0.2s",
                "&:hover": { backgroundColor: "action.selected" },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Typography variant="body1" sx={{ fontWeight: notif.read ? 400 : 600, color: "text.primary" }}>
                        {notif.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTimeShort(notif.timestamp)}
                      </Typography>
                    </Stack>
                  </Stack>

                  {notif.message && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {notif.message}
                    </Typography>
                  )}
                </Box>

                <Tooltip title={notif.read ? "Mark as unread" : "Mark as read"}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleToggleRead(e, notif)}
                    sx={{
                      p: 0.5,
                      color: notif.read ? "text.disabled" : "primary.main",
                      "&:hover": { backgroundColor: "action.hover" },
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
          ))}
        </CardAtom>
      </Box>
    );

  const inboxContent = (
    <Box sx={{ mt: 2 }}>
      {renderSection("Today", filteredNotifications.today)}
      {renderSection("Yesterday", filteredNotifications.yesterday)}
      {renderSection("Older", filteredNotifications.older)}

      {filteredNotifications.today.length === 0 &&
        filteredNotifications.yesterday.length === 0 &&
        filteredNotifications.older.length === 0 &&
        !isLoading && (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography color="text.secondary" variant="h6">
              {activeTab === 2 ? "No archived items" : "No items in this category"}
            </Typography>
          </Box>
        )}

      {notificationsData?.data?.hasMore && (
        <Box sx={{ textAlign: "center", mt: 4, mb: 2 }}>
          <SecondaryButton onClick={handleLoadMore} disabled={isLoading}>
            {isLoading ? "Loading..." : "Load More"}
          </SecondaryButton>
        </Box>
      )}
    </Box>
  );

  const tabs = [
    { label: "Take Action", content: inboxContent },
    { label: "Notification", content: inboxContent },
    { label: "Archived", content: inboxContent },
  ];

  return (
    <CardAtom
      elevation={2}
      sx={{
        p: 3,
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="h6" color="textPrimary">
          Inbox
        </Typography>

        <Stack direction="row" alignItems="center" spacing={2}>
          <SecondaryButton
            size="small"
            color="secondary"
            disabled={unreadCount?.data?.unreadCount === 0}
            onClick={async () => {
              try {
                await markAllRead().unwrap();
                showSnack("Marked all as read", "success");
              } catch (e: any) {
                showSnack(e?.data?.message || "Error", "error");
              }
            }}
          >
            Mark All Read
          </SecondaryButton>
          <Tooltip title="Unread Count">
            <Chip
              variant="count"
              label={`${unreadCount?.data?.unreadCount ?? 0}`}
              color="error"
              sx={{ cursor: "pointer" }}
            />
          </Tooltip>
        </Stack>
      </Stack>

      <TabsAtom
        tabs={tabs}
        value={activeTab}
        onChange={setActiveTab}
        sx={{ flex: 1, minHeight: 0 }}
        contentSx={{ p: 0 }}
      />

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </CardAtom>
  );
}
