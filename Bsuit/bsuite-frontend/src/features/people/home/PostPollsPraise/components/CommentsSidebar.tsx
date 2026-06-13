import { useEffect, useRef, useState } from "react";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import {
    Box, Drawer, Typography, Avatar, IconButton,
    TextField, Divider, CircularProgress, ClickAwayListener,
} from "@mui/material";
import { Close, Send } from "@mui/icons-material";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useDispatch } from "react-redux";
import { Tooltip } from "../../../../../components/atom/tooltip";
import {
    announcementsApi,
    useCommentAnnouncementMutation,
} from "../api/announcements.api";
import type { AnnouncementType, Author, FeedComment, FeedItem } from "../api/announcements.api";
import type { AppDispatch } from "../../../../../store/store";

dayjs.extend(relativeTime);

const DEFAULT_FEED_QUERY = { page: 1, limit: 10 };

interface CommentsSidebarProps {
    open: boolean;
    onClose: () => void;
    postAuthor: string;
    announcementId: number;
    announcementType: AnnouncementType;
    initialComments: FeedComment[];
    currentUserId: number | null;
    currentUserName: string;
}

const toolBtnSx = {
    mx: 1.5,
    border: "1px solid",
    borderColor: "divider",
    borderRadius: "50%",
    color: "text.secondary",
    "&:hover": { color: "info.main", borderColor: "info.main" },
};

export function CommentsSidebar({
    open,
    onClose,
    postAuthor,
    announcementId,
    announcementType,
    initialComments,
    currentUserId,
    currentUserName,
}: CommentsSidebarProps) {
    const dispatch = useDispatch<AppDispatch>();
    const [newComment, setNewComment] = useState("");
    const [localComments, setLocalComments] = useState<FeedComment[]>(initialComments);
    const [showEmojis, setShowEmojis] = useState(false);

    const textRef = useRef<HTMLTextAreaElement>(null);

    const [commentAnnouncement, { isLoading: isSending }] = useCommentAnnouncementMutation();

    useEffect(() => {
        setLocalComments(initialComments);
    }, [initialComments, announcementId, announcementType]);

    const handleAddComment = async () => {
        const trimmed = newComment.trim();
        if (!trimmed) return;

        const tempId = Date.now();
        const optimistic: FeedComment = {
            id: tempId,
            comment: trimmed,
            commentedBy: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setLocalComments((prev) => [...prev, optimistic]);
        setNewComment("");

        try {
            const response = await commentAnnouncement({
                type: announcementType,
                id: announcementId,
                comment: trimmed,
            }).unwrap();

            const created = response.data;

            const enrichedCommentedBy: Partial<Author> =
                created.commentedBy?.id === currentUserId && currentUserName
                    ? {
                        ...created.commentedBy,
                        contact: {
                            id: created.commentedBy.id!,
                            name: currentUserName,
                            lastName: null,
                            email: "",
                        },
                    }
                    : created.commentedBy;

            const confirmed: FeedComment = {
                id: created.id ?? tempId,
                comment: created.comment,
                commentedBy: enrichedCommentedBy,
                createdAt: created.createdAt,
                updatedAt: created.updatedAt,
            };

            setLocalComments((prev) =>
                prev.map((c) => (c.id === tempId ? confirmed : c))
            );

            dispatch(
                announcementsApi.util.updateQueryData(
                    "getAnnouncementsFeed",
                    DEFAULT_FEED_QUERY,
                    (draft) => {
                        if (!draft?.data) return;
                        const item = draft.data.find(
                            (i) => i.feedType === announcementType && i.id === announcementId,
                        ) as (FeedItem & { comments: FeedComment[] }) | undefined;
                        if (!item) return;
                        item.commentsCount = (item.commentsCount ?? 0) + 1;
                        item.comments = [...(item.comments ?? []), confirmed];
                    },
                ),
            );
        } catch {
            setLocalComments((prev) => prev.filter((c) => c.id !== tempId));
            setNewComment(trimmed);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAddComment();
        }
    };

    const insertEmoji = (e: string) => {
        const el = textRef.current;
        const start = el?.selectionStart ?? newComment.length;
        setNewComment(newComment.slice(0, start) + e + newComment.slice(start));
        setTimeout(() => {
            if (el) {
                el.focus();
                el.selectionStart = el.selectionEnd = start + e.length;
            }
        });
    };


    const hasCommenterDisplayName = (commentedBy: Partial<Author>): boolean =>
        Boolean(commentedBy.contact?.name || commentedBy.nameAsPerPan);

    const getCommenterName = (commentedBy: Partial<Author>): string => {
        if (commentedBy.contact?.name) {
            const last = commentedBy.contact.lastName ? ` ${commentedBy.contact.lastName}` : "";
            return `${commentedBy.contact.name}${last}`;
        }
        if (commentedBy.nameAsPerPan) return commentedBy.nameAsPerPan;
        if (commentedBy.employeeId) return commentedBy.employeeId;
        return "";
    };

    const getCommenterInitials = (commentedBy: Partial<FeedComment["commentedBy"]>) => {
        const name = getCommenterName(commentedBy);
        return name ? name.slice(0, 2).toUpperCase() : "?";
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { width: { xs: "100%", sm: 400 }, display: "flex", flexDirection: "column" },
            }}
        >
            {/* Header */}
            <Box sx={{
                px: 3, py: 2,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid", borderColor: "divider",
            }}>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Comments</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {postAuthor}'s post
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose}>
                    <Close fontSize="small" />
                </IconButton>
            </Box>

            {/* Comments list */}
            <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2 }}>
                {localComments.length === 0 ? (
                    <Box sx={{
                        height: "100%", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        gap: 1, color: "text.secondary", py: 8,
                    }}>
                        <Typography variant="body2">No comments yet.</Typography>
                        <Typography variant="caption">Be the first to comment!</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                        {localComments.map((comment, idx) => {
                            const isPending = !hasCommenterDisplayName(comment.commentedBy);
                            return (
                                <Box key={comment.id}>
                                    {isPending ? (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                minHeight: 72,
                                                py: 2,
                                            }}
                                        >
                                            <CircularProgress size={24} color="primary" />
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: "flex", gap: 1.5 }}>
                                            <Avatar sx={{
                                                bgcolor: "primary.main",
                                                width: 36, height: 36,
                                                fontSize: "0.75rem", fontWeight: 600, flexShrink: 0,
                                            }}>
                                                {getCommenterInitials(comment.commentedBy)}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.5 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {getCommenterName(comment.commentedBy)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {dayjs(comment.createdAt).fromNow()}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
                                                    {comment.comment}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    {idx < localComments.length - 1 && <Divider sx={{ mt: 2.5 }} />}
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>

            {/* Input */}
            <Box sx={{
                px: 3, py: 2,
                borderTop: "1px solid", borderColor: "divider",
                display: "flex", gap: 1, alignItems: "flex-end",
                position: "relative",
            }}>
                {showEmojis && (
                    <ClickAwayListener onClickAway={() => setShowEmojis(false)}>
                        <Box sx={{
                            position: "absolute", bottom: 70, right: 65, zIndex: 2000,
                            "& .EmojiPickerReact": {
                                border: "1px solid", borderColor: "divider",
                                borderRadius: "12px", boxShadow: 3,
                            },
                        }}>
                            <EmojiPicker
                                onEmojiClick={(e) => insertEmoji(e.emoji)}
                                previewConfig={{ showPreview: false }}
                                skinTonesDisabled searchDisabled
                                height={350} width={310}
                                emojiStyle={EmojiStyle.NATIVE}
                            />
                        </Box>
                    </ClickAwayListener>
                )}

                <TextField
                    inputRef={textRef}
                    fullWidth multiline maxRows={4}
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    size="small"
                    disabled={isSending}
                    sx={{ flex: 1, "& .MuiInputBase-inputSizeSmall": { pr: 0 } }}
                    InputProps={{
                        endAdornment: (
                            <Tooltip title="Emoji">
                                <IconButton size="small" onClick={() => setShowEmojis((v) => !v)} sx={toolBtnSx}>
                                    <EmojiEmotionsOutlinedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        )
                    }}
                />
                <IconButton
                    color="primary"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSending}
                    sx={{
                        mb: 0.25,
                        bgcolor: newComment.trim() && !isSending ? "primary.main" : "transparent",
                        color: newComment.trim() && !isSending ? "white" : "text.disabled",
                        "&:hover": { bgcolor: "primary.dark" },
                        transition: "all 0.2s",
                    }}
                >
                    {isSending
                        ? <CircularProgress size={16} color="inherit" />
                        : <Send fontSize="small" />
                    }
                </IconButton>
            </Box>
        </Drawer>
    );
}