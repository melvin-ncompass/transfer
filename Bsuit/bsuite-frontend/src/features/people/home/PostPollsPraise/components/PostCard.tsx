import { useState, useEffect, useRef } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
} from "@mui/material";
import { ThumbUp, ThumbUpOutlined, ChatBubbleOutline, Share, DeleteOutline, ChevronLeft, ChevronRight, Close } from "@mui/icons-material";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import PollBlock from "./PollBlock";
import { CommentsSidebar } from "./CommentsSidebar";
import { PrimaryButton } from "../../../../../components/atom/button";
import type { FeedItem, FeedPost, FeedPoll } from "../api/announcements.api";
import {
    useLikeAnnouncementMutation,
} from "../api/announcements.api";
import { useLazyGetAttachmentFileQuery } from "../../../../books/transact/transactHome/api/transact.api";
import PraiseBody from "./PraiseCard";

dayjs.extend(relativeTime);

// ─── helpers ──────────────────────────────────────────────────────────────────

function getAuthorName(author: FeedPost["author"] | FeedPoll["author"]): string {
    if (author.contact?.name) {
        const last = author.contact.lastName ? ` ${author.contact.lastName}` : "";
        return `${author.contact.name}${last}`;
    }
    return author.nameAsPerPan ?? author.employeeId;
}

function getInitials(name: string): string {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
}

function formatTimestamp(iso: string) {
    return dayjs(iso).fromNow();
}

// ─── types ────────────────────────────────────────────────────────────────────

interface PostCardProps {
    item: FeedItem;
    currentUserId: number | null;
    currentUserName: string;
    onDelete: () => void;
}

const CHAR_LIMIT = 250;

// ─── image carousel ───────────────────────────────────────────────────────────

function ImageCarousel({ images }: { images: Array<{ blobUrl: string; filename: string }> }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [openViewer, setOpenViewer] = useState(false);

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    useEffect(() => {
        if (!openViewer) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                handlePrevious();
            } else if (e.key === "ArrowRight") {
                handleNext();
            } else if (e.key === "Escape") {
                setOpenViewer(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [openViewer]);

    if (images.length === 0) return null;

    return (
        <>
            {/* Main carousel */}
            <Box sx={{ position: "relative", mb: 3 }}>
                <Box
                    sx={{
                        position: "relative",
                        width: "100%",
                        height: 300,
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "grey.100",
                    }}
                >
                    {/* Navigation */}
                    {images.length > 1 && (
                        <>
                            <IconButton
                                onClick={handlePrevious}
                                sx={{
                                    position: "absolute",
                                    left: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 2,
                                    bgcolor: "rgba(255,255,255,0.9)",
                                    boxShadow: 1,
                                    width: 32,
                                    height: 32,
                                    "&:hover": {
                                        bgcolor: "white",
                                    },
                                }}
                            >
                                <ChevronLeft sx={{ fontSize: 20 }} />
                            </IconButton>

                            <IconButton
                                onClick={handleNext}
                                sx={{
                                    position: "absolute",
                                    right: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 2,
                                    bgcolor: "rgba(255,255,255,0.9)",
                                    boxShadow: 1,
                                    width: 32,
                                    height: 32,
                                    "&:hover": {
                                        bgcolor: "white",
                                    },
                                }}
                            >
                                <ChevronRight sx={{ fontSize: 20 }} />
                            </IconButton>
                        </>
                    )}

                    {/* Clickable image */}
                    <Box
                        component="img"
                        src={images[currentIndex].blobUrl}
                        alt={images[currentIndex].filename}
                        onClick={() => setOpenViewer(true)}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            cursor: "zoom-in",
                            transition: "transform 0.2s ease",
                            "&:hover": {
                                transform: "scale(1.01)",
                            },
                        }}
                    />
                </Box>

                {/* Dots */}
                {images.length > 1 && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 1,
                            mt: 1.5,
                        }}
                    >
                        {images.map((_, index) => (
                            <Box
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    bgcolor:
                                        index === currentIndex
                                            ? "primary.main"
                                            : "grey.300",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    "&:hover": {
                                        transform: "scale(1.2)",
                                    },
                                }}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            {/* Fullscreen viewer */}
            <Dialog
                open={openViewer}
                onClose={() => setOpenViewer(false)}
                fullScreen
                sx={{
                    "& .MuiDialog-paper": {
                        bgcolor: "rgba(0,0,0,0.72)",
                        backdropFilter: "blur(6px)",
                        overflow: "hidden",
                    },
                }}
            >
                <Box
                    sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                    }}
                >
                    {/* Close button */}
                    <IconButton
                        onClick={() => setOpenViewer(false)}
                        sx={{
                            position: "absolute",
                            top: 20,
                            right: 20,
                            color: "white",
                            bgcolor: "rgba(255,255,255,0.12)",
                            zIndex: 3,
                            width: 44,
                            height: 44,
                            "&:hover": {
                                bgcolor: "rgba(255,255,255,0.2)",
                                transform: "scale(1.05)",
                            },
                            transition: "all 0.2s ease",
                        }}
                    >
                        <Close />
                    </IconButton>

                    {/* Left nav */}
                    {images.length > 1 && (
                        <IconButton
                            onClick={handlePrevious}
                            sx={{
                                position: "absolute",
                                left: 24,
                                color: "white",
                                bgcolor: "rgba(255,255,255,0.12)",
                                zIndex: 2,
                                "&:hover": {
                                    bgcolor: "rgba(255,255,255,0.2)",
                                },
                            }}
                        >
                            <ChevronLeft sx={{ fontSize: 40 }} />
                        </IconButton>
                    )}

                    {/* Image */}
                    <Box
                        component="img"
                        src={images[currentIndex].blobUrl}
                        alt={images[currentIndex].filename}
                        sx={{
                            maxWidth: "95%",
                            maxHeight: "95vh",
                            objectFit: "contain",
                            borderRadius: 2,
                            userSelect: "none",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
                        }}
                    />

                    {/* Right nav */}
                    {images.length > 1 && (
                        <IconButton
                            onClick={handleNext}
                            sx={{
                                position: "absolute",
                                right: 24,
                                color: "white",
                                bgcolor: "rgba(255,255,255,0.12)",
                                zIndex: 2,
                                "&:hover": {
                                    bgcolor: "rgba(255,255,255,0.2)",
                                },
                            }}
                        >
                            <ChevronRight sx={{ fontSize: 40 }} />
                        </IconButton>
                    )}

                    {/* Counter */}
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 24,
                            left: "50%",
                            transform: "translateX(-50%)",
                            px: 2,
                            py: 0.75,
                            borderRadius: 10,
                            bgcolor: "rgba(0,0,0,0.45)",
                        }}
                    >
                        <Typography variant="body2" sx={{ color: "white" }}>
                            {currentIndex + 1} / {images.length}
                        </Typography>
                    </Box>
                </Box>
            </Dialog>
        </>
    );
}

// ─── attachment images loader ─────────────────────────────────────────────────

function AttachmentImagesLoader({ attachments }: { attachments: Array<{ path: string; filename: string }> }) {
    const [fetchFile] = useLazyGetAttachmentFileQuery();
    const [loadedImages, setLoadedImages] = useState<Array<{ blobUrl: string; filename: string }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const urls: string[] = [];

        const loadImages = async () => {
            const results: Array<{ blobUrl: string; filename: string }> = [];

            for (const att of attachments) {
                try {
                    const blob = await fetchFile(att.path).unwrap();
                    if (cancelled) break;
                    const url = URL.createObjectURL(blob as Blob);
                    urls.push(url);
                    results.push({ blobUrl: url, filename: att.filename });
                } catch (error) {
                    console.error('Failed to load image:', error);
                }
            }

            if (!cancelled) {
                setLoadedImages(results);
                setLoading(false);
            }
        };

        loadImages();

        return () => {
            cancelled = true;
            urls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [attachments, fetchFile]);

    if (loading) {
        return (
            <Box sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 300,
                bgcolor: "grey.100",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                mb: 3,
            }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    if (loadedImages.length === 0) return null;

    return <ImageCarousel images={loadedImages} />;
}

// ─── sub-renderers ────────────────────────────────────────────────────────────

function PostBody({ item }: { item: FeedPost }) {
    const [expanded, setExpanded] = useState(false);
    const isLong = item.content.length > CHAR_LIMIT;
    return (
        <Box sx={{ mb: item.attachments?.length ? 2.5 : 3, flexGrow: 1 }}>
            <Typography variant="body1" sx={{ lineHeight: 1.6, color: "text.primary" }}>
                {isLong && !expanded ? `${item.content.slice(0, CHAR_LIMIT)}...` : item.content}
            </Typography>
            {isLong && (
                <Typography variant="body2" onClick={() => setExpanded((p) => !p)}
                    sx={{ mt: 0.5, color: "primary.main", cursor: "pointer", fontWeight: 500, display: "inline-block", "&:hover": { textDecoration: "underline" } }}>
                    {expanded ? "View Less" : "View More"}
                </Typography>
            )}
        </Box>
    );
}

function PollBody({ item, currentUserId }: { item: FeedPoll; currentUserId: number | null }) {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1" sx={{ lineHeight: 1.6, color: "text.primary", mb: 1.5 }}>{item.question}</Typography>
            <PollBlock poll={item} currentUserId={currentUserId} />
        </Box>
    );
}

function PostCard({ item, currentUserId, currentUserName, onDelete }: PostCardProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isLikedByMe =
        currentUserId != null &&
        (item.likes?.some((l) => l.likedBy?.id === currentUserId) ?? false);

    const [liked, setLiked] = useState(isLikedByMe);
    const [likeCount, setLikeCount] = useState(item.likesCount ?? 0);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const [likeAnnouncement] = useLikeAnnouncementMutation();

    const likesSignature = item.likes?.map(l => l.likedBy?.id).join(",") ?? "";

    useEffect(() => {
        const serverLiked =
            currentUserId != null &&
            (item.likes?.some((l) => l.likedBy?.id === currentUserId) ?? false);
        setLiked(serverLiked);
        setLikeCount(item.likesCount ?? 0);
    }, [item.id, item.feedType, likesSignature, currentUserId]);

    const author = item.feedType === "praise" ? item.praisedBy : item.author;
    const authorLabel = getAuthorName(author);
    const timestamp = formatTimestamp(item.createdAt);
    const attachments = item.attachments ?? [];

    const isOwner = currentUserId !== null && author.id === currentUserId;

    const isPraise = item.feedType === "praise";

    const handleLike = async () => {
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikeCount((prev) => (wasLiked ? prev - 1 : prev + 1));

        try {
            await likeAnnouncement({ type: item.feedType, id: item.id }).unwrap();
        } catch {
            setLiked(wasLiked);
            setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1));
        }
    };

    const handleDelete = async () => {
        try {
            await onDelete();
        } finally {
            setConfirmOpen(false);
        }
    };

    const deleteLabel = item.feedType === "post" ? "Post"
        : item.feedType === "poll" ? "Poll"
            : "Praise";

    return (
        <Card
            elevation={0}
            sx={{
                border: "1px solid",
                borderColor: isPraise ? "warning.200" : "divider",
                borderRadius: 2,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "fit-content",
            }}
        >
            <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "fit-content" }}>

                {/* Author header */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
                    <Avatar sx={{
                        bgcolor: isPraise ? "warning.main" : "primary.main",
                        mr: 2, width: 48, height: 48, fontSize: "1rem", fontWeight: 600,
                    }}>
                        {getInitials(authorLabel)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.25 }}>
                                {authorLabel}
                            </Typography>
                            {isPraise && (
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.25 }}>
                                    gave praise
                                </Typography>
                            )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">{timestamp}</Typography>
                    </Box>

                    {isOwner && (
                        <IconButton size="small" onClick={() => setConfirmOpen(true)}
                            sx={{ color: "text.disabled", "&:hover": { color: "error.main", bgcolor: "error.50" } }}>
                            <DeleteOutline sx={{ fontSize: 18 }} />
                        </IconButton>
                    )}
                </Box>

                {/* Body */}
                {item.feedType === "post" && <PostBody item={item} />}
                {item.feedType === "poll" && <PollBody item={item} currentUserId={currentUserId} />}
                {item.feedType === "praise" && <PraiseBody item={item} />}

                {/* Attachments */}
                {attachments.length > 0 && (
                    <AttachmentImagesLoader attachments={attachments} />
                )}

                <Box sx={{ mt: "auto", pt: 2 }} />

                {/* Actions */}
                <Box sx={{ display: "flex", gap: 1, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                    <Button
                        startIcon={
                            liked
                                ? <ThumbUp sx={{ fontSize: "18px !important", color: "primary.main" }} />
                                : <ThumbUpOutlined sx={{ fontSize: "18px !important" }} />
                        }
                        size="small"
                        onClick={handleLike}
                        sx={{
                            color: liked ? "primary.main" : "text.secondary",
                            textTransform: "none",
                            px: 1.5,
                            py: 0.75,
                            minWidth: "auto",
                            fontWeight: liked ? 700 : 400,
                            bgcolor: liked ? "primary.50" : "transparent",
                            border: "1px solid",
                            borderColor: liked ? "primary.200" : "transparent",
                            borderRadius: 2,
                            transition: "all 0.15s ease",
                            "&:hover": {
                                bgcolor: liked ? "primary.100" : "action.hover",
                                borderColor: liked ? "primary.300" : "transparent",
                                color: "primary.main",
                            },
                            "&:active": {
                                transform: "scale(0.93)",
                            },
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                ml: 0.5,
                                fontWeight: liked ? 700 : 400,
                                color: liked ? "primary.main" : "text.secondary",
                            }}
                        >
                            {likeCount}
                        </Typography>
                    </Button>

                    <Button
                        startIcon={<ChatBubbleOutline sx={{ fontSize: "18px !important" }} />}
                        size="small" onClick={() => setSidebarOpen(true)}
                        sx={{
                            color: "text.secondary", textTransform: "none",
                            px: 1.5, py: 0.75, minWidth: "auto",
                            "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                        }}
                    >
                        <Typography variant="body2" sx={{ ml: 0.5 }}>{item.commentsCount}</Typography>
                    </Button>

                    {item.feedType !== "poll" && (
                        <IconButton size="small"
                            sx={{ color: "text.secondary", px: 1.5, py: 0.75, "&:hover": { bgcolor: "action.hover", color: "primary.main" } }}>
                            <Share sx={{ fontSize: "18px !important" }} />
                        </IconButton>
                    )}
                </Box>

                <CommentsSidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    postAuthor={authorLabel}
                    announcementId={item.id}
                    announcementType={item.feedType}
                    initialComments={item.comments ?? []}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                />

                <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ fontWeight: 600 }}>Delete {deleteLabel}?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            This action cannot be undone. Are you sure you want to delete this {deleteLabel.toLowerCase()}?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <PrimaryButton variant="outlined" size="small" onClick={() => setConfirmOpen(false)}
                            sx={{ borderColor: "divider", color: "text.primary" }}>
                            Cancel
                        </PrimaryButton>
                        <PrimaryButton variant="contained" size="small" color="error" onClick={handleDelete}>
                            Delete
                        </PrimaryButton>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
}

export default PostCard;