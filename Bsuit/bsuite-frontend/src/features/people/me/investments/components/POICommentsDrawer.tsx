import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { Close, Send } from "@mui/icons-material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { POIComment } from "../api/itDeclaration.api";

dayjs.extend(relativeTime);

export interface POICommentsDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Shown under the title (e.g. line item label). */
  subtitle?: string;
  comments: POIComment[];
  loading?: boolean;
  readOnly?: boolean;
  newComment: string;
  onNewCommentChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  isSubmitting?: boolean;
}

function getCommenterInitials(user: string): string {
  const trimmed = user.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function formatCommentTime(date?: string): string {
  if (!date) return "";
  const d = dayjs(date);
  return d.isValid() ? d.fromNow() : date;
}

export function POICommentsDrawer({
  open,
  onClose,
  subtitle,
  comments,
  loading = false,
  readOnly = false,
  newComment,
  onNewCommentChange,
  onSubmit,
  isSubmitting = false,
}: POICommentsDrawerProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSubmit();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Comments
          </Typography>
          {subtitle ? (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Close comments">
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 3, py: 2 }}>
        {loading ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 8,
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
              <CircularProgress size={24} color="primary" />
              <Typography variant="body2" color="text.secondary">
                Loading comments…
              </Typography>
            </Box>
          </Box>
        ) : comments.length === 0 ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              color: "text.secondary",
              py: 8,
            }}
          >
            <Typography variant="body2">No comments yet.</Typography>
            {!readOnly ? (
              <Typography variant="caption">Be the first to comment!</Typography>
            ) : null}
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {comments.map((comment, idx) => (
              <Box key={`${comment.date}-${comment.user}-${idx}`}>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      width: 36,
                      height: 36,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {getCommenterInitials(comment.user)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 1,
                        mb: 0.5,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {comment.user || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCommentTime(comment.date)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
                      {comment.message}
                    </Typography>
                  </Box>
                </Box>
                {idx < comments.length - 1 ? <Divider sx={{ mt: 2.5 }} /> : null}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {!readOnly ? (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => onNewCommentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              size="small"
              disabled={isSubmitting}
              sx={{ flex: 1 }}
            />
            <IconButton
              color="primary"
              onClick={() => void onSubmit()}
              disabled={!newComment.trim() || isSubmitting}
              aria-label="Send comment"
              sx={{
                mb: 0.25,
                bgcolor:
                  newComment.trim() && !isSubmitting
                    ? "primary.main"
                    : "transparent",
                color:
                  newComment.trim() && !isSubmitting
                    ? "primary.contrastText"
                    : "text.disabled",
                "&:hover": { bgcolor: "primary.dark" },
                transition: "all 0.2s",
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Send fontSize="small" />
              )}
            </IconButton>
          </Box>
        </Box>
      ) : null}
    </Drawer>
  );
}
