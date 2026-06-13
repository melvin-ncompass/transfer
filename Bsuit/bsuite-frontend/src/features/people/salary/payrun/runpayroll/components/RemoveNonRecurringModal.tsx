import { useState } from "react";
import { Box, Typography, Checkbox, Alert } from "@mui/material";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { PrimaryButton } from "../../../../../../components/atom/button";
import type { NonRecurringKind, RemoveOption } from "../types";

export function RemoveNonRecurringModal({
  open,
  onClose,
  kind,
  options,
  onContinue,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  kind: NonRecurringKind;
  options: RemoveOption[];
  onContinue: (componentIds: number[]) => void;
  isSubmitting?: boolean;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetAndClose = () => {
    setSelected(new Set());
    onClose();
  };

  const handleContinue = () => {
    const componentIds = Array.from(selected.values());
    if (componentIds.length === 0) return;
    onContinue(componentIds);
  };

  return (
    <ModalElement
      open={open}
      onClose={resetAndClose}
      title={`Remove Non-Recurring ${kind === "earning" ? "Earning" : "Deduction"}`}
    >
      <Box>
        {options.length === 0 ? (
          <Alert severity="info" sx={{ fontSize: 13 }}>
            No non-recurring {kind === "earning" ? "earnings" : "deductions"} found for this
            employee.
          </Alert>
        ) : (
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.5,
              overflow: "hidden",
            }}
          >
            {options.map((opt, idx) => (
              <Box
                key={opt.componentId}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 1.25,
                  py: 0.75,
                  borderTop: idx === 0 ? "none" : "1px solid",
                  borderColor: "divider",
                  cursor: "pointer",
                }}
                onClick={() => toggle(opt.componentId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") toggle(opt.componentId);
                }}
              >
                <Typography variant="body2" sx={{ fontSize: 13 }}>
                  {opt.label}
                </Typography>
                <Checkbox size="small" checked={selected.has(opt.componentId)} />
              </Box>
            ))}
          </Box>
        )}

        <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
          <PrimaryButton
            variant="outlined"
            onClick={resetAndClose}
            disabled={Boolean(isSubmitting)}
          >
            Cancel
          </PrimaryButton>
          <PrimaryButton
            onClick={handleContinue}
            disabled={Boolean(isSubmitting) || selected.size === 0 || options.length === 0}
          >
            Continue
          </PrimaryButton>
        </Box>
      </Box>
    </ModalElement>
  );
}
