import { useState } from "react";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { PaymentHistoryPanel } from "./PaymentHistoryPanel";
import { Snackbar } from "../../../../../../components/atom/snackbar";

interface PaymentHistoryModalProps {
  open: boolean;
  onClose: () => void;
  payrunId: number;
  totalNetPay: number;
  onPaymentDeleted?: () => void;
}

export function PaymentHistoryModal({
  open,
  onClose,
  payrunId,
  totalNetPay,
  onPaymentDeleted,
}: PaymentHistoryModalProps) {
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({ open: false, message: "", color: "success" });

  return (
    <>
      <ModalElement
        open={open}
        onClose={onClose}
        title="Payment History"
        maxWidth="lg"
      >
        <PaymentHistoryPanel
          payrunId={payrunId}
          totalNetPay={totalNetPay}
          onSuccess={(msg) => setSnackbar({ open: true, message: msg, color: "success" })}
          onError={(msg) => setSnackbar({ open: true, message: msg, color: "error" })}
          onEmpty={onClose}
          onPaymentDeleted={onPaymentDeleted}
        />
      </ModalElement>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        />
      )}
    </>
  );
}
