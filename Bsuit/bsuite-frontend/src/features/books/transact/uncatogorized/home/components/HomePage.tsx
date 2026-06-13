import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  Box,
  CircularProgress,
  Container,
  Typography,
  useTheme,
} from "@mui/material";
import MergeIcon from "@mui/icons-material/Merge";
import { Delete, Send } from "@mui/icons-material";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../../../components/atom/button";
import { Checkbox } from "../../../../../../components/atom/check-box";
import { MultiSelectElement } from "../../../../../../components/atom/select-field/MultiSelect";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import {
  useDeleteUncategorizedMutation,
  useGetUncategorizedRowsQuery,
} from "../api/uncategorized.api";
import { TransactionCard } from "./BankStatementCard";
import MultiMatchModal from "../../match/components/MultiMatchModal";
import {
  TransferModal,
  type AccountType,
} from "../../transfer/components/TransferModal";
import { useAllAccountOptions } from "../../../transactHome/hooks/useAllAccountOptions";
import { useSaveBulkTransferMutation } from "../../transfer/api/transfer.api";

const FILTER_EXCLUDED_NAMES = [
  "miscellaneous income",
  "miscellaneous expense",
  "accounts receivable",
  "accounts payable",
  "in transit",
  "fx gain/ loss",
];

interface HomePageProps {
  isActive?: boolean;
  totalCount: number;
  filterAccountIds: string[];
  setFilterAccountIds: Dispatch<SetStateAction<string[]>>;
  isFilterOpen: boolean;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
  highlightUncategorizedIds?: number[];
  refetchTransactCount: () => void;
}
export interface TransferRow {
  accountId: number;
  accountName: string;
  amount: number;
  currency: string;
  description: string;
  direction: "in" | "out";
  uncatId: number;
}
export interface BulkRow {
  name: string;
  id: number;
  description?: string;
  amount?: number;
  direction?: "in" | "out";
}

export default function HomePage({
  isActive = true,
  filterAccountIds,
  setFilterAccountIds,
  isFilterOpen,
  setIsFilterOpen,
  highlightUncategorizedIds = [],
  refetchTransactCount,
}: HomePageProps) {
  const theme = useTheme();
  const pageSize = 50;
  const [page, setPage] = useState(1);
  const [allRows, setAllRows] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });
  const [bulkDescriptions, setBulkDescriptions] = useState<Record<number, string>>({});

  const showSnackbar = (message: string, color: "success" | "error") => {
    setSnackbar({
      open: true,
      message,
      color,
    });
  };
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [multiMatchOpen, setMultiMatchOpen] = useState(false);
  const [moneyDirection, setMoneyDirection] = useState<"in" | "out">("in");
  // const [_accountsSelected, setAccountsSeleted] = useState(undefined);
  const [deleteUncategorized] = useDeleteUncategorizedMutation();
  // const { allAccountOptions, taxesData } = useAllAccountOptions(
  //   null,
  //   true,
  //   "full" 
  // );
  const [saveBulkTransfer] = useSaveBulkTransferMutation();
const { allAccountOptions, taxesData, contactsData, accountsData: aData } = useAllAccountOptions(null, true, "full");
  /* Ref to refresh data when new account is opened */
  const latestQueryRef = useRef<string>("");
  const firstHighlightRef = useRef<HTMLDivElement | null>(null);
  const [activeHighlightIds, setActiveHighlightIds] = useState<number[]>([]);

  /* ---------- Accounts for filter ---------- */
  const accountsList = (aData?.data ?? aData) || [];

  const groupedAccountOptions = useMemo(() => {
    const groups: Record<string, any[]> = {
      Asset: [],
      Liability: [],
      Income: [],
      Expense: [],
      Other: [],
    };

    accountsList.forEach((acc: any) => {
      const type = acc.accountType || "Other";
      const name = acc.accountName || acc.name || "Unnamed Account";
      const currency = acc.accountCurrency?.split("-")[0] ?? "";
      const label = `${name}${currency ? ` (${currency})` : ""}`;
      const option = { label, value: label, id: acc.id };
      groups[type]?.push(option);
    });

    return Object.entries(groups)
      .filter(([_, options]) => options.length > 0)
      .map(([label, options]) => ({ label, options }));
  }, [accountsList]);

  const filterAccountOptions = useMemo(() => {
    return groupedAccountOptions
      .filter((g) => g.label === "Asset" || g.label === "Liability")
      .map((group) => ({
        ...group,
        options: group.options.filter(
          (opt) =>
            !FILTER_EXCLUDED_NAMES.some((excluded) =>
              opt.label.toLowerCase().includes(excluded)
            ),
        ),
      }))
      .filter((g) => g.options.length > 0);
  }, [groupedAccountOptions]);

  /* ---------- Filter state ---------- */
  const selectedAccountIDs = filterAccountIds;
  const [tempSelectedIDs, setTempSelectedIDs] = useState<string[]>([]);
  const [tempSelectedLabels, setTempSelectedLabels] = useState<string[]>([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferUncatIds, setTransferUncatIds] = useState<number[]>([]);
  const [bulkToAccounts, setBulkToAccounts] = useState<Record<number, string>>(
    {},
  );
  const [bulkContacts, setBulkContacts] = useState<Record<number, string>>({});

  const contactOptions = useMemo(
    () =>
      (contactsData?.data || []).map((c: any) => ({
        value: `contact_${c.id}`,
        label: c.name,
      })),
    [contactsData],
  );

  const isBulkActive =
    Object.keys(bulkToAccounts).length === selectedIds.length;

  useEffect(() => {
    if (!isFilterOpen) return;

    setTempSelectedIDs(filterAccountIds);

    const labels = groupedAccountOptions
      .flatMap((group) => group.options)
      .filter((opt) => filterAccountIds.includes(opt.id))
      .map((opt) => opt.label);

    setTempSelectedLabels(labels);
  }, [isFilterOpen, filterAccountIds, groupedAccountOptions]);

  /* -------------------- Reset pagination on filter change -------------------- */
  useEffect(() => {
    setPage(1);
    setAllRows([]);
    setHasMore(true);
    setSelectedIds([]);
  }, [selectedAccountIDs]);

  /* -------------------- Fetch uncategorized rows -------------------- */
  const queryArgs = useMemo(
    () => ({
      page,
      pageSize,
      ...(selectedAccountIDs.length > 0 && {
        accountId: selectedAccountIDs.map((id) => Number(id)),
      }),
    }),
    [page, pageSize, selectedAccountIDs],
  );

  const queryKey = useMemo(() => {
    return JSON.stringify(queryArgs);
  }, [queryArgs]);

  useEffect(() => {
    latestQueryRef.current = queryKey;
  }, [queryKey]);

  const {
    data: uncategorizedTransactData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetUncategorizedRowsQuery(queryArgs, { skip: !isActive });

  useEffect(() => {
    if (!uncategorizedTransactData?.data) return;

    if (latestQueryRef.current !== queryKey) return;

    if (uncategorizedTransactData.data.length === 0 && page > 1) {
      setHasMore(false);
      return;
    }

    if (page === 1) {
      setAllRows(uncategorizedTransactData.data);
    } else {
      setAllRows((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const newRows = uncategorizedTransactData.data.filter(
          (r) => !existingIds.has(r.id),
        );
        return [...prev, ...newRows];
      });
    }

    setHasMore(uncategorizedTransactData.data.length === pageSize);
  }, [uncategorizedTransactData, page, queryKey]);
  /* -------------------- Filtered rows -------------------- */
  const filteredRows = useMemo(() => {
    if (!selectedAccountIDs.length) return allRows;
    return allRows.filter((row) => selectedAccountIDs.includes(row.account.id));
  }, [allRows, selectedAccountIDs]);

  const allRowIds = useMemo(
    () => filteredRows.map((row) => row.id),
    [filteredRows],
  );

  const isAllRowsSelected =
    allRowIds.length > 0 && allRowIds.every((id) => selectedIds.includes(id));
  const isSomeRowsSelected = selectedIds.length > 0 && !isAllRowsSelected;

  /* -------------------- Handlers -------------------- */
  const handleToggleRow = (id: number) => {
    setSelectedIds((prev) => {
      const newSelected = prev.includes(id)
        ? prev.filter((rowId) => rowId !== id)
        : [...prev, id];

      if (newSelected.length !== allRowIds.length) setSelectAllMode(false);

      if (newSelected) {
        setBulkToAccounts((prevAccounts) => {
          const updated = { ...prevAccounts };
          delete updated[id];
          return updated;
        });

        setBulkContacts((prevContacts) => {
          const updated = { ...prevContacts };
          delete updated[id];
          return updated;
        });
      }
      return newSelected;
    });
  };

  const handleDeleteClick = () => setDeleteConfirmOpen(true);

  const handleConfirmDelete = async () => {
    try {
      await deleteUncategorized(selectedIds).unwrap();
      setDeleteConfirmOpen(false);
      handleDeleteSuccess("Transactions deleted successfully", selectedIds);
    } catch {
      handleDeleteError("Failed to delete transaction");
    }
  };

  const handleDeleteSuccess = (message: string, deletedIds: number[]) => {
    setAllRows((prev) => prev.filter((row) => !deletedIds.includes(row.id)));
    setSelectedIds([]);
    showSnackbar(message, "success");
  };

  const handleDeleteError = (message: string) => {
    showSnackbar(message, "error");
  };

  const handleToggleSelectAllRows = () => {
    if (!selectAllMode) {
      setSelectedIds(allRowIds);
      setSelectAllMode(true);
    } else {
      setSelectedIds([]);
      setSelectAllMode(false);
    }

    setBulkToAccounts({});
    setBulkContacts({});
    setBulkDescriptions({});
  };

  const handleInlineBulkSave = async () => {
    const selectedRows = selectedIds.filter((id) => bulkToAccounts[id]);

    if (!selectedRows.length) return;

    await saveBulkTransfer({
      transfers: selectedRows.map((id) => {
        const val = bulkToAccounts[id];
        const [type, rawId] = val.split("_");

        const contactVal = bulkContacts[id];
        const row = filteredRows.find((r) => r.id === id);

        return {
          uncatId: id,
          toAccountId: Number(rawId),
          toAccountType: type as AccountType,
          contactId:
            type === "account" && contactVal
              ? Number(contactVal.split("_")[1])
              : undefined,
          hasTdsMapping: false,
          description: bulkDescriptions[id] ?? row?.description,
        };
      }),
    });

    setBulkToAccounts({});
    setBulkContacts({});
    setBulkDescriptions({});
    setSelectedIds([]);
    refetchTransactCount();
    showSnackbar("Transfer Sucessfull!", "success");
  };

  const handleApplyFilter = () => {
    setFilterAccountIds(tempSelectedIDs);
    setIsFilterOpen(false);
  };

  /* -------------------- Multi Match Validation -------------------- */
  const selectedRowsData = useMemo(() => {
    return filteredRows
      .filter((row) => selectedIds.includes(row.id))
      .map((row) => ({
        ...row,
        description: bulkDescriptions[row.id] ?? row.description,
      }));
  }, [filteredRows, selectedIds, bulkDescriptions]);

  const multiMatchValidation = useMemo(() => {
    const moneyDirections = selectedRowsData.map((row) =>
      row.credit && row.credit > 0 ? "in" : "out",
    );
    const uniqueDirections = new Set(moneyDirections);
    if (uniqueDirections.size > 1) {
      return {
        isValid: false,
        reason: "Cannot match money in and money out transactions together",
      };
    } else {
      setMoneyDirection([...uniqueDirections][0] as "in" | "out");
    }

    return { isValid: true, reason: "" };
  }, [selectedRowsData, selectedIds]);

  const fetchMoreData = () => {
    if (!isFetching && hasMore) setPage((prev) => prev + 1);
  };

  const isInitialLoading = (isLoading || isFetching) && allRows.length === 0;

  useEffect(() => {
    if (!uncategorizedTransactData?.data) return;

    if (uncategorizedTransactData.data.length === 0 && page > 1) {
      setHasMore(false);
      return;
    }

    if (uncategorizedTransactData.data.length) {
      setAllRows((prev) => {
        if (page === 1) return uncategorizedTransactData.data;
        const existingIds = new Set(prev.map((r) => r.id));
        const newRows = uncategorizedTransactData.data.filter(
          (r) => !existingIds.has(r.id),
        );
        return [...prev, ...newRows];
      });


      setHasMore(uncategorizedTransactData.data.length === pageSize);
    }
  }, [uncategorizedTransactData, page]);

  /* Start temporary highlight when highlightUncategorizedIds arrive; clear after a few seconds */
  useEffect(() => {
    if (highlightUncategorizedIds.length === 0) return;
    setActiveHighlightIds([...highlightUncategorizedIds]);
    const clearTimer = setTimeout(() => setActiveHighlightIds([]), 2500);
    return () => clearTimeout(clearTimer);
  }, [highlightUncategorizedIds.join(",")]);

  /* Scroll first highlighted row into view when highlight ids are set */
  useEffect(() => {
    if (activeHighlightIds.length === 0 || !firstHighlightRef.current) return;
    const timer = setTimeout(() => {
      firstHighlightRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
    return () => clearTimeout(timer);
  }, [activeHighlightIds, filteredRows.length]);

  /* -------------------- Initial loading -------------------- */
  if (isInitialLoading) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          py: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: "center" }}>
        <Typography color="error">
          Failed to load uncategorized transactions
        </Typography>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Sticky Action Bar*/}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 48,
            flexWrap: "nowrap",
            p: 1,
          }}
        >
          {filteredRows.length > 0 && (
            <>
              {/* Left: Select All */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  checked={isAllRowsSelected}
                  indeterminate={isSomeRowsSelected}
                  onChange={handleToggleSelectAllRows}
                />
                <Typography variant="body2" color="text.primary">
                  Select All
                  {selectedIds.length > 0 && (
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 0.5 }}
                    >
                      ({selectedIds.length})
                    </Typography>
                  )}
                </Typography>
              </Box>

              {/* Right: Buttons */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {selectedIds.length > 1 && (
                  <>
                    <PrimaryIconButton
                      title="Multi Match"
                      disabled={!multiMatchValidation.isValid}
                      onClick={() => {
                        setMultiMatchOpen(true);
                      }}
                      sx={{
                        width: { xs: 40, md: 35 },
                        height: { xs: 40, md: 35 },
                        backgroundColor: theme.palette.primary.main,
                        color: "white",
                        "&:hover": { backgroundColor: theme.palette.primary.dark },
                      }}
                      icon={<MergeIcon sx={{ width: 19 }} />}
                    />

                    <PrimaryIconButton
                      title={
                        isBulkActive
                          ? "Bulk Transfer"
                          : "Select To Accounts for all selected rows"
                      }
                      onClick={handleInlineBulkSave}
                      sx={{
                        width: 35,
                        height: 35,
                        backgroundColor: theme.palette.primary.main,
                        color: "white",
                        "&:hover": { backgroundColor: theme.palette.primary.dark },
                      }}
                      icon={<Send sx={{ width: 19 }} />}
                      disabled={!isBulkActive}
                    />

                    <PrimaryIconButton
                      title="Bulk Delete"
                      onClick={handleDeleteClick}
                      sx={{
                        width: 35,
                        height: 35,
                        backgroundColor: theme.palette.error.main,
                        color: "white",
                        "&:hover": { backgroundColor: theme.palette.error.dark },
                      }}
                      icon={<Delete sx={{ width: 19 }} />}
                    />
                  </>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box
        id="scrollableDiv"
        sx={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
          px: 1,
          py: 2,
        }}
      >
        <InfiniteScroll
          dataLength={filteredRows.length}
          next={fetchMoreData}
          hasMore={hasMore}
          scrollableTarget="scrollableDiv"
          style={{
            overflow: "visible",
          }}
          loader={
            page > 1 &&
            hasMore && (
              <Box
                sx={{
                  backgroundColor: "background.paper",
                  borderTop: "1px solid rgba(224,224,224,0.3)",
                  py: 2,
                  my: 2,
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <CircularProgress size={32} sx={{ mb: 1 }} />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    Loading more transactions...
                  </Typography>
                </Box>
              </Box>
            )
          }
        >
          {/* Transaction Rows */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {!isLoading &&
              !isFetching &&
              page === 1 &&
              (allRows.length === 0 ||
                uncategorizedTransactData?.data?.length === 0) && (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="h6" color="text.secondary">
                    No uncategorized transactions found
                  </Typography>
                </Box>
              )}

            {filteredRows.map((row) => {
              const isChecked = selectedIds.includes(row.id);
              const isSelectedMany = selectedIds.length > 1;
              const isHighlighted = activeHighlightIds.includes(row.id);
              const isFirstHighlighted = isHighlighted && row.id === activeHighlightIds[0];
              return (
                <Box
                  key={row.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    borderRadius: 1,
                    "@media (max-width:1024px)": {
                      gap: 1.5,
                    },
                  }}
                >
                  <Checkbox
                    checked={isChecked}
                    onChange={() => handleToggleRow(row.id)}
                  />
                  <Box ref={isFirstHighlighted ? firstHighlightRef : undefined}>
                    <TransactionCard
                      isAllSelected={isSelectedMany && isChecked}
                      isHighlighted={isHighlighted}
                      id={row.id}
                      accountName={row.account.accountName}
                      accountCurrency={row.account.accountCurrency}
                      date={row.date}
                      description={row.description}
                      credit={row.credit}
                      debit={row.debit}
                      currentAccountId={row.account.id}
                      showDeleteIcon
                      onDeleteSuccess={() =>
                        handleDeleteSuccess(
                          "Transaction deleted successfully",
                          [row.id],
                        )
                      }
                      onDeleteError={handleDeleteError}
                      bulkToAccount={bulkToAccounts[row.id]}
                      setBulkToAccount={(value) =>
                        setBulkToAccounts((prev) => {
                          const updated = { ...prev };

                          if (!value) {
                            delete updated[row.id];
                          } else {
                            updated[row.id] = value;
                          }

                          return updated;
                        })
                      }
                      bulkContact={bulkContacts[row.id]}
                      setBulkContact={(value) =>
                        setBulkContacts((prev) => ({
                          ...prev,
                          [row.id]: value,
                        }))
                      }
                      contactOptions={contactOptions}
                      allAccountOptions={allAccountOptions}
                      taxesData={taxesData}
                      showSnackbar={showSnackbar}
                      bulkDescription={bulkDescriptions[row.id]}
                      setBulkDescription={(value) =>
                        setBulkDescriptions((prev) => ({ ...prev, [row.id]: value }))
                      }
                      refetchTransactCount={refetchTransactCount}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </InfiniteScroll>
      </Box>

      {/* Filter Modal */}
      <ModalElement
        open={isFilterOpen}
        title="Filter by Accounts"
        onClose={() => setIsFilterOpen(false)}
        sx={{
          "& .MuiDialog-paper": { width: { xs: "90vw", sm: 500 }, margin: 2 },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 2 }}>
          <MultiSelectElement
            label="Accounts"
            options={filterAccountOptions}
            value={tempSelectedLabels}
            onChange={(labels: string[]) => {
              setTempSelectedLabels(labels);
              const ids = filterAccountOptions
                .flatMap((group) => group.options)
                .filter((opt) => labels.includes(opt.label))
                .map((opt) => opt.id);
              setTempSelectedIDs(ids);
            }}
            width="100%"
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <PrimaryButton onClick={handleApplyFilter}>
              Apply Filter
            </PrimaryButton>
          </Box>
        </Box>
      </ModalElement>

      {/* Snackbar */}

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        confirmColor="error"
      />
      <MultiMatchModal
        moneyDirection={moneyDirection}
        isOpen={multiMatchOpen}
        onClose={() => {
          setMultiMatchOpen(false);
          refetch();
        }}
        selectedUncat={selectedRowsData}
        refetchTransactCount={refetchTransactCount}
      />
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        uncatId={transferUncatIds}
        refetchTransactCount={refetchTransactCount}
      />
    </Box>
  );
}
