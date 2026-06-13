import dayjs from "dayjs";
import CardAtom from "../../../../../components/atom/card/Card";
import { Typography, Box, Divider, Chip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import type { IExperienceInformation } from "../types/profile.types";
import { formatDateShort } from "../../../../../utils/numberFormatter";

interface Props {
    data: IExperienceInformation[];
    onEdit?: () => void;
}

function formatDate(dateStr: string): string {
    return formatDateShort(dateStr) || dateStr;
}

function getDuration(startDate: string, endDate?: string): string {
    const start = dayjs(startDate);
    const end = endDate ? dayjs(endDate) : dayjs();
    if (!start.isValid()) return "";

    const totalMonths = end.diff(start, "month");
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (years > 0 && months > 0) return `${years} yr${years > 1 ? "s" : ""} ${months} mo${months > 1 ? "s" : ""}`;
    if (years > 0) return `${years} yr${years > 1 ? "s" : ""}`;
    if (months > 0) return `${months} mo${months > 1 ? "s" : ""}`;

    const days = end.diff(start, "day");
    return days > 0 ? `${days} day${days !== 1 ? "s" : ""}` : "< 1 day";
}

export default function ExperienceCard({ data, onEdit }: Props) {
    const sortedExperience = [...data].sort((a, b) => {
        const aStart = dayjs(a.startDate);
        const bStart = dayjs(b.startDate);
        if (aStart.isValid() && bStart.isValid()) {
            if (aStart.isBefore(bStart)) return 1;
            if (aStart.isAfter(bStart)) return -1;
        } else if (aStart.isValid()) {
            return -1;
        } else if (bStart.isValid()) {
            return 1;
        }

        const aEnd = a.endDate ? dayjs(a.endDate) : dayjs();
        const bEnd = b.endDate ? dayjs(b.endDate) : dayjs();
        if (aEnd.isBefore(bEnd)) return 1;
        if (aEnd.isAfter(bEnd)) return -1;
        return 0;
    });

    return (
        <CardAtom elevation={2} sx={{ p: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>Experience Information</Typography>
                {onEdit && <PrimaryIconButton icon={<EditIcon />} title="Edit" variant="outlined" onClick={onEdit} />}
            </Box>

            {sortedExperience.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No experience added.</Typography>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                    {sortedExperience.map((exp, i) => (
                        <Box key={i}>
                            {i > 0 && <Divider sx={{ my: 1.5 }} />}
                            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                                {/* Icon column */}
                                <Box
                                    sx={{
                                        mt: 0.25,
                                        width: 34,
                                        height: 34,
                                        borderRadius: "8px",
                                        bgcolor: "primary.50",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        border: "1px solid",
                                        borderColor: "primary.100",
                                    }}
                                >
                                    <WorkOutlineIcon fontSize="small" color="primary" />
                                </Box>

                                {/* Text column */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    {/* Designation @ Company */}
                                    <Box sx={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 0.5 }}>
                                        <Typography variant="body2" fontWeight={600} noWrap>
                                            {exp.designation || "—"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            @
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" fontWeight={500} noWrap>
                                            {exp.companyName || "—"}
                                        </Typography>
                                    </Box>

                                    {/* Date range + duration */}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.4, flexWrap: "wrap" }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(exp.startDate)} – {exp.endDate ? formatDate(exp.endDate) : "Present"}
                                        </Typography>
                                        <Chip
                                            label={getDuration(exp.startDate, exp.endDate)}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                height: 18,
                                                fontSize: "0.68rem",
                                                borderRadius: "4px",
                                                color: "text.secondary",
                                                borderColor: "grey.300",
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </CardAtom>
    );
}
