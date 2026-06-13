import { useMemo } from "react";
import type { InvoiceFormState } from "../utils/types";

interface ValidationError {
  field: string;
  message: string;
}

export const useInvoiceValidation = (
  invoiceForm: InvoiceFormState,
  docValidation: { valid: boolean; message?: string },
  dateValidation: {
    servicePeriod: { valid: boolean; message: string };
    documentDates: { valid: boolean; message: string };
  }
) => {
  const errors = useMemo(() => {
    const errorList: ValidationError[] = [];

    //  Contact validation
    if (!invoiceForm.header.contactId) {
      errorList.push({
        field: "Contact",
        message: `${invoiceForm.formType === "Invoice" ? "Bill To" : "Bill From"} is required`,
      });
    }

    //  Document number validation
    if (!invoiceForm.header.documentNo || invoiceForm.header.documentNo.trim() === "") {
      errorList.push({
        field: "Document Number",
        message: `${invoiceForm.formType} Number is required`,
      });
    }

    //  Document number uniqueness validation
    if (!docValidation.valid && docValidation.message) {
      errorList.push({
        field: "Document Number",
        message: docValidation.message,
      });
    }

    //  Date validations
    if (!dateValidation.servicePeriod.valid) {
      errorList.push({
        field: "Service Period",
        message: dateValidation.servicePeriod.message,
      });
    }

    if (!dateValidation.documentDates.valid) {
      errorList.push({
        field: "Document Dates",
        message: dateValidation.documentDates.message,
      });
    }

    //  Row-level validations
    invoiceForm.rows.forEach((row, index) => {
      const rowNumber = index + 1;

      // Item name
      if (!row.itemName || row.itemName.trim() === "") {
        errorList.push({
          field: `Row ${rowNumber}`,
          message: `Item Name is required in row ${rowNumber}`,
        });
      } else if (row.itemName.trim().length < 2 || row.itemName.trim().length > 300) {
        errorList.push({
          field: `Row ${rowNumber}`,
          message: `Item name must be between 2 and 300 characters in row ${rowNumber}`,
        });
      }

      // Account
      if (!row.accountId || row.accountId === 0) {
        errorList.push({
          field: `Row ${rowNumber}`,
          message: `Account is required in row ${rowNumber}`,
        });
      }

      // Quantity
      if (!row.quantity || row.quantity <= 0) {
        errorList.push({
          field: `Row ${rowNumber}`,
          message: `Quantity must be greater than 0 in row ${rowNumber}`,
        });
      }

      // Price
      if (row.price === 0 || row.price === null || row.price === undefined) {
        errorList.push({
          field: `Row ${rowNumber}`,
          message: `Price is required in row ${rowNumber}`,
        });
      }

      // TDS validation (if inline TDS is enabled)
      if (invoiceForm.flags.showInlineTds) {
        if (row.tdsValue === null || row.tdsValue === undefined) {
          errorList.push({
            field: `Row ${rowNumber}`,
            message: `TDS value is required in row ${rowNumber}`,
          });
        }
      }

      // Discount validation (if inline discount is enabled)
      if (invoiceForm.flags.showInlineDisc) {
        if (row.discountValue === null || row.discountValue === undefined) {
          errorList.push({
            field: `Row ${rowNumber}`,
            message: `Discount value is required in row ${rowNumber}`,
          });
        }
      }
    });

    //  Transaction-level TDS validation
    if (invoiceForm.transactionTds) {
      if (
        invoiceForm.transactionTds.value === null ||
        invoiceForm.transactionTds.value === undefined
      ) {
        errorList.push({
          field: "Transaction TDS",
          message: "TDS value is required when TDS is enabled",
        });
      }
    }

    //  Transaction-level Discount validation
    if (invoiceForm.transactionDiscount) {
      if (
        invoiceForm.transactionDiscount.value === null ||
        invoiceForm.transactionDiscount.value === undefined
      ) {
        errorList.push({
          field: "Transaction Discount",
          message: "Discount value is required when discount is enabled",
        });
      }

      // Account validation for discount
      if (!invoiceForm.transactionDiscount.accountId) {
        errorList.push({
          field: "Transaction Discount",
          message: "Discount account is required when discount is enabled",
        });
      }
    }

    //  Currency validation
    if (!invoiceForm.header.currency) {
      errorList.push({
        field: "Currency",
        message: "Currency is required",
      });
    }

    return errorList;
  }, [invoiceForm, docValidation, dateValidation]);

  const isValid = errors.length === 0;

  const errorMessage = useMemo(() => {
    if (errors.length === 0) return "";
    
    // Group errors by field
    const grouped = errors.reduce((acc, error) => {
      if (!acc[error.field]) {
        acc[error.field] = [];
      }
      acc[error.field].push(error.message);
      return acc;
    }, {} as Record<string, string[]>);

    // Format errors
    return Object.entries(grouped)
      .map(([field, messages]) => {
        if (messages.length === 1) {
          return `• ${messages[0]}`;
        }
        return `• ${field}:\n  ${messages.join("\n  ")}`;
      })
      .join("\n");
  }, [errors]);

  // Truncated error message for tooltip (show max 5 errors)
  const truncatedErrorMessage = useMemo(() => {
    if (errors.length === 0) return "";
    
    const maxErrors = 5;
    const displayErrors = errors.slice(0, maxErrors);
    const remainingCount = errors.length - maxErrors;
    
    const messages = displayErrors.map((error) => `• ${error.message}`);
    
    if (remainingCount > 0) {
      messages.push(`\n... and ${remainingCount} more error${remainingCount > 1 ? 's' : ''}`);
    }
    
    return messages.join("\n");
  }, [errors]);

  return {
    isValid,
    errors,
    errorMessage,
    truncatedErrorMessage,
    errorCount: errors.length,
  };
};