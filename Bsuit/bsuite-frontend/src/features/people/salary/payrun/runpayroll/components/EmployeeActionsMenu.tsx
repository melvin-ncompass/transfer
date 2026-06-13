import { useState, useMemo } from "react";
import { IconButton, Menu, MenuItem, Divider } from "@mui/material";
import { Typography } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useGetEarningsQuery } from "../../../structure/Earnings/api/earnings.api";
import { useGetDeductionsQuery } from "../../../structure/Deductions/api/deductions.api";
import type { NonRecurringKind, RemoveOption, LopAction } from "../types";

export function EmployeeActionsMenu({
  isDraft,
  lopDays,
  appliedNonRecurringEarningIds,
  appliedNonRecurringDeductionIds,
  isSkipped,
  onPick,
  onRemovePick,
  onSkip,
  onRestore,
}: {
  isDraft: boolean;
  lopDays: string;
  appliedNonRecurringEarningIds: number[];
  appliedNonRecurringDeductionIds: number[];
  isSkipped?: boolean;
  onPick: (action: "earning" | "deduction" | LopAction) => void;
  onRemovePick: (kind: NonRecurringKind, options: RemoveOption[]) => void;
  onSkip: () => void;
  onRestore: () => void;
}) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const hasLop = Number(lopDays) > 0;
  const { data: earnings = [] } = useGetEarningsQuery(undefined, { skip: !open });
  const { data: deductions = [] } = useGetDeductionsQuery(undefined, { skip: !open });

  const appliedNonRecurringEarnings: RemoveOption[] = useMemo(() => {
    const ids = Array.from(
      new Set((appliedNonRecurringEarningIds ?? []).filter((id) => Number.isFinite(Number(id))))
    ).map((id) => Number(id));
    return ids
      .map((id) => {
        const match = earnings.find((e) => Number(e.id) === id);
        if (match && match.earningFrequency !== "non_recurring") return null;
        return { componentId: id, label: match?.earningName ?? `Earning #${id}` };
      })
      .filter((x): x is RemoveOption => Boolean(x));
  }, [appliedNonRecurringEarningIds, earnings]);

  const appliedNonRecurringDeductions: RemoveOption[] = useMemo(() => {
    const ids = Array.from(
      new Set(
        (appliedNonRecurringDeductionIds ?? []).filter((id) => Number.isFinite(Number(id)))
      )
    ).map((id) => Number(id));
    return ids
      .map((id) => {
        const match = deductions.find((d) => Number(d.id) === id);
        if (match && match.deductionFrequency !== "non_recurring") return null;
        return { componentId: id, label: match?.deductionName ?? `Deduction #${id}` };
      })
      .filter((x): x is RemoveOption => Boolean(x));
  }, [appliedNonRecurringDeductionIds, deductions]);

  const hasNonRecurringEarning = appliedNonRecurringEarnings.length > 0;
  const hasNonRecurringDeduction = appliedNonRecurringDeductions.length > 0;

  if (!isDraft) {
    return (
      <Typography variant="body2" color="text.secondary" align="center">
        -
      </Typography>
    );
  }

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: 1.5, minWidth: 210 } } }}
      >
        {!isSkipped && [
          <MenuItem
            key="add-earning"
            onClick={() => { setAnchor(null); onPick("earning"); }}
            sx={{ fontSize: 13 }}
          >
            Add Non-Recurring Earning
          </MenuItem>,
          hasNonRecurringEarning ? (
            <MenuItem
              key="remove-earning"
              onClick={() => { setAnchor(null); onRemovePick("earning", appliedNonRecurringEarnings); }}
              sx={{ fontSize: 13 }}
            >
              Remove Non-Recurring Earning
            </MenuItem>
          ) : null,
          <MenuItem
            key="add-deduction"
            onClick={() => { setAnchor(null); onPick("deduction"); }}
            sx={{ fontSize: 13 }}
          >
            Add Non-Recurring Deduction
          </MenuItem>,
          hasNonRecurringDeduction ? (
            <MenuItem
              key="remove-deduction"
              onClick={() => { setAnchor(null); onRemovePick("deduction", appliedNonRecurringDeductions); }}
              sx={{ fontSize: 13 }}
            >
              Remove Non-Recurring Deduction
            </MenuItem>
          ) : null,
          <Divider key="divider-top" />,
          hasLop ? (
            <MenuItem
              key="remove-lop"
              onClick={() => { setAnchor(null); onPick("remove_lop"); }}
              sx={{ fontSize: 13 }}
            >
              Remove LOP
            </MenuItem>
          ) : (
            <MenuItem
              key="add-lop"
              onClick={() => { setAnchor(null); onPick("add_lop"); }}
              sx={{ fontSize: 13 }}
            >
              Add LOP
            </MenuItem>
          ),
          <Divider key="divider-bottom" />,
        ]}
        {isSkipped ? (
          <MenuItem
            onClick={() => { setAnchor(null); onRestore(); }}
            sx={{ fontSize: 13 }}
          >
            Add Employee to Payrun
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => { setAnchor(null); onSkip(); }}
            sx={{ fontSize: 13 }}
          >
            Skip Employee
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
