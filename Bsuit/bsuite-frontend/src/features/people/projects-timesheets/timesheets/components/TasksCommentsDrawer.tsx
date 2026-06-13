import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
  useTheme,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";
import { useGetAttendanceTasksQuery } from "../../../me/attendance/api/attendance.api";
import { mapAttendanceTasksToDrawerCards } from "../utils/timesheet.utils";

const formatCommentDate = (date?: string) => {
  if (!date) return "";
  const parsed = dayjs(date);
  return parsed.isValid() ? parsed.format("MMM D, YYYY") : date;
};

interface TasksCommentsDrawerProps {
  open: boolean;
  onClose: () => void;
  attendanceId: number | null;
}

export function TasksCommentsDrawer({
  open,
  onClose,
  attendanceId,
}: TasksCommentsDrawerProps) {
  const theme = useTheme();
  const { data, isLoading, isFetching } = useGetAttendanceTasksQuery(
    attendanceId ?? 0,
    { skip: !open || !attendanceId },
  );

  const tasks = mapAttendanceTasksToDrawerCards(data);
  const loading = isLoading || isFetching;

  const allComments = tasks.flatMap((t) => t.comments ?? []);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { sx: { width: { xs: "100%", sm: 420 }, p: 0 } },
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={600}>
            Tasks & Comments
          </Typography>
          <IconButton aria-label="Close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ p: 2.5, overflowY: "auto" }}>
        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Tasks:
            </Typography>

            {tasks.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ py: 2, textAlign: "center" }}
              >
                No tasks available
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {tasks.map((task, index) => (
                  <Box
                    key={`${task.type}-${index}`}
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: theme.shadows[1],
                      bgcolor: "background.paper",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      gap={2}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          color="primary"
                          fontWeight={600}
                          gutterBottom
                        >
                          {task.title ? `${task.type} — ${task.title}` : task.type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Description:
                        </Typography>
                        <Typography variant="body2">{task.description}</Typography>
                      </Box>
                      {task.hours != null && task.hours !== "" && (
                        <Box textAlign="right" flexShrink={0}>
                          <Typography
                            variant="h6"
                            color="success.main"
                            fontWeight={700}
                            lineHeight={1.2}
                          >
                            {Number(task.hours).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Hours Spent
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}

            <Divider sx={{ my: 2.5 }} />

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Comments:
            </Typography>
            {allComments.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ py: 2, textAlign: "center" }}
              >
                No comments available
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {allComments.map((c, i) => (
                  <Box
                    key={i}
                    sx={{
                      pl: 2,
                      borderLeft: "4px solid",
                      borderColor: "warning.main",
                    }}
                  >
                    <Typography variant="body2">{c.message}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      By {c.user} on {formatCommentDate(c.date)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
}
