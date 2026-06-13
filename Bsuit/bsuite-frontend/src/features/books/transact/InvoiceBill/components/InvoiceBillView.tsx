import { Box, Divider, IconButton, MenuItem, Switch } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/Info";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Typography } from "@mui/material";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { PrimaryButton } from "../../../../../components/atom/button/PrimaryButton";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { useEffect, useMemo, useRef, useState } from "react";
import { InvoiceSection } from "./InvoiceOrBillSection";
import { InputAdornment } from "@mui/material";
import {
  useRegisterContactMutation,
} from "../../../coa/contact/api/contact.api";
import { currencyData } from "../../../../company/utils/currency";
import type { ICurrencyItem } from "../../../../company/types/company.types";
import AddContactForm from "../../../coa/contact/dialog/ContactForm";
import { ModalElement } from "../../../../../components/dialogs/modal-element/ModalElement";
import type { IContactRegister } from "../../../coa/contact/types/contact.types";
import { Snackbar } from "../../../../../components/atom/snackbar/Snackbar";
import type { FormType, TransactionLevel } from "../../utils/types";
import {
  enableInlineTds,
  disableInlineTds,
  enableInlineDisc,
  disableInlineDisc,
  setTransactionTds,
  setTransactionDiscount,
  clearTransactionTds,
  clearTransactionDiscount,
  setFormType,
  recalculateSummary,
  clearInlineTds,
  clearInlineDisc,
  clearInlineTax,
  setTransactionTax,
  clearTransactionTax,
  disableInlineTax,
  enableInlineTax,
} from "../../slice/InvoiceOrBillSlice";
import { useAppDispatch, useAppSelector } from "../../../../../store/store";
import { updateHeader } from "../../slice/InvoiceOrBillSlice";
import {
  useGetLatestBillsQuery,
  useLazyCheckBillNumberQuery,
} from "../../api/bill.api";
import {
  useGetLatestInvoicesQuery,
  useLazyCheckInvoiceNumberQuery,
} from "../../api/invoice.api";
import { Tooltip } from "../../../../../components/atom/tooltip";
import { DatePickerElement } from "../../../../../components/atom/date-picker";
import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { useGetFxHistoryQuery } from "../../api/fx.api";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import CustomCircularProgress from "../../../../../components/atom/circular-progress/CircularProgress";
import { useGetDateRangeQuery } from "../../transactHome/api/transact.api";
import dayjs from "dayjs";
import { Stack } from "@mui/system";
import { Add, Clear } from "@mui/icons-material";
import { useInvoiceValidation } from "../../utils/useInvoiceValidation";
import { useAllAccountOptions } from "../../transactHome/hooks/useAllAccountOptions";

export default function InvoiceOrBillView({
  formType,
  onSave,
  docId,
  duplicate,
  mode,
  isLoading = false,
  imageFiles,
  onImageFilesChange,
  isSaveDisabled = false,
  showSaveAndNext = false,
}: {
  formType: FormType;
  onSave: (action?: 'saveAndNext') => void;
  data?: any;
  docId?: number;
  mode: string;
  duplicate?: boolean;
  isLoading?: boolean;
  imageFiles?: File[];
  onImageFilesChange?: (files: File[]) => void;
  isSaveDisabled?: boolean;
  showSaveAndNext?: boolean;
}) {
  const [currencyOptions, setCurrencyOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [openContactModal, setOpenContactModal] = useState(false);
  const [docValidation, setDocValidation] = useState<{
    valid: boolean;
    message?: string;
  }>({
    valid: true,
  });
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [manualFxRate, setManualFxRate] = useState<string>("");
  const [isEditingFxRate, setIsEditingFxRate] = useState(false);
  const [editedBillNo, setEditedBillNo] = useState<boolean>(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Helper function to extract currency code from "$ - USD" format
  const extractCurrencyCode = (currencyString: string): string => {
    if (!currencyString) return "";
    const match = currencyString.match(/\b([A-Z]{3})\b/);
    return match ? match[1] : "";
  };

  const validateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dispatch = useAppDispatch();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  // Date validation states
  const [dateValidation, setDateValidation] = useState({
    servicePeriod: { valid: true, message: "" },
    documentDates: { valid: true, message: "" },
  });

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  // Validate date ranges
  const validateDates = (newHeader: any = header) => {
    const validation = {
      servicePeriod: { valid: true, message: "" },
      documentDates: { valid: true, message: "" },
    };

    const serviceStart = dayjs(newHeader.serviceStartDate);
    const serviceEnd = dayjs(newHeader.serviceEndDate);
    const docDate = dayjs(newHeader.documentDate);
    const dueDate = dayjs(newHeader.dueDate);

    // Check service period
    if (serviceStart && serviceEnd) {
      if (serviceStart.isAfter(serviceEnd)) {
        validation.servicePeriod = {
          valid: false,
          message: "Service start date must be before service end date",
        };
      }
    }

    // Check document dates
    if (docDate && dueDate) {
      if (docDate.isAfter(dueDate)) {
        dispatch(
          updateHeader({
            dueDate: dayjs(docDate.add(1, "month")).format("YYYY-MM-DD"),
          }),
        );
      }
    }

    setDateValidation(validation);
    return validation.servicePeriod.valid && validation.documentDates.valid;
  };

  const tdsOptions = [
    { label: "At transaction level", value: "transaction" },
    { label: "At item level", value: "item" },
  ];
  const discountOptions = [
    { label: "At transaction level", value: "transaction" },
    { label: "At item level", value: "item" },
  ];

  const {contactsData: cData} = useAllAccountOptions();
  const [registerContact] = useRegisterContactMutation();
  const [checkBillNumber, { isFetching: checkingBill }] =
    useLazyCheckBillNumberQuery();

  const [checkInvoiceNumber, { isFetching: checkingInvoice }] =
    useLazyCheckInvoiceNumberQuery();

  // Fetch header data including reportingCurrency
  const { data: headerData } = useGetHeaderDataQuery();

  const validationCounterRef = useRef(0);

  const validateDocumentNumber = async (): Promise<boolean> => {
    if (!header.documentNo || !header.contactId) return true;

    const currentRequest = ++validationCounterRef.current;

    try {
      let res;
      if (formType === "Bill") {
        res = await checkBillNumber({
          billNo: header.documentNo,
          ignoreBillId: mode === "Edit" ? docId : undefined,
        }).unwrap();
      }

      if (formType === "Invoice") {
        res = await checkInvoiceNumber({
          invoiceNo: header.documentNo,
          contactId: Number(header.contactId),
          ignoreInvoiceId: mode === "Edit" ? docId : undefined,
        }).unwrap();
      }

      if (currentRequest !== validationCounterRef.current) return false;

      if (!res?.success) {
        setDocValidation({
          valid: false,
          message: `${formType} number already exists`,
        });
        return false;
      }

      setDocValidation({ valid: true });
      return true;
    } catch (err: any) {
      if (currentRequest !== validationCounterRef.current) return false;

      setDocValidation({
        valid: false,
        message:
          err?.status === 409
            ? `${formType} number already exists`
            : "Unable to validate number",
      });
      return false;
    }
  };

  const contactGroup = useMemo(() => {
    const contacts = cData?.data || [];
    if (!contacts.length) return [];

    return [
      {
        label: "CONTACTS",
        options: contacts.map((contact: any) => ({
          label: contact.name,
          value: `contact_${contact.id}`,
        })),
      },
    ];
  }, [cData]);

  useEffect(() => {
    const formatted = currencyData.map((item: ICurrencyItem) => ({
      label: `${item.symbol} - ${item.cc} - ${item.name}`,
      value: `${item.symbol} - ${item.cc}`,
    }));
    setCurrencyOptions(formatted);
  }, []);

  useEffect(() => {
    dispatch(setFormType(formType));
  }, [formType, dispatch]);

  const handleSubmitContact = async (data: IContactRegister) => {
    try {
      const res = await registerContact(data).unwrap();
      showSnack("Contact added successfully!", "success");
      setOpenContactModal(false);
      dispatch(updateHeader({ contactId: (res as any).data.id }));
    } catch (err: any) {
      showSnack(
        err?.data?.message ||
        err?.error ||
        err?.message ||
        "Something went wrong!",
        "error",
      );
    }
  };

  const {
    header,
    flags: { showInlineTds, showInlineDisc, showInlineTax },
    transactionTds,
    transactionDiscount,
    transactionTax,
    rows,
  } = useAppSelector((state) => state.invoiceForm);

  const taxLevel: TransactionLevel = showInlineTax
    ? "item"
    : transactionTax
      ? "transaction"
      : "";

  const isTaxEnabled = !!transactionTax || showInlineTax || rows.some(row => (row.taxes?.length ?? 0) > 0);

  const invoiceForm = useAppSelector((state) => state.invoiceForm);

  // Use validation hook
  const validation = useInvoiceValidation(
    invoiceForm,
    docValidation,
    dateValidation,
  );

  // Auto-select currency from reportingCurrency on mount and when headerData changes
  useEffect(() => {
    if (headerData?.data?.reportingCurrency && !header.currency) {
      dispatch(updateHeader({ currency: headerData.data.reportingCurrency }));
    }
  }, [headerData?.data?.reportingCurrency, header.currency, dispatch]);

  useEffect(() => {
    if (formType == "Invoice") {
      validateDocumentNumber();
    }
  }, [header.contactId]);

  useEffect(() => {
    if (!header.documentNo) return;

    const timer = setTimeout(() => {
      validateDocumentNumber();
    }, 400);
    return () => clearTimeout(timer);
  }, [header.documentNo, header.contactId]);

  // Fetch FX rate when currency or invoice date changes
  const fromCode = extractCurrencyCode(header.currency);
  const toCode = extractCurrencyCode(headerData?.data?.reportingCurrency || "");
  const invoiceDate = dayjs(header.documentDate)?.format("YYYY-MM-DD") || "";
  const { data: dateRangeData } = useGetDateRangeQuery();
  const [fxChanged, setFxChanged] = useState(false);

  const { data: fxData, isFetching: fxLoading } = useGetFxHistoryQuery(
    {
      from: fromCode,
      to: toCode,
      date: invoiceDate,
    },
    {
      skip:
        !fromCode ||
        !toCode ||
        !invoiceDate ||
        fromCode === toCode ||
        (mode === "Edit" && !fxChanged),
    },
  );

  useEffect(() => {
    if (mode === "Edit" && header.fxRate && header.originalFxRate) {
      setFxRate(header.originalFxRate);
      if (header.fxRate !== header.originalFxRate && header.fxRate !== 1.0) {
        setManualFxRate(header.fxRate.toString());
      }
      setInitialLoadComplete(true);
    }
  }, [mode, header.fxRate, header.originalFxRate, initialLoadComplete]);

  // FIXED: Main effect - Always update from API when currency changes
  useEffect(() => {
    if (mode === "Edit" && !initialLoadComplete && !fxChanged) {
      return;
    }

    const sameCurrency = fromCode === toCode && !!fromCode && !!toCode;
    // CASE 1: Same currency → reset FX to 1
    if (sameCurrency) {
      dispatch(updateHeader({ fxRate: 1, originalFxRate: 1 }));
      setFxRate(null);
      setManualFxRate("");
      return;
    }

    // CASE 2: New FX data from API (currency changed or new fetch)
    if (fxData?.data?.rate) {
      dispatch(
        updateHeader({
          originalFxRate: Number(fxData.data.rate[fromCode]),
          fxRate: Number(fxData.data.rate[fromCode]),
        }),
      );
      setFxRate(Number(fxData.data.rate[fromCode]));
      setManualFxRate(""); // Clear manual override when currency changes
    }
  }, [
    fxData?.data?.rate,
    fromCode,
    toCode,
    dispatch,
    mode,
    initialLoadComplete,
  ]);

  const showFxRow =
    Boolean(header.currency) &&
    Boolean(fromCode) &&
    Boolean(toCode) &&
    fromCode !== toCode;

  const tdsLevel: TransactionLevel = showInlineTds
    ? "item"
    : transactionTds
      ? "transaction"
      : "";

  const discLevel: TransactionLevel = showInlineDisc
    ? "item"
    : transactionDiscount
      ? "transaction"
      : "";

  const isTdsEnabled = showInlineTds || !!transactionTds;
  const isDiscEnabled = showInlineDisc || !!transactionDiscount;

  const selectedContact = useMemo<IContactRegister | null>(() => {
    if (!header.contactId) return null;

    return (
      cData?.data?.find((c: any) => Number(c.id) === header.contactId) ?? null
    );
  }, [header.contactId, cData]);

  const contactId = Number(header.contactId);

  const shouldFetchLatest = !!contactId; // hover-controlled

  const { data: latestInvoices = [], isFetching: invoicesLoading } =
    useGetLatestInvoicesQuery(contactId, {
      skip: formType !== "Invoice" || !shouldFetchLatest,
    });

  const { data: latestBills = [], isFetching: billsLoading } =
    useGetLatestBillsQuery(contactId, {
      skip: formType !== "Bill" || !shouldFetchLatest,
    });

  const latestNumbers = formType === "Invoice" ? latestInvoices : latestBills;

  const tooltipContent = (
    <Box sx={{ minWidth: 160 }}>
      <Box sx={{ fontWeight: 600, mb: 0.5 }}>Latest {formType}s</Box>

      {invoicesLoading || billsLoading ? (
        <Typography variant="body2">Loading…</Typography>
      ) : latestNumbers.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No recent {formType.toLowerCase()}s
        </Typography>
      ) : (
        latestNumbers.map((num) => (
          <Typography
            key={num}
            variant="body2"
            sx={{ fontFamily: "monospace" }}
          >
            {num}
          </Typography>
        ))
      )}
    </Box>
  );

  // Determine if save should be disabled
  const hasInvalidDiscountAccount =
    showInlineDisc &&
    rows.some((row) => !row.discountAccountId && row.discountValue > 0);

  const shouldDisableSave =
    checkingBill ||
    checkingInvoice ||
    !validation.isValid ||
    isSaveDisabled ||
    hasInvalidDiscountAccount;
    
  useEffect(() => {
    return () => {
      if (validateTimeoutRef.current) {
        clearTimeout(validateTimeoutRef.current);
      }
    };
  }, []);
  useEffect(() => {
    if (header.documentNo && header.contactId) {
      validateDocumentNumber();
    }
  }, [header.documentNo, header.contactId]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <CustomCircularProgress size={40} />
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          borderRadius: "3px 3px 0 0",
          backgroundColor: "#fff",
          padding: "8px",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* ───────────────  Header Row 1 ─────────────── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 0.8fr",
              gap: 2,
              mb: 3,
            }}
          >
            {/* Bill To */}
            <Stack direction={"row"}>
              <SingleSelectElement
                required
                fullWidth
                label={formType === "Invoice" ? "Bill To" : "Bill From"}
                value={header.contactId ? `contact_${header.contactId}` : ""}
                onChange={(value) => {
                  const id = Number(value.replace("contact_", ""));
                  dispatch(updateHeader({ contactId: id }));
                }}
                options={contactGroup}
              />
              <IconButton
                onClick={() => {
                  setOpenContactModal(true);
                }}
              >
                <Add />
              </IconButton>
            </Stack>

            {/* Invoice / Bill Number + Tooltip */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                flex: 1,
              }}
            >
              <TextFieldElement
                name="invoicenumber"
                required
                fullWidth
                label={
                  formType === "Invoice" ? "Invoice Number" : "Bill Number"
                }
                placeholder={
                  formType === "Invoice" ? "Invoice Number" : "Bill Number"
                }
                value={header.documentNo}
                onChange={(e) => {
                  const value = e.target.value;

                  dispatch(updateHeader({ documentNo: value }));
                  setEditedBillNo(true);

                  // clear previous debounce
                  if (validateTimeoutRef.current) {
                    clearTimeout(validateTimeoutRef.current);
                  }

                  // validate shortly after user stops typing
                  validateTimeoutRef.current = setTimeout(() => {
                    validateDocumentNumber();
                  }, 200); // 150–250ms feels instant
                }}
                error={!docValidation.valid}
                helperText={docValidation.message}
                slotProps={{
                  input: {
                    endAdornment:
                      formType === "Invoice" ? (
                        <InputAdornment
                          position="end"
                          sx={{ cursor: "pointer" }}
                        >
                          <Tooltip title={tooltipContent} variant="primary">
                            <IconButton
                              sx={{ cursor: "pointer" }}
                              size="small"
                              disabled={!header.contactId}
                              edge="end"
                            >
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ) : null,
                  },
                  htmlInput: {
                    maxLength: 50,
                  },
                }}
              />
            </Box>

            {/* Currency & FX Rate */}
            <Box>
              <SingleSelectElement
                required
                label={`${formType} Currency`}
                value={header.currency}
                onChange={(value) => {
                  dispatch(updateHeader({ currency: value }));
                  setFxChanged(true);
                }}
                options={currencyOptions}
                fullWidth
                clearable={false}
              />
            </Box>

          </Box>

          {/* ─────────────── Header Row 2 ─────────────── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 0.8fr",
              gap: 2,
            }}
          >
            <Box
              sx={{
                gridColumn: "1 / 3",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 2,
              }}>
              {/* Service Period (date range) - first row */}
              <Box>
                <DateRangePicker
                  required
                  label="Service Period"
                  min={
                    dateRangeData?.data?.openingBalanceExists
                      ? dayjs(dateRangeData?.data.minDate)
                      : null
                  }
                  width="100%"
                  startValue={
                    header.serviceStartDate
                      ? dayjs(header.serviceStartDate)
                      : null
                  }
                  endValue={
                    header.serviceEndDate ? dayjs(header.serviceEndDate) : null
                  }
                  onChange={([start, end]) => {
                    dispatch(
                      updateHeader({
                        serviceStartDate: start?.format("YYYY-MM-DD"),
                        serviceEndDate: end?.format("YYYY-MM-DD"),
                      }),
                    );
                    validateDates({
                      ...header,
                      serviceStartDate: start ?? undefined,
                      serviceEndDate: end ?? undefined,
                    });
                  }}
                  error={!dateValidation.servicePeriod.valid}
                  helperText={
                    !dateValidation.servicePeriod.valid
                      ? dateValidation.servicePeriod.message
                      : ""
                  }
                />
              </Box>

              {/* Invoice / Bill Date - second row */}
              <DatePickerElement
                required
                width="100%"
                label={formType === "Invoice" ? "Invoice Date" : "Bill Date"}
                min={
                  dateRangeData?.data?.openingBalanceExists
                    ? dayjs(dateRangeData?.data.minDate)
                    : null
                }
                value={dayjs(header.documentDate)}
                onChange={(value) => {
                  const docDate = value?.format("YYYY-MM-DD");
                  const dueDateOneMonthLater = value
                    ? value.add(1, "month").format("YYYY-MM-DD")
                    : undefined;
                  dispatch(
                    updateHeader({
                      documentDate: docDate,
                      ...(dueDateOneMonthLater != null && {
                        dueDate: dueDateOneMonthLater,
                      }),
                    }),
                  );
                  validateDates({
                    ...header,
                    documentDate: value,
                    ...(value && {
                      dueDate: value.add(1, "month"),
                    }),
                  });
                }}
                error={!dateValidation.documentDates.valid}
                helperText={
                  !dateValidation.documentDates.valid
                    ? dateValidation.documentDates.message
                    : ""
                }
              />

              {/* Due Date */}
              <DatePickerElement
                required
                label="Due Date"
                width="100%"
                value={dayjs(header.dueDate)}
                min={
                  dateRangeData?.data?.openingBalanceExists
                    ? dayjs(dateRangeData?.data.minDate)
                    : null
                }
                onChange={(value) => {
                  dispatch(
                    updateHeader({ dueDate: value?.format("YYYY-MM-DD") }),
                  );
                  validateDates({ ...header, dueDate: value });
                }}
                error={!dateValidation.documentDates.valid}
                helperText={
                  !dateValidation.documentDates.valid
                    ? dateValidation.documentDates.message
                    : ""
                }
              />
            </Box>

            {/* FX Rate Section */}
            {showFxRow && (
              <Box
                sx={{
                  px: isEditingFxRate ? 0 : 1,
                  pr: 1,
                  backgroundColor: "#f9f9f9",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: 40,
                  gridColumn: "3 / 4",
                }}
              >
                <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
                  {fxLoading ? (
                    <Typography variant="body2" color="textSecondary">
                      Loading FX rate...
                    </Typography>
                  ) : isEditingFxRate ? (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <TextFieldElement
                        label="FX Rate"
                        type="number"
                        value={manualFxRate}
                        onChange={(e) => setManualFxRate(e.target.value)}
                        onBlur={(e) => {
                          if (manualFxRate) {
                            dispatch(
                              updateHeader({ fxRate: Number(manualFxRate) }),
                            );
                            dispatch(recalculateSummary());
                          }
                        }}
                        placeholder={fxRate?.toString() || "Enter FX rate"}
                        width="100%"
                        slotProps={{
                          input: {
                            inputProps: { step: 0.0001 },
                          },
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => setIsEditingFxRate(false)}
                        sx={{ color: "success.main" }}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setIsEditingFxRate(false)
                          setManualFxRate("")
                        }}
                        sx={{ color: "error.main" }}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : fxRate && fromCode !== toCode ? (
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      1 {fromCode} = {manualFxRate || fxRate} {toCode}
                    </Typography>
                  ) : fromCode === toCode ? (
                    <Typography variant="body2" color="textSecondary">
                      Same currency
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      FX rate unavailable
                    </Typography>
                  )}
                </Box>

                {/* Edit / Revert Buttons */}
                {fxRate && fromCode !== toCode && (
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {!isEditingFxRate && (
                      <Tooltip title="Edit FX Rate">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setIsEditingFxRate(true);
                            if (!manualFxRate)
                              setManualFxRate(fxRate.toString());
                          }}
                          sx={{ color: "primary.main" }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {manualFxRate && !isEditingFxRate && (
                      <Tooltip title="Revert FX Rate">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setManualFxRate("");
                            dispatch(
                              updateHeader({ fxRate: header.originalFxRate }),
                            );
                            dispatch(recalculateSummary());
                          }}
                          sx={{ color: "error.main" }}
                        >
                          <RestartAltIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>

          <Box
            display="flex"
            gap={2}
            sx={{ mt: 1, alignItems: "center" }}
            justifyContent="space-between"
          >
            <Box display="flex" gap={2} width={"45%"} alignItems={"center"}>
              <Typography
                sx={{ fontSize: "1rem", fontWeight: 600, color: "grey.600", textTransform: "uppercase" }}
              >
                Tax
              </Typography>

              <Switch
                size="small"
                checked={isTaxEnabled}
                onChange={(e) => {
                  if (e.target.checked) {
                    dispatch(clearInlineTax());
                    dispatch(disableInlineTax());
                    dispatch(setTransactionTax({ taxes: [], applied: "after" }));
                  } else {
                    dispatch(clearTransactionTax());
                    dispatch(clearInlineTax());
                    dispatch(disableInlineTax());
                  }
                  dispatch(recalculateSummary());
                }}
              />

              {/* {(showInlineTax || transactionTax) && ( */}
              {isTaxEnabled && (
                <SingleSelectElement
                  width="100%"
                  value={taxLevel}
                  onChange={(value: string) => {
                    if (value === 'item') {
                      dispatch(enableInlineTax());
                      dispatch(recalculateSummary());
                    } else {
                      dispatch(disableInlineTax());
                      dispatch(clearInlineTax());
                      dispatch(setTransactionTax({ taxes: [], applied: "after" }));
                      dispatch(recalculateSummary());
                    }
                  }}
                  options={[
                    { label: 'At transaction level', value: 'transaction' },
                    { label: 'At item level', value: 'item' },
                  ]}
                  label=""
                />
              )}
            </Box>

            <Box display="flex" gap={2} width={"45%"} alignItems={"center"}>
              <Typography
                sx={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "grey.600",
                  textTransform: "uppercase",
                }}
              >
                TDS
              </Typography>

              <Switch
                size="small"
                checked={isTdsEnabled}
                onChange={(e) => {
                  if (e.target.checked) {
                    dispatch(clearInlineTds());
                    dispatch(disableInlineTds());
                    dispatch(setTransactionTds({ value: 0, unit: "percent" }));
                  } else {
                    dispatch(clearTransactionTds());
                    dispatch(clearInlineTds());
                    dispatch(disableInlineTds());
                  }
                  dispatch(recalculateSummary());
                }}
              />

              {(showInlineTds || transactionTds) && (
                <SingleSelectElement
                  width="100%"
                  value={tdsLevel}
                  onChange={(value: string) => {
                    if (value === "item") {
                      dispatch(enableInlineTds());
                      dispatch(recalculateSummary());
                    } else {
                      dispatch(disableInlineTds());
                      dispatch(clearInlineTds());
                      dispatch(
                        setTransactionTds({ value: 0, unit: "percent" }),
                      );
                      dispatch(recalculateSummary());
                    }
                  }}
                  options={tdsOptions}
                  label={""}
                />
              )}
            </Box>

            <Box display="flex" gap={2} width={"55%"} alignItems={"center"}>
              <Typography
                sx={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "grey.600",
                  textTransform: "uppercase",
                }}
              >
                Discount
              </Typography>
              <Switch
                size="small"
                checked={isDiscEnabled}
                onChange={(e) => {
                  if (e.target.checked) {
                    dispatch(clearInlineDisc());
                    dispatch(disableInlineDisc());
                    dispatch(
                      setTransactionDiscount({
                        value: 0,
                        unit: "percent",
                        applied: "after",
                      }),
                    );
                  } else {
                    dispatch(disableInlineDisc());
                    dispatch(clearTransactionDiscount());
                    dispatch(clearInlineDisc());
                  }
                  dispatch(recalculateSummary());
                }}
              />

              {(showInlineDisc || transactionDiscount) && (
                <SingleSelectElement
                  width="100%"
                  value={discLevel}
                  onChange={(value: string) => {
                    if (value === "item") {
                      dispatch(clearTransactionDiscount());
                      dispatch(enableInlineDisc());
                      dispatch(recalculateSummary());
                    } else {
                      dispatch(disableInlineDisc());
                      dispatch(clearInlineDisc());
                      dispatch(setTransactionDiscount({ value: 0, unit: "percent", applied: "after" }));
                      dispatch(recalculateSummary());
                    }
                  }}
                  options={discountOptions}
                  label={""}
                />
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 2, mt: 2 }} />
          <InvoiceSection
            selectedCurrency={header.currency}
            formType={formType}
            mode={mode}
            duplicate={duplicate}
            showInlineDisc={showInlineDisc}
            showInlineTds={isTdsEnabled && tdsLevel === "item"}
            tdsLevel={tdsLevel}
            discLevel={discLevel}
            imageFiles={imageFiles}
            onImageFilesChange={onImageFilesChange}
            fxLoading={fxLoading}
            fxRate={
              manualFxRate
                ? Number(manualFxRate)
                : fromCode !== toCode
                  ? fxRate
                  : null
            }
            companyCurrencyCode={toCode}
            selectedCurrencyCode={fromCode}
            companyCurrencySymbol={
              headerData?.data?.reportingCurrency?.split(" - ")[0]
            }
            showTotal={showFxRow}
            showInlineTax={isTaxEnabled && taxLevel === 'item'}
            TaxLevel={taxLevel}
          />
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
          >
            {!validation.isValid ? (
              <Tooltip
                title={
                  <Box sx={{ minWidth: 200, maxWidth: 400 }}>
                    {/* <Box sx={{ fontWeight: 600, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                      <ErrorOutlineIcon fontSize="small" />
                      <Typography variant="subtitle2">
                        {validation.errorCount} Issues{validation.errorCount > 1 ? "s" : ""} Found
                      </Typography>
                    </Box> */}
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        whiteSpace: "pre-wrap",
                        fontFamily: "inherit",
                        lineHeight: 1.6,
                      }}
                    >
                      {validation.truncatedErrorMessage}
                    </Typography>
                  </Box>
                }
                placement="top"
                arrow
                maxWidth={400}
              >
                <span>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    {showSaveAndNext && (
                      <PrimaryButton
                        onClick={() => {
                          if (validateDates()) {
                            onSave("saveAndNext");
                          }
                        }}
                        disabled={shouldDisableSave}
                        variant="outlined"
                      >
                        Save & Next
                      </PrimaryButton>
                    )}
                    <PrimaryButton
                      onClick={() => {
                        if (validateDates()) {
                          onSave();
                        }
                      }}
                      disabled={shouldDisableSave}
                      variant="contained"
                    >
                      Save
                    </PrimaryButton>
                  </Box>
                </span>
              </Tooltip>
            ) : (
              <Box sx={{ display: "flex", gap: 2 }}>
                {showSaveAndNext && (
                  <PrimaryButton
                    onClick={() => {
                      if (validateDates()) {
                        onSave("saveAndNext");
                      }
                    }}
                    disabled={shouldDisableSave}
                    variant="outlined"
                  >
                    Save & Next
                  </PrimaryButton>
                )}
                <PrimaryButton
                  onClick={() => {
                    if (validateDates()) {
                      onSave();
                    }
                  }}
                  disabled={shouldDisableSave}
                  variant="contained"
                >
                  Save
                </PrimaryButton>
              </Box>
            )}
          </Box>
        </Box>
        <ModalElement
          open={openContactModal}
          onClose={() => setOpenContactModal(false)}
          title={"Add Contact"}
          maxWidth="md"
        >
          <AddContactForm onSubmit={handleSubmitContact} />
        </ModalElement>
      </Box>
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </>
  );
}
