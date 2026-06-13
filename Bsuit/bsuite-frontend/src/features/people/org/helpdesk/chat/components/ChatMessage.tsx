import { Box, IconButton, Stack, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { TextAreaField } from "../../../../../../components/atom/text-area-field";
import type { TicketComment } from "../types/ticketChat.types";
import { isSystemMessage } from "../utils/chatMessage.utils";
import InternalNoteBadge from "./InternalNoteBadge";

interface ChatMessageProps {
  comment: TicketComment;
  isOwnMessage: boolean;
  canEdit: boolean;
  onEdit: (messageId: string, newMessage: string) => void;
  formatDateTime: (value: string) => string;
}

export default function ChatMessage({
  comment,
  isOwnMessage,
  canEdit,
  onEdit,
  formatDateTime,
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.message);

  if (isSystemMessage(comment.message)) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 0.75,
            borderRadius: 2,
            bgcolor: "action.hover",
            color: "text.secondary",
            textAlign: "center",
            maxWidth: "85%",
          }}
        >
          {comment.message}
          <Box component="span" sx={{ display: "block", mt: 0.25, opacity: 0.8 }}>
            {formatDateTime(comment.createdAt)}
          </Box>
        </Typography>
      </Box>
    );
  }

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed || !comment.id) return;
    onEdit(comment.id, trimmed);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(comment.message);
    setIsEditing(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
        mb: 1.5,
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: "92%", sm: "72%" },
          px: 1.75,
          py: 1.25,
          borderRadius: 2,
          bgcolor: comment.isInternal
            ? "warning.light"
            : isOwnMessage
              ? "primary.main"
              : "grey.100",
          color: comment.isInternal
            ? "warning.contrastText"
            : isOwnMessage
              ? "primary.contrastText"
              : "text.primary",
          border: comment.isInternal ? 1 : 0,
          borderColor: comment.isInternal ? "warning.main" : "transparent",
          position: "relative",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{
              color: comment.isInternal
                ? "warning.dark"
                : isOwnMessage
                  ? "primary.contrastText"
                  : "text.secondary",
            }}
          >
            {comment.authorName}
          </Typography>
          {comment.isInternal && <InternalNoteBadge />}
        </Stack>

        {isEditing ? (
          <Stack spacing={1} mt={0.5}>
            <TextAreaField
              label="Edit message"
              value={draft}
              onChange={setDraft}
              rows={3}
              sx={{ width: "100%" }}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <PrimaryButton
                size="small"
                variant="outlined"
                onClick={handleCancel}
                sx={{ minWidth: 0, px: 1 }}
              >
                <CloseIcon fontSize="small" />
              </PrimaryButton>
              <PrimaryButton
                size="small"
                onClick={handleSave}
                disabled={!draft.trim()}
                sx={{ minWidth: 0, px: 1 }}
              >
                <CheckIcon fontSize="small" />
              </PrimaryButton>
            </Stack>
          </Stack>
        ) : (
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: comment.isInternal
                ? "warning.dark"
                : isOwnMessage
                  ? "primary.contrastText"
                  : "text.primary",
            }}
          >
            {comment.message}
          </Typography>
        )}

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          mt={0.75}
        >
          <Typography
            variant="caption"
            sx={{
              opacity: 0.85,
              color: comment.isInternal
                ? "warning.dark"
                : isOwnMessage
                  ? "primary.contrastText"
                  : "text.secondary",
            }}
          >
            {formatDateTime(comment.createdAt)}
            {comment.isEdited && " (edited)"}
          </Typography>

          {canEdit && comment.id && !isEditing && (
            <IconButton
              size="small"
              aria-label="Edit message"
              onClick={() => {
                setDraft(comment.message);
                setIsEditing(true);
              }}
              sx={{
                color: isOwnMessage ? "primary.contrastText" : "text.secondary",
                p: 0.25,
              }}
            >
              <EditOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
