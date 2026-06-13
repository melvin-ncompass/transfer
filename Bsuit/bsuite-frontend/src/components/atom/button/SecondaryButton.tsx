import { Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { BaseButtonProps } from "../../../types/types";

export function SecondaryButton({
  children,
  loading = false,
  disabled,
  sx,
  ...props
}: BaseButtonProps) {
  const theme = useTheme();
  const nativeDisabled = disabled && !loading;
  const cursorStyle = loading ? "pointer" : "not-allowed";
  const pointerEventsStyle = nativeDisabled ? "none" : "auto";

  return (
    <Button
      variant="contained"
      disabled={nativeDisabled}
      {...props}
      sx={{
        borderRadius: 5,
        fontWeight: 200,
        textTransform: "none",
        padding: theme.spacing(1, 2.5),
        // color: theme.palette.secondary.contrastText,
        backgroundColor: theme.palette.secondary.main,
        border: "none",
        "&:hover": {
          backgroundColor: theme.palette.secondary.dark,
        },
        "&.Mui-disabled": {
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
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
