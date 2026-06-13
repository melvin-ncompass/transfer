import { useState } from "react";
import {
    Box,
    Card,
    MenuItem,
    Select,
    Typography,
    Drawer,
    IconButton,
    Divider,
    CircularProgress,
    TextField,
    FormControlLabel,
    Button,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PollOutlinedIcon from "@mui/icons-material/PollOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import { PrimaryButton } from "../../../../components/atom/button";
import { Checkbox } from "../../../../components/atom/check-box";
import { Tooltip } from "../../../../components/atom/tooltip";
import { DatePickerElement } from "../../../../components/atom/date-picker";
import { Dayjs } from "dayjs";
import { useCreatePollMutation } from "./api/announcements.api";
import { Snackbar } from "../../../../components/atom/snackbar";

import PraiseTab from "./components/PraiseTab";
import PostTab from "./components/PostTab";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PollOption {
    id: number;
    value: string;
}

export interface MentionedEmployee {
    id: number;
    name: string;
    designation?: string;
}

export interface TabProps {
    onCancel: () => void;
    onPostCreated: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

let _nextId = 0;
const uid = () => ++_nextId;

type DrawerType = "post" | "poll" | "praise";

const DRAWER_META: Record<DrawerType, { label: string; icon: React.ReactNode }> = {
    post: { label: "Post", icon: <ImageOutlinedIcon sx={{ fontSize: 18 }} /> },
    poll: { label: "Poll", icon: <PollOutlinedIcon sx={{ fontSize: 18 }} /> },
    praise: { label: "Praise", icon: <EmojiEventsOutlinedIcon sx={{ fontSize: 18 }} /> },
};

// ─── Shared Footer ─────────────────────────────────────────────────────────────

const DEFAULT_POSTING_OPTIONS = ["Organization", "My Team", "Department"] as const;

interface FooterProps {
    onCancel: () => void;
    onPost: () => void;
    isLoading?: boolean;
    postDisabled?: boolean;
    postDisabledReason?: string;
    showPostingTo?: boolean;
    postingTo?: string;
    onPostingToChange?: (v: string) => void;
    postingOptions?: readonly string[];
}

export function Footer({
    onCancel,
    onPost,
    isLoading,
    postDisabled,
    postDisabledReason,
    showPostingTo = true,
    postingTo = DEFAULT_POSTING_OPTIONS[0],
    onPostingToChange,
    postingOptions = DEFAULT_POSTING_OPTIONS,
}: FooterProps) {
    const showPostDisabledTooltip = Boolean(postDisabled && postDisabledReason && !isLoading);

    const postButton = (
        <PrimaryButton
            variant="contained"
            size="small"
            onClick={onPost}
            disabled={isLoading || postDisabled}
            sx={{
                bgcolor: "info.main",
                "&:hover": { bgcolor: "info.dark" },
                px: 4,
                minWidth: 80,
            }}
        >
            {isLoading ? <CircularProgress size={16} color="inherit" /> : "Post"}
        </PrimaryButton>
    );
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: showPostingTo ? "space-between" : "flex-end",
                px: 2,
                py: 1.5,
                borderTop: "1px solid",
                borderColor: "divider",
            }}
        >
            {showPostingTo && onPostingToChange && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                        Posting to
                    </Typography>
                    <Select
                        value={postingTo}
                        onChange={(e) => onPostingToChange(e.target.value)}
                        size="small"
                        sx={{
                            fontSize: 13,
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
                            width: 150,
                        }}
                    >
                        {postingOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>
            )}

            <Box sx={{ display: "flex", gap: 1 }}>
                <PrimaryButton
                    variant="outlined"
                    size="small"
                    onClick={onCancel}
                    disabled={isLoading}
                    sx={{ borderColor: "divider", color: "text.primary", px: 3 }}
                >
                    Cancel
                </PrimaryButton>
                {showPostDisabledTooltip ? (
                    <Tooltip title={postDisabledReason!} placement="top" maxWidth={320}>
                        {postButton}
                    </Tooltip>
                ) : (
                    postButton
                )}
            </Box>
        </Box>
    );
}

// ─── Poll Tab ─────────────────────────────────────────────────────────────────

function PollTab({ onCancel, onPostCreated }: TabProps) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState<PollOption[]>([
        { id: uid(), value: "" },
        { id: uid(), value: "" },
        { id: uid(), value: "" },
    ]);
    const [expiry, setExpiry] = useState<Dayjs | null>(null);
    const [anonymous, setAnonymous] = useState(false);

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        color: "success" | "error" | "info" | "warning";
    }>({ open: false, message: "", color: "info" });

    const showMessage = (msg: string, color: "success" | "error" = "success") => {
        setSnackbar({ open: true, message: msg, color });
    };

    const [createPoll, { isLoading }] = useCreatePollMutation();

    const addOption = () =>
        setOptions((prev) => [...prev, { id: uid(), value: "" }]);

    const removeOption = (id: number) =>
        setOptions((prev) => (prev.length > 2 ? prev.filter((o) => o.id !== id) : prev));

    const updateOption = (id: number, value: string) =>
        setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, value } : o)));

    const reset = () => {
        setQuestion("");
        setOptions([
            { id: uid(), value: "" },
            { id: uid(), value: "" },
            { id: uid(), value: "" },
        ]);
        setExpiry(null);
        setAnonymous(false);
    };

    const handleCancel = () => {
        reset();
        onCancel();
    };

    const handlePost = async () => {
        if (!question.trim()) return;

        const filledOptions = options.filter((o) => o.value.trim());
        if (filledOptions.length < 2 || !expiry) return;

        try {
            await createPoll({
                question: question.trim(),
                options: filledOptions.map((o) => ({ option: o.value.trim() })),
                expiryDate: expiry.toISOString(),
                isAnonymous: anonymous,
            }).unwrap();
            showMessage("Poll created successfully!", "success");
            reset();
            onCancel();
            onPostCreated();
        } catch (err) {
            console.error("Failed to create poll:", err);
            showMessage("Failed to create poll. Please try again.", "error");
        }
    };

    const isPostDisabled =
        !question.trim() ||
        options.some((o) => !o.value.trim()) ||
        options.filter((o) => o.value.trim()).length < 2 ||
        !expiry;

    const postDisabledReason = (() => {
        const reasons: string[] = [];
        if (!question.trim()) reasons.push("Enter a poll question");
        const filledCount = options.filter((o) => o.value.trim()).length;
        if (options.some((o) => !o.value.trim())) {
            reasons.push("Fill in all poll options");
        } else if (filledCount < 2) {
            reasons.push("Add at least 2 poll options");
        }
        if (!expiry) reasons.push("Select a poll expiry date");
        return reasons.length > 0 ? reasons.join(". ") : undefined;
    })();

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ px: 2, pt: 2, pb: 1, flex: 1, overflowY: "auto" }}>
                <TextField
                    fullWidth
                    variant="standard"
                    placeholder="What this poll is about"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    sx={{ mb: 2, "& input": { fontSize: 14 } }}
                />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 1.5 }}>
                    {options.map((opt) => (
                        <Box key={opt.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <TextField
                                size="small"
                                variant="outlined"
                                placeholder="Add option here"
                                value={opt.value}
                                onChange={(e) => updateOption(opt.id, e.target.value)}
                                fullWidth
                                sx={{
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
                                    "& input": { fontSize: 14 },
                                }}
                            />
                            <IconButton
                                size="small"
                                onClick={() => removeOption(opt.id)}
                                sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}
                            >
                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Box>
                    ))}
                </Box>

                <Button
                    size="small"
                    onClick={addOption}
                    sx={{
                        color: "info.main",
                        fontSize: 13,
                        p: 0,
                        mb: 2,
                        "&:hover": { bgcolor: "transparent", color: "info.dark" },
                    }}
                >
                    + Add Option
                </Button>

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                        pt: 1.5,
                        borderTop: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    {/* Row 1 — expiry date */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                            Poll Expires on
                        </Typography>
                        <DatePickerElement
                            width='100%'
                            size="small"
                            format="MMM DD, YYYY"
                            value={expiry}
                            onChange={(newValue) => setExpiry(newValue)}
                        />
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Tooltip title="Identity of voters will be hidden" placement="left-start">
                            <FormControlLabel
                                control={<Checkbox checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />}
                                label={<Typography variant="body2">Anonymous poll</Typography>}
                            />
                        </Tooltip>
                    </Box>
                </Box>
            </Box>

            <Footer
                showPostingTo={false}
                onCancel={handleCancel}
                onPost={handlePost}
                isLoading={isLoading}
                postDisabled={isPostDisabled}
                postDisabledReason={postDisabledReason}
            />

            {snackbar.open && (
                <Snackbar
                    message={snackbar.message}
                    color={snackbar.color}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                />
            )}
        </Box>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface PostPollPraiseProps {
    onPostCreated: () => void;
}

export default function PostPollPraise({ onPostCreated }: PostPollPraiseProps) {
    const [openDrawer, setOpenDrawer] = useState<DrawerType | "">("");

    const handleClose = () => setOpenDrawer("");

    return (
        <>
            <Card
                elevation={2}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2.5,
                    py: 1.75,
                    gap: 2,
                }}
            >
                <Typography variant="body2" color="text.disabled" sx={{ flex: 1 }}>
                    Share an update, run a poll, or recognise a peer…
                </Typography>

                <Select
                    displayEmpty
                    value=""
                    size="small"
                    onChange={(e) => {
                        const val = e.target.value as DrawerType;
                        if (val) setOpenDrawer(val);
                    }}
                    renderValue={() => "Create"}
                    sx={{
                        fontSize: 13,
                        minWidth: 110,
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
                    }}
                >
                    <MenuItem value="post">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <ImageOutlinedIcon sx={{ fontSize: 17, color: "text.secondary" }} />
                            Post
                        </Box>
                    </MenuItem>
                    <MenuItem value="poll">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <PollOutlinedIcon sx={{ fontSize: 17, color: "text.secondary" }} />
                            Poll
                        </Box>
                    </MenuItem>
                    <MenuItem value="praise">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <EmojiEventsOutlinedIcon sx={{ fontSize: 17, color: "text.secondary" }} />
                            Praise
                        </Box>
                    </MenuItem>
                </Select>
            </Card>

            <Drawer
                anchor="right"
                open={!!openDrawer}
                onClose={(_, reason) => {
                    if (reason === "backdropClick") return;
                    handleClose();
                }}
                disableEscapeKeyDown
                PaperProps={{
                    sx: {
                        width: 520,
                        display: "flex",
                        flexDirection: "column",
                    },
                }}
            >
                {/* Drawer header */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 2,
                        py: 1.5,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {openDrawer && DRAWER_META[openDrawer]?.icon}
                        <Typography fontWeight={600} fontSize={15}>
                            {openDrawer && DRAWER_META[openDrawer]?.label}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={handleClose}>
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </Box>

                <Divider />

                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                    {openDrawer === "post" && <PostTab onCancel={handleClose} onPostCreated={onPostCreated} />}
                    {openDrawer === "poll" && <PollTab onCancel={handleClose} onPostCreated={onPostCreated} />}
                    {openDrawer === "praise" && <PraiseTab onCancel={handleClose} onPostCreated={onPostCreated} />}
                </Box>
            </Drawer>
        </>
    );
}