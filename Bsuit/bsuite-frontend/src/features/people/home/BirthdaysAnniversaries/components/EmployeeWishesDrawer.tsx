import { useEffect, useMemo, useState, useRef } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Close, FavoriteBorder, FavoriteRounded } from "@mui/icons-material";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { useGetEmployeeInfoQuery } from "../../../api/people.api";
import {
  type BirthdayPerson,
  type EmployeeWish,
  type WishLike,
  useCreateWishMutation,
  useGetEmployeeWishesQuery,
  useLikeWishMutation,
} from "../api/birthday.api";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export interface EmployeeWishesDrawerProps {
  open: boolean;
  employee: BirthdayPerson | null;
  occasionType: "birthday" | "work_anniversary";
  onClose: () => void;
}

export function EmployeeWishesDrawer({
  open,
  employee,
  occasionType,
  onClose,
}: EmployeeWishesDrawerProps) {
  const [wishText, setWishText] = useState("");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "info" });

  const { data: me } = useGetEmployeeInfoQuery();
  const myEmployeeId = me?.data?.employeeId ?? null;

  const isReceiver = employee?.employeeId === myEmployeeId;
  const textFieldRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);

  const handleAddEmoji = (emoji: string) => {
    const input = textFieldRef.current;
    if (input) {
      const start = input.selectionStart ?? wishText.length;
      const end = input.selectionEnd ?? wishText.length;
      const newText = wishText.substring(0, start) + emoji + wishText.substring(end);
      setWishText(newText.slice(0, 250));
      
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setWishText((prev) => (prev + emoji).slice(0, 250));
    }
  };

  const {
    data: wishesResponse,
    isFetching: isWishesLoading,
  } = useGetEmployeeWishesQuery(
    { employeeId: employee?.employeeId ?? 0, occasionType },
    { skip: !open || !employee?.employeeId, refetchOnMountOrArgChange: true },
  );

  const [createWish, { isLoading: isSendingWish }] = useCreateWishMutation();
  const [likeWish] = useLikeWishMutation();
  const [likingWishIds, setLikingWishIds] = useState<Set<number>>(new Set());

  const [optimisticWishes, setOptimisticWishes] = useState<EmployeeWish[]>([]);
  useEffect(() => {
    const wishes = Array.isArray(wishesResponse?.data?.wishes)
      ? wishesResponse.data.wishes
      : [];
    setOptimisticWishes(wishes);
  }, [wishesResponse?.data?.wishes, employee?.employeeId, occasionType]);

  useEffect(() => {
    if (!open) {
      setWishText("");
    }
  }, [open]);

  const wishes = optimisticWishes;
  const drawerTitle = employee
    ? `${employee.name.split(" ")[0]}'s wishes`
    : "Wishes";
  const todayIso = new Date().toISOString().split("T")[0];

  const showToast = (
    message: string,
    color: "success" | "error" | "info" | "warning" = "success",
  ) => setSnackbar({ open: true, message, color });

  const getBackendMessage = (error: unknown) => {
    const err = error as { data?: { message?: string } };
    return err?.data?.message;
  };

  const handleSendWish = async () => {
    if (!employee || !wishText.trim()) return;
    const trimmedWish = wishText.trim();
    const optimisticWish: EmployeeWish = {
      id: Date.now(),
      date: todayIso,
      message: trimmedWish,
      occasionType,
      status: "active",
      likes: [],
      wishedBy: {
        id: myEmployeeId ?? 0,
        name: "You",
      },
      createdAt: new Date().toISOString(),
    };

    setOptimisticWishes((prev) => [optimisticWish, ...prev]);
    setWishText("");
    try {
      await createWish({
        employeeId: employee.employeeId,
        message: trimmedWish,
        occasionType,
      }).unwrap();

      let successMsg = "";
      if (isReceiver) {
        successMsg = occasionType === "birthday"
          ? "Your birthday message has been posted successfully! 🎉"
          : "Your anniversary message has been posted successfully! ✨";
      } else {
        successMsg = occasionType === "birthday"
          ? `Your birthday wish has been sent to ${employee.name.split(" ")[0]}! 🎂`
          : `Your anniversary wish has been sent to ${employee.name.split(" ")[0]}! 🎗️`;
      }
      showToast(successMsg, "success");
    } catch (error) {
      setOptimisticWishes((prev) => prev.filter((wish) => wish.id !== optimisticWish.id));
      const backendMessage = getBackendMessage(error);
      if (backendMessage) {
        showToast(backendMessage, "error");
      }
    }
  };

  const handleLikeWish = async (wishId: number) => {
    if (!employee || !myEmployeeId || likingWishIds.has(wishId)) return;
    const targetWish = wishes.find((wish) => wish.id === wishId);
    if (!targetWish) return;

    const alreadyLiked = (targetWish.likes ?? []).some(
      (like: WishLike) => like?.likedBy?.id === myEmployeeId,
    );

    const optimisticLike = {
      id: Date.now(),
      likedBy: { id: myEmployeeId },
    };

    setLikingWishIds((prev) => new Set(prev).add(wishId));
    setOptimisticWishes((prev) =>
      prev.map((wish) => {
        if (wish.id !== wishId) return wish;
        return {
          ...wish,
          likes: alreadyLiked
            ? (wish.likes ?? []).filter((like: WishLike) => like?.likedBy?.id !== myEmployeeId)
            : [...(wish.likes ?? []), optimisticLike],
        };
      }),
    );

    try {
      await likeWish({ wishId, employeeId: employee.employeeId }).unwrap();
    } catch {
      setOptimisticWishes((prev) =>
        prev.map((wish) => {
          if (wish.id !== wishId) return wish;
          return {
            ...wish,
            likes: alreadyLiked
              ? [...(wish.likes ?? []), optimisticLike]
              : (wish.likes ?? []).filter((like: WishLike) => like?.likedBy?.id !== myEmployeeId),
          };
        }),
      );
    } finally {
      setLikingWishIds((prev) => {
        const next = new Set(prev);
        next.delete(wishId);
        return next;
      });
    }
  };

  const hasLiked = (wish: EmployeeWish) => {
    if (!myEmployeeId) return false;
    return (wish.likes ?? []).some((like: WishLike) => like?.likedBy?.id === myEmployeeId);
  };

  const hasWishedToday = wishesResponse?.data?.hasWished ?? false;

  const sortedWishes = useMemo(
    () =>
      [...wishes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [wishes],
  );

  const handleDrawerClose = () => {
    setWishText("");
    setShowEmojis(false);
    onClose();
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleDrawerClose}
        PaperProps={{
          sx: {
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            width: { xs: "100vw", sm: 460 },
            maxWidth: "100vw",
            height: "100%",
            p: 2,
            pb:1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} gap={1}>
            <Box display="flex" alignItems="center" gap={1} minWidth={0}>
              {employee && (
                <Avatar
                  src={employee.profileUrl ?? employee.contact?.profileUrl ?? undefined}
                  sx={{ width: 30, height: 30, fontSize: 12 }}
                >
                  {getInitials(employee.name)}
                </Avatar>
              )}
              <Typography
                variant="h6"
                sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {drawerTitle} ({sortedWishes.length})
              </Typography>
            </Box>
            <IconButton size="small" aria-label="Close drawer" onClick={handleDrawerClose}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.25 }}>
            {isWishesLoading ? (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={22} />
              </Box>
            ) : wishes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No wishes yet. Be the first to wish!
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                {sortedWishes.map((wish) => (
                  <Box
                    key={wish.id}
                    sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1.25 }}
                  >
                    <Box display="flex" justifyContent="space-between" gap={1} alignItems="center">
                      <Box display="flex" alignItems="center" gap={0.75} minWidth={0}>
                        <Avatar
                          src={wish?.wishedBy?.profileUrl ?? undefined}
                          sx={{ width: 24, height: 24, fontSize: 11 }}
                        >
                          {getInitials(
                            [wish?.wishedBy?.name, wish?.wishedBy?.lastName]
                              .filter(Boolean)
                              .join(" ") || "Employee",
                          )}
                        </Avatar>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                        >
                          {[wish?.wishedBy?.name, wish?.wishedBy?.lastName]
                            .filter(Boolean)
                            .join(" ") || "Employee"}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(wish.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" mt={0.5}>
                      {wish.message}
                    </Typography>
                    <Box mt={0.75} display="flex" justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleLikeWish(wish.id)}
                        disabled={likingWishIds.has(wish.id)}
                        sx={{
                          minWidth: 48,
                          px: 0.5,
                          fontSize: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 0.5,
                        }}
                      >
                        <Box sx={{ width: 16, display: "inline-flex", justifyContent: "center" }}>
                          {hasLiked(wish) ? (
                            <FavoriteRounded fontSize="small" />
                          ) : (
                            <FavoriteBorder fontSize="small" />
                          )}
                        </Box>
                        {wish.likes?.length ?? 0}
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              pt: 1.5,
              mt: 1.5,
              bgcolor: "background.paper",
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box display="flex" justifyContent="space-between" sx={{ width: "100%" }}>
              {hasWishedToday && !isReceiver ? (
                <Typography variant="caption" color="success.main" sx={{ alignSelf: "center", fontWeight: 500 }}>
                  You have already sent a wish today
                </Typography>
              ) : (
                <Box sx={{ width: "100%" }}>
                  <TextField
                    inputRef={textFieldRef}
                    multiline
                    minRows={2}
                    maxRows={4}
                    fullWidth
                    placeholder={isReceiver ? "Write a reply or thank you..." : "Write a wish..."}
                    value={wishText}
                    onChange={(e) => setWishText(e.target.value.slice(0, 250))}
                    helperText={`${wishText.length}/250`}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          size="small"
                          onClick={() => setShowEmojis((prev) => !prev)}
                          sx={{
                            color: "text.secondary",
                            "&:hover": { color: "primary.main" },
                          }}
                        >
                          <EmojiEmotionsOutlinedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      )
                    }}
                  />
                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <Button
                      onClick={handleSendWish}
                      variant="contained"
                      disabled={!wishText.trim() || isSendingWish}
                    >
                      {isSendingWish ? "Sending..." : isReceiver ? "Post message" : "Send wish"}
                    </Button>
                  </Box>
                  {showEmojis && (
                    <ClickAwayListener onClickAway={() => setShowEmojis(false)}>
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: "100%",
                          right: 0,
                          mb: 1.5,
                          zIndex: 2000,
                          "& .EmojiPickerReact": {
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: "12px",
                            boxShadow: 3,
                          },
                          "& .epr-emoji span": {
                            fontSize: "16px",
                          },
                          "& .epr-emoji-category": {
                            gap: "2px !important",
                          },
                        }}
                      >
                        <EmojiPicker
                          onEmojiClick={(e) => handleAddEmoji(e.emoji)}
                          previewConfig={{ showPreview: false }}
                          skinTonesDisabled
                          searchDisabled
                          height={320}
                          width={290}
                          emojiStyle={EmojiStyle.NATIVE}
                        />
                      </Box>
                    </ClickAwayListener>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Drawer>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          autoClose={4000}
        />
      )}
    </>
  );
}
