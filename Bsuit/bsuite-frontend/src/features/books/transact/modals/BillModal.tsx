import { useEffect, useState, type SetStateAction } from "react";
import {
  prefillInvoiceForm,
  resetInvoiceForm,
  recalculateSummary,
} from "../slice/InvoiceOrBillSlice";
import { mapBillApiToForm, mapExtractedDataToForm, type BillCreatePayload } from "../utils/types";
import {
  useCreateBillMutation,
  useGetBillByIdQuery,
  useUpdateBillMutation,
} from "../api/bill.api";
import { useUploadAttachmentsMutation } from "../transactHome/api/transact.api";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import InvoiceOrBillView from "../InvoiceBill/components/InvoiceBillView";
import { ModalElement } from "../../../../components/dialogs/modal-element/ModalElement";
import { mapFormStateToPayload } from "../api/invoice.api";
import type { HighlightedRow } from "../../../../types/types";
import { useTaxMap } from "../../../../hooks/useTaxMap";
import type { RefetchMetaDataTransactTable } from "../transactHome/types/transact.types";
import { Box, Slider, Typography } from "@mui/material";
import { FilePreview } from "../../../../components/atom/file-preview/FilePreview";

export default function BillModal({
  open,
  mode,
  duplicate,
  selectedRow,
  onClose,
  onSuccess,
  showSnackBar,
  setHighlightedRow,
  previewFile,
  extractedData,
}: {
  open: boolean;
  mode: "Make" | "Edit";
  duplicate?: boolean;
  selectedRow?: any;
  onClose: () => void;
  onSuccess?: (meta?: RefetchMetaDataTransactTable, action?: 'saveAndNext') => void | boolean;
  showSnackBar: (message: string, color: "success" | "error") => void;
  setHighlightedRow?: React.Dispatch<SetStateAction<HighlightedRow>>;
  previewFile?: File | null;
  extractedData?: any;
}) {
  const dispatch = useAppDispatch();
  const invoiceForm = useAppSelector((s) => s.invoiceForm);
  const [createBill] = useCreateBillMutation();
  const [updateBill] = useUpdateBillMutation();
  const [uploadAttachments] = useUploadAttachmentsMutation();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isDataReady, setIsDataReady] = useState(true);
  const [hasUserEdited, setHasUserEdited] = useState(false);
  const [initialFormState, setInitialFormState] = useState<string>("");
  const [hasFormChanged, setHasFormChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewPaneWidth, setPreviewPaneWidth] = useState(45);

  useEffect(() => {
    if (open && previewFile) {
      setImageFiles([previewFile]);
    }
  }, [open, previewFile]);

  const { data, isSuccess, refetch } = useGetBillByIdQuery(
    selectedRow?.transactionTypeId || selectedRow?.id!,
    {
      skip: mode !== "Edit" || !selectedRow?.id,
    },
  );

  const taxMap = useTaxMap();

  useEffect(() => {
    if (mode !== "Edit") return;
    if (!open) return;
    if (!isSuccess || !data) return;
    if (hasUserEdited) return;

    const mapped = duplicate
      ? mapBillApiToForm(data, taxMap, true)
      : mapBillApiToForm(data, taxMap, false);

    const hasItemDiscount = mapped.rows?.some((r) => r.discountValue > 0);
    const hasTransactionDiscount = !!mapped.transactionDiscount;

    dispatch(prefillInvoiceForm({
      ...mapped,
      flags: {
        ...mapped.flags,
        showInlineDisc: hasItemDiscount && !hasTransactionDiscount,
      },
    }));
    setTimeout(() => {
      dispatch(recalculateSummary());
    }, 0);
    setIsDataReady(true);
  }, [mode, isSuccess, data]);

  // Capture initial state after prefill
  // Disable save button if form hasn't changed
  useEffect(() => {
    if (
      mode === "Edit" &&
      !duplicate &&
      isSuccess &&
      isDataReady &&
      !initialFormState
    ) {
      // Use a short timeout to ensure Redux form is updated after dispatch(prefillInvoiceForm)
      const timeout = setTimeout(() => {
        setInitialFormState(JSON.stringify(invoiceForm));
        setHasFormChanged(false);
      }, 300); // next tick ensures Redux store is updated

      return () => clearTimeout(timeout);
    }
  }, [mode, duplicate, isDataReady, isSuccess, initialFormState, invoiceForm]);

  // Track changes by comparing current state with initial state
  useEffect(() => {
    if (mode === "Edit" && !duplicate && initialFormState) {
      const currentState = JSON.stringify(invoiceForm);
      setHasFormChanged(currentState !== initialFormState);
    }
  }, [invoiceForm, initialFormState, mode, duplicate]);

  useEffect(() => {
    if (!open || mode !== "Make") return;
    if (extractedData) {
      const mappedData = mapExtractedDataToForm(extractedData, "Bill", taxMap);
      dispatch(prefillInvoiceForm(mappedData));
      setTimeout(() => dispatch(recalculateSummary()), 0);
    } else {
      dispatch(resetInvoiceForm());
    }
    setHasUserEdited(false);
    setHasFormChanged(false);
  }, [open, mode, extractedData, taxMap]);

  useEffect(() => {
    if (open && mode === "Edit" && selectedRow?.id) {
      setIsDataReady(false);
      setHasUserEdited(false);
      setInitialFormState("");
      setHasFormChanged(false);
      refetch();
    }
  }, [open, mode, selectedRow?.id, refetch]);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setImageFiles([]);
      setIsDataReady(true);
      setHasUserEdited(false);
      setInitialFormState("");
      setHasFormChanged(false);
      setIsSaving(false);
      dispatch(resetInvoiceForm());
    }
  }, [open]);

  const billId = data?.data?.billData?.id;

  // Determine if Save button should be disabled
  const isSaveDisabled =
    isSaving || (mode === "Edit" && !duplicate && !hasFormChanged);

  const handleBillSave = async (submitAction?: 'saveAndNext') => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      setHasUserEdited(true);

      if (!invoiceForm.header.contactId) {
        showSnackBar("Please select a contact before saving", "error");
        setIsSaving(false);
        return;
      }

      if (invoiceForm.formType !== "Bill") {
        setIsSaving(false);
        return;
      }

      // ---------- CREATE ----------
      if (mode === "Make" || duplicate) {
        const payload = mapFormStateToPayload(invoiceForm) as BillCreatePayload;
        const response = await createBill(payload).unwrap();

        // Highlight row
        const transactionId = String(response?.data?.transactionTypeId);
        if (setHighlightedRow) {
          setHighlightedRow({
            key: "transactionTypeId",
            value: transactionId,
            type: "add",
          });
        }

        // Attachments – await so table refetch sees correct count (same as InvoiceModal)
        if (imageFiles.length > 0 && response?.data?.transactionTypeId) {
          try {
            await uploadAttachments({
              files: imageFiles,
              transactionTypeId: response.data.transactionTypeId,
              transactionTypeName: "bill",
            }).unwrap();
          } catch (err) {
            showSnackBar("Bill created but attachments upload failed", "error");
          }
        }

        showSnackBar("Bill created successfully", "success");
        const shouldClose = onSuccess?.({
          newTransactionId: transactionId,
          newTransactionName: "bill",
          newPaymentId: null,
        }, submitAction);
        dispatch(resetInvoiceForm());
        setImageFiles([]);
        setIsSaving(false);
        if (shouldClose !== false) {
          onClose();
        }
        setHasUserEdited(false);
        return;
      }

      // ---------- UPDATE ----------
      if (mode === "Edit" && !duplicate) {
        if (!selectedRow?.id) {
          showSnackBar("Bill ID missing", "error");
          setIsSaving(false);
          return;
        }

        const payload = {
          ...mapFormStateToPayload(invoiceForm),
          id: selectedRow?.id,
        } as BillCreatePayload & { id: number };

        await updateBill({
          id: selectedRow?.transactionTypeId ?? selectedRow?.id,
          updatedData: payload,
        }).unwrap();

        const transactionId = String(
          selectedRow?.id ?? selectedRow?.transactionTypeId,
        );
        if (setHighlightedRow) {
          setHighlightedRow({
            key: "id",
            value: transactionId,
            type: "edit",
          });
        }

        // Attachments on edit (same as InvoiceModal)
        if (imageFiles.length > 0 && transactionId) {
          try {
            await uploadAttachments({
              files: imageFiles,
              transactionTypeId: transactionId,
              transactionTypeName: "bill",
            }).unwrap();
            showSnackBar("Bill updated and attachments uploaded", "success");
          } catch (err) {
            console.error("Attachment upload failed:", err);
            showSnackBar(
              "Bill updated but attachments upload failed",
              "error",
            );
          }
        } else {
          showSnackBar("Bill updated successfully", "success");
        }
        
        let shouldClose: boolean | void = true;
        if (selectedRow?.type == "all_bills") {
          shouldClose = onSuccess?.({
            newBillNo: selectedRow?.billNo,
          }, submitAction);
        } else {
          shouldClose = onSuccess?.({
            newTransactionId: selectedRow?.id,
            newTransactionName: selectedRow?.type,
            newPaymentId: selectedRow?.paymentId,
          }, submitAction);
        }
        setHasUserEdited(false);

        setTimeout(() => {
          dispatch(resetInvoiceForm());
          setIsSaving(false);
          if (shouldClose !== false) {
            onClose();
          }
        }, 800);
      }
    } catch (err: any) {
      setIsSaving(false);
      let errorMessage = "Failed to save bill. Please try again.";
      const rawMessage = err?.data?.message;

      if (Array.isArray(rawMessage)) {
        const formattedMessages = rawMessage.map((msg: string) => {
          const match = msg.match(/^items\.(\d+)\.(\w+)/);
          if (match) {
            const [, index, field] = match;
            const readableField = field
              .replace(/([A-Z])/g, " $1")
              .toLowerCase()
              .trim();
            return `"${readableField}" is missing in row ${Number(index) + 1}.`;
          }
          if (/account with id 0/i.test(msg))
            return "Please select an account before saving.";
          return msg;
        });
        errorMessage = formattedMessages.join("\n");
      } else if (typeof rawMessage === "string") {
        errorMessage = /account with id 0/i.test(rawMessage)
          ? "Please select an account before saving."
          : rawMessage;
      } else if (err?.error) {
        errorMessage = err.error;
      }

      showSnackBar(errorMessage, "error");
    }
  };

  return (
    <ModalElement
      title={duplicate ? "Duplicate Bill" : mode + " Bill"}
      open={open}
      height="90vh"
      maxWidth="xl"
      draggable={true}
      contentSx={previewFile ? { overflow: "hidden", p: 0 } : undefined}
      headerActions={
        previewFile ? (
          <Box
            sx={{ width: 160, display: "flex", alignItems: "center", gap: 1 }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
              Resize
            </Typography>
            <Slider
              size="small"
              value={previewPaneWidth}
              min={25}
              max={70}
              step={1}
              onChange={(_, value) => setPreviewPaneWidth(value as number)}
              sx={{ width: 100 }}
            />
          </Box>
        ) : undefined
      }
      onClose={() => {
        dispatch(resetInvoiceForm());
        onClose();
      }}
    >
      {previewFile ? (
        <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
          {/* PDF / Image Preview */}
          <Box
            sx={{
              width: `${previewPaneWidth}%`,
              flexShrink: 0,
              height: "100%",
              bgcolor: "grey.50",
              overflow: "hidden",
            }}
          >
            <FilePreview file={previewFile} />
          </Box>
          {/* Form */}
          <Box sx={{ flex: 1, height: "100%", overflowY: "auto", p: 3 }}>
            <InvoiceOrBillView
              formType="Bill"
              mode={mode}
              docId={billId}
              duplicate={duplicate}
              isLoading={!isDataReady}
              onSave={handleBillSave}
              imageFiles={imageFiles}
              onImageFilesChange={setImageFiles}
              isSaveDisabled={isSaveDisabled}
              showSaveAndNext={!!previewFile}
            />
          </Box>
        </Box>
      ) : (
        <InvoiceOrBillView
          formType="Bill"
          mode={mode}
          docId={billId}
          duplicate={duplicate}
          isLoading={!isDataReady}
          onSave={handleBillSave}
          imageFiles={imageFiles}
          onImageFilesChange={setImageFiles}
          isSaveDisabled={isSaveDisabled}
          showSaveAndNext={!!previewFile}
        />
      )}
    </ModalElement>
  );
}
