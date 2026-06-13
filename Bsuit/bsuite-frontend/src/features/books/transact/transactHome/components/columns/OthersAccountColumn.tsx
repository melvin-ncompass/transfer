import { IconButton, Box } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Lock } from "@mui/icons-material";
import type { StandardTableColumn } from "../../../../../../types/types";
import { renderDate, formatType } from "../../utils/transact.utils";
import { AccountsDisplay } from "../../utils/AccountsDisplay ";
import { renderDescription } from "../../utils/renderDescription";

export const OtherAccountColumns = ({
  onMenuOpen,
  onAttachmentsClick,
  formatAmount,
  onTypeClick,
  getAttachmentKey,
  attachmentCountOverrides,
  isContactView,
  canManageTransactions,
}: {
  onMenuOpen: (e: React.MouseEvent<Element>, row: any) => void;
  onAttachmentsClick: (row: any) => void;
  formatAmount: (v: number) => string;
  onTypeClick: (row: any) => void;
  getAttachmentKey: (transactionTypeId: string, paymentId?: string) => string;
  attachmentCountOverrides: Record<string, number>;
  isContactView?: boolean;
  canManageTransactions: boolean;
}): StandardTableColumn[] => {
  /* -------------------- Base Columns -------------------- */

  const baseColumns: StandardTableColumn[] = [
    {
      id: "date",
      label: "Date",
      flex: 1,
      render: renderDate,
      width: "10%",
    },
    {
      id: "type",
      label: "Type",
      flex: 1,
      render: (row) => (
        <Box
          onClick={() => onTypeClick(row)}
          sx={{ cursor: "pointer", color: "primary.main" }}
        >
          {formatType(row.type)}
        </Box>
      ),
      width: "10%",
    },
    {
      id: "relatedAccounts",
      label: "From/To",
      flex: 1,
      render: (row) => (
        <AccountsDisplay
          accounts={(row.relatedAccounts || []).map((acc: any) => ({
            ...acc,
            balance: 1,
          }))}
        />
      ),
      width: "17%",
    },
    {
      id: "description",
      label: "Description",
      flex: 1,
      render: (row) => renderDescription(row.description),
      width: "19%",
    },
  ];

  /* -------------------- Debit Column -------------------- */

  const debitColumn: StandardTableColumn = {
    id: "debit",
    label: "Debit",
    headerAlign: "right",
    align: "right",
    flex: 1,
    render: (row) => row.debit && formatAmount(row.debit),
    width: "9%",
  };

  /* -------------------- Credit Column -------------------- */

  const creditColumn: StandardTableColumn = {
    id: "credit",
    label: "Credit",
    headerAlign: "right",
    align: "right",
    flex: 1,
    render: (row) => row.credit && formatAmount(row.credit),
    width: "9%",
  };

  /* -------------------- Balance / Amount Column -------------------- */

  const balanceColumn: StandardTableColumn = {
    id: "balance",
    label: isContactView ? "Amount" : "Balance", // Adjust the label accordingly
    headerAlign: "right",
    align: "right",
    flex: 1,
    render: (row) => {
      const value = isContactView ? row.amount : row.balance; // Choose between `amount` and `balance`
      return formatAmount(value || 0); // Fallback to 0 if value is undefined or null
    },
    width: "9%",
  };

  /* -------------------- Attachments Column -------------------- */

  const attachmentsColumn: StandardTableColumn = {
    id: "attachments",
    label: "Attachments",
    headerAlign: "center",
    align: "center",
    render: (row) => {
      const key = getAttachmentKey(
        row.transactionTypeId ?? row.id,
        row.paymentId,
      );

      const count = attachmentCountOverrides[key] ?? row.attachments;

      return (
        <IconButton
          onClick={() => onAttachmentsClick(row)}
          sx={(theme) => ({
            position: "relative",
            "&:hover": {
              backgroundColor: "transparent",
              "& .MuiSvgIcon-root": {
                color: theme.palette.primary.main,
              },
            },
          })}
        >
          <AttachFileIcon />

          {count > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                bgcolor: "primary.main",
                color: "white",
                width: 16,
                height: 16,
                borderRadius: "50%",
                fontSize: "0.65rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {count}
            </Box>
          )}
        </IconButton>
      );
    },
    width: "9%",
  };

  /* -------------------- Actions Column -------------------- */

  const actionsColumn: StandardTableColumn = {
    id: "actions",
    label: "Actions",
    headerAlign: "center",
    align: "center",
    flex: 1,
    render: (row) =>
      row.type !== "opening_balance" &&
        row.type !== "payroll_expense" &&
        row.type !== "payroll_expense_payment" ? (
        <IconButton onClick={(e) => onMenuOpen(e, row)}>
          <MoreVertIcon />
        </IconButton>
      ) : (
        <Lock />
      ),
    width: "9%",
  };

  /* -------------------- Final Column Assembly -------------------- */

  if (isContactView) {
    return [
      ...baseColumns,
      balanceColumn,
      attachmentsColumn,
      ...(canManageTransactions ? [actionsColumn] : []),
    ];
  }

  return [
    ...baseColumns,
    debitColumn,
    creditColumn,
    balanceColumn,
    attachmentsColumn,
    ...(canManageTransactions ? [actionsColumn] : []),
  ];
};
