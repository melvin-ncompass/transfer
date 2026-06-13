import { useEffect, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import SideBarInvoice from "./components/SideBarInvoice";
import InvoiceTempContent from "./components/InvoiceTempContent";
import { PrimaryButton } from "../../../components/atom/button";
import { useSelector } from "react-redux";
import { useAppDispatch, type RootState } from "../../../store/store";
import { buildTransactionDetails } from "./utils/buildTransactionDetails";
import { buildTableDetails } from "./utils/buildTableDetails";
import { buildTotalDetails } from "./utils/buildTotalDetails";
import { buildOtherDetails } from "./utils/buildOtherDetails";
import { Snackbar } from "../../../components/atom/snackbar";
import type { IOtherDetailsState } from "./types/otherDetails";
import DOMPurify from "dompurify";
import {
  useCreateInvoiceTemplateMutation,
  useLazyEditInvoiceTemplateQuery,
  useUpdateInvoiceTemplateMutation,
} from "./api/invoice.api";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import {
  prefillBankDetails,
  prefillIdentityFields,
  setShowBankDetails,
  setShowIdentity,
} from "./slice/otherDetailsSlice";
import { prefillTransactionDetails } from "./slice/transactionDetailsSlice";
import { prefillTableDetails } from "./slice/tableDetailsSlice";
import { prefillFooter } from "./slice/pageSlice";
import {
  saveHeader,
  setPlaceholderPositions,
  setPreviewHtml,
} from "./slice/previewHtmlSlice";
import { prefillTemplateName } from "./slice/sideBarGeneralSlice";

import CustomCircularProgress from "../../../components/atom/circular-progress/CircularProgress";
import { buildHtmlFromPositions } from "./utils/buildHtmlFromPosition";
import { prefillTotal } from "./slice/totalSlice";

export default function InvoiceTemplateView() {
  const [createInvoice] = useCreateInvoiceTemplateMutation();
  const [collapsed, setCollapsed] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "error" as "success" | "error",
  });
  const dispatch = useAppDispatch();
  const [triggerEditInvoiceTemplate, { isLoading }] =
    useLazyEditInvoiceTemplateQuery();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isEdit = searchParams.get("edit") === "true";
  const templateId = searchParams.get("id");

  const [updateInvoice] = useUpdateInvoiceTemplateMutation();

  const templateName = useSelector(
    (state: RootState) => state.invoice.sideGeneral.tempelateName,
  );

  const positions = useSelector(
    (state: RootState) => state.invoice.previewHtml.placeholderPositions,
  );

  const pageCurrentFormat = useSelector(
    (state: RootState) => state.invoice.pageSetUp.pageCurrentFormat,
  );

  const { CheckedTransaction, TransactionValue } = useSelector(
    (state: RootState) => state.invoice.transactionDetails,
  );

  const tableDetails = useSelector(
    (state: RootState) => state.invoice.tableDetail,
  );

  const { checkedTotal, value } = useSelector(
    (state: RootState) => state.invoice.totalReducer,
  );

  const otherDetails = useSelector(
    (state: RootState) => state.invoice.otherDetails,
  ) as IOtherDetailsState;

  const handleSubmit = async () => {
    if (!templateName || templateName.trim() === "") {
      setSnackbar({
        open: true,
        message: "Template Name is required!",
        color: "error",
      });
      return;
    }

    const transactionDetails = buildTransactionDetails(
      CheckedTransaction,
      TransactionValue,
    );

    const finalTable = buildTableDetails(tableDetails);
    const finalTotal = buildTotalDetails(checkedTotal, value);
    const detail = buildOtherDetails(otherDetails);

    const result = {
      templateName,
      header: positions,
      footer: {
        pageCurrentFormat:
          pageCurrentFormat && pageCurrentFormat.startsWith("INV-17")
            ? "Invoice Number - Page X of Y"
            : (pageCurrentFormat ?? ""), // fallback to empty string if null
      },
      transactionDetails,
      table: finalTable,
      total: finalTotal,
      otherDetails: detail,
    };

    try {
      if (isEdit && templateId) {
        await updateInvoice({
          id: Number(templateId),
          updateData: result,
        }).unwrap();
        setSnackbar({
          open: true,
          message: "Template updated successfully!",
          color: "success",
        });
      } else {
        await createInvoice(result).unwrap();
        setSnackbar({
          open: true,
          message: "Submitting details...",
          color: "success",
        });
      }
      navigate("/company/settings", {
        state: { scrollToInvoice: true },
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message:
          err?.data?.message ||
          err?.error ||
          err?.message ||
          "Something went wrong!",
        color: "error",
      });
    }
  };

  useEffect(() => {
    const checkReloadAndFetch = async () => {
      const reload = performance
        .getEntriesByType("navigation")
        .map((nav) => (nav as PerformanceNavigationTiming).type)
        .includes("reload");

      if (!isEdit || !templateId || !reload) return;
      try {
        const response = await triggerEditInvoiceTemplate(Number(templateId)).unwrap();
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
      } catch (err) {

      }
    };

    checkReloadAndFetch();
  }, [isEdit, templateId]);

  return isLoading ? (
    <Box
      sx={{
        height: "80vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CustomCircularProgress size={40} />
    </Box>
  ) : (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconButton
          onClick={() => navigate("/company/settings")}
          sx={{
            p: 1,
            borderRadius: 1.5,
            "&:hover": { backgroundColor: "action.hover" },
          }}
        >
          <ArrowBack fontSize="small" sx={{ color: "text.primary" }} />
        </IconButton>

        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: "text.primary", fontSize: "1.5rem" }}
        >
          Go Back
        </Typography>
      </Box>

      <Box sx={{ display: "flex", height: "80vh", width: "100%", gap: 3 }}>
        <SideBarInvoice collapsed={collapsed} setCollapsed={setCollapsed} />
        <Box sx={{ flexGrow: 1, overflow: "auto", height: "100%" }}>
          <InvoiceTempContent />
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <PrimaryButton onClick={handleSubmit}>Submit</PrimaryButton>
      </Box>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
        />
      )}
    </Box>
  );
}
