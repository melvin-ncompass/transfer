import { Box, Typography, Avatar, Chip } from "@mui/material";
import {
    EmojiEvents,
    Bolt,
    Diversity3,
    EmojiEmotions,
    RocketLaunch,
    AutoAwesome,
    HistoryEdu,
} from "@mui/icons-material"; import type { FeedPraise, PraiseBadge } from "../api/announcements.api";

const BADGE_CONFIG: Record<PraiseBadge, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    top_performer: { label: "Top Performer", icon: <EmojiEvents sx={{ fontSize: 18 }} />, color: "#F4C430", bg: "#fefce8" },
    leadership_impact: { label: "Leadership Impact", icon: <Bolt sx={{ fontSize: 18 }} />, color: "#69B3FF", bg: "#eff6ff" },
    team_player: { label: "Team Player", icon: <Diversity3 sx={{ fontSize: 18 }} />, color: "#A6C437", bg: "#f7fee7" },
    high_five: { label: "High Five", icon: <EmojiEmotions sx={{ fontSize: 18 }} />, color: "#A78BFA", bg: "#f5f3ff" },
    rockstar_rookie: { label: "Rockstar Rookie", icon: <RocketLaunch sx={{ fontSize: 18 }} />, color: "#5EA9F6", bg: "#eff6ff" },
    above_and_beyond: { label: "Above & Beyond", icon: <AutoAwesome sx={{ fontSize: 18 }} />, color: "#6FD3E7", bg: "#ecfeff" },
    leaving_a_legacy: { label: "Leaving a Legacy", icon: <HistoryEdu sx={{ fontSize: 18 }} />, color: "#F28B82", bg: "#fff1f2" },
};

function getPraiseeName(emp: FeedPraise["praisedTo"][number]): string {
    if (emp.contact?.name) {
        const last = emp.contact.lastName ? ` ${emp.contact.lastName}` : "";
        return `${emp.contact.name}${last}`;
    }
    return emp.nameAsPerPan ?? emp.employeeId;
}

function getInitials(name: string): string {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
}

interface PraiseBodyProps {
    item: FeedPraise;
}

export default function PraiseBody({ item }: PraiseBodyProps) {
    const badge = item.badge ? BADGE_CONFIG[item.badge] : null;

    return (
        <Box sx={{ flexGrow: 1 }}>
            {badge && (
                <Chip
                    icon={<span style={{ color: badge.color, display: "flex", alignItems: "center" }}>{badge.icon}</span>}
                    label={badge.label}
                    size="medium"
                    sx={{
                        mb: 2,
                        bgcolor: badge.bg,
                        color: badge.color,
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        height: 32,
                        px: 0.5,
                        border: "1px solid",
                        borderColor: badge.color + "40",
                        "& .MuiChip-icon": { ml: "8px", fontSize: 18 },
                    }}
                />
            )}

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                {item.praisedTo.map((emp) => {
                    const name = getPraiseeName(emp);
                    return (
                        <Box key={emp.id} sx={{
                            display: "flex", alignItems: "center", gap: 0.75,
                            bgcolor: "grey.50", border: "1px solid", borderColor: "grey.200",
                            borderRadius: 5, px: 1, py: 0.5,
                        }}>
                            <Avatar sx={{ width: 22, height: 22, fontSize: "0.6rem", bgcolor: "primary.light" }}>
                                {getInitials(name)}
                            </Avatar>
                            <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1 }}>
                                {name}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            <Typography variant="body2" sx={{
                color: "text.primary",
                lineHeight: 1.6,
                bgcolor: "warning.50",
                borderLeft: "3px solid",
                borderColor: "warning.400",
                px: 1.5, py: 1,
                borderRadius: "0 6px 6px 0",
                fontStyle: "italic",
            }}>
                "{item.praise}"
            </Typography>

            {item.project && (
                <Chip
                    label={item.project.projectName}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1.5, fontSize: "0.7rem", height: 20, borderRadius: 1 }}
                />
            )}
        </Box>
    );
}