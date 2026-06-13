import React, { useState } from "react";
import {
  IconButton,
  Box,
  Chip,
  Typography,
  Popper,
  Paper,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AttachFileIcon from "@mui/icons-material/AttachFile";

import type { StandardTableColumn } from "../../../../../../types/types";

import { formatDateShort } from "../../../../../../utils/numberFormatter";
import { Lock } from "@mui/icons-material";

interface ColumnParams {
  onMenuOpen: (e: React.MouseEvent<Element>, row: any) => void;
  onAttachmentsClick: (row: any) => void;
  formatAmount: (amount: number, currencySymbol?: string) => string;
  onTypeClick: (row: any) => void;
  getAttachmentKey: (transactionTypeId: string, paymentId?: string) => string;
  attachmentCountOverrides: Record<string, number>;
  canManageTransactions: boolean;
}

export const InvoiceTableColumns = ({
  onMenuOpen,
  onAttachmentsClick,
  formatAmount,
  onTypeClick,
  getAttachmentKey,
  attachmentCountOverrides,
  canManageTransactions,
}: ColumnParams): StandardTableColumn[] => {
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
    width: "10%",
  };

  return [
    {
      id: "invoiceDate",
      label: "Invoice Date",
      flex: 1,
      render: (row) => formatDateShort(row.invoiceDate),
      width: "10%",
    },
    {
      id: "invoiceNo",
      label: "Invoice No",
      flex: 1,
      render: (row) => (
        <Box onClick={() => onTypeClick(row)}>
          <InvoiceNoHover row={row} />
        </Box>
      ),
      width: "15%",
    },
    {
      id: "invoiceTo",
      label: "Invoice To",
      flex: 1,
      render: (row) => row.contact?.name || "-",
      width: "15%",
    },
    {
      id: "status",
      label: "Status",
      flex: 1,
      render: (row) => <StatusBadge row={row} />,
      width: "10%",
    },
    {
      id: "dueIn",
      label: "Due In",
      flex: 1,
      render: (row) => <DueInCell row={row} />,
      width: "10%",
    },
    {
      id: "invoiceTotal",
      label: "Invoice Total",
      flex: 1,
      headerAlign: "right",
      align: "right",
      render: (row) => {
        const currencySymbol = row.invoiceCurrency
          ? row.invoiceCurrency.split(" - ")[0]
          : "₹";

        return formatAmount(Number(row.invoiceTotal || 0), currencySymbol);
      },
      width: "10%",
    },
    {
      id: "balanceDue",
      label: "Balance Due",
      flex: 1,
      headerAlign: "right",
      align: "right",
      render: (row) => {
        const currencySymbol = row.invoiceCurrency
          ? row.invoiceCurrency.split(" - ")[0]
          : "₹";

        return formatAmount(Number(row.balanceDue || 0), currencySymbol);
      },
      width: "10%",
    },
    {
      id: "attachments",
      label: "Attachments",
      headerAlign: "center",
      align: "center",
      flex: 1,
      render: (row) => {
        const key = getAttachmentKey(
          row.transactionTypeId ?? row.id,
          row.paymentId,
        );

        const count =
          attachmentCountOverrides[key] !== undefined
            ? attachmentCountOverrides[key]
            : (row.noOfAttachments ?? 0);

        // console.log("Count",count)

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
      width: "10%",
    },
  ...(canManageTransactions ? [actionsColumn] : []),
  ];
};

/* ------------------ Helper Components ------------------ */

// Status badge logic
const StatusBadge = ({ row }: { row: any }) => {
  const dueDate = new Date(row.invoiceDueDate);
  const today = new Date();

  const diffTime = dueDate.getTime() - today.getTime();
  const dueIn = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let badgeLabel = "Partial";

  if (row.balanceDue <= 0) {
    badgeLabel = "Received";
  } else if (row.balanceDue === Number(row.invoiceTotal) && dueIn >= 0) {
    badgeLabel = "Unpaid";
  } else if (row.balanceDue > 0 && dueIn < 0) {
    badgeLabel = "Overdue";
  }

  const colorMap: Record<string, string> = {
    Received: "success.main",
    Unpaid: "warning.main",
    Overdue: "error.main",
    Partial: "primary.main",
  };

  return (
    <Chip
      label={badgeLabel}
      size="small"
      sx={{
        bgcolor: colorMap[badgeLabel],
        color: "#fff",
      }}
    />
  );
};

// DueIn column with +/- for overdue
const DueInCell = ({ row }: { row: any }) => {
  const dueDate = new Date(row.invoiceDueDate);
  const today = new Date();

  // If fully paid → show hyphen
  if (row.balanceDue <= 0) {
    return "-";
  }

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 ? `+${diffDays} days` : `-${Math.abs(diffDays)} overdue`;
};

// Hoverable InvoiceNo with items popper
const InvoiceNoHover = ({ row }: { row: any }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const popperRef = React.useRef<HTMLDivElement>(null);

  const handleMouseOver = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMouseOut = (e: React.MouseEvent<HTMLElement>) => {
    const relatedTarget = e.relatedTarget as Node;

    if (
      popperRef.current?.contains(relatedTarget) ||
      e.currentTarget.contains(relatedTarget)
    ) {
      return;
    }

    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Box
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        sx={{ display: "inline-block" }}
      >
        <Typography
          sx={{
            cursor: "pointer",
            color: "primary.main",
            textDecoration: "underline",
          }}
        >
          {row.invoiceNo}
        </Typography>
      </Box>

      {row.items?.length > 0 && (
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom-start"
          disablePortal={false}
          style={{ zIndex: 1300 }}
        >
          <Paper
            ref={popperRef}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            sx={{ p: 2, minWidth: 250, boxShadow: 3 }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Items
            </Typography>

            {row.items.map((item: any) => (
              <Box key={item.id} sx={{ mb: 1 }}>
                <Typography variant="body2">
                  • {item.itemName} ({item.itemAccount?.accountName || "N/A"})
                </Typography>
              </Box>
            ))}
          </Paper>
        </Popper>
      )}
    </>
  );
};
