import { useEffect, useRef, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { TransactTable } from "./TransactTable";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import AdvanceJournal from "./dialogs/AdvanceJournal";
import { Transfer } from "./dialogs/Transfer";
import InvoiceModal from "../../modals/InvoiceModal";
import BillModal from "../../modals/BillModal";
import { Snackbar } from "../../../../../components/atom/snackbar";
import {
  setSelectedAccount,
  closeJournalModal,
  resetAllFilters,
  closeBillModal,
  closeInvoiceModal,
  closeTransferModal,
  setAppliedFilters,
} from "../../slice/transcatSlice";
import type { HighlightedRow } from "../../../../../types/types";
import type { RefetchMetaDataTransactTable } from "../types/transact.types";
import { useAllAccountOptions } from "../hooks/useAllAccountOptions";

export const TransactTabCard = ({
 
}: {
 
}) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightedRow, setHighlightedRow] = useState<HighlightedRow>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const [scrollAfterAction, setScrollAfterAction] = useState(false);
  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  /* Refetching Method */
  const tableRefetchRef = useRef<
    ((meta?: RefetchMetaDataTransactTable) => void) | null
  >(null);

  const refetchAndScrollTable = (meta?: RefetchMetaDataTransactTable) => {
    tableRefetchRef.current?.(meta); // trigger refetch in table
    setScrollAfterAction(true); // trigger scroll after refetch
  };

  const {
    fromDate,
    toDate,
    appliedFilters,
    submittedFilters,
    isInitialized,
    minDate,
    maxDate,
    journalModalOpen,
    billModalOpen,
    invoiceModalOpen,
    transferModalOpen,
  } = useSelector((state: any) => state.transact);

  const { taxesData } = useAllAccountOptions();
  const tdsTaxId = (() => {
    const list = taxesData?.data || [];
    const tds = list.find(
      (t: any) =>
        /tds/i.test(t.taxName || "") || /tds/i.test(t.abbreviation || ""),
    );
    return tds ? String(tds.id) : list[0] ? String(list[0].id) : undefined;
  })();

  // const taxOptions = [
  //   { label: "GST", value: "gst" },
  //   { label: "VAT", value: "vat" },
  //   { label: "Income Tax", value: "income_tax" },
  //   { label: "Sales Tax", value: "sales_tax" },
  // ];

  /* Handle URL params for account, contact, or tax */
  useEffect(() => {
    const highlightId = searchParams.get("highlightId");
    const transactionType = searchParams.get("transactionType");
    const paymentId = searchParams.get("paymentId");

    if (highlightId && transactionType) {
      const meta: RefetchMetaDataTransactTable = {
        newTransactionId: highlightId,
        newTransactionName: transactionType,
        newPaymentId: paymentId,
      };

      setHighlightedRow({
        key: "id",
        value: highlightId,
        type: "add",
      });

      refetchAndScrollTable(meta);
      setSearchParams({}, { replace: true });
      return;
    }

    const accountId = searchParams.get("accountId");
    const accountTypeUrl = searchParams.get("accountType");
    const contactId = searchParams.get("contactId");
    const taxId = searchParams.get("taxId");
    const source = searchParams.get("source");
    const urlFromDate = searchParams.get("fromDate");
    const urlToDate = searchParams.get("toDate");
    const urlSingleDate = searchParams.get("date");

    const validAccountTypes = ["Asset", "Liability", "Income", "Expense"];
    const accountType =
      accountTypeUrl && validAccountTypes.includes(accountTypeUrl)
        ? "account"
        : accountTypeUrl || "all";

    if (!minDate || !maxDate) return;

    const defaultFromDate = dayjs(minDate).format("YYYY-MM-DD");
    const defaultToDate = dayjs(maxDate).format("YYYY-MM-DD");

    let finalFromDate = defaultFromDate;
    let finalToDate = defaultToDate;

    if (urlSingleDate) {
      finalToDate = urlSingleDate;
    } else {
      finalFromDate = urlFromDate || defaultFromDate;
      finalToDate = urlToDate || defaultToDate;
    }

    if (contactId) {
      dispatch(setSelectedAccount(`contact_${contactId}`));

      const fromTdsSummary = source === "tds";
      dispatch(
        setAppliedFilters({
          fromDate: finalFromDate,
          toDate: finalToDate,
          selectedTransactionType: [],
          accountType: "contact",
          selectedTax: "",
          accountId: Number(contactId),
          selectedAccount: `contact_${contactId}`,
          contactIdFilter: [contactId],
          taxIdFilter: fromTdsSummary && tdsTaxId ? [tdsTaxId] : [],
        }),
      );

      setSearchParams({}, { replace: true });
      return;
    }

    if (taxId) {
      dispatch(setSelectedAccount(`tax_${taxId}`));

      dispatch(
        setAppliedFilters({
          fromDate: finalFromDate,
          toDate: finalToDate,
          selectedTransactionType: [],
          accountType: "tax",
          selectedTax: "",
          accountId: Number(taxId),
          selectedAccount: `tax_${taxId}`,
          taxIdFilter: [taxId],
          contactIdFilter: [],
        }),
      );

      setSearchParams({}, { replace: true });
      return;
    }

    if (accountId) {
      dispatch(setSelectedAccount(`account_${accountId}`));

      dispatch(
        setAppliedFilters({
          fromDate: finalFromDate,
          toDate: finalToDate,
          selectedTransactionType: [],
          accountType,
          selectedTax: "",
          accountId: Number(accountId),
          selectedAccount: `account_${accountId}`,
          taxIdFilter: [],
          contactIdFilter: [],
        }),
      );

      setSearchParams({}, { replace: true });
    }
  }, [searchParams, minDate, maxDate]);

  return (
    <Box>
      {!isInitialized ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "calc(100vh - 230px)",
            }}
          >
            <TransactTable
              setHighlightedRow={setHighlightedRow}
              highlightedRow={highlightedRow}
              filters={appliedFilters}
              
              submittedFilters={submittedFilters}
              showSnackBar={showSnack}
              onRefetchRequest={(refetchFn) => {
                tableRefetchRef.current = refetchFn;
              }}
              scrollAfterAction={scrollAfterAction}
              setScrollAfterAction={setScrollAfterAction}
             
            />
          </Box>
        </>
      )}
      <ModalElement
        open={journalModalOpen}
        title="Add Journal"
        onClose={() => dispatch(closeJournalModal())}
        maxWidth="lg"
      >
        <AdvanceJournal
          onClose={() => dispatch(closeJournalModal())}
          onSuccess={(meta) => {
            dispatch(closeJournalModal());
            refetchAndScrollTable(meta);
          }}
          setHighlightedRow={setHighlightedRow}
          showSnackBar={showSnack}
        />
      </ModalElement>

      <ModalElement
        open={transferModalOpen}
        onClose={() => dispatch(closeTransferModal())}
        title="Add Transfer"
        maxWidth="lg"
        draggable
      >
        <Transfer
          open={transferModalOpen}
          onClose={() => dispatch(closeTransferModal())}
          onSuccess={(meta) => {
            dispatch(
              resetAllFilters({
                minDate: fromDate ?? undefined,
                maxDate: toDate ?? undefined,
              }),
            );
            dispatch(closeJournalModal());
            refetchAndScrollTable(meta);
          }}
          setHighlightedRow={setHighlightedRow}
          showSnackBar={showSnack}
        />
      </ModalElement>

      <BillModal
        open={billModalOpen}
        mode="Make"
        onClose={() => dispatch(closeBillModal())}
        onSuccess={(meta) => {
          refetchAndScrollTable(meta);
          dispatch(
            resetAllFilters({
              minDate: fromDate ?? undefined,
              maxDate: toDate ?? undefined,
            }),
          );
          dispatch(closeBillModal());
        }}
        showSnackBar={showSnack}
        setHighlightedRow={setHighlightedRow}
      />

      <InvoiceModal
        open={invoiceModalOpen}
        mode="Make"
        onClose={() => dispatch(closeInvoiceModal())}
        onSuccess={(meta) => {
          refetchAndScrollTable(meta);
          dispatch(
            resetAllFilters({
              minDate: fromDate ?? undefined,
              maxDate: toDate ?? undefined,
            }),
          );
          dispatch(closeInvoiceModal());
        }}
        showSnackBar={showSnack}
        setHighlightedRow={setHighlightedRow}
      />

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </Box>
  );
};
