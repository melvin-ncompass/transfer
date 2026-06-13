import { Chip } from "@mui/material";
import type { PayrunStatus } from "../api/payrun.api";

const statusConfig: Record<PayrunStatus, { label: string; bg: string; color: string }> = {
  draft: { label: "Draft", bg: "#e0e0e0", color: "#616161" },
  created: { label: "Draft", bg: "#e0e0e0", color: "#616161" }, // backend alias for draft
  approved: { label: "Approved", bg: "#e8f5e9", color: "#2e7d32" },
  rejected: { label: "Rejected", bg: "#ffebee", color: "#c62828" },
  partially_paid: { label: "Partially Paid", bg: "#fff3e0", color: "#e65100" },
  paid: { label: "Paid", bg: "#e3f2fd", color: "#1565c0" },
  skipped: { label: "Skipped", bg: "#fbe9e7", color: "#bf360c" },
};

export function StatusBadge({ status }: { status: PayrunStatus }) {
  const c = statusConfig[status] ?? statusConfig.draft;
  return (
    <Chip
      label={c.label}
      size="small"
      sx={{
        bgcolor: c.bg,
        color: c.color,
        fontWeight: 700,
        fontSize: 12,
        height: 22,
        borderRadius: 1,
      }}
    />
  );
}
