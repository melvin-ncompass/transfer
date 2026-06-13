import { useRef, useState } from "react";
import {
    Box,
    Button,
    IconButton,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from "@mui/material";

import { useCreatePraiseMutation } from "../api/announcements.api";
import { useGetEmployeesQuery } from "../../../org/people/directory/api/directory.api";
import { getDesignationName } from "../../../org/people/directory/types/employee.types";
import { useGetProjectsQuery } from "../../../projects-timesheets/projects/api/project.api";

import { Tooltip } from "../../../../../components/atom/tooltip";
import { Snackbar } from "../../../../../components/atom/snackbar";
import EmployeeDropdown from "./EmployeeSelctDropDown";
import { Footer, type MentionedEmployee, type TabProps } from "../PostPollsPraise";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import {
    EmojiEvents,
    Bolt,
    Diversity3,
    EmojiEmotions,
    RocketLaunch,
    AutoAwesome,
    HistoryEdu,
} from "@mui/icons-material";

interface UploadedAttachment {
    id: number;
    file: File;
}

interface BadgeOption {
    label: string;
    value:
    | "top_performer"
    | "leadership_impact"
    | "team_player"
    | "high_five"
    | "rockstar_rookie"
    | "above_and_beyond"
    | "leaving_a_legacy";
    icon: React.ReactNode;
    color: string;
}

const BADGES: BadgeOption[] = [
    { label: "Top Performer", value: "top_performer", color: "#F4C430", icon: <EmojiEvents /> },
    { label: "Leadership Impact", value: "leadership_impact", color: "#69B3FF", icon: <Bolt /> },
    { label: "Team Player", value: "team_player", color: "#A6C437", icon: <Diversity3 /> },
    { label: "High Five", value: "high_five", color: "#A78BFA", icon: <EmojiEmotions /> },
    { label: "Rockstar Rookie", value: "rockstar_rookie", color: "#5EA9F6", icon: <RocketLaunch /> },
    { label: "Above & Beyond", value: "above_and_beyond", color: "#6FD3E7", icon: <AutoAwesome /> },
    { label: "Leaving a Legacy", value: "leaving_a_legacy", color: "#F28B82", icon: <HistoryEdu /> },
];

const MAX_IMAGES = 5;
let _nextId = 0;
const uid = () => ++_nextId;

function PraiseTab({ onCancel, onPostCreated }: TabProps) {
    const [selectedEmployees, setSelectedEmployees] = useState<MentionedEmployee[]>([]);
    const [search, setSearch] = useState("");
    const [praise, setPraise] = useState("");
    const [selectedBadge, setSelectedBadge] = useState<BadgeOption | null>(null);
    const [showBadges, setShowBadges] = useState(false);
    const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);

    const isPostDisabled = selectedEmployees.length === 0 || !selectedBadge;

    const postDisabledReason = (() => {
        const reasons: string[] = [];
        if (selectedEmployees.length === 0) reasons.push("Select at least one employee to praise");
        if (!selectedBadge) reasons.push("Select a praise badge");
        return reasons.length > 0 ? reasons.join(". ") : undefined;
    })();

    const fileRef = useRef<HTMLInputElement>(null);
    const { data } = useGetEmployeesQuery();
    const employees = data?.data ?? [];

    const filteredEmployees = employees.filter((emp) => {
        const fullName = [emp.contact?.name, emp.contact?.middleName, emp.contact?.lastName]
            .filter(Boolean)
            .join(" ");

        return fullName.toLowerCase().includes(search.toLowerCase());
    });

    const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        color: "success" | "error" | "info" | "warning";
    }>({ open: false, message: "", color: "info" });

    const showMessage = (msg: string, color: "success" | "error" = "success") =>
        setSnackbar({ open: true, message: msg, color });

    const [createPraise, { isLoading }] = useCreatePraiseMutation();
    const { data: projects } = useGetProjectsQuery();

    const handleAddEmployee = (emp: any) => {
        if (selectedEmployees.some((e) => e.id === emp.id)) return;
        const fullName = [emp.contact?.name, emp.contact?.middleName, emp.contact?.lastName]
            .filter(Boolean)
            .join(" ");

        setSelectedEmployees((prev) => [
            ...prev,
            { id: emp.id, name: fullName, designation: getDesignationName(emp) },
        ]);

        setSearch("");
    };

    const removeEmployee = (id: number) => {
        setSelectedEmployees((prev) => prev.filter((e) => e.id !== id));
    };

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);

        const remaining = MAX_IMAGES - attachments.length;
        files.slice(0, remaining).forEach((file) =>
            setAttachments((prev) => [...prev, { id: uid(), file }])
        );
        e.target.value = "";
    };

    const removeAttachment = (id: number) =>
        setAttachments((prev) => prev.filter((f) => f.id !== id));

    const reset = () => {
        setSelectedEmployees([]);
        setSearch("");
        setPraise("");
        setSelectedBadge(null);
        setAttachments([]);
        setSelectedProjectId(undefined);
    };

    const handleCancel = () => { reset(); onCancel(); };

    const handlePost = async () => {
        if (!praise.trim() || selectedEmployees.length === 0) return;
        try {
            await createPraise({
                employeeIds: selectedEmployees.map((e) => e.id),
                praise: praise.trim(),
                badge: selectedBadge?.value,
                projectId: selectedProjectId,
                attachments: attachments.map((a) => a.file),
            }).unwrap();
            showMessage("Praise posted successfully!", "success");
            reset();
            onCancel();
            onPostCreated();
        } catch (err) {
            console.error(err);
            showMessage("Failed to create praise", "error");
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ flex: 1, overflowY: "auto", px: 2, pt: 2, pb: 1 }}>
                <TextField
                    fullWidth
                    variant="standard"
                    placeholder="Search Employee"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{ disableUnderline: true }}
                    sx={{ mb: 1, "& input": { fontSize: 15 }, borderBottom: "1px solid", borderColor: "divider" }}
                />

                {search && (
                    <Box sx={{ mt: 1 }}>
                        <EmployeeDropdown
                            employees={filteredEmployees}
                            onSelect={handleAddEmployee}
                            width={450}
                            maxHeight={220}
                        />
                    </Box>
                )}

                {selectedEmployees.length > 0 && (
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
                        {selectedEmployees.map((emp) => (
                            <Box
                                key={emp.id}
                                sx={{
                                    px: 1.25, py: 0.5, borderRadius: 5,
                                    bgcolor: "action.hover",
                                    display: "flex", alignItems: "center", gap: 1,
                                }}
                            >
                                <Typography variant="caption">{emp.name}</Typography>
                                <IconButton size="small" onClick={() => removeEmployee(emp.id)} sx={{ p: 0.2 }}>
                                    <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                )}

                <TextField
                    multiline
                    minRows={5}
                    fullWidth
                    variant="standard"
                    placeholder="What did the employee do to deserve the praise"
                    value={praise}
                    onChange={(e) => setPraise(e.target.value)}
                    InputProps={{ disableUnderline: true }}
                    sx={{ mt: 3, "& textarea": { fontSize: 14 } }}
                />

                <Box sx={{ mt: 3, position: "relative" }}>
                    <Box
                        onClick={() => setShowBadges((v) => !v)}
                        sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", width: "fit-content" }}
                    >
                        <Box
                            sx={{
                                width: 72, height: 72, borderRadius: 1.5,
                                border: "1px solid", borderColor: "divider",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                bgcolor: selectedBadge?.color ?? "action.hover", color: "#fff",
                            }}
                        >
                            {selectedBadge?.icon ?? <WorkspacePremiumOutlinedIcon />}
                        </Box>
                        <Typography color="info.main">
                            {selectedBadge?.label ?? "Select badge"}
                        </Typography>
                    </Box>

                    {showBadges && (
                        <Paper
                            sx={{
                                position: "absolute", top: 80, left: 0, width: 460,
                                zIndex: 10, border: "1px solid", borderColor: "divider", overflow: "hidden",
                            }}
                        >
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    borderBottom: "1px solid",
                                    borderColor: "divider"
                                }}
                            >
                                <Typography fontWeight={600}>Choose Badge</Typography>
                            </Box>
                            <Box sx={{ p: 3, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
                                {BADGES.map((badge) => (
                                    <Box
                                        key={badge.value}
                                        onClick={() => {
                                            setSelectedBadge(badge);
                                            setShowBadges(false);
                                        }}
                                        sx={{ textAlign: "center", cursor: "pointer" }}
                                    >
                                        <Box
                                            sx={{
                                                width: 70, height: 70, borderRadius: "50%",
                                                bgcolor: badge.color, mx: "auto", mb: 1,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: "#fff",
                                            }}
                                        >
                                            {badge.icon}
                                        </Box>
                                        <Typography variant="body2" sx={{ fontSize: 13 }}>
                                            {badge.label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    )}
                </Box>

                {/* Project */}
                <Box sx={{ mt: 4 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                        Projects (optional)
                    </Typography>
                    <Select
                        fullWidth
                        displayEmpty
                        size="small"
                        value={selectedProjectId ?? ""}
                        onChange={(e) => {
                            const value = e.target.value as number | "";
                            setSelectedProjectId(value === "" ? undefined : Number(value));
                        }}
                        IconComponent={KeyboardArrowDownIcon}>
                        <MenuItem value="">
                            Select Project
                        </MenuItem>

                        {projects?.map((project: any) => (
                            <MenuItem key={project.id} value={project.id}>
                                {project.projectName}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>

                {/* Attachments */}
                <Box sx={{ mt: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Button
                            startIcon={<AttachFileIcon />}
                            onClick={() => fileRef.current?.click()}
                            sx={{ p: 0, minWidth: 0, textTransform: "none" }}
                        >
                            Add Attachment
                        </Button>
                        <Tooltip title="Maximum 5 files">
                            <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        </Tooltip>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        Max number of files allowed is 5
                    </Typography>

                    {attachments.length > 0 && (
                        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                            {attachments.map((a) => (
                                <Box
                                    key={a.id}
                                    sx={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        border: "1px solid", borderColor: "divider", borderRadius: 1, px: 1.5, py: 1,
                                    }}
                                >
                                    <Typography variant="body2" noWrap>{a.file.name}</Typography>
                                    <IconButton size="small" onClick={() => removeAttachment(a.id)}>
                                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>

                <input ref={fileRef} type="file" multiple hidden onChange={handleFiles} />
            </Box>

            {/* ── Pinned footer ── */}
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

export default PraiseTab;