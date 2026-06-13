import {
  Alert,
  Box,
  CircularProgress,
  Paper,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { useHelpdeskChatViewer } from "../hooks/useHelpdeskChatViewer";
import { useTicketChat } from "../hooks/useTicketChat";
import type { TicketParticipant } from "../types/ticketChat.types";
import { filterVisibleMessages } from "../utils/chatMessage.utils";
import ChatComposer from "./ChatComposer";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import EmptyChat from "./EmptyChat";

interface TicketChatPanelProps {
  ticketId: number | null;
  ticketNumber?: string;
  participants?: TicketParticipant[];
  title?: string;
  minHeight?: number | string;
}

function formatChatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TicketChatPanel({
  ticketId,
  ticketNumber,
  participants,
  title,
  minHeight = 420,
}: TicketChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { canViewInternalNotes, isOwnMessage } = useHelpdeskChatViewer();

  const {
    messages,
    connected,
    sending,
    historyLoaded,
    sendMessage,
    editMessage,
    reconnect,
  } = useTicketChat(ticketId, ticketNumber, participants, {
    onError: (message) => setErrorMessage(message),
  });

  const visibleMessages = useMemo(
    () => filterVisibleMessages(messages, canViewInternalNotes),
    [messages, canViewInternalNotes],
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [visibleMessages, sending]);

  const showLoading = Boolean(ticketId) && !historyLoaded && connected;

  return (
    <Paper
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight,
        height: "100%",
        overflow: "hidden",
        borderRadius: 2,
      }}
    >
      <ChatHeader title={title} connected={connected} />

      {!connected && historyLoaded && (
        <Alert
          severity="warning"
          sx={{ mx: 2, mt: 1.5, borderRadius: 2 }}
          action={
            <Box
              component="button"
              type="button"
              onClick={() => reconnect(ticketId)}
              sx={{
                border: 0,
                bgcolor: "transparent",
                color: "warning.dark",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            >
              Retry
            </Box>
          }
        >
          Connection lost. Messages may not send until reconnected.
        </Alert>
      )}

      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 2,
          bgcolor: "grey.50",
        }}
      >
        {showLoading ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : visibleMessages.length === 0 ? (
          <EmptyChat connected={connected} historyLoaded={historyLoaded} />
        ) : (
          visibleMessages.map((comment) => (
            <ChatMessage
              key={comment.id ?? `${comment.createdAt}-${comment.authorName}`}
              comment={comment}
              isOwnMessage={isOwnMessage(comment)}
              canEdit={isOwnMessage(comment) && Boolean(comment.id)}
              onEdit={editMessage}
              formatDateTime={formatChatDateTime}
            />
          ))
        )}
      </Box>

      <ChatComposer
        disabled={!ticketId || !connected}
        sending={sending}
        canSendInternalNotes={canViewInternalNotes}
        onSend={sendMessage}
      />

      {errorMessage && (
        <Snackbar
          message={errorMessage}
          color="error"
          onClose={() => setErrorMessage(null)}
          autoClose={5000}
        />
      )}
    </Paper>
  );
}
