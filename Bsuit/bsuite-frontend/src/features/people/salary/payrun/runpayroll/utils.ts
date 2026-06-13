import type { SxProps, Theme } from "@mui/material/styles";

/** Outlined report actions (Payout report tab bar, ECR in Taxes tab) - keep in sync. */
export const payrunOutlinedReportButtonSx: SxProps<Theme> = {
  fontWeight: 600,
  textTransform: "none",
  letterSpacing: 0.15,
  minHeight: 40,
  px: 2,
  py: 0.75,
  borderWidth: 1,
  whiteSpace: "nowrap",
  boxShadow: "none",
  "&:hover": {
    borderColor: "primary.main",
    bgcolor: "action.hover",
  },
};

/** Right-aligned toolbar row next to tabs / above taxes tables. */
export const payrunReportToolbarRowSx: SxProps<Theme> = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 1,
  pl: { xs: 0, sm: 2 },
  ml: { xs: 0, sm: 1 },
  py: 0.25,
  borderLeft: {
    xs: "none",
    sm: (theme) => `1px solid ${theme.palette.divider}`,
  },
};

export const fmt = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export const sanitizeNumericInput = (value: string): string =>
  value.replace(/,/g, "").replace(/[^\d.]/g, "");

export const formatNumericInput = (value: string): string => {
  const sanitized = sanitizeNumericInput(value);
  if (!sanitized) return "";
  const [integerPart, decimalPart] = sanitized.split(".");
  const formattedInteger = Number(integerPart || 0).toLocaleString("en-IN");
  return decimalPart !== undefined
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger;
};

export function getErrorMessage(err: unknown): string {
  if (!err) return "Something went wrong.";
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const e = err as any;
    return e?.data?.message ?? e?.error ?? e?.message ?? "Something went wrong.";
  }
  return "Something went wrong.";
}
