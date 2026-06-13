import { Stack, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { PrimaryButton } from "../../../../../components/atom/button";
import type { TimesheetStatusTab } from "../types/timesheet.types";

interface TimesheetBulkActionBarProps {
  selectedCount: number;
  statusTab: TimesheetStatusTab;
  onClear: () => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  isApproving?: boolean;
}

export function TimesheetBulkActionBar({
  selectedCount,
  statusTab,
  onClear,
  onApprove,
  onRequestChanges,
  isApproving,
}: TimesheetBulkActionBarProps) {
  if (selectedCount === 0) return null;

  const showApprove =
    statusTab === "pending_verification" ||
    statusTab === "pending_on_employee";
  const approveLabel =
    statusTab === "pending_on_employee" ? "Mark as Verified" : "Approve";

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      alignItems="center"
      justifyContent="flex-end"
      gap={1}
      position="fixed"
      // bottom={0}
      // top={0}
      left={0}
      right={0}
      p={2}
      
    >
      <Typography variant="body2" fontWeight={600} sx={{ mr: 0.5 }}>
        {selectedCount} selected
      </Typography>
      {showApprove && (
        <PrimaryButton
          size="small"
          sx={{ height: 30 }}
          startIcon={<CheckIcon />}
          onClick={onApprove}
          disabled={isApproving}
        >
          {approveLabel}
        </PrimaryButton>
      )}
      <PrimaryButton
        size="small"
        variant="outlined"
        sx={{ height: 32 }}
        startIcon={<EditNoteIcon />}
        onClick={onRequestChanges}
      >
        Request changes
      </PrimaryButton>
      <PrimaryButton size="small" variant="text" onClick={onClear}>
        Clear selection
      </PrimaryButton>
    </Stack>
  );
}
