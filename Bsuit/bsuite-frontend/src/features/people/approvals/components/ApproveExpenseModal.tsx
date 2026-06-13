import { Alert, Box, Stack, Typography } from "@mui/material";
import { ModalElement } from "../../../../components/dialogs/modal-element/ModalElement";
import { PrimaryButton } from "../../../../components/atom/button";
import type { ExpenseClaimResponse } from "../api/approvals.api";
import { useValidateExpenseClaimQuery } from "../api/approvals.api";

interface ApproveExpenseModalProps {
  open: boolean;
  onClose: () => void;
  claim: ExpenseClaimResponse | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ApproveExpenseModal({
  open,
  onClose,
  claim,
  onConfirm,
  isLoading = false,
}: ApproveExpenseModalProps) {
  const employeeName = claim?.employee?.contact?.name ?? "—";
  const amount =
    claim != null
      ? `₹${Number(claim.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      : "—";

  const { data: validation } = useValidateExpenseClaimQuery(claim?.id ?? 0, {
    skip: !open || claim == null,
    refetchOnMountOrArgChange: true,
  });

  const fmt = (n: number) =>
    `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <ModalElement
      open={open}
      onClose={onClose}
      title="Approve expense claim"
      maxWidth="xs"
    >
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Are you sure you want to approve this expense claim?
        </Typography>
        <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Employee
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {employeeName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Amount
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {amount}
          </Typography>
        </Box>
        {validation?.isAmountExceeded === true && (
          <Alert severity="info" variant="outlined">
            {validation.totalClaimedAmount === 0 ? (
              <>
                This policy has a max limit of <strong>{fmt(validation.maxLimit)}</strong>.
                {" "}Approving will exceed the allowed limit by{" "}
                {fmt(
                  claim?.amount
                    ? Number(claim.amount) + validation.totalClaimedAmount - validation.maxLimit
                    : 0
                )}
                .
              </>
            ) : (
              <>
                This employee has already claimed{" "}
                <strong>{fmt(validation.totalClaimedAmount)}</strong> against a policy
                limit of <strong>{fmt(validation.maxLimit)}</strong>. Approving will
                exceed the allowed limit by{" "}
                {fmt(
                  claim?.amount
                    ? Number(claim.amount) + validation.totalClaimedAmount - validation.maxLimit
                    : 0
                )}
                .
              </>
            )}
          </Alert>
        )}
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <PrimaryButton onClick={onConfirm} disabled={isLoading} loading={isLoading}>
            Confirm
          </PrimaryButton>
        </Stack>
      </Stack>
    </ModalElement>
  );
}
