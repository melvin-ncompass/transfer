import { Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { BaseButtonProps } from "../../../types/types";

export function PrimaryButton({
  children,
  loading = false,
  disabled,
  sx,
  variant = "contained",
  ...props
}: BaseButtonProps) {
  const theme = useTheme();

  const nativeDisabled = disabled && !loading;
  const cursorStyle = loading ? "pointer" : "not-allowed";
  const pointerEventsStyle = nativeDisabled ? "none" : "auto";

  return (
    <Button
      variant={variant}
      disabled={nativeDisabled}
      {...props}
      
      sx={{
        borderRadius: 2,
        fontWeight: 200,
        textTransform: "capitalize",
        padding: theme.spacing(1, 2.5),
        "&.Mui-disabled": {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          opacity: 0.5,
          cursor: cursorStyle,
          pointerEvents: pointerEventsStyle,
          boxShadow: "none",
          transform: "none",
        },
        ...sx,
      }}
    >
      {loading ? "Loading ..." : children}
    </Button>
  );
}