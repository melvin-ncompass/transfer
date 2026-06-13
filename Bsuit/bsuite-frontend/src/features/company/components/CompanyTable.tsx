import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { QuickFilterDataGrid } from "../../../components/tables/data-table";
import { Snackbar } from "../../../components/atom/snackbar";
import { ConfirmDialog } from "../../../components/dialogs/confirm-dialog";

import {
  useDeleteCompanyMutation,
  useSetDefaultCompanyMutation,
  useSetCompanyIdMutation,
} from "../api/company.api";

import { baseApi } from "../../../api/base.api";
import { TAGS } from "../../../api/tagTypes";
import { getErrorMessage } from "../utils/errorHandler";

import EditCompanyModal from "./EditCompanyModal";
import { getCompanyTableColumns } from "./companyTableColumns";
import { notifyCompanyChanged } from "../utils/companyCrossTabSync";


interface CompanyTableProps {
  rows: any[];
  loading?: boolean;
}
function CompanyTable({ rows }: CompanyTableProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const [openDeleteDialog, setDeleteDialog] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const [deleteCompany,{isLoading: isDeleting}] = useDeleteCompanyMutation();
  const [setDefaultCompany] = useSetDefaultCompanyMutation();
  const [setCompanyId] = useSetCompanyIdMutation();

  // ---------- Menu ----------
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, id: number) => {
    setAnchorEl(e.currentTarget);
    setSelectedRow(id);
  };

  const handleMenuClose = () => setAnchorEl(null);

  // ---------- Edit ----------
  const handleEdit = () => {
    const company = rows.find((row) => row.id === selectedRow);
    if (company) {
      setSelectedCompany(company);
      setOpenEditModal(true);
    }
    handleMenuClose();
  };

  // ---------- Delete ----------
  const handleDelete = async () => {
    if (selectedRow === null) return;

    try {
      await deleteCompany({ id: selectedRow }).unwrap();
      setSnackbar({
        open: true,
        message: "Company deleted successfully!",
        color: "success",
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: getErrorMessage(err),
        color: "error",
      });
    } finally {
      setDeleteDialog(false);
      handleMenuClose();
    }
  };

  // ---------- Set Default ----------
  const handleSetDefault = async (companyId: string) => {
    try {
      await setDefaultCompany({ companyId }).unwrap();
      setSnackbar({
        open: true,
        message: "Default company updated",
        color: "success",
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: getErrorMessage(err),
        color: "error",
      });
    }
  };

  // ---------- Set Current Company (NEW) ----------
  const handleSetCompany = async (
    companyId: string,
    _companyName: string,
    navigatePath: string,
    state?: any,
  ) => {
    try {
      await setCompanyId({ companyId }).unwrap();
      notifyCompanyChanged(companyId);
      dispatch(baseApi.util.invalidateTags([...TAGS]));
      navigate(navigatePath, { state });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: getErrorMessage(err),
        color: "error",
      });
    }
  };

  // Switch company and open domain URL in new window (no navigate in current window)
  const handleSetCompanyAndOpenInNewWindow = async (
    companyId: string,
    _companyName: string,
    domainUrl: string,
  ) => {
    console.log("[handleSetCompanyAndOpenInNewWindow] companyId:", companyId);
    console.log("[handleSetCompanyAndOpenInNewWindow] domainUrl:", domainUrl);
    try {
      await setCompanyId({ companyId }).unwrap();
      notifyCompanyChanged(companyId);
      console.log("[handleSetCompanyAndOpenInNewWindow] company switch success");
      dispatch(baseApi.util.invalidateTags([...TAGS]));
      window.open(domainUrl, "_blank");
    } catch (err: any) {
      console.error("[handleSetCompanyAndOpenInNewWindow] company switch failed:", err);
      setSnackbar({
        open: true,
        message: getErrorMessage(err),
        color: "error",
      });
    }
  };

  const columns = getCompanyTableColumns({
    setCompanyId,
    handleSetCompanyAndOpenInNewWindow,
    handleSetDefault,
    handleMenuOpen,
    anchorEl,
    selectedRow,
    handleMenuClose,
    handleEdit,
    setDeleteDialog,
    navigate,
    handleSetCompany,
  });

  return (
    <>
      <QuickFilterDataGrid
        columns={columns}
        rows={rows}
        disableRowSelectionOnClick={true}
        onCellClick={(params, event) => {
          if (
            params.field !== "companyName" &&
            params.field !== "noOfUsers" &&
            params.field !== "companyProductDomain" &&
            params.field !== "default" &&
            params.field !== "actions"
          ) {
            event.preventDefault();
          }
        }}
        disableRowSelection={true}
        checkboxSelection={false}
        sx={{ maxHeight: "calc(100vh - 220px)" }}
        disableColumnMenu ={true}
      />

      {/* ---------- Edit Company Modal ---------- */}
      <EditCompanyModal
        open={openEditModal}
        company={selectedCompany}
        onClose={() => {
          setOpenEditModal(false);
          setSelectedCompany(null);
        }}
        onSuccess={() => {
          setOpenEditModal(false);
          setSelectedCompany(null);
        }}
      />

      {/* ---------- Delete Confirmation ---------- */}
      <ConfirmDialog
        open={openDeleteDialog}
        title="Delete Company"
        message="Are you sure you want to delete this company? This action cannot be undone."
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        disableConfirmButton={isDeleting}
        confirmColor="error"
      />

      {/* ---------- Snackbar ---------- */}
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </>
  );
}
export default CompanyTable;
