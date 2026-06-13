import { IconButton, Stack, Typography } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Checkbox } from "../../../../../components/atom/check-box";
import { Chip } from "../../../../../components/atom/chips";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import type { IContactResponse } from "../types/contact.types";
import { formatCurrencyByCommaSeparation } from "../../../../../utils/numberFormatter";
import { PermissionGuard } from "../../../../../guards/ComponentGuard";

interface ColumnParams {
  menuAnchor: HTMLElement | null;
  selectedRow: IContactResponse | null;
  openMenu: (e: React.MouseEvent<HTMLElement>, row: IContactResponse) => void;
  closeMenu: () => void;
  handleEdit: () => void;
  setDeleteDialog: (open: boolean) => void;
  setOpenArchiveDialog: (open: boolean) => void;
  checkboxToggleFunction: (id: number) => void;
  onTransactionClick?: (row: IContactResponse) => void;
  commaSeparation: "US" | "IN";
  currency: string;
  hasManageCoaPermission: boolean;
}
interface StandardColumn {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: IContactResponse) => React.ReactNode;
  width?: number;
}
export const getContactTableColumns = ({
  menuAnchor,
  selectedRow,
  openMenu,
  closeMenu,
  handleEdit,
  setDeleteDialog,
  setOpenArchiveDialog,
  checkboxToggleFunction,
  onTransactionClick,
  commaSeparation,
  currency,
  hasManageCoaPermission,
}: ColumnParams): StandardColumn[] => [
    {
      id: "name",
      label: "Name",
      width: 350,
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ whiteSpace: "nowrap" }}>
          <span>{row.name}</span>
          {row.isArchived && <Chip label="Archived" color="warning" size="xs" />}
        </Stack>
      ),
    },
    { id: "email", label: "Email" },
    {
      id: "userBalance",
      label: "Balance",
      align: "right",
      render: (params) => <span>{formatCurrencyByCommaSeparation(params.contactBalance!, commaSeparation, currency)}</span>,
    },
    {
      id: "transactions",
      label: "Transactions",
      align: "right",
      render: (row) => {
        const count = (row as any).transactionCount ?? 0;
        const hasTransactions = count > 0 &&hasManageCoaPermission;
        return (
          <Typography
            component="span"
            sx={{
              width: "100%",
              textAlign: "right",
              display: "block",
              cursor: hasTransactions ? "pointer" : "default",
              color: hasTransactions ? "primary.main" : "text.primary",
              fontWeight: hasTransactions ? 600 : 400,
              textDecoration: hasTransactions ? "underline" : "none",
              "&:hover": hasTransactions ? { color: "primary.dark" } : {},
            }}
            onClick={(e) => {
              if (hasTransactions && onTransactionClick) {
                e.stopPropagation();
                onTransactionClick(row);
              }
            }}
          >
            {count}
          </Typography>
        );
      },
    },
    ...(hasManageCoaPermission
      ? [
        {
          id: "reports",
          label: "Reports",
          align: "center",
          render: (params) => <Checkbox
            checked={(params as any).showInReports}
            onChange={() => checkboxToggleFunction(params.id)}
          />,
        },
      ] as StandardColumn[]
      : []),
    ...(hasManageCoaPermission
      ? [
        {
          id: "actions",
          label: "Actions",
          render: (row:any) => (
            <>
              <PermissionGuard permission={"manage_coa"}>
                <IconButton onClick={(e) => openMenu(e, row)}>
                  <MoreVertIcon />
                </IconButton>
              </PermissionGuard>
              {selectedRow?.id === row.id && menuAnchor && (
                <MenuAtom
                  items={[
                    { label: "Edit", onClick: handleEdit },
                    {
                      label: row.isArchived ? "Unarchive" : "Archive",
                      onClick: () => setOpenArchiveDialog(true),
                    },
                    { label: "Delete", onClick: () => setDeleteDialog(true) }
                  ]}
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onCloseAll={closeMenu}
                />
              )}
            </>
          ),
        },
      ]
      : []),
  ];