import { ToggleButton, ToggleButtonGroup, Box, useTheme } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

export type ToggleOption<T extends string> = {
    value: T;
    label: string;
    disabled?: boolean;
};

interface ToggleButtonAtomProps<T extends string> {
    value: T;
    options: readonly ToggleOption<T>[];
    onChange: (value: T) => void;
    exclusive?: boolean;
    sx?: SxProps<Theme>;
    vertical?: boolean;
    buttonSx?: SxProps<Theme>;
    size?: "small" | "medium" | "large";
}

export function ToggleButtonAtom<T extends string>({
    value,
    options,
    vertical = false,
    onChange,
    exclusive = true,
    sx,
    buttonSx,
    size = "medium",
}: ToggleButtonAtomProps<T>) {
    const theme = useTheme();

    const sizeConfig = {
        small:  { height: 26, px: 1.5, py: 0.25, fontSize: "0.75rem" },
        medium: { height: 32, px: 2.5, py: 0.5,  fontSize: "0.875rem" },
        large:  { height: 40, px: 3,   py: 0.75, fontSize: "1rem" },
    }[size];

    return (
        <Box>
            <ToggleButtonGroup
                value={value}
                exclusive={exclusive}
                orientation={vertical ? "vertical" : "horizontal"}
                onChange={(_, newValue) => {
                    if (newValue !== null) {
                        onChange(newValue);
                    }
                }}
                sx={{
                    height: sizeConfig.height,
                    ...sx,
                }}
            >
                {options.map((option) => (
                    <ToggleButton
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        color="primary"
                        sx={{
                            px: sizeConfig.px,
                            py: sizeConfig.py,
                            minHeight: sizeConfig.height,
                            minWidth: 0,
                            textTransform: "none",
                            ...theme.typography.button,
                            fontSize: sizeConfig.fontSize,
                            fontWeight: theme.typography.fontWeightMedium,
                            borderRadius: 0.8,
                            "&.Mui-selected": {
                                backgroundColor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                "&:hover": {
                                    backgroundColor: theme.palette.primary.dark,
                                },
                            },
                            ...buttonSx,
                        }}
                    >
                        {option.label}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </Box>
    );
}