import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  type SetStateAction,
  useCallback,
  useLayoutEffect,
} from "react";
import { Box, CircularProgress, IconButton } from "@mui/material";
import MenuAtom, {
  type MenuAtomItem,
} from "../../../../../components/menuatom/MenuAtom";
import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import { formatCurrencyByCommaSeparation } from "../../../../../utils/numberFormatter";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import {
  useDeleteJournalMutation,
  useGetJournalByIdQuery,
  useLazyGetTransactDataQuery,
  useLazyGetAllInvoicesQuery,
  useLazyGetAllBillsQuery,
  useDownloadInvoiceMutation,
  useLazyGetAttachmentCountQuery,
} from "../api/transact.api";
import {
  useGetBillByIdPreviewQuery,
  useGetBillPaymentsQuery,
} from "../../api/bill.api";
import {
  useGetAllPaymentsQuery,
  useGetInvoiceByIdPreviewQuery,
} from "../../api/invoice.api";
import { Transfer } from "./dialogs/Transfer";
import AdvanceJournal from "./dialogs/AdvanceJournal";
import AttachmentsModal from "./dialogs/AttachmentsModal";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import ReceivePayment from "../../Payments/components/ReceivePayment";
import MakePayment from "../../Payments/components/MakePayment";
import BillModal from "../../modals/BillModal";
import InvoiceModal from "../../modals/InvoiceModal";
import { TransactionTableColumns } from "./columns/TransactColumns";
import { OtherAccountColumns } from "./columns/OthersAccountColumn";
import { BillTableColumns } from "./columns/BillsColumns";
import { InvoiceTableColumns } from "./columns/InvoiceColumns";
import ViewInvoiceBill from "./dialogs/ViewInvoiceBill";
import ViewAdvanceJournal from "./dialogs/ViewAdvanceJournal";
import { PaymentDetailsCard } from "./dialogs/PaymentDetailsCard";
import type {
  DetailedJournalData,
  RefetchMetaDataTransactTable,
} from "../types/transact.types";
import { resetInvoiceForm } from "../../slice/InvoiceOrBillSlice";
import { useAppDispatch } from "../../../../../store/store";
import { DenseTableAtom } from "../../../../../components/tables/standard-table/DenseTableAtom";
import type { HighlightedRow } from "../../../../../types/types";
import { debounce } from "lodash-es";

type QueryParams = {
  fromDate?: string;
  toDate?: string;
  selectedTransactionType?: string[];
  limit?: number;
  accountType?: string;
  accountId?: number;
};
type ScrollMode = "UP_ONLY" | "BOTH";
import { ContentCopy, Edit, Delete } from "@mui/icons-material";
import { Tooltip } from "../../../../../components/atom/tooltip";
import type {
  BillPreviewResponse,
  InvoicePreviewResponse,
} from "../../utils/types";
import { setTransactCount } from "../../slice/transcatSlice";
import { usePermission } from "../../../../../context/PermissionContext";

export const TransactTable = ({
  highlightedRow,
  setHighlightedRow,

  filters = {
    fromDate: undefined,
    toDate: undefined,
    selectedTransactionType: [],
    accountType: "all",
    accountId: undefined,
    selectedAccount: "all_accounts",
    taxIdFilter: [],
    contactIdFilter: [],
  },
  showSnackBar,
  onRefetchRequest,
  scrollAfterAction,
  setScrollAfterAction,

}: {
  highlightedRow: HighlightedRow;
  setHighlightedRow: React.Dispatch<SetStateAction<HighlightedRow>>;
  filters?: {
    fromDate?: string;
    toDate?: string;
    selectedTransactionType?: string[];
    accountType?: string;
    accountId?: number;
    selectedAccount?: string;
    taxIdFilter?: string[];
    contactIdFilter?: string[];
  };
  scrollAfterAction?: boolean;
  setScrollAfterAction?: React.Dispatch<React.SetStateAction<boolean>>;
  submittedFilters?: boolean;
  showSnackBar: (message: string, color: "success" | "error") => void;
  onRefetchRequest?: (
    refetchFn: (meta?: RefetchMetaDataTransactTable) => void,
  ) => void;


}) => {
  const requestIdRef = useRef(0);
  const dispatch = useAppDispatch();
  const { permissions } = usePermission();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [selectedRowForFetch, setSelectedRowForFetch] = useState<any>(null);
  const [selectedRowForInvoice, setSelectedRowForInvoice] = useState<any>(null);
  const [selectedRowForBill, setSelectedRowForBill] = useState<any>(null);
  const [allRows, setAllRows] = useState<any[]>([]);

  const [cursorUp, setCursorUp] = useState<string | undefined>();
  const [cursorDown, setCursorDown] = useState<string | undefined>();
  const [scrollMode, setScrollMode] = useState<ScrollMode>("UP_ONLY");
  const [scrollAfterActionInternal, setScrollAfterActionInternal] =
    useState(false);

  const [addJournalOpen, setAddJournalOpen] = useState(false);
  const [advJournalOpen, setAdvJournalOpen] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [selectedRowForAttachments, setSelectedRowForAttachments] =
    useState<any>(null);
  const [isEditMakePayment, setIsEditMakePayment] = useState(false);
  const [isEditReceivePayment, setIsEditReceivePayment] = useState(false);
  const [openMakePayment, setOpenMakePayment] = useState(false);
  const [openRecievePayment, setOpenRecievePayment] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState(false);
  const [viewAdvanceJournal, setViewAdvanceJournal] = useState(false);
  const [journalData, setJournalData] = useState<DetailedJournalData | null>(
    null,
  );

  const [duplicate, setDuplicate] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<any>(null);
  const [attachmentCountOverrides, setAttachmentCountOverrides] = useState<
    Record<string, number>
  >({});
  const [_dataForInvoice] = useState<
    InvoicePreviewResponse | BillPreviewResponse | null
  >(null);
  const [_paymentsForInvoice] = useState<any>();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const refetchMetaRef = useRef<RefetchMetaDataTransactTable | null>(null);

  const { data: headerData } = useGetHeaderDataQuery();

  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const currency = headerData?.data?.reportingCurrency?.split(" - ")[0] || "";

  const [attachmentQueryParams, setAttachmentQueryParams] = useState<{
    transactionTypeId: string;
    transactionTypeName: string;
    paymentId?: string;
  } | null>(null);

  // Track if current fetch is a background refetch
  const isBackgroundRefetchRef = useRef(false);
  // Track if we've done the initial load
  const hasInitialLoadRef = useRef(false);
  const isFetchingUpRef = useRef(false);
  const isFetchingDownRef = useRef(false);
  const didInitialScrollRef = useRef(false);

  const [refetchAttachmentCount] = useLazyGetAttachmentCountQuery();

  const shouldFetchInvoice =
    !!selectedRow?.id &&
    (selectedRow?.type === "invoice" ||
      filters.selectedAccount === "all_invoices");

  const shouldFetchBill =
    !!selectedRow?.id &&
    (selectedRow?.type === "bill" || filters.selectedAccount === "all_bills");

  const getAttachmentKey = (
    transactionTypeId: string,
    paymentId?: string | "",
  ) => `${transactionTypeId}_${paymentId ?? "root"}`;

  const { data: invoices } = useGetAllPaymentsQuery(
    filters.selectedAccount === "all_invoices"
      ? selectedRow?.transactionTypeId
      : selectedRow?.id,
    {
      skip: !shouldFetchInvoice,
    },
  );

  const { data: bills } = useGetBillPaymentsQuery(
    filters.selectedAccount === "all_bills"
      ? selectedRow?.transactionTypeId
      : selectedRow?.id,
    {
      skip: !shouldFetchBill,
    },
  );

  const { data: invoiceData, isFetching: invoiceLoading } = useGetInvoiceByIdPreviewQuery(
    selectedRow?.transactionTypeId || selectedRow?.id!,
    {
      skip: !shouldFetchInvoice,
    },
  );
  const { data: billData, isFetching: billLoading } = useGetBillByIdPreviewQuery(
    selectedRow?.transactionTypeId || selectedRow?.id!,
    {
      skip: !shouldFetchBill,
    },
  );

  const {
    data: journalResponse,
    isFetching,
    refetch: refetchJournal,
  } = useGetJournalByIdQuery(
    {
      id: selectedRowForFetch?.id || "",
      transactionTypeName:
        selectedRowForFetch?.type,
      ...(selectedRowForFetch?.type === "payroll_payment" && {
        paymentId: selectedRowForFetch?.paymentId,
      }),
    },
    {
      skip: !selectedRowForFetch?.id,
    },
  );

  const prevCompanyIdRef = useRef<string | undefined>(
    headerData?.data?.companyId,
  );
  const [downloadInvoice] = useDownloadInvoiceMutation();

  const [deleteJournal] = useDeleteJournalMutation();

  const formatType = (type: string): string => {
    if (!type) return "-";
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const refetchData = (meta?: RefetchMetaDataTransactTable) => {
    refetchMetaRef.current = meta ?? null;

    // RESET PAGINATION STATE
    setAllRows([]);
    setCursorUp(undefined);
    setCursorDown(undefined);
    setScrollMode("UP_ONLY");

    isFetchingUpRef.current = false;
    isFetchingDownRef.current = false;

    isBackgroundRefetchRef.current = true;
    setRefetchTrigger((prev) => prev + 1);
  };

  // Helper function to format description column data in all accounts filter
  const getTransactionDescription = (item: any): string => {
    if (!item) return "";

    const type = item.transactionTypeName?.toLowerCase() || "";

    //  Updated field names
    const contactName =
      item.descContactName ||
      item.toAccount?.find((acc: any) => acc.type === "Contact")?.name ||
      "";

    const invoiceOrBillNo =
      item.descInvoiceNumber ||
      item.descBillNumber ||
      item.invoiceNo ||
      item.billNo ||
      "";

    const baseDescription = item.descNotes || "";

    // ---- Logic by transaction type ----
    if (type === "invoice" || type === "bill") {
      return `${invoiceOrBillNo} - ${contactName}`.trim();
    }

    if (type === "invoice_payment" || type === "bill_payment") {
      if (!invoiceOrBillNo) {
        return `${contactName} - ${baseDescription}`.trim();
      } else if (invoiceOrBillNo && !contactName) {
        return `${invoiceOrBillNo} - ${baseDescription}`.trim();
      } else if (invoiceOrBillNo && contactName && !baseDescription) {
        return `${invoiceOrBillNo} - ${contactName}`.trim();
      } else {
        return `${invoiceOrBillNo} - ${contactName} - ${baseDescription}`.trim();
      }
    }

    if (type === "transfer" || type === "journal") {
      return baseDescription.trim();
    }

    // Default fallback
    return baseDescription.trim();
  };

  /* Table Config (Dynamic table according to account type (all_account/(asset,liablility,contact,tax)/invoices/bills)) */
  const ACCOUNT_TABLE_CONFIG = {
    all_accounts: {
      useLazyQuery: useLazyGetTransactDataQuery,
      columns: TransactionTableColumns,
      mapRows: (data: any[]) =>
        data.map((item) => {
          const key = getAttachmentKey(item.transactionTypeId, item.paymentId);
          const baseRow = {
            id: item.transactionTypeId,
            transactionTypeId: item.transactionTypeId,
            paymentId: item.paymentId || null,
            date: item.date,
            type: item.transactionTypeName,
            fromAccounts: item.fromAccount || [],
            toAccounts: item.toAccount || [],
            description: getTransactionDescription(item),
            amount: item.journalBalance
              ? Number(item.journalBalance).toFixed(2)
              : "0.00",
            attachments:
              attachmentCountOverrides[key] ?? item.noOfAttachments ?? 0,
          };

          if (item.transactionTypeName === "invoice") {
            return {
              ...baseRow,
              invoicePaymentExists: Boolean(item.invoicePaymentExists),
              invoiceNo: item.invoiceNo || null,
            };
          }

          if (item.transactionTypeName === "bill") {
            return {
              ...baseRow,
              billPaymentExists: Boolean(item.billPaymentExists),
              billNo: item.billNo || null,
            };
          }

          return baseRow;
        }),
    },
    others: {
      useLazyQuery: useLazyGetTransactDataQuery,
      columns: OtherAccountColumns,
      mapRows: (data: any[]) =>
        data.map((item) => {
          const key = `${item.transactionTypeId}_${item.paymentId}`;

          const baseRow = {
            id: item.transactionTypeId,
            paymentId: item.paymentId || null,
            date: item.date,
            type: item.transactionTypeName,
            fromAccounts: item.fromAccount || [],
            toAccounts: item.toAccount || [],
            description: getTransactionDescription(item),
            debit: item.fcDebit || 0,
            credit: item.fcCredit || 0,
            balance: item.accountBalance || 0,
            attachments:
              attachmentCountOverrides[key] ?? item.noOfAttachments ?? 0,

            relatedAccounts: item.relatedAccounts || [],
          };

          if (item.transactionTypeName === "invoice") {
            return {
              ...baseRow,
              amount: item.amount || 0,
              invoicePaymentExists: Boolean(item.invoicePaymentExists),
              invoiceNo: item.invoiceNo || null,
            };
          }

          if (item.transactionTypeName === "bill") {
            return {
              ...baseRow,
              amount: item.amount || 0,
              billPaymentExists: Boolean(item.billPaymentExists),
              billNo: item.billNo || null,
            };
          }

          if (filters?.accountType === "contact") {
            return {
              ...baseRow,
              amount: item.amount || 0,
            };
          }

          return baseRow;
        }),
    },

    invoice: {
      useLazyQuery: useLazyGetAllInvoicesQuery,
      columns: InvoiceTableColumns,
      mapRows: (data: any[]) =>
        data.map((item) => ({
          id: item.id,
          transactionTypeId: item.transactionTypeId || "",
          invoiceDate: item.invoiceDate,
          invoiceDueDate: item.invoiceDueDate,
          serviceStartDate: item.serviceStartDate,
          serviceEndDate: item.serviceEndDate,
          invoiceNo: item.invoiceNo,
          invoiceCurrency: item.invoiceCurrency,
          notes: item.notes,
          contact: item.contact,
          invoiceTotal: Number(item.roundoffTotal || item.invoiceTotal || 0),
          balanceDue: Number(item.balanceDue || 0),
          totalReceived: Number(item.totalReceived || 0),
          items: item.items || [],
          noOfAttachments: item.noOfAttachments || 0,
          type: "all_invoices",
        })),
    },
    bill: {
      useLazyQuery: useLazyGetAllBillsQuery,
      columns: BillTableColumns,
      mapRows: (data: any[]) =>
        data.map((item) => ({
          id: item.id,
          transactionTypeId: item.transactionTypeId || "",
          billDate: item.billDate,
          billDueDate: item.billDueDate,
          serviceStartDate: item.serviceStartDate,
          serviceEndDate: item.serviceEndDate,
          billNo: item.billNo,
          billCurrency: item.billCurrency,
          notes: item.notes,
          contact: item.contact,
          billTotal: Number(item.roundoffTotal || item.billTotal || 0),
          balanceDue: Number(item.balanceDue || 0),
          totalPaid: Number(item.totalPaid || 0),
          hasTds: item.hasTds,
          isRoundOff: item.isRoundOff,
          items: item.items || [],
          noOfAttachments: item.noOfAttachments || 0,
          type: "all_bills",
        })),
    },
  } as const;

  // ------------------------- DYNAMIC TABLE SELECTION -------------------------
  const queryParams: QueryParams = useMemo(
    () => ({
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      selectedTransactionType: filters.selectedTransactionType,
      limit: 41,
      accountType: filters.accountType,
      accountId: filters.accountId,
      taxIdFilter: filters.taxIdFilter,
      contactIdFilter: filters.contactIdFilter,
    }),
    [filters],
  );

  const tableConfig = useMemo(() => {
    if (filters.selectedAccount === "all_invoices") {
      return ACCOUNT_TABLE_CONFIG.invoice;
    }
    if (filters.selectedAccount === "all_bills") {
      return ACCOUNT_TABLE_CONFIG.bill;
    }
    if (filters.selectedAccount === "all_accounts") {
      return ACCOUNT_TABLE_CONFIG.all_accounts;
    }
    if (
      filters.selectedAccount?.startsWith("tax_") ||
      filters.selectedAccount?.startsWith("contact_") ||
      filters.selectedAccount?.startsWith("account_")
    ) {
      return ACCOUNT_TABLE_CONFIG.others;
    }
    return ACCOUNT_TABLE_CONFIG.all_accounts;
  }, [filters.selectedAccount]);

  // ------------------------- LAZY QUERY FROM RTK -------------------------
  const { useLazyQuery, columns: tableColumns, mapRows } = tableConfig;
  const [triggerFetch, { isFetching: isFetchingTransactData }] = useLazyQuery();

  // ------------------------- TableSkeleton State -------------------------
  const isScrollFetch = isFetchingTransactData && hasInitialLoadRef.current;
  const isFetchingUp = isFetchingTransactData && isFetchingUpRef.current;
  const isFetchingDown = isFetchingTransactData && isFetchingDownRef.current;
  const isInitialLoad = !hasInitialLoadRef.current && isFetchingTransactData;
  const isUserScrollingRef = useRef(false); // tracks if user is actively scrolling
  const scrollUserTimeout = useRef<NodeJS.Timeout | null>(null); // debounce user scroll flag

  // ------------------------- SCROLL HANDLER -------------------------
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Track previous filter values to detect real filter changes
  const prevFiltersRef = useRef({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    selectedTransactionType: filters.selectedTransactionType,
    selectedAccount: filters.selectedAccount,
    accountType: filters.accountType,
    accountId: filters.accountId,
    taxIdFilter: filters.taxIdFilter,
    contactIdFilter: filters.contactIdFilter,
  });

  // ------------------------- FetchUp Method-------------------------
  const fetchUp = async () => {
    if (!cursorUp || isFetchingTransactData || isFetchingUpRef.current) return;

    isFetchingUpRef.current = true;

    try {
      const container = tableContainerRef.current;
      const prevHeight = container?.scrollHeight ?? 0;

      const res = await triggerFetch(
        { ...queryParams, prevCursor: cursorUp, meta: undefined },
        false,
      ).unwrap();

      setAllRows((prev) => [...prev, ...res.data]);
      setCursorUp(res.prevCursor || undefined);

      // Preserve scroll position after prepend
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop =
            container.scrollHeight - prevHeight + container.scrollTop;
        }
      });
    } finally {
      isFetchingUpRef.current = false;
    }
  };

  // ------------------------- FetchDown Method-------------------------
  const fetchDown = async () => {
    if (!cursorDown || isFetchingDownRef.current) return;
    isFetchingDownRef.current = true;
    const container = tableContainerRef.current;
    const prevScrollTop = container?.scrollTop ?? 0;
    try {
      const res = await triggerFetch(
        { ...queryParams, nextCursor: cursorDown },
        false,
      ).unwrap();

      setAllRows((prev) => [...res.data, ...prev]);

      requestAnimationFrame(() => {
        if (!container) return;
        container.scrollTop = prevScrollTop;
      });

      setCursorDown(res.nextCursor || undefined);
    } finally {
      isFetchingDownRef.current = false;
    }
  };

  // ------------------------- FORMAT ROWS -------------------------
  const formattedRows = mapRows(allRows).reverse();

  const handleDeleteAttachmentCount = async ({
    transactionTypeId,
    transactionTypeName,
    paymentId,
  }: {
    transactionTypeId: string;
    transactionTypeName: string;
    paymentId?: string;
  }) => {
    const params = { transactionTypeId, transactionTypeName, paymentId };
    setAttachmentQueryParams(params);

    try {
      const res = await refetchAttachmentCount(params).unwrap();
      const key = getAttachmentKey(transactionTypeId, paymentId);
      setAttachmentCountOverrides((prev) => ({
        ...prev,
        [key]: res?.data?.count ?? 0,
      }));
      // Do not close attachments modal here — keep it open after delete so user can continue managing attachments
    } catch (err: any) {
      showSnackBar(err?.data?.message, "error");
    }
  };

  // ------------------------- Handle Reverse Scroll Method -------------------------
  const handleScroll = useCallback(
    debounce(() => {
      const container = tableContainerRef.current;
      if (!container) return;

      // Ignore programmatic scrolls
      if (!isUserScrollingRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = container;

      // Stop if container is smaller than content
      if (scrollHeight <= clientHeight) return;

      // Trigger fetch only if exactly at top or bottom
      const atTop = scrollTop <= 200;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 5; // within 5px from bottom

      if (atTop && cursorUp && !isFetchingTransactData) {
        fetchUp();
      }

      if (atBottom && cursorDown) {
        fetchDown();
      }
    }, 250),

    [
      cursorUp,
      cursorDown,
      scrollMode,
      isFetchingTransactData,
      fetchUp,
      fetchDown,
    ],
  );

  const handleMenuOpen = (event: React.MouseEvent<Element>, row: any) => {
    setMenuAnchor(event.currentTarget as HTMLElement);
    setSelectedRow(row);
  };

  const handleMenuClose = () => setMenuAnchor(null);

  // ------------------------- EDIT OPTION IN MENU -------------------------
  const handleEditClick = () => {
    switch (selectedRow.type) {
      case "transfer":
        // setViewAdvanceJournal(false);
        setSelectedRowForFetch(selectedRow);
        setAddJournalOpen(true);
        break;
      case "invoice":
        if (selectedRow.invoicePaymentExists) {
          showSnackBar("Invoice with payment cannot be edited", "error");
          handleMenuClose();
          return;
        }
        setSelectedRowForInvoice(selectedRow);
        setInvoiceOpen(true);
        break;
      case "bill":
        if (selectedRow.billPaymentExists) {
          showSnackBar("Bill with payment cannot be edited", "error");
          handleMenuClose();
          return;
        }
        setSelectedRowForBill(selectedRow);
        setBillOpen(true);
        break;
      case "invoice_payment":
        setSelectedRowForInvoice(selectedRow);
        setOpenRecievePayment(true);
        break;
      case "bill_payment":
        setSelectedRowForBill(selectedRow);
        setOpenMakePayment(true);
        break;
      case "journal":
        if (!isFetching) {
          setSelectedRowForFetch(selectedRow);
          setAdvJournalOpen(true);
        }
        break;
      default:
        break;
    }
    if (filters.selectedAccount === "all_invoices") {
      setSelectedRowForInvoice(selectedRow);
      setInvoiceOpen(true);
    }
    if (filters.selectedAccount === "all_bills") {
      setSelectedRowForBill(selectedRow);
      setBillOpen(true);
    }
    handleMenuClose();
  };

  // ------------------------- DUPLICATE OPTION IN MENU -------------------------
  const handleDuplicateClick = () => {
    if (!selectedRow?.id) return;

    if (selectedRow.type === "transfer") {
      setDuplicate(true);
      setAddJournalOpen(true);
      setSelectedRowForFetch(selectedRow);
    }

    if (
      selectedRow.type === "invoice" ||
      filters.selectedAccount === "all_invoices"
    ) {
      setDuplicate(true);
      setSelectedRowForInvoice(selectedRow);
      setInvoiceOpen(true);
    }

    if (
      selectedRow.type === "bill" ||
      filters.selectedAccount === "all_bills"
    ) {
      setDuplicate(true);
      setSelectedRowForBill(selectedRow);
      setBillOpen(true);
    }

    if (selectedRow.type === "journal") {
      setDuplicate(true);
      setAdvJournalOpen(true);
      setSelectedRowForFetch(selectedRow);
    }
    setViewAdvanceJournal(false);
    setViewOpen(false);
    setViewPayment(false);
    handleMenuClose();
  };

  // ------------------------- DELETE OPTION IN MENU -------------------------
  const handleDeleteClick = () => {
    setRowToDelete(selectedRow);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  // ------------------------- DELETE BUTTON IN CONFIRM DELETE MODAL -------------------------
  const handleConfirmDelete = () => {
    if (!rowToDelete?.id) return;

    deleteJournal({
      transactionTypeId:
        filters.selectedAccount === "all_invoices" ||
          filters.selectedAccount === "all_bills"
          ? rowToDelete?.transactionTypeId || ""
          : rowToDelete?.id || "",
      transactionTypeName:
        filters.selectedAccount === "all_bills"
          ? "bill"
          : filters.selectedAccount === "all_invoices"
            ? "invoice"
            : rowToDelete?.type,
      paymentId: rowToDelete?.paymentId,
    })
      .unwrap()
      .then(() => {
        const typeName =
          filters.selectedAccount === "all_bills"
            ? "Bill"
            : filters.selectedAccount === "all_invoices"
              ? "Invoice"
              : formatType(rowToDelete?.type);

        showSnackBar(`${typeName} deleted successfully`, "success");
        refetchData();
        // onResetOffset?.();
        setDeleteConfirmOpen(false);
        setViewAdvanceJournal(false);
        setViewOpen(false);
        setViewPayment(false);
        if (typeName === "Invoice Payment" || typeName === "Bill Payment") {
          setSelectedRow(null);
        }
      })
      .catch((err: any) => {
        showSnackBar(
          err?.data?.message || "Failed to delete transaction",
          "error",
        );
      });
  };
  // ------------------------- Handle View Row Method -------------------------

  const handleViewRow = (row: any) => {
    setSelectedRow(row);
    if (
      row.type === "bill" ||
      row.type === "invoice" ||
      filters.selectedAccount === "all_invoices" ||
      filters.selectedAccount === "all_bills"
    ) {
      setViewOpen(true);
      return;
    }

    if (row.type === "invoice_payment" || row.type === "bill_payment") {
      setViewPayment(true);
      return;
    } else if (
      row.type === "journal" ||
      row.type === "transfer" ||
      row.type === "payroll_payment" ||
      row.type === "payroll"
    ) {
      setSelectedRowForFetch(row);
      setViewAdvanceJournal(true);
    }
  };

  // ------------------------- Handle Attachments Click Method -------------------------
  const handleAttachmentsClick = (row: any) => {
    console.log(row.type)
    const params = {
      transactionTypeId:
        filters.selectedAccount === "all_invoices" ||
          filters.selectedAccount === "all_bills"
          ? row.transactionTypeId || ""
          : row.id || "",
      transactionTypeName:
        filters.selectedAccount === "all_invoices"
          ? "invoice"
          : filters.selectedAccount === "all_bills"
            ? "bill"
            : row.type || "",
      paymentId: row.paymentId,
    };

    setAttachmentQueryParams(params);
    setSelectedRowForAttachments(row);
    setAttachmentsModalOpen(true);
  };

  // ------------------------- HandleDownload Method-------------------------

  const handleDownload = async () => {
    let transactionId: string | undefined;

    if (filters.selectedAccount === "all_invoices") {
      transactionId = selectedRow?.transactionTypeId;
    } else if (selectedRow?.type === "invoice") {
      transactionId = selectedRow?.id;
    }

    if (!transactionId) {
      showSnackBar("No transaction selected", "error");
      return;
    }

    try {
      const blob = await downloadInvoice({ transactionId }).unwrap();

      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error("Invalid PDF");
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `invoice-${transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);

      showSnackBar("Invoice downloaded successfully", "success");
    } catch (err) {
      showSnackBar("Failed to download invoice", "error");
    }
  };

  // ------------------------- DYNAMIC LOADING OF MENU ITEMS -------------------------
  const menuItems: MenuAtomItem[] =
    selectedRow?.type === "payroll_payment" || selectedRow?.type === "payroll"
      ? [
        {
          label: "View",
          onClick: () => {
            handleViewRow(selectedRow);
            handleMenuClose();
          },
        },
      ]
      : [
        { label: "Edit", onClick: handleEditClick },

        ...(selectedRow?.type !== "invoice_payment" &&
          selectedRow?.type !== "bill_payment"
          ? [{ label: "Duplicate", onClick: handleDuplicateClick }]
          : []),

        { label: "Delete", onClick: handleDeleteClick },

        {
          label:
            selectedRow?.type === "invoice" ||
              filters.selectedAccount === "all_invoices"
              ? "Receive Payment"
              : selectedRow?.type === "bill" ||
                filters.selectedAccount === "all_bills"
                ? "Make Payment"
                : undefined,
          onClick: () => {
            if (
              selectedRow?.type === "invoice" ||
              filters.selectedAccount === "all_invoices"
            ) {
              setOpenRecievePayment(true);
            }
            if (
              selectedRow?.type === "bill" ||
              filters.selectedAccount === "all_bills"
            ) {
              setOpenMakePayment(true);
            }
            handleMenuClose();
          },
        },

        {
          label: "View",
          onClick: () => {
            handleViewRow(selectedRow);
            handleMenuClose();
          },
        },

        ...(selectedRow?.type === "invoice" ||
          filters.selectedAccount === "all_invoices"
          ? [
            {
              label: "Download",
              onClick: handleDownload,
            },
          ]
          : []),
      ].filter((item) => Boolean(item.label)) as MenuAtomItem[];
  // ------------------------- Table Columns -------------------------
  const columns = tableColumns({
    formatAmount: (amount: any, currencySymbol?: string) => {
      return formatCurrencyByCommaSeparation(
        Number(amount),
        commaSeparation,
        currencySymbol || currency,
      );
    },
    onMenuOpen: handleMenuOpen,
    onAttachmentsClick: (row: any) => {
      handleAttachmentsClick(row);
    },
    onTypeClick: handleViewRow,
    getAttachmentKey,
    attachmentCountOverrides,
    isContactView: filters?.accountType == "contact",
    canManageTransactions: permissions.includes("manage_transactions"),
  });

  useEffect(() => {
    if (!attachmentQueryParams) return;

    refetchAttachmentCount(attachmentQueryParams)
      .unwrap()
      .then((res) => {
        const key = getAttachmentKey(
          attachmentQueryParams.transactionTypeId,
          attachmentQueryParams.paymentId,
        );

        setAttachmentCountOverrides((prev) => ({
          ...prev,
          [key]: res?.data?.count ?? 0,
        }));
      })
      .catch(() => {});
  }, [attachmentQueryParams]);

  useEffect(() => {
    if (onRefetchRequest) {
      onRefetchRequest(refetchData);
    }
  }, [onRefetchRequest]);

  useEffect(() => {
    const currentCompanyId = headerData?.data?.companyId;
    const prevCompanyId = prevCompanyIdRef.current;
    if (
      prevCompanyId &&
      currentCompanyId &&
      prevCompanyId !== currentCompanyId
    ) {
      // Reset state similar to refetchData
      setAllRows([]);
      setCursorUp(undefined);
      setCursorDown(undefined);
      setScrollMode("UP_ONLY");
      hasInitialLoadRef.current = false;
      isFetchingUpRef.current = false;
      isFetchingDownRef.current = false;
      isBackgroundRefetchRef.current = true;
      setRefetchTrigger((prev) => prev + 1);
    }

    prevCompanyIdRef.current = currentCompanyId;
  }, [headerData?.data?.companyId]);

  // Reset data ONLY when actual filters change (not when refetchTrigger changes)
  useEffect(() => {
    const currentFilters = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      selectedTransactionType: filters.selectedTransactionType,
      selectedAccount: filters.selectedAccount,
      accountType: filters.accountType,
      accountId: filters.accountId,
      taxIdFilter: filters.taxIdFilter,
      contactIdFilter: filters.contactIdFilter,
    };

    // Check if any filter actually changed
    const filtersChanged =
      prevFiltersRef.current.fromDate !== currentFilters.fromDate ||
      prevFiltersRef.current.toDate !== currentFilters.toDate ||
      JSON.stringify(prevFiltersRef.current.selectedTransactionType) !==
      JSON.stringify(currentFilters.selectedTransactionType) ||
      prevFiltersRef.current.selectedAccount !==
      currentFilters.selectedAccount ||
      prevFiltersRef.current.accountType !== currentFilters.accountType ||
      prevFiltersRef.current.accountId !== currentFilters.accountId ||
      JSON.stringify(prevFiltersRef.current.taxIdFilter) !==
      JSON.stringify(currentFilters.taxIdFilter) ||
      JSON.stringify(prevFiltersRef.current.contactIdFilter) !==
      JSON.stringify(currentFilters.contactIdFilter);

    if (filtersChanged) {
      setAllRows([]);
      setScrollMode("UP_ONLY");
      setIsFilterLoading(true);
      hasInitialLoadRef.current = false;
      setCursorUp(undefined);
      setCursorDown(undefined);
      prevFiltersRef.current = currentFilters;
    }
  }, [
    filters.fromDate,
    filters.toDate,
    filters.selectedTransactionType,
    filters.selectedAccount,
    filters.accountType,
    filters.accountId,
    filters.taxIdFilter,
    filters.contactIdFilter,
  ]);

  useEffect(() => {
    if (!filters.selectedAccount || !triggerFetch) return;

    const currentRequestId = ++requestIdRef.current;

    const finalQueryParams = {
      ...queryParams,
      meta: refetchMetaRef.current ?? undefined,
    };

    setIsFilterLoading(true);

    triggerFetch(finalQueryParams, false)
      .unwrap()
      .then((res: any) => {
        if (currentRequestId !== requestIdRef.current) return;

        const { data, nextCursor, prevCursor, totalCount } = res;
        if (!Array.isArray(data)) return;

        setCursorUp(prevCursor || undefined);
        setCursorDown(nextCursor || undefined);

        if (prevCursor && nextCursor) {
          setScrollMode("BOTH");
        } else {
          setScrollMode("UP_ONLY");
        }

        setAllRows(data);
        dispatch(setTransactCount(totalCount));
        hasInitialLoadRef.current = true;
        refetchMetaRef.current = null;
        didInitialScrollRef.current = false;
        setIsFilterLoading(false);


      })
      .catch(() => {
        if (currentRequestId === requestIdRef.current) {
          setIsFilterLoading(false);

        }
      });
  }, [
    triggerFetch,
    filters.fromDate,
    filters.toDate,
    filters.selectedTransactionType,
    filters.selectedAccount,
    filters.accountType,
    filters.accountId,
    filters.taxIdFilter,
    filters.contactIdFilter,
    refetchTrigger,

  ]);

  useEffect(() => {
    if (journalResponse?.data) setJournalData(journalResponse.data);
  }, [journalResponse]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const onUserScroll = () => {
      isUserScrollingRef.current = true;

      if (scrollUserTimeout.current) clearTimeout(scrollUserTimeout.current);
      scrollUserTimeout.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 1000); // reset after 1 second idle
    };

    container.addEventListener("wheel", onUserScroll);
    container.addEventListener("touchmove", onUserScroll);

    return () => {
      container.removeEventListener("wheel", onUserScroll);
      container.removeEventListener("touchmove", onUserScroll);
      if (scrollUserTimeout.current) clearTimeout(scrollUserTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!attachmentQueryParams) return;

    refetchAttachmentCount(attachmentQueryParams)
      .unwrap()
      .then((res) => {
        const key = getAttachmentKey(
          attachmentQueryParams.transactionTypeId,
          attachmentQueryParams.paymentId,
        );

        setAttachmentCountOverrides((prev) => ({
          ...prev,
          [key]: res?.data?.count ?? 0,
        }));
      })
      .catch(() => {});
  }, [attachmentQueryParams]);

  useEffect(() => {
    onRefetchRequest?.(refetchData);
  }, []);

  useLayoutEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (didInitialScrollRef.current) return;

    const container = tableContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (container.scrollHeight > container.clientHeight) {
          container.scrollTop = container.scrollHeight; // bottom
          didInitialScrollRef.current = true;
        }
      });
    });
  }, [allRows.length]);

  useEffect(() => {
    if (scrollAfterAction) {
      setScrollAfterActionInternal(true); // trigger internal scroll
    }
  }, [scrollAfterAction]);

  useEffect(() => {
    if (!scrollAfterActionInternal || !hasInitialLoadRef.current) return;
    if (allRows.length === 0) return;

    const container = tableContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.style.scrollBehavior = "smooth";

        if (cursorUp && cursorDown) {
          // Both directions available → go to center
          container.scrollTop =
            (container.scrollHeight - container.clientHeight) / 2;
        } else if (cursorUp && !cursorDown) {
          // Only top fetch possible → go to bottom
          container.scrollTop = container.scrollHeight;
        } else if (!cursorUp && cursorDown) {
          // Only bottom fetch possible → go to top
          container.scrollTop = 0;
        } else {
          // No cursors → fallback
          container.scrollTop = container.scrollHeight;
        }

        setTimeout(() => {
          container.style.scrollBehavior = "auto";
          setScrollAfterActionInternal(false); // reset internal state
          setScrollAfterAction?.(false); // reset parent state too
        }, 300);
      });
    });
  }, [allRows.length, scrollAfterActionInternal, cursorUp, cursorDown]);

  return (
    <>
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
        }}
      >
        <DenseTableAtom
          ref={tableContainerRef}
          columns={columns}
          rows={formattedRows}
          loading={isFilterLoading || isInitialLoad} // full page loader only
          showSkeleton={isInitialLoad} // ONLY initial load skeleton
          loadingUp={isFetchingUp} // prepend skeleton
          loadingDown={isFetchingDown} // append skeleton
          emptyMessage="No transactions available"
          highlightedRow={highlightedRow}
          sticky
          ariaLabel="transactions table"
          sx={{
            height: "100%",
          }}
        />

        {/* Loading indicator for scroll fetch */}
        {isScrollFetch && (
          <Box
            sx={{
              position: "absolute",
              bottom: 8,
              left: "50%",
              transform: "translateX(-50%)",
              pointerEvents: "none",
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}

        <MenuAtom
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          items={menuItems}
          onCloseAll={handleMenuClose}
        />

        {/* Transfer → Add Journal */}
        <ModalElement
          open={addJournalOpen}
          onClose={() => {
            setAddJournalOpen(false);
            setDuplicate(false);
          }}
          title={
            duplicate
              ? "Duplicate Transfer"
              : selectedRowForFetch?.id
                ? "Edit Transfer"
                : "Add Transfer"
          }
          maxWidth="lg"
          draggable
        >
          <Transfer
            open={addJournalOpen}
            duplicate={duplicate}
            selectedRow={selectedRowForFetch}
            onClose={() => {
              setAddJournalOpen(false);
              setDuplicate(false);
            }}
            onSuccess={(meta?: RefetchMetaDataTransactTable) => {
              refetchData(meta);
              if (selectedRowForFetch?.id) {
                refetchJournal().then((result) => {
                  if (result.data?.data) {
                    setJournalData(result.data.data);
                  }
                });
              }
              setAddJournalOpen(false);
              setDuplicate(false);
              setScrollAfterActionInternal(true);
            }}
            setHighlightedRow={setHighlightedRow}
            showSnackBar={showSnackBar}
          />
        </ModalElement>

        <BillModal
          selectedRow={selectedRowForBill}
          open={billOpen}
          duplicate={duplicate}
          mode={"Edit"}
          onClose={() => {
            setBillOpen(false);
            dispatch(resetInvoiceForm());
            setDuplicate(false);
          }}
          showSnackBar={showSnackBar}
          onSuccess={(meta?: RefetchMetaDataTransactTable) => {
            refetchData(meta);
            setScrollAfterActionInternal(true);
          }}
          setHighlightedRow={setHighlightedRow}
        />

        <InvoiceModal
          selectedRow={selectedRowForInvoice}
          open={invoiceOpen}
          duplicate={duplicate}
          mode={"Edit"}
          showSnackBar={showSnackBar}
          onClose={() => {
            dispatch(resetInvoiceForm());
            setInvoiceOpen(false);
            setDuplicate(false);
          }}
          onSuccess={(meta?: RefetchMetaDataTransactTable) => {
            refetchData(meta); // pass meta here
            setScrollAfterActionInternal(true); // Tell the table to scroll after refetch
          }}
          setHighlightedRow={setHighlightedRow}
        />

        <ModalElement
          title="View Payment"
          open={viewPayment}
          onClose={() => {
            setViewPayment(false);
          }}
          headerActions={
            permissions.includes("manage_transactions") &&
            <>
              <Tooltip title="Edit">
                <IconButton onClick={handleEditClick} color="info">
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton onClick={handleDeleteClick} color="error">
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          }
        >
          <PaymentDetailsCard
            paymentId={selectedRow?.paymentId}
            transactionId={selectedRow?.id}
            type={selectedRow?.type}
          />
        </ModalElement>

        {/*Receive Payment */}
        <ModalElement
          maxWidth="lg"
          open={openRecievePayment}
          draggable
          title={isEditReceivePayment ? "Edit Payment" : `Receive Payment `}
          // ${selectedRow?.toAccounts[0]?.name}
          onClose={() => {
            setIsEditReceivePayment(false);
            setOpenRecievePayment(false);
            setSelectedRowForInvoice(null);
            setSelectedRowForBill(null);
          }}
        >
          {selectedRow?.id && (
            <ReceivePayment
              isEditReceivePayment={isEditReceivePayment}
              setIsEditReceivePayment={setIsEditReceivePayment}
              transactionTypeId={
                filters.selectedAccount === "all_invoices" ||
                  filters.selectedAccount === "all_bills"
                  ? selectedRow.transactionTypeId
                  : selectedRow.id
              }
              mode={
                selectedRow.type === "invoice_payment"
                  ? "transaction"
                  : "parent"
              }
              initialPayment={
                selectedRow.type === "invoice_payment" ? selectedRow : undefined
              }
              onSuccess={(meta?: RefetchMetaDataTransactTable) => {
                setOpenRecievePayment(false);
                setScrollAfterActionInternal(true);
                refetchData(meta);
              }}
              onNotify={(m, t) => {
                showSnackBar(m, t);
              }}
              fromCurrency={invoices?.currency}
              setHighlightedRow={setHighlightedRow}
            />
          )}
        </ModalElement>

        {/* Make Payment */}
        <ModalElement
          maxWidth="lg"
          open={openMakePayment}
          draggable
          title={isEditMakePayment ? "Edit Payment" : `Make Payment`}
          onClose={() => {
            setIsEditMakePayment(false);
            setOpenMakePayment(false);
            setSelectedRowForInvoice(null);
            setSelectedRowForBill(null);
          }}
        >
          {selectedRow?.id && (
            <MakePayment
              isEditMakePayment={isEditMakePayment}
              setIsEditMakePayment={setIsEditMakePayment}
              transactionTypeId={
                filters.selectedAccount === "all_invoices" ||
                  filters.selectedAccount === "all_bills"
                  ? selectedRow.transactionTypeId
                  : selectedRow.id
              }
              mode={
                selectedRow.type === "bill_payment" ? "transaction" : "parent"
              }
              initialPayment={
                selectedRow.type === "bill_payment" ? selectedRow : undefined
              }
              onSuccess={(meta?: RefetchMetaDataTransactTable) => {
                setOpenRecievePayment(false);
                setScrollAfterActionInternal(true);
                refetchData(meta);
              }}
              onNotify={(message, type) => {
                showSnackBar(message, type);
              }}
              fromCurrency={bills?.currency}
              setHighlightedRow={setHighlightedRow}
            />
          )}
        </ModalElement>

        {/* Delete Confirmation */}
        {/* Journal → Advance Journal */}
        <ModalElement
          open={advJournalOpen}
          onClose={() => {
            setAdvJournalOpen(false);
            setDuplicate(false);
          }}
          title={
            duplicate
              ? "Duplicate Journal"
              : journalData != null
                ? "Edit Journal"
                : "Add Journal"
          }
          maxWidth="lg"
        >
          <AdvanceJournal
            duplicate={duplicate}
            selectedRow={selectedRowForFetch}
            onClose={() => {
              setAdvJournalOpen(false);
              setDuplicate(false);
            }}
            onSuccess={(meta?: RefetchMetaDataTransactTable) => {
              setAdvJournalOpen(false);
              setDuplicate(false);
              refetchData(meta);
              setScrollAfterActionInternal(true);
              if (selectedRowForFetch?.id) {
                refetchJournal().then((result) => {
                  if (result.data?.data) {
                    setJournalData(result.data.data);
                  }
                });
              }
            }}
            initialData={journalData}
            setHighlightedRow={setHighlightedRow}
            showSnackBar={showSnackBar}
          />
        </ModalElement>

        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction?"
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          confirmText="Yes, Delete"
          confirmColor="error"
        />

        {selectedRow &&
          viewOpen &&
          (selectedRow?.type === "invoice" ||
            selectedRow?.type === "bill" ||
            filters.selectedAccount === "all_invoices" ||
            filters.selectedAccount === "all_bills") && (
            <ModalElement
              title={`View ${selectedRow?.type === "bill" ? "Bill" : "Invoice"}`}
              maxWidth="lg"
              open={viewOpen}
              draggable
              onClose={() => {
                setViewOpen(false);
              }}
              headerActions={
                permissions.includes("manage_transactions") &&
                <>
                  <Tooltip title="Duplicate">
                    <IconButton onClick={handleDuplicateClick} color="primary">
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton onClick={handleEditClick} color="info">
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={handleDeleteClick} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              }
            >
              <ViewInvoiceBill
                key={selectedRow?.id}
                selectedRow={selectedRow}
                data={
                  selectedRow?.type === "invoice" ||
                    filters.selectedAccount === "all_invoices"
                    ? invoiceData
                    : billData
                }
                paymentData={
                  selectedRow?.type === "invoice" ||
                    filters.selectedAccount === "all_invoices"
                    ? invoices
                    : bills
                }
                isLoadingData={billLoading || invoiceLoading}
              />
            </ModalElement>
          )}

        {journalResponse && (
          <ModalElement
            title={`View ${selectedRow?.type == "journal" ?
              "Journal" : selectedRow?.type == "payroll_payment" ?
                "Payroll Payment" : selectedRow?.type == "payroll" ?
                  "Payroll" : "Transfer"}`}
            maxWidth="lg"
            open={viewAdvanceJournal}
            onClose={() => {
              setViewAdvanceJournal(false);
              setSelectedRowForFetch(null);
            }}
            headerActions={
              permissions.includes("manage_transactions") &&
              <>
                {selectedRow?.type !== "payroll_payment" && selectedRow?.type !== "payroll" &&
                  <><Tooltip title="Duplicate">
                    <IconButton onClick={handleDuplicateClick} color="primary">
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton onClick={handleEditClick} color="info">
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={handleDeleteClick} color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>}
              </>
            }
          >
            <ViewAdvanceJournal
              selectedRow={selectedRowForFetch}
              advJournalData={journalResponse}
              isFetchingJournalData={isFetching}
              transactionType={selectedRow?.type}
            />
          </ModalElement>
        )}

        {/* Attachments Modal */}
        <AttachmentsModal
          key={selectedRowForAttachments?.paymentId}
          open={attachmentsModalOpen}
          onDelete={handleDeleteAttachmentCount}
          onClose={() => {
            setAttachmentsModalOpen(false);
            setSelectedRowForAttachments(null);
          }}
          transactionTypeId={
            filters.selectedAccount === "all_invoices" ||
              filters.selectedAccount === "all_bills"
              ? selectedRowForAttachments?.transactionTypeId || ""
              : selectedRowForAttachments?.id || ""
          }
          transactionTypeName={
            filters.selectedAccount === "all_invoices"
              ? "invoice"
              : filters.selectedAccount === "all_bills"
                ? "bill"
                : selectedRowForAttachments?.type || ""
          }
          paymentId={selectedRowForAttachments?.paymentId}
          showSnackBar={showSnackBar}
          onSuccess={() => {
            handleDeleteAttachmentCount({
              transactionTypeId:
                filters.selectedAccount === "all_invoices" ||
                  filters.selectedAccount === "all_bills"
                  ? selectedRowForAttachments?.transactionTypeId || ""
                  : selectedRowForAttachments?.id || "",
              transactionTypeName:
                filters.selectedAccount === "all_invoices"
                  ? "invoice"
                  : filters.selectedAccount === "all_bills"
                    ? "bill"
                    : selectedRowForAttachments?.type || "",
              paymentId: selectedRowForAttachments?.paymentId,
            });

            setAttachmentsModalOpen(false);
            setSelectedRowForAttachments(null);
          }}
          setHighlightedRow={setHighlightedRow}
        />
      </Box>
    </>
  );
};
