import { IconButton, Box } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import type { StandardTableColumn } from "../../../../../../types/types";
import { formatType, renderDate } from "../../utils/transact.utils";
import { renderDescription } from "../../utils/renderDescription";
import { Lock } from "@mui/icons-material";
import { AccountsDisplay } from "../../utils/AccountsDisplay ";

interface ColumnParams {
  onMenuOpen: (e: React.MouseEvent<Element>, row: any) => void;
  onAttachmentsClick: (row: any) => void;
  formatAmount: (amount: number) => string;
  onTypeClick: (row: any) => void;
  getAttachmentKey: (transactionTypeId: string, paymentId?: string) => string;
  attachmentCountOverrides: Record<string, number>;
  canManageTransactions: boolean;
}

export const TransactionTableColumns = ({
  onMenuOpen,
  onAttachmentsClick,
  formatAmount,
  onTypeClick,
  getAttachmentKey,
  attachmentCountOverrides,
  canManageTransactions,
}: ColumnParams): StandardTableColumn[] => {
  const actionColumn: StandardTableColumn = {
    id: "actions",
    label: "Actions",
    headerAlign: "center",
    align: "center",
    width: "7%",
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
  };

  return [
    {
      id: "date",
      label: "Date",
      render: renderDate,
      width: "10%",
    },
  {
    id: "type",
    label: "Type",
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
    id: "from",
    label: "From",
    render: (row) => <AccountsDisplay accounts={row.fromAccounts} />,
    width: "17%",
  },
  {
    id: "to",
    label: "To",
    render: (row) => <AccountsDisplay accounts={row.toAccounts} />,
    width: "17%",
  },
  {
    id: "description",
    label: "Description",
    render: (row) => renderDescription(row.description),
    width: "19%",
  },

  {
    id: "amount",
    label: "Amount",
    headerAlign: "right",
    align: "right",
    render: (row) => formatAmount(Number(row.amount)),
    width: "12%",
  },
  {
    id: "attachments",
    label: "Attachments",
    headerAlign: "center",
    align: "center",
    width: "8%",
    render: (row) => {
      const key = getAttachmentKey(
        row.transactionTypeId ?? row.id,
        row.paymentId,
      );

      const count =
        attachmentCountOverrides[key] !== undefined
          ? attachmentCountOverrides[key]
          : (row.attachments ?? 0);

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
  },
  ...(canManageTransactions ? [actionColumn] : []),
];
};
