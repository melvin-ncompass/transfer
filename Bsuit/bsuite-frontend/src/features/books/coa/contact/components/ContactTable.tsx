import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import type {
  IContactRegister,
  IContactResponse,
} from "../types/contact.types";
import {
  useDeleteContactMutation,
  useArchiveContactMutation,
  useToggleReportForContactMutation,
  useGetAllContactQuery,
} from "../api/contact.api";
import { getContactTableColumns } from "./ContactTableColumns";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import { useGetUserPermissionsQuery } from "../../../../../api/permission.api";

// Type definitions
interface ApiError {
  message?: string;
  data?: {
    message?: string;
  };
}

interface IContactTable {
  onEdit: (contact: IContactRegister, editIndex: number) => void;
  search: string;
  zeroBalance: boolean;
}
export default function ContactTable({ onEdit, search, zeroBalance }: IContactTable) {
  const navigate = useNavigate();
  const { data: usepermissionsData } = useGetUserPermissionsQuery();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<IContactResponse | null>(null);
  const [openDeleteDialog, setDeleteDialog] = useState(false);
  const [openArchiveDialog, setOpenArchiveDialog] = useState(false);
  const [toggleReport] = useToggleReportForContactMutation();
  const { data: contactData } = useGetAllContactQuery();
  const [deleteContact] = useDeleteContactMutation();
  const [archiveContact] = useArchiveContactMutation();
  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation = (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const currency = headerData?.data?.reportingCurrency?.split(" - ")[0] ?? "";
  const hasManageCoaPermission = usepermissionsData?.data?.permissions?.includes(
    "manage_coa",
  );

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({
    open: false,
    message: "",
    color: "success",
  });
  const showSnackbar = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });
  /* -------------------- MENU -------------------- */
  const openMenu = (
    e: React.MouseEvent<HTMLElement>,
    row: IContactResponse
  ) => {
    setMenuAnchor(e.currentTarget);
    setSelectedRow(row);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
  };
  /* -------------------- ACTIONS -------------------- */
  const handleEdit = () => {
    if (!selectedRow) return;
    onEdit(selectedRow, selectedRow.id);
    closeMenu();
  };
  const handleDelete = async () => {
    if (!selectedRow) return;
    try {
      await deleteContact({ id: selectedRow.id }).unwrap();
      showSnackbar("Contact deleted successfully", "success");
    } catch {
      showSnackbar("Failed to delete contact", "error");
    } finally {
      setDeleteDialog(false);
      setSelectedRow(null); // :white_check_mark: clear AFTER delete
    }
  };
  const handleArchiveToggle = async () => {
    if (!selectedRow) return;
    try {
      const res = await archiveContact({ id: selectedRow.id }).unwrap();
      showSnackbar(
        res?.data.isArchived
          ? "Contact archived successfully"
          : "Contact unarchived successfully",
        "success"
      );
    } catch {
      showSnackbar("Failed to update archive status", "error");
    } finally {
      closeMenu();
    }
  };
  async function handleToggleReport(id: number) {
    try {
      const res = await toggleReport(id).unwrap();
      showSnackbar("Report setting updated", "success");
    } catch (err: unknown) {
      const apiError = err as ApiError;
      showSnackbar(apiError?.data?.message || "Failed to toggle report", "error");
    }
  }
  /* -------------------- TABLE -------------------- */
  const columns = getContactTableColumns({
    menuAnchor,
    selectedRow,
    openMenu,
    closeMenu,
    handleEdit,
    setDeleteDialog,
    setOpenArchiveDialog,
    checkboxToggleFunction: handleToggleReport,
    onTransactionClick: (row) =>
      navigate(`/books/transact/home?contactId=${row.id}`),
    commaSeparation,
    currency,
    hasManageCoaPermission: !!hasManageCoaPermission,
  });
  const filteredRows = useMemo(() => {
    if (!contactData?.data) return [];

    const q = search.toLowerCase();

    return contactData.data.filter((c: IContactResponse) => {
      //  SEARCH
      const matchesSearch =
        !search.trim() ||
        [
          c.name,
          c.middleName,
          c.lastName,
          c.email,
          c.city,
          c.state,
          c.country,
          c.pan,
          c.gstin,
          c.phoneNumber?.toString(),
          String(c.contactBalance),
        ]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q));

      //  ZERO BALANCE FIX (IMPORTANT)
      const balance = Number(c.contactBalance ?? 0);

      const matchesZeroBalance = zeroBalance
        ? true
        : Math.abs(balance) > 0.000001;

      return matchesSearch && matchesZeroBalance;
    });
  }, [contactData, search, zeroBalance]);
  /* -------------------- RENDER -------------------- */
  return (
    <>
      <Box
        sx={{
          maxHeight: "65vh",
          overflow: "auto",
          "&::-webkit-scrollbar": { width: 8 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            borderRadius: 4,
          },
        }}
      >
        <StandardTable columns={columns} rows={filteredRows} />
      </Box>
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        />
      )}
      <ConfirmDialog
        open={openDeleteDialog}
        title="Confirm Contact Delete"
        message="Are you sure you want to delete this contact?"
        onClose={() => {
          setDeleteDialog(false);
          setSelectedRow(null);
        }}
        onConfirm={handleDelete}
        confirmColor="error"
      />
      <ConfirmDialog
        open={openArchiveDialog}
        title={`Confirm ${selectedRow?.isArchived ? "Unarchive" : "Archive"}`}
        message={`Are you sure you want to ${selectedRow?.isArchived ? "unarchive" : "archive"} this contact?`}
        onClose={() => setOpenArchiveDialog(false)}
        onConfirm={() => {
          handleArchiveToggle();
          setOpenArchiveDialog(false);
        }}
        confirmColor="error"
      />
    </>
  );
}
