import { useState } from "react";
import { Box, Card, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { ConfirmDialog } from "../../../../components/dialogs/confirm-dialog";
import { Snackbar } from "../../../../components/atom/snackbar";
import { PrimaryIconButton } from "../../../../components/atom/button";

import { getInvoiceTableColumns } from "./InvoiceTableColumns";
import {
  useGetInvoiceTemplatesQuery,
  useDeleteInvoiceTemplateMutation,
  useSetDefaultInvoiceTemplateMutation,
  useLazyEditInvoiceTemplateQuery,
} from "../api/invoice.api";
import { useNavigate } from "react-router-dom";
import {
  prefillBankDetails,
  prefillIdentityFields,
  setShowBankDetails,
  setShowIdentity,
} from "../slice/otherDetailsSlice";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../../store/store";
import { prefillTransactionDetails } from "../slice/transactionDetailsSlice";
import { prefillTableDetails } from "../slice/tableDetailsSlice";
import { prefillFooter } from "../slice/pageSlice";
import {
  saveHeader,
  setPlaceholderPositions,
  setPreviewHtml,
} from "../slice/previewHtmlSlice";
import { prefillTemplateName } from "../slice/sideBarGeneralSlice";
import { resetAllInvoiceState } from "../utils/resetAllInvoiceState";
import { Tooltip } from "../../../../components/atom/tooltip";
import { StandardTable } from "../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../types/types";
import { buildHtmlFromPositions } from "../utils/buildHtmlFromPosition";
import DOMPurify from "dompurify";
import type {
  ICheckedTransactionDetails,
  ITransactionDetailsValue,
} from "../types/transactionDetails";
import { prefillTotal } from "../slice/totalSlice";
import { PermissionGuard } from "../../../../guards/ComponentGuard";
export default function InvoiceCard() {
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [openDeleteDialog, setDeleteDialog] = useState(false);
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  // ---------- API ----------
  const { data: InvoiceData } = useGetInvoiceTemplatesQuery();
  const [deleteTemplate] = useDeleteInvoiceTemplateMutation();
  const [setDefaultTemplate] = useSetDefaultInvoiceTemplateMutation();
  const [triggerEditInvoiceTemplate] = useLazyEditInvoiceTemplateQuery();

  const rows = InvoiceData?.data || [];

  const showSnackbar = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  //---------- Edit ----------

  const handleEdit = async (template: {
    id: number;
    isDefault: boolean;
    templateName: string;
  }) => {
    try {
      const response = await triggerEditInvoiceTemplate(template.id).unwrap();
      const data = response?.data;

      if (!data) return;

      // Bank
      if (data.bankDetails) {
        dispatch(prefillBankDetails(data.bankDetails));
      }

      // Identity
      if (data.identityDetails?.length) {
        dispatch(prefillIdentityFields(data.identityDetails));
      }

      dispatch(prefillTransactionDetails(response.data.transaction));

      // Table
      if (data.table) {
        dispatch(prefillTableDetails(data.table));
      }

      if (data.others?.total) {
        dispatch(prefillTotal(data.others.total));
      }
      // Footer
      dispatch(
        prefillFooter({
          pageCurrentFormat: data.footer?.pageCurrentFormat ?? null,
        }),
      );

      // Header
      if (data.header) {
        // 1. Build HTML from positions
        const html = buildHtmlFromPositions(data.header);

        // 2. Extract placeholder positions (same logic as getPlaceholderPositions)
        const positions = data.header; // already in {key: ["1a", "2b"]} format

        // 3. Build preview HTML by replacing %KEY% with KEY text
        const previewHtml = DOMPurify.sanitize(
          html.replace(/%([A-Za-z0-9_]+)%/g, (_, key) => key),
        );

        // 4. Dispatch everything
        dispatch(
          saveHeader({
            html,
            placeholders: Object.keys(data.header),
          }),
        );
        dispatch(setPreviewHtml(previewHtml));
        dispatch(setPlaceholderPositions(positions));
      }

      // Template Name
      if (data.templateName) {
        dispatch(prefillTemplateName(data.templateName));
      }

      if (data.others) {
        dispatch(setShowBankDetails(data.others.showBankDetails));
        dispatch(setShowIdentity(data.others.showIdentity));
      }
      if (response.success) {
        navigate(`/company/settings/invoice?edit=true&id=${template.id}`);
      }
    } catch (err: any) {
      showSnackbar(
        err?.data?.message ||
          err?.error ||
          err?.message ||
          "Something went wrong!",
        "error",
      );
    }
  };

  // ---------- Delete ----------
  const handleDelete = async () => {
    if (!selectedRow) return;

    try {
      await deleteTemplate({ id: Number(selectedRow) }).unwrap();
      showSnackbar("Template deleted successfully!", "success");
    } catch (err: any) {
      showSnackbar(err?.data.message, "error");
    } finally {
      setDeleteDialog(false);
      setSelectedRow(null);
    }
  };

  // ---------- Set Default ----------
  const handleSetDefault = async (templateId: string) => {
    try {
      await setDefaultTemplate({ id: Number(templateId) }).unwrap();
      showSnackbar("Default template updated", "success");
    } catch (err: any) {
      showSnackbar(err?.data.message, "error");
    }
  };

  // ---------- Columns ----------
  const columns: StandardTableColumn[] = getInvoiceTableColumns({
    onEdit: handleEdit,
    onDelete: (id: string) => {
      setSelectedRow(id);
      setDeleteDialog(true);
    },
    onSetDefault: handleSetDefault,
  });

  return (
    <Card
      id="invoice-card-section"
      sx={{
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* ---------- Header ---------- */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography variant="h6">Invoice PDF Templates</Typography>

       <PermissionGuard permission={"update_business_settings"}>
         <Tooltip title="Add Template">
          <PrimaryIconButton
            onClick={() => {
              resetAllInvoiceState(dispatch),
                navigate("/company/settings/invoice", {
                  state: {
                    create: true,
                  },
                });
            }}
            icon={<AddIcon />}
          />
        </Tooltip>
       </PermissionGuard>
      </Box>

      {/* ---------- Table ---------- */}
      <StandardTable columns={columns} rows={rows} />

      {/* ---------- Delete Confirmation ---------- */}
      <ConfirmDialog
        open={openDeleteDialog}
        title="Delete Template"
        message="Are you sure you want to delete this invoice template?"
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        confirmColor="error"
      />

      {/* ---------- Snackbar ---------- */}
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        />
      )}
    </Card>
  );
}
