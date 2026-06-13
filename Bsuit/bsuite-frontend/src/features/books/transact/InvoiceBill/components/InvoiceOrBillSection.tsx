import { Box, Typography, IconButton, Stack } from "@mui/material";
import Delete from "@mui/icons-material/Delete";
import InvoiceRepeater from "./InvoiceOrBillRepeater";
import { PrimaryButton } from "../../../../../components/atom/button";
import InvoiceSummaryCard from "./InvoiceOrBillSummaryCard";
import { TextAreaField } from "../../../../../components/atom/text-area-field/TextAreaField";

import { useAppDispatch, useAppSelector } from "../../../../../store/store";
import {
  addRow,
  deleteRow,
  recalculateSummary,
  setNotes,
} from "../../slice/InvoiceOrBillSlice";
import type { InvoiceSectionProps } from "../../utils/types";
import { FileUploadField } from "../../../../../components/atom/file-upload-field";

export function InvoiceSection({
  selectedCurrency,
  showInlineTds,
  showInlineDisc,
  tdsLevel,
  discLevel,
  formType,
  mode,
  imageFiles,
  onImageFilesChange,
  fxRate,
  companyCurrencyCode,
  selectedCurrencyCode,
  companyCurrencySymbol,
  showTotal,
  fxLoading,
  duplicate,
  showInlineTax,
  TaxLevel,
}: InvoiceSectionProps & {
  imageFiles?: File[];
  onImageFilesChange?: (files: File[]) => void;
  fxRate?: number | null;
  companyCurrencyCode?: string;
  selectedCurrencyCode?: string;
  companyCurrencySymbol?: string;
  showTotal: boolean;
  fxLoading: boolean;
  duplicate?: boolean;
  showInlineTax: any;
  TaxLevel: any;
}) {
  const dispatch = useAppDispatch();

  const notes = useAppSelector((state) => state.invoiceForm.header.notes);
  const rows = useAppSelector((state) => state.invoiceForm.rows);
  const summary = useAppSelector((state) => state.invoiceForm.summary);

  const handleAddFiles = (files: File[] | File | null) => {
    if (!files) return;
    const fileArray = Array.isArray(files) ? files : [files];
    const updatedFiles = [...(imageFiles || []), ...fileArray];
    onImageFilesChange?.(updatedFiles);
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = (imageFiles || []).filter((_, i) => i !== index);
    onImageFilesChange?.(updatedFiles);
  };

  const currencySymbol = selectedCurrency?.split(" - ")[0] ?? "";

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {/* ROWS */}
      {rows.map((row, i) => (
        <InvoiceRepeater
          selectedCurrency={currencySymbol}
          key={row.id}
          index={i}
          row={row}
          showHeader={i === 0}
          showInlineTds={showInlineTds}
          showInlineDisc={showInlineDisc}
          showDelete={rows.length > 1}
          formType={formType}
          onDelete={() => {
            dispatch(deleteRow(i));
            dispatch(recalculateSummary());
          }}
          showInlineTax={showInlineTax}
          taxLevel={TaxLevel}
        />
      ))}

      <Box width={120}>
        <PrimaryButton onClick={() => dispatch(addRow())}>
          Add Item
        </PrimaryButton>
      </Box>

      {/* SUMMARY */}
      <InvoiceSummaryCard
        selectedCurrency={currencySymbol}
        formType={formType}
        summary={summary}
        isTdsEnabled={tdsLevel}
        isDiscEnabled={discLevel}
        fxRate={fxRate}
        fxLoading={fxLoading}
        companyCurrencyCode={companyCurrencyCode}
        selectedCurrencyCode={selectedCurrencyCode}
        companyCurrencySymbol={companyCurrencySymbol}
        showTotal={showTotal}
        isTaxEnabled={TaxLevel}
      />

      <TextAreaField
        width="100%"
        label="Notes"
        value={notes ?? ""}
        onChange={(val: string) => dispatch(setNotes(val))}
        rows={2}
        maxLength={255}
      />

      {/* Attachments Section - Only show in Create mode */}
      {!(mode === "Edit" && !duplicate) && (
        <Stack spacing={2}>
          {/* Upload */}
          <FileUploadField
            label="Attachments"
            multiple
            maxFiles={10} // max number of files allowed
            maxSize={5} // max size per file in MB
           accept={["image/jpeg", "image/png", "image/webp", "application/pdf"]}  // allowed types
            value={null}
            onChange={handleAddFiles}
          />

          {/* File List */}
          {imageFiles && imageFiles.length > 0 && (
            <Stack spacing={1}>
              {imageFiles.map((file, index) => (
                <Stack
                  key={`${file.name}-${index}`}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    px: 1.5,
                    py: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2">
                    {file.name}
                    {` (${(file.size / 1024).toFixed(2)} KB)`}
                  </Typography>

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Box>
  );
}
