import { Box, Stack, Typography, useTheme } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import type { PresetColor } from "../../../../types/types";
import useConfig from "../../../../hooks/useConfig";
import defaultColor from "../../../../themes/theme/default";
import theme1 from "../../../../themes/theme/theme1";
import theme2 from "../../../../themes/theme/theme2";
import theme3 from "../../../../themes/theme/theme3";
import theme4 from "../../../../themes/theme/theme4";
import theme5 from "../../../../themes/theme/theme5";
import theme6 from "../../../../themes/theme/theme6";

const PALETTES: {
    id: PresetColor;
    primary: string;
    secondary: string;
}[] = [
        {
            id: "default",
            primary: defaultColor.primaryMain,
            secondary: defaultColor.secondaryMain,
        },
        {
            id: "theme1",
            primary: theme1.primaryMain,
            secondary: theme1.secondaryMain,
        },
        {
            id: "theme2",
            primary: theme2.primaryMain,
            secondary: theme2.secondaryMain,
        },
        {
            id: "theme3",
            primary: theme3.primaryMain,
            secondary: theme3.secondaryMain,
        },
        {
            id: "theme4",
            primary: theme4.primaryMain,
            secondary: theme4.secondaryMain,
        },
        {
            id: "theme5",
            primary: theme5.primaryMain,
            secondary: theme5.secondaryMain,
        },
        {
            id: "theme6",
            primary: theme6.primaryMain,
            secondary: theme6.secondaryMain,
        },
    ];

export default function ThemeSelector() {
    const theme = useTheme();
    const {
        state: { presetColor },
        setField,
    } = useConfig();

    return (
        <Box sx={{ pt: 0.75 }}>
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, mb: 0.75, display: "block", fontSize: "0.9rem" }}
            >
                Theme color
            </Typography>

            <Stack direction="row" spacing={0.75}>
                {PALETTES.map((palette) => {
                    const selected = presetColor === palette.id;

                    return (
                        <Box
                            key={palette.id}
                            onClick={() =>
                                setField("presetColor", palette.id as PresetColor)
                            }
                            sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                cursor: "pointer",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: selected
                                    ? `2px solid ${theme.palette.primary.main}`
                                    : `1px solid ${theme.palette.divider}`,
                                background: `linear-gradient(
          90deg,
          ${palette.primary} 50%,
          ${palette.secondary} 50%
        )`,
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    transform: "scale(1.05)",
                                },
                            }}
                        >
                            {selected && (
                                <CheckIcon
                                    sx={{
                                        fontSize: 12,
                                        color: "#fff",
                                        textShadow: "0 0 4px rgba(0,0,0,0.6)",
                                    }}
                                />
                            )}
                        </Box>
                    );
                })}
            </Stack>
        </Box>
    );
}

