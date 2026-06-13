import { useEffect, useState, type SetStateAction } from "react";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import {
  mapFormStateToPayload,
  useCreateInvoiceMutation,
  useGetInvoiceByIdQuery,
  useUpdateInvoiceMutation,
} from "../api/invoice.api";
import { useUploadAttachmentsMutation } from "../transactHome/api/transact.api";
import { mapInvoiceApiToForm, mapExtractedDataToForm, type InvoiceCreatePayload } from "../utils/types";
import {
  prefillInvoiceForm,
  resetInvoiceForm,
  recalculateSummary,
} from "../slice/InvoiceOrBillSlice";
import { ModalElement } from "../../../../components/dialogs/modal-element/ModalElement";
import InvoiceOrBillView from "../InvoiceBill/components/InvoiceBillView";
import type { HighlightedRow } from "../../../../types/types";
import { useTaxMap } from "../../../../hooks/useTaxMap";
import type { RefetchMetaDataTransactTable } from "../transactHome/types/transact.types";
import { Box, Slider, Typography } from "@mui/material";
import { FilePreview } from "../../../../components/atom/file-preview/FilePreview";

export default function InvoiceModal({
  open,
  mode,
  selectedRow,
  duplicate,
  onClose,
  onSuccess,
  showSnackBar,
  setHighlightedRow,
  previewFile,
  extractedData,
}: {
  open: boolean;
  mode: "Make" | "Edit";
  selectedRow?: any;
  duplicate?: boolean;
  onClose: () => void;
  onSuccess?: (meta?: RefetchMetaDataTransactTable, action?: 'saveAndNext') => void | boolean;

  showSnackBar: (message: string, color: "success" | "error") => void;
  setHighlightedRow?: React.Dispatch<SetStateAction<HighlightedRow>>;
  previewFile?: File | null;
  extractedData?: any;
}) {
  const dispatch = useAppDispatch();
  const invoiceForm = useAppSelector((s) => s.invoiceForm);

  const [createInvoice] = useCreateInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();
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

  const { data, isSuccess, refetch } = useGetInvoiceByIdQuery(
    selectedRow?.transactionTypeId || selectedRow?.id!,
    {
      skip: mode !== "Edit" || !selectedRow?.id,
    },
  );

  const taxMap = useTaxMap();

  // PREFILL ONLY FOR EDIT
  // useEffect(() => {
  //   if (mode !== "Edit") return;
  //   if (!open) return;
  //   if (!isSuccess || !data) return;
  //   if (hasUserEdited) return;

  //   const mapped = duplicate
  //     ? mapInvoiceApiToForm(data, taxMap, true)
  //     : mapInvoiceApiToForm(data, taxMap, false);

  //   const hasItemDiscount = mapped.rows?.some((r) => r.discountValue > 0);
  //   const hasTransactionDiscount = !!mapped.transactionDiscount;

  //   dispatch(prefillInvoiceForm({
  //     ...mapped,
  //     flags: {
  //       ...mapped.flags,
  //       showInlineDisc: hasItemDiscount && !hasTransactionDiscount,  // ← infer item-level
  //     },
  //   }));
  //   dispatch(recalculateSummary());
  //   setIsDataReady(true);
  // }, [mode, isSuccess, data, hasUserEdited]);
  useEffect(() => {
    if (mode !== "Edit") return;
    if (!open) return;
    if (!isSuccess || !data) return;
    if (hasUserEdited) return;

    const mapped = duplicate
      ? mapInvoiceApiToForm(data, taxMap, true)
      : mapInvoiceApiToForm(data, taxMap, false);

    const hasItemDiscount = mapped.rows?.some((r) => r.discountValue > 0);
    const hasTransactionDiscount = !!mapped.transactionDiscount;

    dispatch(prefillInvoiceForm({
      ...mapped,
      flags: {
        ...mapped.flags,
        showInlineDisc: hasItemDiscount && !hasTransactionDiscount,
      },
    }));

    // setTimeout ensures recalculate runs AFTER Redux commits the prefilled state
    setTimeout(() => {
      dispatch(recalculateSummary());
    }, 0);

    setIsDataReady(true);
  }, [mode, isSuccess, data, hasUserEdited]);

  // Capture initial state after prefill (only for Edit mode, not Duplicate)
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

  useEffect(() => {
    if (mode === "Edit" && !duplicate && initialFormState) {
      const currentState = JSON.stringify(invoiceForm);
      setHasFormChanged(currentState !== initialFormState);
    }
  }, [invoiceForm, initialFormState, mode, duplicate]);

  // RESET FOR ADD
  useEffect(() => {
    if (!open || mode !== "Make") return;

    if (extractedData) {
      const mappedData = mapExtractedDataToForm(
        extractedData,
        "Invoice",
        taxMap
      );

      dispatch(prefillInvoiceForm(mappedData));

      setTimeout(() => {
        dispatch(recalculateSummary());
      }, 0);
    } else {
      dispatch(resetInvoiceForm());
    }

    setHasUserEdited(false);
    setHasFormChanged(false);

  }, [open, mode, extractedData]);

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
      dispatch(resetInvoiceForm());
      setImageFiles([]);
      setIsDataReady(true);
      setHasUserEdited(false);
      setInitialFormState("");
      setHasFormChanged(false);
      setIsSaving(false);
    }
  }, [open]);

  const invoiceId = data?.data?.invoiceData?.id;

  // Determine if Save button should be disabled
  const isSaveDisabled =
    isSaving || (mode === "Edit" && !duplicate && !hasFormChanged);

  const handleInvoiceSave = async (submitAction?: 'saveAndNext') => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      setHasUserEdited(true);

      if (!invoiceForm.header.contactId) {
        showSnackBar("Please select a contact before saving", "error");
        setIsSaving(false);
        return;
      }

      if (invoiceForm.formType !== "Invoice") {
        setIsSaving(false);
        return;
      }

      const isEdit = mode === "Edit" && !duplicate;
      const payload: InvoiceCreatePayload = mapFormStateToPayload(
        invoiceForm,
      ) as InvoiceCreatePayload;

      let response: any;
      // ---------- CREATE ----------
      if (!isEdit || duplicate) {
        response = await createInvoice(payload).unwrap();
        // console.log("Response", response);
        // Highlight row
        const transactionId = String(response?.data?.transactionTypeId);
        if (setHighlightedRow) {
          setHighlightedRow({
            key: "transactionTypeId",
            value: transactionId,
            type: "add",
          });
        }

        // Attachments
        if (imageFiles.length > 0 && response?.data?.transactionTypeId) {
          try {
            await uploadAttachments({
              files: imageFiles,
              transactionTypeId: response.data.transactionTypeId,
              transactionTypeName: "invoice",
            }).unwrap();
            showSnackBar("Invoice created and attachments uploaded", "success");
          } catch (err) {
            console.error("Attachment upload failed:", err);
            showSnackBar(
              "Invoice created but attachments upload failed",
              "error",
            );
          }
        } else {
          showSnackBar("Invoice created successfully", "success");
        }
        const shouldClose = onSuccess?.({
          newTransactionId: transactionId,
          newTransactionName: "invoice",
          newPaymentId: null,
        }, submitAction);

        setIsSaving(false);
        if (shouldClose !== false) {
          onClose();
        }
        setHasUserEdited(false);
        return;
      }

      // ---------- UPDATE ----------
      if (isEdit) {
        if (!selectedRow?.id) {
          showSnackBar("Invoice ID missing", "error");
          setIsSaving(false);
          return;
        }

        const updatePayload: InvoiceCreatePayload & { id: number } = {
          ...payload,
          id: selectedRow.id,
        };

        response = await updateInvoice({
          id: selectedRow?.transactionTypeId ?? selectedRow?.id,
          updatedData: updatePayload,
        }).unwrap();

        // Highlight row
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

        // Attachments
        if (imageFiles.length > 0 && response?.data?.transactionTypeId) {
          try {
            await uploadAttachments({
              files: imageFiles,
              transactionTypeId: response.data.transactionTypeId,
              transactionTypeName: "invoice",
            }).unwrap();
            showSnackBar("Invoice updated and attachments uploaded", "success");
          } catch (err) {
            console.error("Attachment upload failed:", err);
            showSnackBar(
              "Invoice updated but attachments upload failed",
              "error",
            );
          }
        } else {
          showSnackBar("Invoice updated successfully", "success");
        }

        let shouldClose: boolean | void = true;
        if (selectedRow?.type == "all_invoices") {
          shouldClose = onSuccess?.({
            newInvoiceNo: selectedRow?.invoiceNo,
          }, submitAction);
        } else {
          shouldClose = onSuccess?.({
            newTransactionId: selectedRow?.id,
            newTransactionName: selectedRow?.type,
            newPaymentId: selectedRow?.paymentId,
          }, submitAction);
        }

        if (shouldClose !== false) {
          onClose();
        }
        setIsSaving(false);
        setHasUserEdited(false);
      }
    } catch (err: any) {
      setIsSaving(false);
      let errorMessage = "Failed to save invoice. Please try again.";
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
            return `“${readableField}” is missing in row ${Number(index) + 1}.`;
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
      title={duplicate ? "Duplicate Invoice" : mode + " Invoice"}
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
              formType="Invoice"
              onSave={handleInvoiceSave}
              docId={invoiceId}
              mode={mode}
              duplicate={duplicate}
              isLoading={!isDataReady}
              imageFiles={imageFiles}
              onImageFilesChange={setImageFiles}
              isSaveDisabled={isSaveDisabled}
              showSaveAndNext={!!previewFile}
            />
          </Box>
        </Box>
      ) : (
        <InvoiceOrBillView
          formType="Invoice"
          onSave={handleInvoiceSave}
          docId={invoiceId}
          mode={mode}
          duplicate={duplicate}
          isLoading={!isDataReady}
          imageFiles={imageFiles}
          onImageFilesChange={setImageFiles}
          isSaveDisabled={isSaveDisabled}
          showSaveAndNext={!!previewFile}
        />
      )}
    </ModalElement>
  );
}
