import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import { useCallback, useRef, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import { Footer, type MentionedEmployee, type TabProps } from "../PostPollsPraise";

import { useGetEmployeesQuery } from "../../../org/people/directory/api/directory.api";
import { usePostAnnouncementMutation } from "../api/announcements.api";
import { getDesignationName } from "../../../org/people/directory/types/employee.types";

import EmployeeDropdown from "../components/EmployeeSelctDropDown";
import { Box } from "@mui/system";
import { ClickAwayListener, IconButton, Portal, TextField } from "@mui/material";
import { Tooltip } from "../../../../../components/atom/tooltip";
import { Snackbar } from "../../../../../components/atom/snackbar";

interface UploadedImage {
    id: number;
    src: string;
    file: File;
}

const toolBtnSx = {
    border: "1px solid",
    borderColor: "divider",
    borderRadius: "50%",
    color: "text.secondary",
    "&:hover": { color: "info.main", borderColor: "info.main" },
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGES = 5;

let _nextId = 0;
const uid = () => ++_nextId;

const PICKER_WIDTH = 320;
const PICKER_HEIGHT = 360;
const PICKER_MARGIN = 8;

function PostTab({ onCancel, onPostCreated }: TabProps) {
    const [text, setText] = useState("");
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [showEmojis, setShowEmojis] = useState(false);
    const [emojiPickerPos, setEmojiPickerPos] = useState<{ top: number; left: number } | null>(null);

    const isPostDisabled = !text.trim();
    const postDisabledReason = isPostDisabled ? "Enter post content to continue" : undefined;

    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionPos, setMentionPos] = useState<{ top: number; left: number } | null>(null);
    const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        color: "success" | "error" | "info" | "warning";
    }>({ open: false, message: "", color: "info" });

    const showMessage = (msg: string, color: "success" | "error" = "success") =>
        setSnackbar({ open: true, message: msg, color });

    const { data } = useGetEmployeesQuery();
    const [postAnnouncement, { isLoading }] = usePostAnnouncementMutation();

    const closeMention = useCallback(() => {
        setMentionQuery(null);
        setMentionPos(null);
        setMentionStartIndex(null);
    }, []);

    const openMentionAt = useCallback((atIndex: number, query: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const rect = ta.getBoundingClientRect();
        setMentionStartIndex(atIndex);
        setMentionQuery(query);
        setMentionPos({ top: rect.bottom - 65, left: rect.left });
    }, []);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.value;
        setText(val);
        const cursor = e.target.selectionStart ?? val.length;
        const slice = val.slice(0, cursor);
        const match = slice.match(/@(\w*)$/);
        if (match) {
            openMentionAt(slice.lastIndexOf("@"), match[1]);
        } else {
            closeMention();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") closeMention();
    };

    const handleSelectMention = (emp: MentionedEmployee) => {
        if (mentionStartIndex === null) return;
        const ta = textareaRef.current;
        const cursor = ta?.selectionStart ?? text.length;
        const before = text.slice(0, mentionStartIndex);
        const after = text.slice(cursor);
        const newText = `${before}@${emp.name} ${after}`;
        setText(newText);
        closeMention();
        setTimeout(() => {
            if (!ta) return;
            ta.focus();
            const pos = before.length + emp.name.length + 2;
            ta.selectionStart = ta.selectionEnd = pos;
        });
    };

    const insertAt = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart ?? text.length;
        const next = text.slice(0, start) + "@" + text.slice(start);
        setText(next);
        setTimeout(() => {
            ta.focus();
            ta.selectionStart = ta.selectionEnd = start + 1;
            openMentionAt(start, "");
        });
    };

    const insertEmoji = (e: string) => {
        const el = textareaRef.current;
        const start = el?.selectionStart ?? text.length;
        setText(text.slice(0, start) + e + text.slice(start));
        setTimeout(() => {
            if (el) { el.focus(); el.selectionStart = el.selectionEnd = start + e.length; }
        });
    };

    const toggleEmojiPicker = () => {
        if (showEmojis) {
            setShowEmojis(false);
            setEmojiPickerPos(null);
            return;
        }

        const btn = emojiButtonRef.current;
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const spaceAbove = rect.top;

        const openAbove = spaceAbove >= PICKER_HEIGHT + PICKER_MARGIN;
        const top = openAbove
            ? rect.top - PICKER_HEIGHT - PICKER_MARGIN
            : rect.bottom + PICKER_MARGIN;

        const left = Math.min(
            rect.left,
            window.innerWidth - PICKER_WIDTH - PICKER_MARGIN,
        );

        setEmojiPickerPos({ top, left });
        setShowEmojis(true);
    };

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        const remaining = MAX_IMAGES - images.length;
        files.slice(0, remaining).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) =>
                setImages((prev) => [...prev, { id: uid(), src: ev.target?.result as string, file }]);
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    };

    const removeImage = (id: number) => setImages((prev) => prev.filter((i) => i.id !== id));

    const reset = () => { setText(""); setImages([]); closeMention(); };

    const handleCancel = () => { reset(); onCancel(); };

    const handlePost = async () => {
        if (!text.trim() && images.length === 0) return;
        try {
            await postAnnouncement({
                content: text,
                attachments: images.map((img) => img.file),
            }).unwrap();
            showMessage("Post was published successfully!");
            reset();
            onCancel();
            onPostCreated();
        } catch (err) {
            console.error("Failed to post announcement:", err);
            showMessage("Failed to publish the post. Please try again.", "error");
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

            {/* ── Scrollable content area ── */}
            <Box sx={{ flex: 1, overflowY: "auto" }}>
                <Box sx={{ px: 2, pt: 2 }}>
                    <TextField
                        multiline
                        minRows={4}
                        fullWidth
                        placeholder="Write your post here and mention your peers"
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        variant="standard"
                        inputProps={{ ref: textareaRef }}
                        InputProps={{ disableUnderline: true }}
                        sx={{ "& textarea": { color: "text.primary", fontSize: 14 } }}
                    />
                </Box>

                {mentionQuery !== null && mentionPos && (
                    <Portal>
                        <ClickAwayListener onClickAway={closeMention}>
                            <Box sx={{ position: "fixed", top: mentionPos.top - 10, left: mentionPos.left, zIndex: 1400 }}>
                                <EmployeeDropdown
                                    employees={(data?.data ?? []).filter((emp) => {
                                        const fullName = [emp.contact?.name, emp.contact?.middleName, emp.contact?.lastName]
                                            .filter(Boolean).join(" ");
                                        return fullName.toLowerCase().includes((mentionQuery ?? "").toLowerCase());
                                    })}
                                    onSelect={(emp) => {
                                        const fullName = [emp.contact?.name, emp.contact?.middleName, emp.contact?.lastName]
                                            .filter(Boolean).join(" ");
                                        handleSelectMention({ id: emp.id, name: fullName, designation: getDesignationName(emp) });
                                    }}
                                    width={320}
                                    maxHeight={280}
                                />
                            </Box>
                        </ClickAwayListener>
                    </Portal>
                )}

                {images.length > 0 && (
                    <Box sx={{ display: "flex", gap: 1.25, px: 2, pb: 1.5, flexWrap: "wrap" }}>
                        {images.map((img) => (
                            <Box
                                key={img.id}
                                sx={{
                                    position: "relative", width: 82, height: 82,
                                    borderRadius: 1.5, overflow: "hidden",
                                    border: "1px solid", borderColor: "divider",
                                    "&:hover .del-btn": { opacity: 1 },
                                }}
                            >
                                <Box
                                    component="img" src={img.src} alt="preview"
                                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                <IconButton
                                    className="del-btn"
                                    size="small"
                                    onClick={() => removeImage(img.id)}
                                    sx={{
                                        position: "absolute", top: 3, right: 3,
                                        bgcolor: "rgba(0,0,0,0.6)", opacity: 0,
                                        transition: "opacity 0.2s", color: "#fff", p: 0.4,
                                        "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                                    }}
                                >
                                    <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Box>
                        ))}

                        {images.length < MAX_IMAGES && (
                            <Box
                                onClick={() => fileRef.current?.click()}
                                sx={{
                                    width: 82, height: 82, borderRadius: 1.5,
                                    border: "1.5px dashed", borderColor: "divider",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", color: "text.disabled",
                                    "&:hover": { borderColor: "info.main", color: "info.main" },
                                }}
                            >
                                <AddIcon />
                            </Box>
                        )}
                    </Box>
                )}

                {showEmojis && emojiPickerPos && (
                    <Portal>
                        <ClickAwayListener onClickAway={() => { setShowEmojis(false); setEmojiPickerPos(null); }}>
                            <Box
                                sx={{
                                    position: "fixed",
                                    top: emojiPickerPos.top,
                                    left: emojiPickerPos.left,
                                    zIndex: 1400,
                                    "& .EmojiPickerReact": {
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: "12px",
                                        boxShadow: 3,
                                    },
                                    "& .epr-emoji span": { fontSize: "16px" },
                                    "& .epr-emoji-category": { gap: "2px !important" },
                                }}
                            >
                                <EmojiPicker
                                    onEmojiClick={(e) => insertEmoji(e.emoji)}
                                    previewConfig={{ showPreview: false }}
                                    skinTonesDisabled
                                    searchDisabled={true}
                                    height={PICKER_HEIGHT}
                                    width={PICKER_WIDTH}
                                    emojiStyle={EmojiStyle.NATIVE}
                                />
                            </Box>
                        </ClickAwayListener>
                    </Portal>
                )}

                {/* Toolbar */}
                <Box sx={{ display: "flex", gap: 0.5, px: 1.75, py: 1.25, borderTop: "1px solid", borderColor: "divider" }}>
                    <Tooltip title="Mention someone">
                        <IconButton size="small" onClick={insertAt} sx={toolBtnSx}>
                            <AlternateEmailIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Upload image">
                        <IconButton size="small" onClick={() => fileRef.current?.click()} sx={toolBtnSx}>
                            <ImageOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Emoji">
                        <IconButton ref={emojiButtonRef} size="small" onClick={toggleEmojiPicker} sx={toolBtnSx}>
                            <EmojiEmotionsOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
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

export default PostTab;