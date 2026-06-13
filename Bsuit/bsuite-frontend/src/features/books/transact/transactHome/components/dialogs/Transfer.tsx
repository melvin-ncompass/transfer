import {
  useState,
  useMemo,
  useEffect,
  type SetStateAction,
  useRef,
} from "react";
import dayjs, { Dayjs } from "dayjs";
import {
  Stack,
  Typography,
  Divider,
  IconButton,
  useTheme,
  Box,
  useMediaQuery,
  InputAdornment,
} from "@mui/material";
import {
  Delete,
  Add,
  InfoOutlined as InfoOutlinedIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  WarningAmber as WarningAmberIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { DatePickerElement } from "../../../../../../components/atom/date-picker";
import { FileUploadField } from "../../../../../../components/atom/file-upload-field";
import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../../../components/atom/button";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import CustomCircularProgress from "../../../../../../components/atom/circular-progress/CircularProgress";
import {
  useCreateJournalMutation,
  useUpdateJournalMutation,
  useUploadAttachmentsMutation,
  useGetJournalByIdQuery,
  useGetDateRangeQuery,
} from "../../api/transact.api";
import type {
  JournalFormData,
  JournalRow,
  RefetchMetaDataTransactTable,
  TdsContactMappingItem,
} from "../../types/transact.types";
import {
  formatCurrencyByCommaSeparation,
  formatNumberByCommaSeparation,
  formatNumberForTyping,
  parseNumberByCommaSeparation,
  parseNumberForTyping,
  roundToTwoDecimals,
} from "../../../../../../utils/numberFormatter";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { useAllAccountOptions } from "../../hooks/useAllAccountOptions";
import type { HighlightedRow } from "../../../../../../types/types";
import { useLazyGetFxHistoryQuery } from "../../../api/fx.api";
import RestoreIcon from "@mui/icons-material/Restore";
import { RepeaterElement } from "../../../../../../components/atom/form-repeater";
import { Chip } from "../../../../../../components/atom/chips";

type CurrencyInfo = {
  code: string;
  symbol: string;
};
export function Transfer({
  open,
  onClose,
  duplicate,
  onSuccess,
  selectedRow,
  setHighlightedRow,
  showSnackBar,
}: {
  open: boolean;
  onClose: () => void;
  duplicate?: boolean;
  onSuccess?: (meta?: RefetchMetaDataTransactTable) => void;
  selectedRow?: { id: number };
  onTransactionCreated?: (id: string) => void;
  setHighlightedRow?: React.Dispatch<SetStateAction<HighlightedRow>>;
  showSnackBar?: (message: string, color: "success" | "error") => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // Detect edit mode
  const isEditMode = selectedRow?.id;

  // Initialize based on edit mode: false (show skeleton) if editing, true (show form) if creating
  const [isDataReady, setIsDataReady] = useState(!isEditMode);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);
  // Form State
  const [description, setDescription] = useState("");
  const [fromAccount, setFromAccount] = useState("");
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferAmountInput, setTransferAmountInput] = useState("");
  const [journalRows, setJournalRows] = useState<JournalRow[]>([
    {
      id: "1",
      toAccount: "",
      debitAmount: 0,
      debitAmountInput: "",
      convertedAmount: 0,
      convertedAmountInput: "",
      fxRate: null,
      fxRateInput: "",
      originalFxRate: null,
      isFxEdited: false,
      contactMapping: [],
    },
  ]);
  const [fxRates, setFxRates] = useState<
    Record<
      string,
      {
        rate: number;
        originalRate: number;
      }
    >
  >({});
  const isHydratingEditRef = useRef(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [tdsExpanded, setTdsExpanded] = useState(true);
  const [fromAccountContactMapping, setFromAccountContactMapping] = useState<
    TdsContactMappingItem[]
  >([]);
  const [tdsContactMappingFromApi, setTdsContactMappingFromApi] = useState<
    TdsContactMappingItem[]
  >([]);
  const buildSnapshot = () =>
    JSON.stringify({
      description,
      date: date ? date.format("YYYY-MM-DD") : null,
      fromAccount,
      transferAmount,
      fromAccountContactMapping: fromAccountContactMapping ?? [],
      journalRows: journalRows.map((r) => ({
        toAccount: r.toAccount,
        debitAmount: r.debitAmount,
        contactMapping: r.contactMapping ?? [],
      })),
    });

  const { data: dateRangeData } = useGetDateRangeQuery();

  // Fetch header data to get commaSeparation setting
  const { data: headerData } = useGetHeaderDataQuery();

  // Fetch journal data internally - only when editing
  const { data: journalResponse, refetch } = useGetJournalByIdQuery(
    {
      id: String(selectedRow?.id || 0),
      transactionTypeName: "transfer",
    },
    {
      skip: !isEditMode,
    },
  );

  const [fetchFxRate] = useLazyGetFxHistoryQuery();

  // RTK Query mutations
  const [createJournal, { isLoading: isCreatingJournal }] =
    useCreateJournalMutation();
  const [updateJournal, { isLoading: isUpdatingJournal }] =
    useUpdateJournalMutation();
  const [uploadAttachments, { isLoading: isUploadingAttachments }] =
    useUploadAttachmentsMutation();

  // Get merged account/contact/tax options (exclude only "in transit")
  const { allAccountOptions, accountsData, contactsData, taxesData } =
    useAllAccountOptions(undefined, true, "in_transit_only");
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";

  const contactOptions = useMemo(
    () =>
      (contactsData?.data || []).map((c: any) => ({
        value: `contact_${c.id}`,
        label: c.name,
      })),
    [contactsData],
  );

  const isTdsAccountId = (accountValue: string) => {
    if (!accountValue?.startsWith("tax_")) return false;
    const taxId = Number(accountValue.split("_")[1]);
    const tax = taxesData?.data?.find((t: any) => t.id === taxId);
    return tax?.abbreviation?.toLowerCase() === "tds";
  };

  const isFromAccountTds = isTdsAccountId(fromAccount);

  const tdsLines = useMemo(
    () =>
      journalRows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => isTdsAccountId(row.toAccount)),
    [journalRows, taxesData?.data],
  );
  const hasTdsLines = tdsLines.length > 0;

  // Extract ID helper
  const extractId = (value: string): string =>
    value.includes("_") ? value.split("_").slice(1).join("_") : value;

  const selectedAccountCurrency = useMemo(() => {
    if (!fromAccount) return [];

    const accountId = extractId(fromAccount);
    const accounts = Array.isArray(accountsData?.data) ? accountsData.data : [];

    const selectedAcc = accounts.find(
      (acc: any) => String(acc.id) === accountId,
    );

    if (selectedAcc?.accountCurrency) {
      return selectedAcc.accountCurrency.split("-");
    }

    return [];
  }, [fromAccount, accountsData]);

  const selectedAccountBalance = useMemo(() => {
    if (!fromAccount) return null;
    const accountId = extractId(fromAccount);
    const prefix = fromAccount.split("_")[0];

    if (prefix === "account") {
      const selected = accountsData?.data?.find(
        (a: any) => String(a.id) === accountId,
      );
      return selected?.accountBalance ?? null;
    } else if (prefix === "contact") {
      const selected = contactsData?.data?.find(
        (c: any) => String(c.id) === accountId,
      );
      return selected?.contactBalance ?? null;
    } else if (prefix === "tax") {
      const selected = taxesData?.data?.find(
        (t: any) => String(t.id) === accountId,
      );
      return selected?.taxBalance ?? null;
    }
    return null;
  }, [fromAccount, accountsData, contactsData, taxesData]);

  const isDirty = useMemo(() => {
    if (!isEditMode || !initialSnapshot) return true;

    const currentSnapshot = buildSnapshot();
    return currentSnapshot !== initialSnapshot;
  }, [
    isEditMode,
    initialSnapshot,
    description,
    date,
    fromAccount,
    transferAmount,
    journalRows,
    fromAccountContactMapping,
  ]);

  // Derived Values
  const totalDebitAmount = useMemo(
    () =>
      journalRows.reduce((sum, row) => sum + Number(row.debitAmount || 0), 0),
    [journalRows],
  );

  // Validation logic (same as before)
  const hasAtLeastOneAccount = journalRows.some(
    (row) => row.toAccount && String(row.toAccount).trim() !== "",
  );
  const fromAccountSelected = fromAccount && String(fromAccount).trim() !== "";
  const dateSelected = date !== null;
  const debitsCreditEqual =
    transferAmount === totalDebitAmount && transferAmount > 0;
  const isAmountValid = transferAmount > 0 && debitsCreditEqual;

  const fromAccountSameAsToAccount = journalRows.some(
    (row) =>
      row.toAccount &&
      String(row.toAccount).trim() === String(fromAccount).trim(),
  );

  const hasEmptyRows = journalRows.some(
    (row) =>
      !row.toAccount || row.toAccount.trim() === "" || row.debitAmount <= 0,
  );
  const isSaving =
    isCreatingJournal || isUpdatingJournal || isUploadingAttachments;

  const tdsMappingErrors = useMemo(() => {
    const errs: string[] = [];
    if (isFromAccountTds) {
      const mapping = fromAccountContactMapping ?? [];
      const hasCompleteEntries = mapping.some(
        (i) => !!i.contactId && !!i.amount && String(i.amount).trim() !== "",
      );
      const hasPartialRow = mapping.some(
        (i) => (!!i.contactId && !i.amount) || (!i.contactId && !!i.amount),
      );
      const mappingSum = mapping.reduce(
        (sum, i) => sum + (parseFloat(i.amount) || 0),
        0,
      );
      const sumValid = Math.abs(mappingSum - transferAmount) < 0.01;
      if (!hasCompleteEntries || mapping.length === 0) {
        errs.push("• From account (TDS): Contact mapping is required");
      }
      if (hasPartialRow) {
        errs.push(
          "• From account (TDS): Each contact mapping must have both contact and amount",
        );
      }
      if (hasCompleteEntries && !sumValid) {
        errs.push(
          `• From account (TDS): Contact mapping total (${mappingSum}) must equal transfer amount (${transferAmount})`,
        );
      }
    }
    journalRows.forEach((row, idx) => {
      if (!isTdsAccountId(row.toAccount)) return;
      const rowAmount = Number(row.debitAmount) || 0;
      const mapping = row.contactMapping ?? [];
      const hasCompleteEntries = mapping.some(
        (i) => !!i.contactId && !!i.amount && String(i.amount).trim() !== "",
      );
      const hasPartialRow = mapping.some(
        (i) => (!!i.contactId && !i.amount) || (!i.contactId && !!i.amount),
      );
      const mappingSum = mapping.reduce(
        (sum, i) => sum + (parseFloat(i.amount) || 0),
        0,
      );
      const sumValid = Math.abs(mappingSum - rowAmount) < 0.01;

      if (!hasCompleteEntries || mapping.length === 0) {
        errs.push(`• Row ${idx + 1} (TDS): Contact mapping is required`);
      }
      if (hasPartialRow) {
        errs.push(
          `• Row ${idx + 1} (TDS): Each contact mapping must have both contact and amount`,
        );
      }
      if (hasCompleteEntries && !sumValid) {
        errs.push(
          `• Row ${idx + 1} (TDS): Contact mapping total (${mappingSum}) must equal row debit amount (${rowAmount})`,
        );
      }
    });
    return errs;
  }, [
    journalRows,
    isFromAccountTds,
    fromAccountContactMapping,
    transferAmount,
  ]);

  // Prefill From-account TDS contact mapping in edit mode whenever:
  // - we have mapping from API, and
  // - the current From account is a TDS tax, and
  // - user hasn't already edited the From-account mapping.
  useEffect(() => {
    if (!open || !isEditMode) return;
    if (!isFromAccountTds) return;
    if (!tdsContactMappingFromApi.length) return;

    setFromAccountContactMapping((prev) => {
      if ((prev ?? []).length > 0) return prev;
      return tdsContactMappingFromApi;
    });
  }, [open, isEditMode, isFromAccountTds, tdsContactMappingFromApi]);

  const hasTdsMappingError = tdsMappingErrors.length > 0;

  const validationErrors: string[] = [];
  if (transferAmount === 0)
    validationErrors.push("• Transfer amount must be greater than 0");
  if (transferAmount > 0 && !debitsCreditEqual)
    validationErrors.push(
      `• Debit total (${totalDebitAmount.toFixed(
        2,
      )}) must equal transfer amount (${transferAmount.toFixed(2)})`,
    );
  if (!hasAtLeastOneAccount)
    validationErrors.push("• At least one account must be selected");
  if (!fromAccountSelected)
    validationErrors.push("• From account must be selected");
  if (!dateSelected) validationErrors.push("• Date must be selected");
  if (fromAccountSameAsToAccount)
    validationErrors.push("• From account cannot be the same as To account");
  if (hasTdsMappingError) validationErrors.push(...tdsMappingErrors);

  const isSubmitDisabled =
    !isAmountValid ||
    !hasAtLeastOneAccount ||
    !fromAccountSelected ||
    !dateSelected ||
    fromAccountSameAsToAccount ||
    hasEmptyRows ||
    hasTdsMappingError ||
    (isEditMode && !isDirty);

  // getCrrencyFromValue method
  const getCurrencyFromValue = (value: string): CurrencyInfo => {
    if (!value) return { code: "", symbol: "" };

    const id = extractId(value);
    const prefix = value.split("_")[0];

    if (prefix === "account") {
      const acc = accountsData?.data?.find((a: any) => String(a.id) === id);
      const rawCurrency = acc?.accountCurrency || "";
      const currencySymbol = acc?.accountCurrency?.split("-")[0];
      const symbol = currencySymbol ?? "";
      const match = rawCurrency.match(/[A-Z]{3}/);
      const code = match ? match[0].toUpperCase() : "";
      return { code, symbol };
    }

    // contacts and taxes always use reporting currency
    if (prefix === "contact" || prefix === "tax") {
      const rawCurrency = headerData?.data?.reportingCurrency ?? "";
      // e.g. "₹ - INR" → symbol = "₹", code = "INR"
      const [symbol, code] = rawCurrency
        .split(" - ")
        .map((s: string) => s.trim());
      return {
        code: code ?? "",
        symbol: symbol ?? "",
      };
    }

    return { code: "", symbol: "" };
  };

  // handleAddRow method
  const handleAddRow = () => {
    setJournalRows((prev) => {
      const newRow: JournalRow = {
        id: Date.now().toString(),
        toAccount: "",
        debitAmount: 0,
        debitAmountInput: "",
        convertedAmount: 0,
        convertedAmountInput: "",
        fxRate: null,
        originalFxRate: null,
        fxRateInput: "",
        isFxEdited: false,
        contactMapping: [],
      };

      return [...prev, newRow];
    });
  };

  // handleRemoveRow method
  const handleRemoveRow = (id: string) => {
    setJournalRows((prev) => prev.filter((row) => row.id !== id));
  };

  const updateRowContactMapping = (
    rowId: string,
    contactMapping: TdsContactMappingItem[],
  ) => {
    setJournalRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, contactMapping } : r)),
    );
  };

  // handleUpdateRow method
  const handleUpdateRow = (
    id: string,
    field: keyof JournalRow,
    value: string | number,
  ) => {
    //  FX RATE GROUP UPDATE
    if (field === "fxRate") {
      setJournalRows((prev) => {
        const targetRow = prev.find((r) => r.id === id);
        if (!targetRow) return prev;
        const toCurrencyInfo = getCurrencyFromValue(targetRow.toAccount);
        const toCurrency = toCurrencyInfo.code;
        if (!toCurrency) return prev;

        const newRate = Number(value);
        if (isNaN(newRate)) return prev;
        const key = `${selectedAccountCurrency[1]?.trim().toUpperCase()}_${toCurrency}_${date?.format("YYYY-MM-DD")}`;
        const originalRate =
          fxRates[key]?.originalRate ?? targetRow.originalFxRate ?? newRate;

        setFxRates((prevFx) => ({
          ...prevFx,
          [key]: {
            rate: newRate,
            originalRate,
          },
        }));

        return prev.map((r) => {
          const rCurrencyInfo = getCurrencyFromValue(r.toAccount);
          const rCurrency = rCurrencyInfo.code;
          if (rCurrency !== toCurrency) return r;

          const converted = roundToTwoDecimals(r.debitAmount * newRate);

          return {
            ...r,
            fxRate: newRate,
            fxRateInput: String(newRate),
            convertedAmount: converted,
            convertedAmountInput: String(converted),
            isFxEdited: newRate !== originalRate,
          };
        });
      });

      return;
    }

    // CONVERTED GROUP UPDATE

    if (field === "convertedAmount") {
      setJournalRows((prev) => {
        const targetRow = prev.find((r) => r.id === id);
        if (!targetRow) return prev;

        const toCurrencyInfo = getCurrencyFromValue(targetRow.toAccount);
        const toCurrency = toCurrencyInfo.code;
        if (!toCurrency || !targetRow.debitAmount) return prev;

        const newConverted = Number(value);
        if (isNaN(newConverted)) return prev;

        // const newFx = roundToTwoDecimals(newConverted / targetRow.debitAmount);
        const newFx = newConverted / targetRow.debitAmount;

        const key = `${selectedAccountCurrency[1]?.trim().toUpperCase()}_${toCurrency}_${date?.format("YYYY-MM-DD")}`;
        const originalRate =
          fxRates[key]?.originalRate ?? targetRow.originalFxRate ?? newFx;

        setFxRates((prevFx) => ({
          ...prevFx,
          [key]: {
            rate: newFx,
            originalRate,
          },
        }));

        return prev.map((r) => {
          const rCurrencyInfo = getCurrencyFromValue(r.toAccount);
          const rCurrency = rCurrencyInfo.code;
          if (rCurrency !== toCurrency) return r;

          const converted = roundToTwoDecimals(r.debitAmount * newFx);

          return {
            ...r,
            fxRate: newFx,
            fxRateInput: String(newFx),
            convertedAmount: converted,
            convertedAmountInput: String(converted),
            isFxEdited: newFx !== originalRate,
          };
        });
      });

      return;
    }

    // NORMAL FIELD UPDATE

    setJournalRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        const updatedRow = { ...row, [field]: value };

        if (field === "debitAmount" && updatedRow.fxRate) {
          const converted = roundToTwoDecimals(
            Number(value) * updatedRow.fxRate,
          );

          return {
            ...updatedRow,
            convertedAmount: converted,
            convertedAmountInput: String(converted),
          };
        }

        return updatedRow;
      }),
    );

    if (field === "toAccount") {
      const currencyInfo = getCurrencyFromValue(String(value));

      if (currencyInfo.code) {
        fetchFxForCurrency(currencyInfo.code);
      }
    }
  };

  // handleAddFiles method
  const handleAddFiles = (files: File | File[] | null) => {
    if (!files) return;

    const newFiles = Array.isArray(files) ? files : [files];

    setImageFiles((prev) => [...prev, ...newFiles]);
  };

  // handleRemoveFile method
  const handleRemoveFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // handleSubmit method
  const handleSubmit = () => {
    if (isSubmitDisabled) {
      if (showSnackBar)
        showSnackBar("Please fix journal entries before submitting", "error");
      return;
    }

    const getTypeFromValue = (
      prefixedId: string,
    ): "Account" | "Contact" | "Tax" => {
      if (prefixedId.startsWith("account_")) return "Account";
      if (prefixedId.startsWith("contact_")) return "Contact";
      if (prefixedId.startsWith("tax_")) return "Tax";
      return "Account";
    };

    const extractNumericId = (value: string) => {
      if (value.includes("_")) {
        return Number(value.substring(value.indexOf("_") + 1));
      }
      return Number(value);
    };

    const journalCurrency =
      selectedAccountCurrency[0] + "-" + selectedAccountCurrency[1] || "";

    const journalCurrencyFxMapping: Record<string, number> = {};

    // Build FX mapping dynamically from rows
    journalRows.forEach((row) => {
      const currencyInfo = getCurrencyFromValue(row.toAccount);
      if (currencyInfo.code && row.fxRate) {
        journalCurrencyFxMapping[currencyInfo.code] = row.fxRate;
      }
    });

    const contactMappingData: Record<string, string> = {};
    if (isFromAccountTds && (fromAccountContactMapping?.length ?? 0) > 0) {
      fromAccountContactMapping
        .filter((i) => i.contactId && i.amount)
        .forEach((i) => {
          const contactId = String(i.contactId.split("_")[1]);
          contactMappingData[contactId] = i.amount;
        });
    }
    journalRows
      .filter(
        (row) =>
          isTdsAccountId(row.toAccount) &&
          (row.contactMapping?.length ?? 0) > 0,
      )
      .forEach((row) => {
        (row.contactMapping ?? [])
          .filter((i) => i.contactId && i.amount)
          .forEach((i) => {
            const contactId = String(i.contactId.split("_")[1]);
            contactMappingData[contactId] = i.amount;
          });
      });

    const payload = {
      description,
      date: date ? date.format("YYYY-MM-DD") : "",
      transactionTypeName: "transfer",
      journalCurrency,
      journalCurrencyFxMapping,
      journalAccounts: [
        // From Account (Credit Side)
        {
          id: extractNumericId(fromAccount),
          type: getTypeFromValue(fromAccount),
          credit: transferAmount,
          isFromAccount: true,
          fxRate: 1,
          originalFxRate: 1,
          amountInAccountCurr: transferAmount,
        },

        // To Accounts (Debit Side)
        ...journalRows.map((row) => ({
          id: extractNumericId(row.toAccount),
          type: getTypeFromValue(row.toAccount),
          debit: row.debitAmount,
          isFromAccount: false,
          fxRate: row.fxRate ?? 1,
          originalFxRate: row.originalFxRate ?? 1,
          amountInAccountCurr:
            Number(row.convertedAmount) || Number(row.debitAmount),
        })),
      ],
      ...(Object.keys(contactMappingData).length > 0 && {
        contactMappingData,
      }),
    };

    const isEdit = isEditMode && !duplicate;

    const mutation = isEdit
      ? updateJournal({
          id: journalResponse?.data?.transactionTypeId ?? "",
          data: payload as JournalFormData,
        })
      : createJournal(payload as JournalFormData);

    mutation
      .unwrap()
      .then((response: any) => {
        const transactionId = String(
          response.data?.transactionTypeId || selectedRow?.id || "",
        );

        const meta = {
          newTransactionId: transactionId,
          newTransactionName: "transfer",
          newPaymentId: response.data?.paymentId ?? null,
        };

        // ------------------- Highlight row -------------------
        setHighlightedRow?.({
          key: "id",
          value: transactionId,
          type: isEdit ? "edit" : "add",
        });

        // ------------------- Snackbar -------------------
        showSnackBar?.(
          `Transfer ${isEdit ? "updated" : "created"} successfully`,
          "success",
        );

        // ------------------- Attachments -------------------
        const afterSave = () => {
          onSuccess?.(meta); //  SEND META HERE
          handleReset();
        };

        if (imageFiles.length > 0) {
          uploadAttachments({
            files: imageFiles,
            transactionTypeId: transactionId,
            transactionTypeName: "transfer",
            paymentId: response.data?.paymentId,
          })
            .unwrap()
            .finally(afterSave);
        } else {
          afterSave();
        }
      })
      .catch((error: any) => {
        showSnackBar?.(error?.data?.message || "Error saving journal", "error");
      });
  };

  // handleRevertFx method
  const handleRevertFx = (cacheKey: string) => {
    const cached = fxRates[cacheKey];
    if (!cached || cached.originalRate == null) return;
    const originalRate = cached.originalRate;

    const [, toCurrency] = cacheKey.split("_");

    applyFxToCurrency(toCurrency, originalRate, originalRate);

    setFxRates((prev) => ({
      ...prev,
      [cacheKey]: {
        ...prev[cacheKey],
        rate: originalRate,
      },
    }));
  };

  // REPLACE WITH:
  const applyFxToCurrency = (
    toCurrency: string,
    rate: number,
    originalRate: number,
    resetOriginal = false, // ← new param, default false
  ) => {
    setJournalRows((prev) =>
      prev.map((r) => {
        const currencyInfo = getCurrencyFromValue(r.toAccount);
        if (currencyInfo.code !== toCurrency) return r;

        const converted = roundToTwoDecimals(r.debitAmount * rate);
        const effectiveOriginal = resetOriginal
          ? originalRate // fresh fetch → reset originalFxRate
          : (r.originalFxRate ?? originalRate); // cache hit or revert → preserve

        return {
          ...r,
          fxRate: rate,
          fxRateInput: String(rate),
          originalFxRate: effectiveOriginal,
          convertedAmount: converted,
          convertedAmountInput: String(converted),
          isFxEdited: rate !== effectiveOriginal,
        };
      }),
    );
  };
  const fetchFxForCurrency = async (toCurrency: string) => {
    const fromCurrency = selectedAccountCurrency[1]?.trim().toUpperCase();

    if (!date || !fromCurrency || !toCurrency) return;

    const formattedDate = date.format("YYYY-MM-DD");
    const cacheKey = `${fromCurrency}_${toCurrency}_${formattedDate}`;

    // SAME CURRENCY
    if (fromCurrency === toCurrency) {
      setJournalRows((prev) =>
        prev.map((r) => {
          const currencyInfo = getCurrencyFromValue(r.toAccount);
          if (currencyInfo.code !== toCurrency) return r;

          return {
            ...r,
            fxRate: null,
            fxRateInput: "",
            originalFxRate: null,
            convertedAmount: 0,
            convertedAmountInput: "",
            isFxEdited: false,
          };
        }),
      );
      return;
    }

    // CACHE HIT
    if (fxRates[cacheKey]) {
      const { rate, originalRate } = fxRates[cacheKey];
      applyFxToCurrency(toCurrency, rate, originalRate);
      return;
    }

    // FETCH
    try {
      const res = await fetchFxRate({
        from: fromCurrency,
        to: toCurrency,
        date: formattedDate,
      }).unwrap();

      const rate = Number(Object.values(res.data.rate)[0]);

      setFxRates((prev) => ({
        ...prev,
        [cacheKey]: {
          rate,
          originalRate: rate,
        },
      }));
      applyFxToCurrency(toCurrency, rate, rate, true);
    } catch (err) {
      // console.error("FX fetch failed", err);
    }
  };

  // handleReset method
  const handleReset = () => {
    setDescription("");
    setFromAccount("");
    setDate(null);
    setTransferAmount(0);
    setTransferAmountInput("");
    setJournalRows([
      {
        id: "1",
        toAccount: "",
        debitAmount: 0,
        debitAmountInput: "",
        convertedAmount: 0,
        convertedAmountInput: "",
        fxRate: null,
        originalFxRate: null,
        fxRateInput: "",
        isFxEdited: false,
        contactMapping: [],
      },
    ]);
    setImageFiles([]);
    setInitialSnapshot(null);
    onClose();
  };

  //  Reset form when opening for CREATE (not edit)
  useEffect(() => {
    if (open && !isEditMode) {
      setDescription("");
      setFromAccount("");
      setDate(null);
      setTransferAmount(0);
      setTransferAmountInput("");
      setJournalRows([
        {
          id: "1",
          toAccount: "",
          debitAmount: 0,
          debitAmountInput: "",
          convertedAmount: 0,
          convertedAmountInput: "",
          fxRate: null,
          originalFxRate: null,
          fxRateInput: "",
          isFxEdited: false,
          contactMapping: [],
        },
      ]);
      setImageFiles([]);
      setIsDataReady(true);
    }
  }, [open, isEditMode]);

  // Prefilling data in edit mode
  useEffect(() => {
    if (!open) return; // Only run when modal is open

    if (isEditMode) {
      // ------------------ EDIT MODE ------------------
      setIsDataReady(false); // Show skeleton while hydrating data
      isHydratingEditRef.current = true;
      if (!journalResponse?.data) return;

      const journalData = journalResponse.data;
      const descriptionValue = journalData.description || "";
      setDescription(
        duplicate ? `Duplicate - ${descriptionValue}` : descriptionValue,
      );
      setDate(journalData.date ? dayjs(journalData.date) : dayjs());

      // From Account
      const fromAcc = journalData.journalAccounts.find(
        (acc: any) => acc.isFromAccount,
      );

      if (fromAcc) {
        const balance =
          roundToTwoDecimals(Number(fromAcc?.counterCurrencyAmount)) || 0;
        setTransferAmount(balance);
        setTransferAmountInput(balance === 0 ? "" : String(balance));
        setFromAccount(
          `${
            ["asset", "liability", "expense", "income"].includes(
              fromAcc.type.toLowerCase(),
            )
              ? "account"
              : fromAcc.type.toLowerCase()
          }_${fromAcc.id}`,
        );
      }

      // To Accounts
      const toAccounts = journalData.journalAccounts.filter(
        (acc: any) => !acc.isFromAccount,
      );

      const tdsMapping = (
        journalData as { tdsMapping?: Record<string, string> }
      )?.tdsMapping;
      const contactMappingFromApi: TdsContactMappingItem[] =
        tdsMapping &&
        typeof tdsMapping === "object" &&
        !Array.isArray(tdsMapping)
          ? Object.entries(tdsMapping).map(([contactId, amount]) => ({
              contactId: `contact_${contactId}`,
              amount: String(amount),
            }))
          : [];

      setTdsContactMappingFromApi(contactMappingFromApi);

      const isFromAccountTdsInEdit =
        fromAcc?.type?.toLowerCase() === "tax" &&
        (() => {
          const tax = taxesData?.data?.find((t: any) => t.id === fromAcc.id);
          return tax?.abbreviation?.toLowerCase() === "tds";
        })();

      if (isFromAccountTdsInEdit && contactMappingFromApi.length > 0) {
        setFromAccountContactMapping(contactMappingFromApi);
      } else {
        setFromAccountContactMapping([]);
      }

      const formattedRows: JournalRow[] = toAccounts.map(
        (acc: any, idx: number) => {
          const debitValue = acc.counterCurrencyAmount
            ? roundToTwoDecimals(Number(acc.counterCurrencyAmount))
            : 0;

          const fx = acc.counterExchangeRate
            ? Number(acc.counterExchangeRate)
            : null;

          const originalFx = acc.counterOriginalExchangeRate
            ? Number(acc.counterOriginalExchangeRate)
            : fx;
          const converted = acc?.accountCurrencyAmount;
          // fx !== null ? roundToTwoDecimals(debitValue * fx) : 0;
          const toAccountValue = `${
            ["asset", "liability", "expense", "income"].includes(
              acc.type.toLowerCase(),
            )
              ? "account"
              : acc.type.toLowerCase()
          }_${acc.id}`;
          const isTdsRow =
            toAccountValue.startsWith("tax_") &&
            (() => {
              const taxId = Number(toAccountValue.split("_")[1]);
              const tax = taxesData?.data?.find((t: any) => t.id === taxId);
              return tax?.abbreviation?.toLowerCase() === "tds";
            })();
          return {
            id: String(Date.now() + idx),
            toAccount: toAccountValue,
            debitAmount: debitValue,
            debitAmountInput: debitValue > 0 ? String(debitValue) : "",
            convertedAmount: converted,
            convertedAmountInput: converted > 0 ? String(converted) : "",
            fxRate: fx,
            originalFxRate: originalFx,
            fxRateInput: fx !== null ? String(fx) : "",
            isFxEdited: fx !== originalFx,
            contactMapping: isTdsRow ? contactMappingFromApi : [],
          };
        },
      );

      setJournalRows(formattedRows);

      // Hydrate FX rates cache
      // FIXED
      const fromCurrencyForCache = journalData.journalAccounts
        .find((acc: any) => acc.isFromAccount)
        ?.counterCurrency?.split(" - ")[1]
        ?.trim()
        .toUpperCase();
      const formattedDate = dayjs(journalData.date).format("YYYY-MM-DD");
      formattedRows.forEach((r) => {
        const currencyInfo = getCurrencyFromValue(r.toAccount);
        const toCurrency = currencyInfo.code;
        if (r.fxRate && fromCurrencyForCache && toCurrency) {
          const cacheKey = `${fromCurrencyForCache}_${toCurrency}_${formattedDate}`;
          setFxRates((prev) => ({
            ...prev,
            [cacheKey]: {
              rate: r.fxRate!,
              originalRate: r.originalFxRate ?? r.fxRate!,
            },
          }));
        }
      });

      const snapshotDescription = duplicate
        ? `Duplicate - ${descriptionValue}`
        : descriptionValue;

      const snapshotBalance = fromAcc
        ? roundToTwoDecimals(Number(fromAcc?.counterCurrencyAmount)) || 0
        : 0;

      setInitialSnapshot(
        JSON.stringify({
          description: snapshotDescription,
          date: journalData.date
            ? dayjs(journalData.date).format("YYYY-MM-DD")
            : null,
          fromAccount: fromAcc
            ? `${
                ["asset", "liability", "expense", "income"].includes(
                  fromAcc.type.toLowerCase(),
                )
                  ? "account"
                  : fromAcc.type.toLowerCase()
              }_${fromAcc.id}`
            : "",
          transferAmount: snapshotBalance,
          fromAccountContactMapping:
            isFromAccountTdsInEdit && contactMappingFromApi.length > 0
              ? contactMappingFromApi
              : [],
          journalRows: formattedRows.map((r) => ({
            toAccount: r.toAccount,
            debitAmount: r.debitAmount,
            contactMapping: r.contactMapping ?? [],
          })),
        }),
      );

      setIsDataReady(true);
      setTimeout(() => {
        isHydratingEditRef.current = false;
      }, 0);
    } else {
      // ------------------ CREATE MODE ------------------
      setDescription("");
      setFromAccount("");
      setDate(dayjs()); // Default to today
      setTransferAmount(0);
      setTransferAmountInput("");
      setJournalRows([
        {
          id: "1",
          toAccount: "",
          debitAmount: 0,
          debitAmountInput: "",
          convertedAmount: 0,
          convertedAmountInput: "",
          fxRate: null,
          originalFxRate: null,
          fxRateInput: "",
          isFxEdited: false,
          contactMapping: [],
        },
      ]);
      setImageFiles([]);
      setIsDataReady(true);
    }
  }, [open, isEditMode, duplicate, journalResponse]);

  /* When: (date changes , fromAccount changes )It fetches FX again.*/
  useEffect(() => {
    if (!date || !fromAccount) return;
    if (isEditMode && isHydratingEditRef.current) return;

    const fromCurrency = selectedAccountCurrency[1]?.trim().toUpperCase();
    if (!fromCurrency) return;

    const uniqueCurrencies = [
      ...new Set(
        journalRows
          .map((r) => getCurrencyFromValue(r.toAccount).code)
          .filter(Boolean),
      ),
    ];

    uniqueCurrencies.forEach((currency) => {
      fetchFxForCurrency(currency);
    });
  }, [date, fromAccount]);

  /* Clear from-account TDS mapping when from account is not TDS */
  useEffect(() => {
    if (fromAccount && !isTdsAccountId(fromAccount)) {
      setFromAccountContactMapping([]);
    }
  }, [fromAccount]);

  /* When from account is selected, clear any row that has the same account in to-account (one account can only be used once) */
  useEffect(() => {
    if (!fromAccount || isHydratingEditRef.current) return;
    setJournalRows((prev) =>
      prev.map((row) => {
        if (String(row.toAccount).trim() !== String(fromAccount).trim())
          return row;
        return {
          ...row,
          toAccount: "",
          debitAmount: 0,
          debitAmountInput: "",
          convertedAmount: 0,
          convertedAmountInput: "",
          contactMapping: [],
          fxRate: null,
          originalFxRate: null,
          fxRateInput: "",
          isFxEdited: false,
        };
      }),
    );
  }, [fromAccount]);

  //  Whenever isEditMode changes, update isDataReady accordingly
  useEffect(() => {
    setIsDataReady(!isEditMode);
  }, [isEditMode]);

  //  Show skeleton when opening modal in edit mode
  useEffect(() => {
    if (open && isEditMode) {
      setIsDataReady(false); // Show skeleton when opening modal in edit mode
      refetch(); // Force refetch to ensure fresh data or cache is used
    } else if (open && !isEditMode) {
      setIsDataReady(true); // Show form when creating new
    }
  }, [open, isEditMode, selectedRow?.id]);

  // Reset loading state when modal closes
  useEffect(() => {
    if (!open) {
      setIsDataReady(true);
    }
  }, [open]);

  // Show skeleton loading state during data prefill
  if (isEditMode && !isDataReady) {
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
    <Box>
      <Stack spacing={3}>
        {/* ─────────── Transfer Details ─────────── */}

        <Stack spacing={3}>
          {/* Row 1 — Description (Full Width) */}
          <TextFieldElement
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            placeholder="Enter transfer description"
          />

          {/* Row 2 — Date + From Account + Transfer Amount */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems="flex-start"
          >
            {/* Date */}
            <Box sx={{ flex: 1 }}>
              <DatePickerElement
                label="Date"
                required
                min={
                  dateRangeData?.data?.openingBalanceExists
                    ? dayjs(dateRangeData?.data.minDate)
                    : null
                }
                value={date}
                onChange={(newValue) => setDate(newValue)}
                width={"100%"}
              />
            </Box>

            {/* From Account */}
            <Box sx={{ flex: 1 }}>
              <SingleSelectElement
                label="From Account / Contact / Tax"
                value={fromAccount}
                onChange={(value) => setFromAccount(value)}
                options={allAccountOptions}
                menuHeight={300}
                width="100%"
              />

              {/* Balance Below Account */}
              {fromAccount && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.5,
                    fontWeight: 600,
                  }}
                >
                  Balance:&nbsp;
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color:
                        selectedAccountBalance >= 0
                          ? "success.main"
                          : "error.main",
                    }}
                  >
                    {selectedAccountBalance >= 0 ? "+" : "-"}{" "}
                    {formatCurrencyByCommaSeparation(
                      Math.abs(selectedAccountBalance).toFixed(2),
                      commaSeparation,
                      selectedAccountCurrency[0],
                    )}
                  </Typography>
                </Typography>
              )}
            </Box>

            {/* Transfer Amount */}
            <Box sx={{ flex: 1 }}>
              <TextFieldElement
                label="Transfer Amount"
                value={formatNumberForTyping(
                  transferAmountInput,
                  commaSeparation,
                )}
                width={"100%"}
                slotProps={{
                  htmlInput: {
                    style: { textAlign: "right" },
                    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (["e", "E", "+", "-"].includes(e.key)) {
                        e.preventDefault();
                      }
                    },
                  },
                  input: {
                    startAdornment: selectedAccountCurrency[0] && (
                      <InputAdornment position="start">
                        <Typography variant="body2">
                          {selectedAccountCurrency[0]?.split(" ")[0]}
                        </Typography>
                      </InputAdornment>
                    ),
                  },
                }}
                onChange={(e) => {
                  const raw = parseNumberForTyping(e.target.value);
                  setTransferAmountInput(raw);
                  setTransferAmount(
                    raw
                      ? roundToTwoDecimals(
                          parseNumberByCommaSeparation(raw, commaSeparation),
                        )
                      : 0,
                  );
                }}
              />
            </Box>
          </Stack>
        </Stack>

        <Divider />

        {/* ─────────── Account Distribution ─────────── */}
        <Stack spacing={1}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Account Distribution
            </Typography>
            <PrimaryIconButton icon={<Add />} onClick={handleAddRow} />
          </Stack>

          {journalRows.map((row) => {
            const isAccountDuplicate = !!(
              row.toAccount &&
              String(row.toAccount).trim() === String(fromAccount).trim()
            );

            // Exclude fromAccount and any option already selected in another row
            const selectedInOtherRows = new Set(
              journalRows
                .filter(
                  (r) =>
                    r.id !== row.id &&
                    r.toAccount &&
                    String(r.toAccount).trim() !== "",
                )
                .map((r) => r.toAccount),
            );
            const rowAccountOptions = allAccountOptions
              .map((group) => ({
                ...group,
                options: group.options.filter(
                  (opt) =>
                    opt.value !== fromAccount &&
                    !selectedInOtherRows.has(opt.value),
                ),
              }))
              .filter((group) => group.options.length > 0);

            const toCurrencyInfo = getCurrencyFromValue(row.toAccount);

            return (
              <Stack
                key={row.id}
                direction={isMobile ? "column" : "row"}
                spacing={2}
                alignItems="center"
                sx={{ px: 1.5, py: 0.75 }}
              >
                {/* To Account */}
                <SingleSelectElement
                  sx={{ flex: 1 }}
                  fullWidth
                  label="To Account / Contact / Tax"
                  value={row.toAccount}
                  onChange={(value) =>
                    handleUpdateRow(row.id, "toAccount", value)
                  }
                  options={rowAccountOptions}
                  menuHeight={250}
                  error={isAccountDuplicate}
                />

                {/* Converted Amount */}
                {selectedAccountCurrency[0] === toCurrencyInfo.symbol ? (
                  <Box sx={{ flex: 1 }}>
                    <TextFieldElement
                      fullWidth
                      label="Converted Amount"
                      value="N/A"
                      disabled
                      slotProps={{
                        input: {
                          style: { textAlign: "right" },
                        },
                      }}
                    />
                  </Box>
                ) : (
                  <TextFieldElement
                    sx={{ flex: 1 }}
                    fullWidth
                    label="Converted Amount"
                    value={formatNumberForTyping(
                      row.convertedAmountInput,
                      commaSeparation,
                    )} // Format number with commas as user types
                    onChange={(e) => {
                      const raw = parseNumberForTyping(e.target.value); // Parse the raw input value
                      setJournalRows((prev) =>
                        prev.map((r) =>
                          r.id === row.id
                            ? { ...r, convertedAmountInput: raw } // Update the state with the formatted value
                            : r,
                        ),
                      );
                    }}
                    onBlur={() => {
                      // When the input loses focus, parse the formatted value to a number
                      const parsed = parseNumberByCommaSeparation(
                        row.convertedAmountInput,
                        commaSeparation,
                      );

                      // Update the row only if the parsed value is different from the current one
                      if (!isNaN(parsed) && parsed !== row.convertedAmount) {
                        handleUpdateRow(row.id, "convertedAmount", parsed);
                      }
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="body2">
                              {toCurrencyInfo.symbol}
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                      htmlInput: {
                        style: { textAlign: "right" },
                        onKeyDown: (
                          e: React.KeyboardEvent<HTMLInputElement>,
                        ) => {
                          if (["e", "E", "+", "-"].includes(e.key)) {
                            e.preventDefault();
                          }
                        },
                      },
                    }}
                  />
                )}

                {/* Debit Amount */}
                <TextFieldElement
                  sx={{ flex: 1 }}
                  fullWidth
                  label="Debit Amount"
                  value={formatNumberForTyping(
                    row.debitAmountInput,
                    commaSeparation,
                  )}
                  onChange={(e) => {
                    const raw = parseNumberForTyping(e.target.value);

                    setJournalRows((prev) =>
                      prev.map((r) =>
                        r.id === row.id ? { ...r, debitAmountInput: raw } : r,
                      ),
                    );

                    const num = parseNumberByCommaSeparation(
                      raw,
                      commaSeparation,
                    );

                    handleUpdateRow(
                      row.id,
                      "debitAmount",
                      !isNaN(num) ? roundToTwoDecimals(num) : 0,
                    );
                  }}
                  slotProps={{
                    input: {
                      startAdornment: selectedAccountCurrency[0] && (
                        <InputAdornment position="start">
                          <Typography variant="body2">
                            {selectedAccountCurrency[0]}
                          </Typography>
                        </InputAdornment>
                      ),
                      style: { textAlign: "right" },
                    },
                    htmlInput: {
                      style: { textAlign: "right" },
                      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (["e", "E", "+", "-"].includes(e.key)) {
                          e.preventDefault();
                        }
                      },
                    },
                  }}
                />

                {/* FX Rate */}
                {row.fxRate === null ? (
                  <TextFieldElement
                    sx={{ flex: 0.8 }}
                    fullWidth
                    label="FX Rate"
                    value="N/A"
                    disabled
                    slotProps={{
                      input: {
                        style: { textAlign: "right" },
                      },
                    }}
                  />
                ) : (
                  <TextFieldElement
                    sx={{ flex: 0.8 }}
                    fullWidth
                    label="FX Rate"
                    value={row.fxRate === null ? "" : row.fxRateInput}
                    onChange={(e) => {
                      const raw = e.target.value;

                      setJournalRows((prev) =>
                        prev.map((r) =>
                          r.id === row.id ? { ...r, fxRateInput: raw } : r,
                        ),
                      );
                    }}
                    onBlur={() => {
                      const parsed = parseNumberByCommaSeparation(
                        row.fxRateInput,
                        commaSeparation,
                      );

                      if (!isNaN(parsed)) {
                        handleUpdateRow(row.id, "fxRate", parsed);
                      }
                    }}
                    slotProps={{
                      input: {
                        style: { textAlign: "right" },
                      },
                    }}
                  />
                )}

                {/* Revert FX (space always reserved) */}
                {/* Revert FX (space always reserved) */}
                <Box sx={{ width: 32, flexShrink: 0 }}>
                  {row.isFxEdited && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        const fromCurrency = selectedAccountCurrency[1]
                          ?.trim()
                          .toUpperCase();
                        const formattedDate = date?.format("YYYY-MM-DD");
                        const toCurrency = toCurrencyInfo.code;

                        if (!fromCurrency || !formattedDate || !toCurrency)
                          return;

                        const cacheKey = `${fromCurrency}_${toCurrency}_${formattedDate}`;
                        handleRevertFx(cacheKey);
                      }}
                    >
                      <RestoreIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                {/* Delete */}
                <IconButton
                  sx={{ flexShrink: 0 }}
                  onClick={() => handleRemoveRow(row.id)}
                  size="small"
                  color="error"
                  disabled={journalRows.length === 1}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Stack>
            );
          })}
        </Stack>

        {/* TDS Contact Mapping */}
        {(hasTdsLines || isFromAccountTds) && (
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              overflow: "hidden",
              mt: 2,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 2,
                py: 1.5,
                backgroundColor: "action.hover",
              }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                TDS Contact Mapping
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                {isFromAccountTds && (
                  <Tooltip
                    title={(() => {
                      const mappingSum = (
                        fromAccountContactMapping ?? []
                      ).reduce(
                        (sum, i) => sum + (parseFloat(i.amount) || 0),
                        0,
                      );
                      const hasMapping =
                        (fromAccountContactMapping ?? []).length > 0;
                      const isBalanced =
                        hasMapping &&
                        Math.abs(mappingSum - transferAmount) < 0.01;
                      return isBalanced
                        ? "From account: Balanced ✓"
                        : hasMapping
                          ? `From account: ${formatNumberByCommaSeparation(mappingSum, commaSeparation)} / ${formatNumberByCommaSeparation(transferAmount, commaSeparation)}`
                          : "From account: No mapping yet";
                    })()}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.4}>
                      {(() => {
                        const mappingSum = (
                          fromAccountContactMapping ?? []
                        ).reduce(
                          (sum, i) => sum + (parseFloat(i.amount) || 0),
                          0,
                        );
                        const hasMapping =
                          (fromAccountContactMapping ?? []).length > 0;
                        const isBalanced =
                          hasMapping &&
                          Math.abs(mappingSum - transferAmount) < 0.01;
                        return isBalanced ? (
                          <CheckCircleOutlineIcon
                            sx={{ fontSize: 16, color: "success.main" }}
                          />
                        ) : (
                          <WarningAmberIcon
                            sx={{
                              fontSize: 16,
                              color: hasMapping
                                ? "warning.main"
                                : "text.disabled",
                            }}
                          />
                        );
                      })()}
                      <Typography
                        variant="caption"
                        sx={{
                          color: (() => {
                            const mappingSum = (
                              fromAccountContactMapping ?? []
                            ).reduce(
                              (sum, i) => sum + (parseFloat(i.amount) || 0),
                              0,
                            );
                            const hasMapping =
                              (fromAccountContactMapping ?? []).length > 0;
                            const isBalanced =
                              hasMapping &&
                              Math.abs(mappingSum - transferAmount) < 0.01;
                            return isBalanced
                              ? "success.main"
                              : hasMapping
                                ? "warning.main"
                                : "text.disabled";
                          })(),
                          fontWeight: 600,
                        }}
                      >
                        From
                      </Typography>
                    </Stack>
                  </Tooltip>
                )}
                {tdsLines.map(({ row, index }) => {
                  const mappingSum = (row.contactMapping ?? []).reduce(
                    (sum, i) => sum + (parseFloat(i.amount) || 0),
                    0,
                  );
                  const rowAmount = Number(row.debitAmount) || 0;
                  const hasMapping = (row.contactMapping ?? []).length > 0;
                  const isBalanced =
                    hasMapping && Math.abs(mappingSum - rowAmount) < 0.01;
                  return (
                    <Tooltip
                      key={row.id}
                      title={
                        isBalanced
                          ? `Row ${index + 1}: Balanced ✓`
                          : hasMapping
                            ? `Row ${index + 1}: ${formatNumberByCommaSeparation(mappingSum, commaSeparation)} / ${formatNumberByCommaSeparation(rowAmount, commaSeparation)}`
                            : `Row ${index + 1}: No mapping yet`
                      }
                    >
                      <Stack direction="row" alignItems="center" spacing={0.4}>
                        {isBalanced ? (
                          <CheckCircleOutlineIcon
                            sx={{ fontSize: 16, color: "success.main" }}
                          />
                        ) : (
                          <WarningAmberIcon
                            sx={{
                              fontSize: 16,
                              color: hasMapping
                                ? "warning.main"
                                : "text.disabled",
                            }}
                          />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            color: isBalanced
                              ? "success.main"
                              : hasMapping
                                ? "warning.main"
                                : "text.disabled",
                            fontWeight: 600,
                          }}
                        >
                          Row {index + 1}
                        </Typography>
                      </Stack>
                    </Tooltip>
                  );
                })}
                <IconButton
                  size="small"
                  sx={{ ml: 0.5 }}
                  onClick={() => setTdsExpanded((v) => !v)}
                >
                  {tdsExpanded ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </IconButton>
              </Stack>
            </Stack>

            {tdsExpanded && (
              <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
                {isFromAccountTds && (
                  <Box
                    sx={{
                      mb: 3,
                      pb: 3,
                      borderBottom: "1px dashed",
                      borderColor: "divider",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 2.5 }}
                    >
                      <Stack direction="row" alignItems="center" gap={2}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Add Contact
                        </Typography>
                        <PrimaryIconButton
                          icon={<Add />}
                          variant="outlined"
                          onClick={() =>
                            setFromAccountContactMapping((prev) => [
                              ...prev,
                              { contactId: "", amount: "" },
                            ])
                          }
                          sx={{ textTransform: "none" }}
                        >
                          Add
                        </PrimaryIconButton>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          Amount to match:
                        </Typography>
                        <Chip
                          label={formatNumberByCommaSeparation(
                            transferAmount,
                            commaSeparation,
                          )}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.68rem",
                            fontWeight: 600,
                          }}
                        />
                        {(fromAccountContactMapping ?? []).length > 0 && (
                          <>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Mapped:
                            </Typography>
                            <Chip
                              label={formatNumberByCommaSeparation(
                                (fromAccountContactMapping ?? []).reduce(
                                  (sum, i) => sum + (parseFloat(i.amount) || 0),
                                  0,
                                ),
                                commaSeparation,
                              )}
                              size="small"
                              color={
                                Math.abs(
                                  (fromAccountContactMapping ?? []).reduce(
                                    (sum, i) =>
                                      sum + (parseFloat(i.amount) || 0),
                                    0,
                                  ) - transferAmount,
                                ) < 0.01
                                  ? "success"
                                  : "warning"
                              }
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 700,
                              }}
                            />
                          </>
                        )}
                      </Stack>
                    </Stack>
                    <RepeaterElement
                      label=""
                      items={fromAccountContactMapping ?? []}
                      gap={2}
                      setItems={(value) => {
                        const newItems =
                          typeof value === "function"
                            ? value(fromAccountContactMapping ?? [])
                            : value;
                        setFromAccountContactMapping(newItems);
                      }}
                      initialItem={{ contactId: "", amount: "" }}
                      renderItem={(subItem, subIndex, onChange) => {
                        const mapping = fromAccountContactMapping ?? [];
                        const selectedInOther = new Set(
                          mapping
                            .map((item, i) =>
                              i === subIndex ? "" : item.contactId,
                            )
                            .filter(Boolean),
                        );
                        const contactOptionsForFrom = contactOptions.filter(
                          (opt: { value: string }) =>
                            !selectedInOther.has(opt.value) ||
                            opt.value === subItem.contactId,
                        );
                        return (
                          <Stack
                            direction="row"
                            gap={1.5}
                            alignItems="center"
                            sx={{ width: "100%", px: 1.5 }}
                          >
                            <SingleSelectElement
                              label="Contact"
                              value={subItem.contactId}
                              onChange={(v) => onChange("contactId", v)}
                              options={contactOptionsForFrom}
                              required
                              sx={{ flex: 2, minWidth: 180 }}
                            />
                            <TextFieldElement
                              label="Amount"
                              value={formatNumberForTyping(
                                String(subItem.amount ?? ""),
                                commaSeparation,
                              )}
                              onChange={(e) =>
                                onChange(
                                  "amount",
                                  parseNumberForTyping(e.target.value),
                                )
                              }
                              required
                              sx={{ flex: 1, minWidth: 120 }}
                              slotProps={{
                                htmlInput: {
                                  style: { textAlign: "right" },
                                  inputMode: "decimal",
                                  onKeyDown: (
                                    e: React.KeyboardEvent<HTMLInputElement>,
                                  ) => {
                                    if (["e", "E", "+", "-"].includes(e.key))
                                      e.preventDefault();
                                  },
                                },
                                input: {
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {selectedAccountCurrency[0]}
                                      </Typography>
                                    </InputAdornment>
                                  ),
                                },
                              }}
                            />
                          </Stack>
                        );
                      }}
                    />
                  </Box>
                )}
                {tdsLines.map(({ row, index: rowIndex }, tdsIdx) => {
                  const mappingSum = (row.contactMapping ?? []).reduce(
                    (sum, i) => sum + (parseFloat(i.amount) || 0),
                    0,
                  );
                  const rowAmount = Number(row.debitAmount) || 0;
                  const hasMapping = (row.contactMapping ?? []).length > 0;
                  const isBalanced =
                    hasMapping && Math.abs(mappingSum - rowAmount) < 0.01;
                  return (
                    <Box
                      key={row.id}
                      sx={{
                        mb: tdsIdx < tdsLines.length - 1 ? 3 : 0,
                        pb: tdsIdx < tdsLines.length - 1 ? 3 : 0,
                        borderBottom:
                          tdsIdx < tdsLines.length - 1 ? "1px dashed" : "none",
                        borderColor: "divider",
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 2.5 }}
                      >
                        <Stack direction="row" alignItems="center" gap={2}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            Add Contact
                          </Typography>
                          <PrimaryIconButton
                            icon={<Add />}
                            variant="outlined"
                            onClick={() =>
                              updateRowContactMapping(row.id, [
                                ...(row.contactMapping ?? []),
                                { contactId: "", amount: "" },
                              ])
                            }
                            sx={{ textTransform: "none" }}
                          >
                            Add
                          </PrimaryIconButton>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="caption" color="text.secondary">
                            Row Amount:
                          </Typography>
                          <Chip
                            label={formatNumberByCommaSeparation(
                              rowAmount,
                              commaSeparation,
                            )}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 600,
                            }}
                          />
                          {hasMapping && (
                            <>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Mapped:
                              </Typography>
                              <Chip
                                label={formatNumberByCommaSeparation(
                                  mappingSum,
                                  commaSeparation,
                                )}
                                size="small"
                                color={isBalanced ? "success" : "warning"}
                                sx={{
                                  height: 20,
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                }}
                              />
                            </>
                          )}
                        </Stack>
                      </Stack>

                      <RepeaterElement
                        label=""
                        items={row.contactMapping ?? []}
                        setItems={(value) => {
                          const newItems =
                            typeof value === "function"
                              ? value(row.contactMapping ?? [])
                              : value;
                          updateRowContactMapping(row.id, newItems);
                        }}
                        initialItem={{ contactId: "", amount: "" }}
                        renderItem={(subItem, subIndex, onChange) => {
                          const mapping = row.contactMapping ?? [];
                          const selectedInOtherRows = new Set(
                            mapping
                              .map((item, i) =>
                                i === subIndex ? "" : item.contactId,
                              )
                              .filter(Boolean),
                          );
                          const contactOptionsForRow = contactOptions.filter(
                            (opt: { value: string }) =>
                              !selectedInOtherRows.has(opt.value) ||
                              opt.value === subItem.contactId,
                          );
                          return (
                            <Stack
                              direction="row"
                              gap={1.5}
                              alignItems="center"
                              sx={{ width: "100%", px: 1.5 }}
                            >
                              <SingleSelectElement
                                label="Contact"
                                value={subItem.contactId}
                                onChange={(v) => onChange("contactId", v)}
                                options={contactOptionsForRow}
                                required
                                sx={{ flex: 2, minWidth: 180 }}
                              />
                              <TextFieldElement
                                label="Amount"
                                value={formatNumberForTyping(
                                  String(subItem.amount ?? ""),
                                  commaSeparation,
                                )}
                                onChange={(e) =>
                                  onChange(
                                    "amount",
                                    parseNumberForTyping(e.target.value),
                                  )
                                }
                                required
                                sx={{ flex: 1, minWidth: 120 }}
                                slotProps={{
                                  htmlInput: {
                                    style: { textAlign: "right" },
                                    inputMode: "decimal",
                                    onKeyDown: (
                                      e: React.KeyboardEvent<HTMLInputElement>,
                                    ) => {
                                      if (["e", "E", "+", "-"].includes(e.key))
                                        e.preventDefault();
                                    },
                                  },
                                  input: {
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {selectedAccountCurrency[0]}
                                        </Typography>
                                      </InputAdornment>
                                    ),
                                  },
                                }}
                              />
                            </Stack>
                          );
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* Totals */}

        <Box
          sx={{
            px: 1.5,
            py: 2,
            backgroundColor: "action.hover",
            borderRadius: 1,
          }}
        >
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            alignItems="center"
          >
            {/* Empty space for To Account */}
            <Box sx={{ flex: 1 }} />

            {/* Empty space for Converted */}
            <Box sx={{ flex: 1 }} />

            {/* Total Debit — aligned with Debit column */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "flex-start",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Total Debit:
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color:
                      transferAmount === totalDebitAmount && transferAmount > 0
                        ? "success.main"
                        : "error.main",
                  }}
                >
                  {formatCurrencyByCommaSeparation(
                    totalDebitAmount.toFixed(2),
                    commaSeparation,
                  )}
                </Typography>
              </Stack>
            </Box>

            {/* Transfer Amount — right of Debit */}
            <Box
              sx={{
                flex: 0.8,
                display: "flex",
                justifyContent: "flex-start",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Transfer Amount:
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color:
                      transferAmount === totalDebitAmount && transferAmount > 0
                        ? "success.main"
                        : "error.main",
                  }}
                >
                  {formatCurrencyByCommaSeparation(
                    transferAmount.toFixed(2),
                    commaSeparation,
                  )}
                </Typography>
              </Stack>
            </Box>

            {/* Space for icon columns */}
            <Box sx={{ width: 72 }} />
          </Stack>
        </Box>

        {!isEditMode && <Divider />}

        {/* ─────────── Attachments (Hide in Edit Mode) ─────────── */}
        {!isEditMode && (
          <Stack spacing={2}>
            {/* Upload */}
            <FileUploadField
              label="Attachments"
              multiple
              maxFiles={10} // max number of files allowed
              maxSize={5} // max size per file in MB
              accept={[
                "image/jpeg",
                "image/png",
                "image/webp",
                "application/pdf",
              ]} // allowed types
              value={null} // important: allow reselecting same file
              onChange={handleAddFiles}
            />

            {/* File List */}
            {imageFiles.length > 0 && (
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

        {/* ─────────── Footer ─────────── */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            mt: 3,
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            justifyContent: "flex-end",
          }}
        >
          {/* Submit */}
          <Box display="flex" justifyContent="flex-end">
            <Tooltip
              title={
                isSubmitDisabled && validationErrors.length > 0 ? (
                  <Stack spacing={0.5}>
                    {validationErrors.map((err, i) => (
                      <Typography variant="inherit" key={i} display="block">
                        {err}
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  ""
                )
              }
              disableHoverListener={!isSubmitDisabled}
            >
              <PrimaryButton
                onClick={handleSubmit}
                disabled={
                  isSaving ||
                  isSubmitDisabled ||
                  isCreatingJournal ||
                  isUpdatingJournal ||
                  isUploadingAttachments
                }
              >
                Save
              </PrimaryButton>
            </Tooltip>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}

export default Transfer;
