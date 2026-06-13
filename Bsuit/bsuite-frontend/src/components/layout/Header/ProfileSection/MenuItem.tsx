import { ListItemButton, ListItemIcon, ListItemText, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";

interface MenuItemProps {
    icon: ReactNode;
    text: string;
    onClick: () => void;
    selected?: boolean;
    color?: string;
}

export default function MenuItem({
    icon,
    text,
    onClick,
    selected = false,
    color,
}: MenuItemProps) {
    const theme = useTheme();

    return (
        <ListItemButton
            selected={selected}
            onClick={onClick}
            sx={{
                py: 0.75,
                px: 1.5,
                minHeight: "auto",
                color: color,
                "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                },
            }}
        >
            <ListItemIcon sx={{ minWidth: 28, color: color }}>
                {icon}
            </ListItemIcon>
            <ListItemText
                primary={
                    <Typography
                        variant="body2"
                        sx={{
                            fontSize: "0.9rem",
                            lineHeight: 0.8,
                            color: color,
                        }}
                    >
                        {text}
                    </Typography>
                }
                sx={{ m: 0, py: 1 }}
            />
        </ListItemButton>
    );
}

