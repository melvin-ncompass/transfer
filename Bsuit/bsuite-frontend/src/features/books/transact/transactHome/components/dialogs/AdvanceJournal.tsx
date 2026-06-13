import { Box, Stack } from "@mui/system";
import { DatePickerElement } from "../../../../../../components/atom/date-picker";
import dayjs from "dayjs";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import {
  formatCurrencyByCommaSeparation,
  formatNumberByCommaSeparation,
  formatNumberForTyping,
  parseNumberForTyping,
  roundToTwoDecimals,
} from "../../../../../../utils/numberFormatter";
import { currencyData } from "../../../../../company/utils/currency";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { Chip } from "../../../../../../components/atom/chips";
import InputAdornment from "@mui/material/InputAdornment";
import {
  Delete,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  WarningAmber as WarningAmberIcon,
} from "@mui/icons-material";
import { Divider, IconButton, Typography } from "@mui/material";
import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../../../components/atom/button";
import AddIcon from "@mui/icons-material/Add";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { FileUploadField } from "../../../../../../components/atom/file-upload-field";
import { RepeaterElement } from "../../../../../../components/atom/form-repeater";
import { Snackbar } from "../../../../../../components/atom/snackbar";
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
  RefetchMetaDataTransactTable,
} from "../../types/transact.types";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import { useAllAccountOptions } from "../../hooks/useAllAccountOptions";
import type { HighlightedRow } from "../../../../../../types/types";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { useNavigate } from "react-router-dom";
import { useLazyGetFxHistoryQuery } from "../../../api/fx.api";
import RestoreIcon from "@mui/icons-material/Restore";
interface IUnCatData {
  title: string;
  uncatId: number;
  currentAccountId: number;
  total: number;
  moneyDirection?: "in" | "out";
  accountCurrencyData: string;
  description: string;
  debit: string | number;
  credit: string | number;
}
type AdvanceJournalProps = {
  initialData?: any | null;
  onSuccess?: (meta?: RefetchMetaDataTransactTable) => void;
  onClose?: () => void;
  selectedRow?: { id: number };
  duplicate?: boolean;
  loading?: boolean;
  setHighlightedRow?: React.Dispatch<SetStateAction<HighlightedRow>>;
  showSnackBar?: (message: string, color: "success" | "error") => void;
  unCatData?: IUnCatData;
  refetchTransactCount?: () => void;
};

type TdsContactMappingItem = { contactId: string; amount: string };

type JournalLine = {
  accountId: string;
  entryType: "DEBIT" | "CREDIT";
  debit: number | string;
  credit: number | string;
  amount: number | string;

  fxRate: number | null;
  originalFxRate?: number | null;
  fxRateInput?: string;

  convertedAmount?: number;
  convertedAmountInput?: string;

  isFxEdited?: boolean;

  contactMapping?: TdsContactMappingItem[];
};
function AdvanceJournal({
  onSuccess,
  onClose,
  selectedRow,
  duplicate,
  setHighlightedRow,
  showSnackBar,
  unCatData,
  refetchTransactCount,
}: AdvanceJournalProps) {
  const navigate = useNavigate();
  // Detect mode
  const isEditMode = selectedRow?.id && !duplicate;
  const isUncatJournal = Boolean(unCatData);

  // Initialize based on edit mode
  const [isDataReady, setIsDataReady] = useState(!isEditMode);
  // State
  const [date1, setDate1] = useState(dayjs());
  const [journalCurrency, setJournalCurrency] = useState<string>("₹ - INR");
  const [journalDescription, setJournalDescription] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    {
      accountId: "",
      entryType: "DEBIT",
      debit: "",
      credit: "",
      amount: "",
      fxRate: null,
      originalFxRate: null,
      fxRateInput: "",
      convertedAmount: 0,
      convertedAmountInput: "",
      isFxEdited: false,
    },
    {
      accountId: "",
      entryType: "CREDIT",
      debit: "",
      credit: "",
      amount: "",
      fxRate: null,
      originalFxRate: null,
      fxRateInput: "",
      convertedAmount: 0,
      convertedAmountInput: "",
      isFxEdited: false,
    },
  ]);

  // STATE MANAGEMENT

  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setErrors] = useState<string | null>(null);
  const [tdsExpanded, setTdsExpanded] = useState(true);

  // API mutations
  const [createJournal, { isLoading: isCreating }] = useCreateJournalMutation();
  const [updateJournal, { isLoading: isUpdating }] = useUpdateJournalMutation();
  const [uploadAttachments, { isLoading: isUploadingAttachments }] =
    useUploadAttachmentsMutation();

  // Snapshot for dirty check (edit mode)
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  // FX cache → avoids repeated API calls
  const [fxRates, setFxRates] = useState<
    Record<string, { rate: number; originalRate: number }>
  >({});

  // Lazy FX fetch
  const [fetchFxRate] = useLazyGetFxHistoryQuery();

  // Prevent unwanted FX calls during hydration
  const isHydratingEditRef = useRef(false);

  // DATA FETCHING (QUERIES)
  // Fetch journal (edit / duplicate mode only)
  const {
    data: journalResponse,
    isSuccess,
    refetch,
  } = useGetJournalByIdQuery(
    {
      id: String(selectedRow?.id || 0),
      transactionTypeName: "journal",
    },
    {
      skip: !isEditMode && !duplicate,
    },
  );

  // Global configs
  const { data: dateRangeData } = useGetDateRangeQuery();
  const { data: headerData } = useGetHeaderDataQuery();

  // Accounts / contacts / taxes
  const { allAccountOptions, accountsData, contactsData, taxesData } =
    useAllAccountOptions(undefined, true, "in_transit_only");

  // ******************************
  //  HELPERS
  // ******************************
  const commaseperation =
    headerData?.data.commaSeparation === "IN" ? "IN" : "US";
  const journalCurrencySymbol =
    journalCurrency.split(" - ")[0]?.trim() ?? "";

  // Extract currency (code + symbol) from accountId
  const getCurrencyFromAccountId = (accountId: string) => {
    if (!accountId) return { code: "", symbol: "" };
    const [type, id] = accountId.split("_");

    switch (type) {
      case "account": {
        const acc = accountsData?.data?.find((a: any) => a.id === Number(id));
        const currencyInfo = acc?.accountCurrency.split("-");
        return {
          code: currencyInfo?.[1] ?? "",
          symbol: currencyInfo?.[0] ?? "",
        };
      }

      case "contact": {
        const reportingCurrency = headerData?.data?.reportingCurrency;
        const currencyInfo = reportingCurrency?.split(" - ");

        return {
          code: currencyInfo?.[1] ?? "",
          symbol: currencyInfo?.[0] ?? "",
        };
      }

      case "tax": {
        const reportingCurrency = headerData?.data?.reportingCurrency;
        const currencyInfo = reportingCurrency?.split(" - ");

        return {
          code: currencyInfo?.[1] ?? "", // fallback to empty string if undefined
          symbol: currencyInfo?.[0] ?? "",
        };
      }

      default:
        return { code: "", symbol: "" };
    }
  };

  // Check if FX rate was manually edited
  const isCurrencyFxEdited = (toCurrency: string) => {
    const baseCurrency = journalCurrency.split(" - ")[1]?.trim().toUpperCase();
    const formattedDate = date1.format("YYYY-MM-DD");

    const key = `${baseCurrency}_${toCurrency}_${formattedDate}`;
    const fx = fxRates[key];

    if (!fx) return false;

    return Math.abs(fx.rate - fx.originalRate) > 0.000001;
  };

  // Identify TDS accounts
  const isTdsAccountId = (accountId: string) => {
    if (!accountId?.startsWith("tax_")) return false;
    const taxId = Number(accountId.split("_")[1]);
    const tax = taxesData?.data?.find((t: any) => t.id === taxId);
    return tax?.abbreviation?.toLowerCase() === "tds";
  };

  // ******************************
  //  FX LOGIC (CACHE + APPLY)
  // ******************************

  // Apply FX rate to all matching currency lines
  const applyFxToCurrency = (
    toCurrency: string,
    rate: number,
    originalRate: number,
  ) => {
    const targetCurrency = toCurrency?.trim().toUpperCase();
    const baseCurrency = journalCurrency.split(" - ")[1]?.trim().toUpperCase();
    const formattedDate = date1.format("YYYY-MM-DD");
    const cacheKey = `${baseCurrency}_${targetCurrency}_${formattedDate}`;

    //  Update cache with edited rate
    setFxRates((prev) => ({
      ...prev,
      [cacheKey]: {
        rate,
        originalRate,
      },
    }));
    setLines((prev) =>
      prev.map((l) => {
        const currencyInfo = getCurrencyFromAccountId(l.accountId);
        const lineCurrency = currencyInfo.code?.trim().toUpperCase();

        if (lineCurrency !== targetCurrency) return l;

        const baseAmount =
          Number(l.debit) > 0
            ? Number(l.debit)
            : Number(l.credit) > 0
              ? Number(l.credit)
              : 0;

        const converted = roundToTwoDecimals(baseAmount * rate);

        return {
          ...l,
          fxRate: rate,
          originalFxRate: l.originalFxRate ?? originalRate,
          fxRateInput: String(rate),
          convertedAmount: converted,
          convertedAmountInput: String(converted),
          // isFxEdited:
          //   Math.abs(Number(rate) - Number(l.originalFxRate ?? originalRate)) >
          //   0.000001,
        };
      }),
    );
  };

  // Fetch FX for a currency +  (cached) + (avoid unnecessary api hits)
  const fetchFxForCurrency = async (toCurrency: string) => {
    const baseCurrency = journalCurrency.split(" - ")[1]?.trim().toUpperCase();
    const targetCurrency = toCurrency?.trim().toUpperCase();
    const formattedDate = date1.format("YYYY-MM-DD");
    if (!date1 || !baseCurrency || !targetCurrency) return;

    // Same currency → no FX needed
    if (baseCurrency === targetCurrency) {
      setLines((prev) =>
        prev.map((l) => {
          const currencyInfo = getCurrencyFromAccountId(l.accountId);
          if (currencyInfo.code?.trim().toUpperCase() !== targetCurrency)
            return l;

          return {
            ...l,
            fxRate: null,
            originalFxRate: null,
            fxRateInput: "",
            convertedAmount: 0,
            convertedAmountInput: "",
            isFxEdited: false,
          };
        }),
      );
      return;
    }

    const cacheKey = `${baseCurrency}_${targetCurrency}_${formattedDate}`;

    // Cache hit
    if (fxRates[cacheKey]) {
      const { rate, originalRate } = fxRates[cacheKey];
      applyFxToCurrency(targetCurrency, rate, originalRate);
      return;
    }

    // API call
    try {
      const res = await fetchFxRate({
        from: baseCurrency,
        to: targetCurrency,
        date: formattedDate,
      }).unwrap();

      const rate = Number(Object.values(res.data.rate)[0]);

      setFxRates((prev) => ({
        ...prev,
        [cacheKey]: { rate, originalRate: rate },
      }));

      applyFxToCurrency(targetCurrency, rate, rate);
    } catch (err) {}
  };

  // ******************************
  //  DERIVED STATE
  // ******************************

  // Derived (round to 2 decimals to avoid floating-point precision issues, e.g. 734.23+102.80+3.67)
  const totalDebit = useMemo(() => {
    const sum = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    return Math.round(sum * 100) / 100;
  }, [lines]);

  const totalCredit = useMemo(() => {
    const sum = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return Math.round(sum * 100) / 100;
  }, [lines]);

  const hasInvalidLine = lines.some((l) => !l.accountId);

  const isDirty = useMemo(() => {
    if (!isEditMode || !initialSnapshot) return true;
    const linesForSnapshot = lines.map((l) => ({
      ...l,
      contactMapping: l.contactMapping ?? [],
    }));
    const currentSnapshot = JSON.stringify({
      description: journalDescription,
      date: date1.format("YYYY-MM-DD"),
      lines: linesForSnapshot,
    });
    return currentSnapshot !== initialSnapshot;
  }, [isEditMode, initialSnapshot, journalDescription, date1, lines]);

  const areTotalsEqual = Math.abs(totalDebit - totalCredit) < 0.001;
  const isSaving = Boolean(isCreating || isUpdating || isUploadingAttachments);

  const tdsMappingErrors = useMemo(() => {
    const errs: string[] = [];
    lines.forEach((line, idx) => {
      if (!isTdsAccountId(line.accountId)) return;
      const rowAmount = Number(line.amount) || 0;
      const mapping = line.contactMapping ?? [];
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
          `• Row ${idx + 1} (TDS): Contact mapping total (${mappingSum}) must equal row amount (${rowAmount})`,
        );
      }
    });
    return errs;
  }, [lines]);

  const hasTdsMappingError = tdsMappingErrors.length > 0;

  // TDS lines derived
  const tdsLines = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => isTdsAccountId(line.accountId));
  const hasTdsLines = tdsLines.length > 0;

  const isSubmitDisabled = Boolean(
    isSaving ||
      !areTotalsEqual ||
      Boolean(totalDebit === 0 && totalCredit === 0) ||
      hasInvalidLine ||
      hasTdsMappingError ||
      (isEditMode && !isDirty),
  );

  const submitErrors = useMemo(() => {
    const errors: string[] = [];
    if (hasInvalidLine) {
      errors.push("• Each journal line must have an account selected");
    }
    if (totalDebit === 0 && totalCredit === 0) {
      errors.push("• Total amount cannot be zero");
    }
    if (totalDebit !== totalCredit) {
      errors.push("• Total debit and total credit must be equal");
    }
    if (isEditMode && !isDirty) {
      errors.push("• No changes detected to save");
    }
    errors.push(...tdsMappingErrors);
    return errors;
  }, [
    hasInvalidLine,
    totalDebit,
    totalCredit,
    isEditMode,
    isDirty,
    tdsMappingErrors,
  ]);

  const extractId = (v: string) =>
    Number(v.includes("_") ? v.split("_")[1] : v);

  const getTypeFromAccountId = (
    accountId: string,
  ): "Account" | "Contact" | "Tax" => {
    if (!accountId) return "Account";
    if (accountId.startsWith("contact_")) return "Contact";
    if (accountId.startsWith("tax_")) return "Tax";
    return "Account";
  };

  // Line Update
  const updateLine = (
    index: number,
    field: keyof JournalLine,
    value: string | number,
  ) => {
    if (isUncatJournal && index === 0) return;

    setLines((prev) => {
      const copy = [...prev];
      const line = { ...copy[index] };
      let newAmount: number | string = line.amount;

      // ----- DEBIT -----
      if (field === "debit") {
        const rounded =
          typeof value === "number" ? roundToTwoDecimals(value) : value;
        line.debit = rounded;
        line.credit = "0.00";
        line.amount = rounded;
        line.entryType = "DEBIT";
        newAmount = rounded;
      }

      // ----- CREDIT -----
      else if (field === "credit") {
        const rounded =
          typeof value === "number" ? roundToTwoDecimals(value) : value;
        line.credit = rounded;
        line.debit = "0.00";
        line.amount = rounded;
        line.entryType = "CREDIT";
        newAmount = rounded;
      }

      // ----- AMOUNT -----
      else if (field === "amount") {
        const rounded =
          typeof value === "number" ? roundToTwoDecimals(value) : value;
        line.amount = rounded;
        if (line.entryType === "DEBIT") line.debit = rounded;
        if (line.entryType === "CREDIT") line.credit = rounded;
        newAmount = rounded;
      }

      // ----- OTHER FIELDS -----
      else {
        line[field] = value as never;
      }

      // ----- FX Recalculation -----
      const rate = Number(line.fxRate ?? 1);
      if (line.fxRate !== null) {
        const baseAmount = Number(newAmount) || 0;
        const converted = roundToTwoDecimals(baseAmount * rate);
        line.convertedAmount = converted;
        line.convertedAmountInput = String(converted);
      }

      copy[index] = line;
      return copy;
    });
  };

  const updateLineContactMapping = (
    index: number,
    contactMapping: TdsContactMappingItem[],
  ) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], contactMapping };
      return copy;
    });
  };

  const shouldShowTooltip = isSubmitDisabled && submitErrors.length > 0;

  // Payload For Submit Handler
  const buildPayload = (): JournalFormData & {
    uncategorizedMappingData?: number[];
  } => {
    const journalCurrencyFxMapping: Record<string, number> = {};

    // helper to safely convert to number
    const toNumber = (val: any, fallback = 1): number => {
      const num = Number(val);
      return isNaN(num) ? fallback : num;
    };

    // Build FX mapping dynamically from rows
    lines.forEach((row) => {
      const currencyInfo = getCurrencyFromAccountId(row.accountId);
      const code = currencyInfo.code?.trim(); //  remove spaces

      if (code && row.fxRate !== undefined) {
        journalCurrencyFxMapping[code] = toNumber(row.fxRate); //  ensure number
      }
    });

    const payload: JournalFormData = {
      description: journalDescription,
      date: date1.format("YYYY-MM-DD"),
      transactionTypeName: "journal",
      journalCurrency: journalCurrency,

      journalAccounts: lines.map((l) => ({
        id: extractId(l.accountId),

        // always numbers
        fxRate: toNumber(l.fxRate),
        originalFxRate: toNumber(l.originalFxRate),

        type: getTypeFromAccountId(l.accountId),

        amountInAccountCurr:
          Number(l.convertedAmount) === 0
            ? Number(l.debit) > 0
              ? Number(l.debit)
              : Number(l.credit) > 0
                ? Number(l.credit)
                : 0
            : Number(l.convertedAmount),

        ...(l.entryType === "DEBIT"
          ? { debit: Number(l.debit) || 0 }
          : { credit: Number(l.credit) || 0 }),

        isFromAccount: l.entryType === "CREDIT",
      })),

      journalCurrencyFxMapping,
    };

    // Contact Mapping
    const contactMappingData: Record<string, string> = {};

    lines
      .filter((l) => isTdsAccountId(l.accountId) && l.contactMapping?.length)
      .forEach((l) => {
        (l.contactMapping ?? [])
          .filter((i) => i.contactId && i.amount)
          .forEach((i) => {
            const contactId = String(i.contactId.split("_")[1]);
            contactMappingData[contactId] = i.amount;
          });
      });

    if (Object.keys(contactMappingData).length > 0) {
      payload.contactMappingData = contactMappingData;
    }

    // Uncategorized Mapping
    if (isUncatJournal && unCatData) {
      payload.uncategorizedMappingData = [
        unCatData.currentAccountId,
        unCatData.uncatId,
      ];
    }

    return payload;
  };

  // ******************************
  //  EFFECTS
  // ******************************

  // Hydrate EDIT mode data
  useEffect(() => {
    if (!isEditMode && !duplicate) return;
    if (!isSuccess || !journalResponse?.data) return;
    isHydratingEditRef.current = true;
    const journalData = journalResponse.data;

    const prefixFromType = (t: string) =>
      t === "Contact" ? "contact" : t === "Tax" ? "tax" : "account";

    const hydratedLines: JournalLine[] = (
      journalData.journalAccounts ?? []
    ).map((acc: any) => {
      const isDebit = acc.debit > 0;
      const amount = acc.counterCurrencyAmount || "";
      const typePrefix = prefixFromType(acc.type ?? "Account");

      return {
        accountId: `${typePrefix}_${acc.id}`,
        entryType: isDebit ? "DEBIT" : "CREDIT",
        debit: isDebit ? amount : "",
        credit: !isDebit ? amount : "",
        amount,
        fxRate: acc.fxRate ?? 1,
        originalFxRate: acc.originalFxRate ?? acc.fxRate ?? 1,
        fxRateInput: String(acc.fxRate ?? 1),
        convertedAmount: acc.accountCurrencyAmount,
        convertedAmountInput: String(acc.accountCurrencyAmount),
        isFxEdited: acc.fxRate !== acc.originalFxRate,
      };
    });

    // Prefill TDS contact mapping from API tdsMapping (e.g. { "2": "100" })
    const tdsMapping = journalData.tdsMapping;
    if (
      tdsMapping &&
      typeof tdsMapping === "object" &&
      !Array.isArray(tdsMapping)
    ) {
      const contactMappingFromApi: TdsContactMappingItem[] = Object.entries(
        tdsMapping,
      ).map(([contactId, amount]) => ({
        contactId: `contact_${contactId}`,
        amount: String(amount ?? ""),
      }));
      const firstTaxIndex = hydratedLines.findIndex((l) =>
        l.accountId.startsWith("tax_"),
      );
      if (firstTaxIndex >= 0 && contactMappingFromApi.length > 0) {
        hydratedLines[firstTaxIndex] = {
          ...hydratedLines[firstTaxIndex],
          contactMapping: contactMappingFromApi,
        };
      }
    }

    setJournalDescription(journalData.description ?? "");
    setJournalCurrency(
      journalData.journalAccounts[0].counterCurrency ?? "₹ - INR",
    );
    setDate1(journalData.date ? dayjs(journalData.date) : dayjs());
    setLines(hydratedLines);
    setTimeout(() => {
      isHydratingEditRef.current = false;
    }, 0);
    const linesForSnapshot = hydratedLines.map((l) => ({
      ...l,

      contactMapping: l.contactMapping ?? [],
    }));
    const snapshot = JSON.stringify({
      description: journalData.description ?? "",
      date: dayjs(journalData.date).format("YYYY-MM-DD"),
      lines: linesForSnapshot,
    });

    setInitialSnapshot(snapshot);
    setIsDataReady(true);
  }, [isEditMode, isSuccess, journalResponse]);

  // Initialize based on edit mode

  useEffect(() => {
    if (!unCatData) return;

    setJournalDescription(unCatData.description || "");

    const isDebit = unCatData.moneyDirection === "out";
    const amount = unCatData.total ?? 0;

    setLines([
      {
        accountId: `account_${unCatData.currentAccountId}`,
        entryType: isDebit ? "DEBIT" : "CREDIT",
        debit: isDebit ? amount : "0.00",
        credit: !isDebit ? amount : "0.00",
        amount,
        fxRate: 1,
      },
      {
        accountId: "",
        entryType: isDebit ? "CREDIT" : "DEBIT",
        debit: "",
        credit: "",
        amount: "",
        fxRate: 1,
      },
    ]);
  }, [unCatData]);

  // Hydrate data in edit mode

  useEffect(() => {
    if (isEditMode) {
      setIsDataReady(false);
      refetch();
    } else {
      setIsDataReady(true);
    }
  }, [isEditMode, selectedRow?.id]);

  const contactOptions = useMemo(
    () =>
      (contactsData?.data || []).map((c: any) => ({
        value: `contact_${c.id}`,
        label: c.name,
      })),
    [contactsData],
  );

  // handleFileChange method
  const handleFileChange = (files: File | File[] | null) => {
    if (!files) {
      setAttachments([]);
      return;
    }

    setAttachments(Array.isArray(files) ? files : [files]);
  };
  // handleDelete method
  const handleDelete = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // handleSubmit method
  const handleSubmit = () => {
    if (isSubmitDisabled) {
      setErrors("Please fix journal entries before submitting");
      return;
    }

    const payload = buildPayload();
    const isEdit = isEditMode && !duplicate;

    const mutation = isEdit
      ? updateJournal({ id: String(selectedRow?.id || 0), data: payload })
      : createJournal(payload);

    mutation
      .unwrap()
      .then((response: any) => {
        const transactionId = String(
          response.data?.transactionTypeId || selectedRow?.id || "",
        );

        setHighlightedRow?.({
          key: "id",
          value: transactionId,
          type: isEdit ? "edit" : "add",
        });

        if (showSnackBar)
          showSnackBar(
            `Journal ${isEdit ? "updated" : "created"} successfully`,
            "success",
          );

        const meta: RefetchMetaDataTransactTable = {
          newTransactionId: transactionId,
          newTransactionName: "journal",
          newPaymentId: null,
        };

        if (attachments.length > 0) {
          uploadAttachments({
            files: attachments,
            transactionTypeId: transactionId,
            transactionTypeName: "journal",
            paymentId: response.data?.paymentId,
          })
            .unwrap()
            .finally(() => {
              onSuccess?.(meta);
              if (isUncatJournal)
                navigate(
                  `/books/transact/home?tab=transact&highlightId=${transactionId}&transactionType=journal`,
                );
              refetchTransactCount?.();
              handleReset();
            });
        } else {
          onSuccess?.(meta);
          if (isUncatJournal)
            navigate(
              `/books/transact/home?tab=transact&highlightId=${transactionId}&transactionType=journal`,
            );
          refetchTransactCount?.();
          handleReset();
        }
      })
      .catch((err: any) => {
        if (showSnackBar)
          showSnackBar(err?.data?.message || "Failed to save journal", "error");
      });
  };

  // handleReset method
  const handleReset = () => {
    setJournalDescription("");
    setDate1(dayjs());
    setLines([
      {
        accountId: "",
        entryType: "DEBIT",
        debit: "",
        credit: "",
        amount: "",
        fxRate: 1,
      },
    ]);
    setAttachments([]);
    onClose?.();
  };

  // handleBaseAmount Change Method
  const handleBaseAmountChange = (index: number, baseAmount: number) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        if (!l.fxRate) return l;

        //  Base amount = debit OR credit
        const actualBase = baseAmount;

        const converted = roundToTwoDecimals(actualBase * l.fxRate);

        return {
          ...l,
          convertedAmount: converted,
          convertedAmountInput: String(converted),
        };
      }),
    );
  };

  // FX refresh on date / currency change
  useEffect(() => {
    if (!date1) return;
    if (isHydratingEditRef.current) return;
    // if (isEditMode && isHydratingEditRef.current) return;
    const baseCurrency = journalCurrency.split(" - ")[1]?.trim().toUpperCase();
    if (!baseCurrency) return;

    const uniqueCurrencies = [
      ...new Set(
        lines
          .map((l) => getCurrencyFromAccountId(l.accountId).code)
          .filter(Boolean),
      ),
    ];

    uniqueCurrencies.forEach((currency) => {
      fetchFxForCurrency(currency);
    });
  }, [date1, journalCurrency]);

  // this useEffect Hook is for unCatData
  useEffect(() => {
    if (!unCatData) return;
    setJournalDescription(unCatData.description || "");

    // Set journal currency from uncategorized account
    if (unCatData.accountCurrencyData) {
      setJournalCurrency(unCatData.accountCurrencyData);
      // example format: "₹ - INR"
    }

    const isDebit = unCatData.moneyDirection === "out";
    const amount = unCatData.total ?? 0;

    const firstLine: JournalLine = {
      accountId: `account_${unCatData.currentAccountId}`,
      entryType: isDebit ? "DEBIT" : "CREDIT",
      debit: isDebit ? amount : 0.0,
      credit: !isDebit ? amount : 0.0,
      amount,
      fxRate: null,
      originalFxRate: null,
      fxRateInput: "",
      convertedAmount: 0,
      convertedAmountInput: "",
      isFxEdited: false,
    };

    const secondLine: JournalLine = {
      accountId: "",
      entryType: isDebit ? "CREDIT" : "DEBIT",
      debit: "",
      credit: "",
      amount: "",
      fxRate: null,
      originalFxRate: null,
      fxRateInput: "",
      convertedAmount: 0,
      convertedAmountInput: "",
      isFxEdited: false,
    };

    setLines([firstLine, secondLine]);
  }, [unCatData]);

  // Hydrate data in edit mode
  useEffect(() => {
    if (!isEditMode && !duplicate) return;
    if (!isSuccess || !journalResponse?.data) return;

    isHydratingEditRef.current = true;
    const journalData = journalResponse.data;

    const prefixFromType = (t: string) =>
      t === "Contact" ? "contact" : t === "Tax" ? "tax" : "account";

    const hydratedLines: JournalLine[] = (
      journalData.journalAccounts ?? []
    ).map((acc: any) => {
      const isDebit = acc.debit > 0;
      const amount = acc.counterCurrencyAmount || "";
      const typePrefix = prefixFromType(acc.type ?? "Account");

      return {
        accountId: `${typePrefix}_${acc.id}`,
        entryType: isDebit ? "DEBIT" : "CREDIT",
        debit: isDebit ? amount : "0.00",
        credit: !isDebit ? amount : "0.00",
        amount,
        fxRate: acc.counterExchangeRate ?? 1,
        originalFxRate: acc.counterOriginalExchangeRate ?? 1,
        fxRateInput: String(acc.counterExchangeRate ?? 1),
        convertedAmount: acc.accountCurrencyAmount,
        convertedAmountInput: String(acc.accountCurrencyAmount),
        isFxEdited: acc.counterExchangeRate !== acc.counterOriginalExchangeRate,
      };
    });

    //  Hydrate FX cache
    const baseCurrency = journalData.journalAccounts[0].counterCurrency
      ?.split(" - ")[1]
      ?.trim()
      .toUpperCase();

    const formattedDate = dayjs(journalData.date).format("YYYY-MM-DD");

    const newFxRates: Record<string, { rate: number; originalRate: number }> =
      {};

    hydratedLines.forEach((line) => {
      const currencyInfo = getCurrencyFromAccountId(line.accountId);
      const toCurrency = currencyInfo.code?.trim().toUpperCase();

      if (!toCurrency || !baseCurrency) return;

      const key = `${baseCurrency}_${toCurrency}_${formattedDate}`;

      // avoid overwriting same currency multiple times
      if (!newFxRates[key]) {
        newFxRates[key] = {
          rate: Number(line.fxRate ?? 1),
          originalRate: Number(line.originalFxRate ?? 1),
        };
      }
    });

    setFxRates(newFxRates);

    // Prefill TDS contact mapping
    const tdsMapping = journalData.tdsMapping;
    if (
      tdsMapping &&
      typeof tdsMapping === "object" &&
      !Array.isArray(tdsMapping)
    ) {
      const contactMappingFromApi: TdsContactMappingItem[] = Object.entries(
        tdsMapping,
      ).map(([contactId, amount]) => ({
        contactId: `contact_${contactId}`,
        amount: String(amount ?? ""),
      }));

      const firstTaxIndex = hydratedLines.findIndex((l) =>
        l.accountId.startsWith("tax_"),
      );

      if (firstTaxIndex >= 0 && contactMappingFromApi.length > 0) {
        hydratedLines[firstTaxIndex] = {
          ...hydratedLines[firstTaxIndex],
          contactMapping: contactMappingFromApi,
        };
      }
    }

    setJournalDescription(journalData.description ?? "");
    setJournalCurrency(
      journalData.journalAccounts[0].counterCurrency ?? "₹ - INR",
    );
    setDate1(journalData.date ? dayjs(journalData.date) : dayjs());

    setLines(hydratedLines);

    setTimeout(() => {
      isHydratingEditRef.current = false;
    }, 0);

    const linesForSnapshot = hydratedLines.map((l) => ({
      ...l,
      contactMapping: l.contactMapping ?? [],
    }));

    const snapshot = JSON.stringify({
      description: journalData.description ?? "",
      date: dayjs(journalData.date).format("YYYY-MM-DD"),
      lines: linesForSnapshot,
    });

    setInitialSnapshot(snapshot);
    setIsDataReady(true);
  }, [isEditMode, isSuccess, journalResponse]);

  useEffect(() => {
    if (isEditMode) {
      setIsDataReady(false);
      refetch();
    } else {
      setIsDataReady(true);
    }
  }, [isEditMode, selectedRow?.id]);

  // ******************************
  // LOADING STATE (EDIT MODE)
  // ******************************
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Date & Currency */}
      <Stack direction={"row"} gap={2}>
        <DatePickerElement
          label="Date"
          disabled={isUncatJournal}
          value={date1}
          onChange={(val) => setDate1(val!)}
          min={
            dateRangeData?.data?.openingBalanceExists
              ? dayjs(dateRangeData?.data.minDate)
              : null
          }
          required
        />
        <SingleSelectElement
          label="Journal Currency"
          value={journalCurrency}
          onChange={(val) => setJournalCurrency(val)}
          options={currencyData.map((item) => ({
            label: `${item.symbol} - ${item.cc} - ${item.name}`,
            value: `${item.symbol} - ${item.cc}`,
          }))}
          sx={{ flex: 1 }}
          disabled={isUncatJournal}
        />
      </Stack>

      {/* Description */}
      <TextFieldElement
        label="Description"
        value={journalDescription}
        fullWidth
        onChange={(e) => setJournalDescription(e.target.value)}
      />

      <Divider />

      {/* Journal Lines */}
      <RepeaterElement
        label="Add Transaction"
        items={lines}
        setItems={setLines}
        initialItem={{
          accountId: "",
          entryType: "CREDIT",
          debit: "0.00",
          credit: "0.00",
          fxRate: null,
          originalFxRate: null,
          fxRateInput: "",
          convertedAmount: 0,
          convertedAmountInput: "",
        }}
        canDeleteItem={(index) => !(isUncatJournal && index === 0)}
        renderItem={(item, index) => {
          const isLockedFirstRow = isUncatJournal && index === 0;
          const toCurrencyInfo = getCurrencyFromAccountId(item.accountId);

          const fromCurrency = journalCurrency
            .split(" - ")[1]
            ?.trim()
            .toUpperCase();

          const currency = toCurrencyInfo.code?.trim().toUpperCase();

          const showFX =
            item.accountId &&
            currency &&
            fromCurrency &&
            fromCurrency !== currency;

          // show for ALL rows of same currency
          const showRestoreIcon = currency && isCurrencyFxEdited(currency);

          const selectedInOtherRows = new Set(
            lines
              .map((line, i) => (i === index ? "" : line.accountId))
              .filter(Boolean),
          );

          const accountOptionsForRow = allAccountOptions.map((group) => ({
            label: group.label,
            options: (group.options || []).filter(
              (opt) =>
                !selectedInOtherRows.has(opt.value) ||
                opt.value === item.accountId,
            ),
          }));

          const selectedAccount = (() => {
            const val = item.accountId;
            if (!val) return null;
            const [type, id] = val.split("_");
            if (type === "account")
              return accountsData?.data.find((a: any) => a.id === Number(id));
            if (type === "contact")
              return contactsData?.data.find((c: any) => c.id === Number(id));
            if (type === "tax")
              return taxesData?.data.find((t: any) => t.id === Number(id));
            return null;
          })();

          return (
            <Stack
              direction="row"
              gap={2}
              alignItems="center"
              flexWrap="wrap"
              paddingY={1}
              key={index}
            >
              {/* Account */}
              <SingleSelectElement
                required
                label="Account"
                value={item.accountId}
                disabled={isLockedFirstRow}
                onChange={(val) => {
                  updateLine(index, "accountId", val);

                  const currencyInfo = getCurrencyFromAccountId(val);
                  const targetCurrency = currencyInfo.code
                    ?.trim()
                    .toUpperCase();
                  const baseCurrency = journalCurrency
                    .split(" - ")[1]
                    ?.trim()
                    .toUpperCase();

                  if (targetCurrency && targetCurrency !== baseCurrency) {
                    fetchFxForCurrency(targetCurrency);
                  }
                }}
                options={accountOptionsForRow}
                sx={{ flex: 1, minWidth: 200 }}
              />

              {/* Account Type Chip */}
              <Box
                sx={{ width: 110, display: "flex", justifyContent: "center" }}
              >
                {selectedAccount && (
                  <Chip
                    label={
                      "accountType" in selectedAccount
                        ? selectedAccount.accountType
                        : "name" in selectedAccount
                          ? "Contact"
                          : "Tax"
                    }
                    color="info"
                    size="small"
                    sx={{ width: "100%" }}
                  />
                )}
              </Box>

              {/* Debit */}
              <TextFieldElement
                label="Debit"
                disabled={isLockedFirstRow}
                value={formatNumberForTyping(
                  String(item.debit),
                  commaseperation,
                )}
                sx={{ flex: 0.7 }}
                onChange={(e) => {
                  const raw = parseNumberForTyping(e.target.value);
                  const parsed = parseFloat(raw);

                  setLines((prev) =>
                    prev.map((l, i) =>
                      i === index
                        ? {
                            ...l,
                            debit: raw,
                            credit: "0.00",
                            amount: !isNaN(parsed) ? parsed : raw,
                            entryType: "DEBIT",
                          }
                        : l,
                    ),
                  );

                  if (!isNaN(parsed)) handleBaseAmountChange(index, parsed);
                }}
                slotProps={{
                  htmlInput: {
                    style: { textAlign: "right" },
                  },
                  input: {
                    startAdornment: selectedAccount && (
                      <InputAdornment position="start">
                        <Stack direction="row" alignItems="center" gap={1}>
                          {["asset", "expense"].includes(
                            selectedAccount.accountType?.toLowerCase(),
                          ) ? (
                            <ArrowUpward
                              sx={{ fontSize: 20 }}
                              color="success"
                            />
                          ) : (
                            <ArrowDownward
                              sx={{ fontSize: 20 }}
                              color="error"
                            />
                          )}
                        </Stack>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Credit */}
              <TextFieldElement
                label="Credit"
                disabled={isLockedFirstRow}
                value={formatNumberForTyping(
                  String(item.credit),
                  commaseperation,
                )}
                sx={{ flex: 0.7 }}
                onChange={(e) => {
                  const raw = parseNumberForTyping(e.target.value);
                  const parsed = parseFloat(raw);

                  setLines((prev) =>
                    prev.map((l, i) =>
                      i === index
                        ? {
                            ...l,
                            credit: raw,
                            debit: "0.00",
                            amount: !isNaN(parsed) ? parsed : raw,
                            entryType: "CREDIT",
                          }
                        : l,
                    ),
                  );

                  if (!isNaN(parsed)) handleBaseAmountChange(index, parsed);
                }}
                slotProps={{
                  htmlInput: {
                    style: { textAlign: "right" },
                  },
                  input: {
                    startAdornment: selectedAccount && (
                      <InputAdornment position="start">
                        <Stack direction="row" alignItems="center" gap={1}>
                          {["asset", "expense"].includes(
                            selectedAccount.accountType?.toLowerCase(),
                          ) ? (
                            <ArrowDownward
                              sx={{ fontSize: 20 }}
                              color="error"
                            />
                          ) : (
                            <ArrowUpward
                              sx={{ fontSize: 20 }}
                              color="success"
                            />
                          )}
                        </Stack>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Converted Amount */}
              {!showFX ? (
                <TextFieldElement
                  label="Converted Amount"
                  value="N/A"
                  disabled
                  sx={{ flex: 0.8 }}
                />
              ) : (
                <TextFieldElement
                  label="Converted Amount"
                  value={formatNumberForTyping(
                    item.convertedAmountInput ?? "",
                    commaseperation,
                  )}
                  sx={{ flex: 0.8 }}
                  onChange={(e) => {
                    const raw = parseNumberForTyping(e.target.value);
                    setLines((prev) =>
                      prev.map((l, i) =>
                        i === index ? { ...l, convertedAmountInput: raw } : l,
                      ),
                    );
                  }}
                  onBlur={() => {
                    const parsed = parseFloat(item.convertedAmountInput ?? "");
                    const baseAmount = Number(item.debit || item.credit || 0);

                    if (isNaN(parsed) || baseAmount <= 0) return;
                    if (parsed === Number(item.convertedAmount)) return;

                    const recalculatedRate = parsed / baseAmount;

                    applyFxToCurrency(
                      toCurrencyInfo.code,
                      recalculatedRate,
                      item.originalFxRate ?? recalculatedRate,
                    );
                  }}
                />
              )}

              {/* FX Rate */}
              {!showFX ? (
                <TextFieldElement
                  label="FX Rate"
                  value="N/A"
                  disabled
                  sx={{ flex: 0.5 }}
                />
              ) : (
                <TextFieldElement
                  label="FX Rate"
                  value={item.fxRateInput ?? ""}
                  sx={{ flex: 0.5 }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setLines((prev) =>
                      prev.map((l, i) =>
                        i === index ? { ...l, fxRateInput: raw } : l,
                      ),
                    );
                  }}
                  onBlur={() => {
                    const parsed = parseFloat(item.fxRateInput ?? "");
                    if (!isNaN(parsed)) {
                      applyFxToCurrency(
                        toCurrencyInfo.code,
                        parsed,
                        item.originalFxRate ?? parsed,
                      );
                    }
                  }}
                />
              )}

              {/*  Restore FX */}
              <Box
                sx={{ width: 40, display: "flex", justifyContent: "center" }}
              >
                {showRestoreIcon && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      const baseCurrency = journalCurrency
                        .split(" - ")[1]
                        ?.trim()
                        .toUpperCase();
                      const formattedDate = date1.format("YYYY-MM-DD");

                      const key = `${baseCurrency}_${currency}_${formattedDate}`;
                      const fx = fxRates[key];

                      if (!fx) return;

                      applyFxToCurrency(
                        currency,
                        fx.originalRate,
                        fx.originalRate,
                      );
                    }}
                  >
                    <RestoreIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Stack>
          );
        }}
      />

      {/* Totals — layout mirrors journal line rows for column alignment */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          px: 2,
          py: 2,
          backgroundColor: "action.hover",
          borderRadius: 1,
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            gap: 2,
            alignItems: "center",
            width: "100%",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Total Debit/Credit
            </Typography>
          </Box>

          <Box sx={{ width: 110 }} />

          <Box sx={{ flex: 0.7, textAlign: "right" }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color:
                  totalDebit === totalCredit && totalDebit > 0
                    ? "success.main"
                    : "error.main",
              }}
            >
              {formatCurrencyByCommaSeparation(
                totalDebit.toFixed(2),
                commaseperation,
                journalCurrencySymbol,
              )}
            </Typography>
          </Box>

          <Box sx={{ flex: 0.7, textAlign: "right" }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color:
                  totalDebit === totalCredit && totalCredit > 0
                    ? "success.main"
                    : "error.main",
              }}
            >
              {formatCurrencyByCommaSeparation(
                totalCredit.toFixed(2),
                commaseperation,
                journalCurrencySymbol,
              )}
            </Typography>
          </Box>

          <Box sx={{ flex: 0.8 }} />
          <Box sx={{ flex: 0.5 }} />
          <Box sx={{ width: 40 }} />
        </Box>

        {/* Spacer for delete button column in journal rows */}
        <Box sx={{ width: 40, flexShrink: 0 }} />
      </Stack>

      {/* ── TDS Contact Mapping Section ── */}
      {hasTdsLines && (
        <Box
          sx={{
            border: "1.5px solid",
            borderColor: hasTdsMappingError ? "warning.main" : "primary.light",
            borderRadius: 2,
            overflow: "hidden",
            transition: "border-color 0.2s",
          }}
        >
          {/* Header */}
          <Box
            onClick={() => setTdsExpanded((v) => !v)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2.5,
              py: 1.25,
              cursor: "pointer",
              userSelect: "none",
              background: (theme) =>
                hasTdsMappingError
                  ? theme.palette.warning.light + "22"
                  : theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(25, 118, 210, 0.06)",
              borderBottom: tdsExpanded ? "1px solid" : "none",
              borderColor: hasTdsMappingError
                ? "warning.light"
                : "primary.light",
              transition: "background 0.2s",
              "&:hover": {
                background: (theme) =>
                  hasTdsMappingError
                    ? theme.palette.warning.light + "33"
                    : theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(25, 118, 210, 0.1)",
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: hasTdsMappingError ? "warning.dark" : "primary.main",
                  letterSpacing: 0.4,
                }}
              >
                TDS Contact Mapping
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1.5}>
              {/* Per-row balance status indicators */}
              {tdsLines.map(({ line, index }) => {
                const mappingSum = (line.contactMapping ?? []).reduce(
                  (sum, i) => sum + (parseFloat(i.amount) || 0),
                  0,
                );
                const rowAmount = Number(line.amount) || 0;
                const hasMapping = (line.contactMapping ?? []).length > 0;
                const isBalanced =
                  hasMapping && Math.abs(mappingSum - rowAmount) < 0.01;

                return (
                  <Tooltip
                    key={index}
                    title={
                      isBalanced
                        ? `Row ${index + 1}: Balanced ✓`
                        : hasMapping
                          ? `Row ${index + 1}: ${formatNumberByCommaSeparation(mappingSum, commaseperation)} / ${formatNumberByCommaSeparation(rowAmount, commaseperation)}`
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

              <IconButton size="small" sx={{ ml: 0.5 }}>
                {tdsExpanded ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </IconButton>
            </Stack>
          </Box>

          {/* Body */}
          {tdsExpanded && (
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
              {tdsLines.map(({ line, index }, tdsIdx) => {
                const mappingSum = (line.contactMapping ?? []).reduce(
                  (sum, i) => sum + (parseFloat(i.amount) || 0),
                  0,
                );
                const rowAmount = Number(line.amount) || 0;
                const hasMapping = (line.contactMapping ?? []).length > 0;
                const isBalanced =
                  hasMapping && Math.abs(mappingSum - rowAmount) < 0.01;

                return (
                  <Box
                    key={index}
                    sx={{
                      mb: tdsIdx < tdsLines.length - 1 ? 3 : 0,
                      pb: tdsIdx < tdsLines.length - 1 ? 3 : 0,
                      borderBottom:
                        tdsIdx < tdsLines.length - 1 ? "1px dashed" : "none",
                      borderColor: "divider",
                    }}
                  >
                    {/* Same row as repeater label: "Add Contact" + Add on left, Row Amount + Mapped on right */}
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
                          icon={<AddIcon />}
                          variant="outlined"
                          onClick={() =>
                            updateLineContactMapping(index, [
                              ...(line.contactMapping ?? []),
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
                            commaseperation,
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
                                commaseperation,
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

                    {/* Contact mapping repeater (no label row - we use custom row above) */}
                    <RepeaterElement
                      label=""
                      items={line.contactMapping ?? []}
                      setItems={(value) => {
                        const newItems =
                          typeof value === "function"
                            ? value(line.contactMapping ?? [])
                            : value;
                        updateLineContactMapping(index, newItems);
                      }}
                      initialItem={{ contactId: "", amount: "" }}
                      renderItem={(subItem, subIndex, onChange) => {
                        const mapping = line.contactMapping ?? [];
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
                            sx={{
                              width: "100%",
                              px: 1.5,
                            }}
                          >
                            {/* Index badge */}
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
                                commaseperation,
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
                                        {journalCurrency.split(" ")[0]}
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

      <Divider />

      {/* Attachments - Hide in Edit Mode */}
      {!isEditMode && (
        <Stack spacing={2}>
          <FileUploadField
            label="Attachments"
            value={attachments} // current selected files
            maxFiles={10} // max number of files allowed
            maxSize={5} // max size per file in MB
            accept={[
              "image/jpeg",
              "image/png",
              "image/webp",
              "application/pdf",
            ]} // allowed types
            onChange={handleFileChange} // updates state
          />

          {attachments.length > 0 && (
            <Stack spacing={1}>
              {attachments.map((file, index) => (
                <Stack
                  key={`${file.name}-${index}`}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    p: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2">{file.name}</Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(index)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {/* Submit */}
      <Box display="flex" justifyContent="flex-end">
        {shouldShowTooltip ? (
          <Tooltip
            title={
              <Stack spacing={0.5}>
                {submitErrors.map((err, index) => (
                  <Typography key={index} variant="inherit" display="block">
                    {err}
                  </Typography>
                ))}
              </Stack>
            }
          >
            <span>
              <PrimaryButton disabled onClick={handleSubmit}>
                {isSaving ? "Saving..." : "Save"}
              </PrimaryButton>
            </span>
          </Tooltip>
        ) : (
          <PrimaryButton disabled={isSubmitDisabled} onClick={handleSubmit}>
            {isSaving ? "Saving..." : "Save"}
          </PrimaryButton>
        )}
      </Box>

      {error && <Snackbar message={error} onClose={() => setErrors(null)} />}
    </Box>
  );
}

export default AdvanceJournal;
