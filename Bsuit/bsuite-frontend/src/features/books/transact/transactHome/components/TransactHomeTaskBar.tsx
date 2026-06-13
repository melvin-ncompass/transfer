import React, { useEffect } from "react";
import { Stack, Badge, useTheme, Box, Divider } from "@mui/material";
import {
  Add as AddIcon,
  Replay,
  IosShare,
  FilterList,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import type { MenuAtomItem } from "../../../../../components/menuatom/MenuAtom";
import type { ExportType } from "../types/transact.types";
import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedAccount,
  setFromDate,
  setToDate,
  setAppliedFilters,
  openBillModal,
  openInvoiceModal,
  openJournalModal,
  openTransferModal,
  openFilterDialog,
  resetAllFilters,
  closeFilterDialog,
  setSelectedTransactionType,
  initializeDateRange,
  setTaxIdFilter,
  setContactIdFilter,
} from "../../slice/transcatSlice";
import {
  useGetDateRangeQuery,
  useGetTransactionNamesQuery,
  useLazyExportPdfTransactAllQuery,
  useLazyExportPdfTransactInvoiceBillQuery,
} from "../api/transact.api";
import { debounce } from "lodash-es";
import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { ModalElement } from "../../../../../components/dialogs/modal-element";
import CustomCircularProgress from "../../../../../components/atom/circular-progress/CircularProgress";
import { MultiSelectElement } from "../../../../../components/atom/select-field/MultiSelect";
import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../../components/atom/button";
import { useAllAccountOptions } from "../hooks/useAllAccountOptions";
import { PermissionGuard } from "../../../../../guards/ComponentGuard";

interface TransactHomeTaskBarProps {
  showSnackBar: (message: string, color: "success" | "error") => void;
}

export const TransactHomeTaskBar: React.FC<TransactHomeTaskBarProps> = ({
  showSnackBar,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);

  const [exportPdfTriggerAll] = useLazyExportPdfTransactAllQuery();
  const [exportPdfTriggerInvoiceBill] =
    useLazyExportPdfTransactInvoiceBillQuery();
  const { taxesData, accountsData, contactsData } = useAllAccountOptions(
    null,
    false
  );
  const { data: dateData } = useGetDateRangeQuery();
  const { data: transactionNamesData, isLoading: loadingNames } =
    useGetTransactionNamesQuery(undefined, { skipPollingIfUnfocused: true });

  const transactionTypeOptions = (transactionNamesData?.data?.names || []).map(
    (name) => ({
      label: name
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      value: name,
    }),
  );

  const taxTypeOptions = (taxesData?.data || []).map((item: any) => ({
    label: item.taxName,
    value: String(item.id),
  }));

  const contactTypeOptions = (contactsData?.data || []).map((item: any) => ({
    label: item.name,
    value: String(item.id),
  }));

  const {
    selectedAccount,
    fromDate,
    toDate,
    activeFilters,
    showMoreFilters,
    payloadExport,
    filterDialogOpen,
    selectedTransactionType,
    selectedTax,
    taxIdFilter,
    contactIdFilter,
  } = useSelector((state: any) => state.transact);

  const fromDateDayjs = fromDate ? dayjs(fromDate) : null;
  const toDateDayjs = toDate ? dayjs(toDate) : null;

  const isDateRangeValid = React.useMemo(() => {
    if (!fromDateDayjs || !toDateDayjs) return true;
    if (!fromDateDayjs.isValid() || !toDateDayjs.isValid()) return true;
    const from = fromDateDayjs.startOf("day");
    const to = toDateDayjs.startOf("day");
    return from.isBefore(to) || from.isSame(to);
  }, [fromDate, toDate]);

  const handleApplyFilters = () => {
    let accountId: number | undefined;
    let accountType = "all";

    if (selectedAccount && selectedAccount !== "all_accounts") {
      const a = selectedAccount.split("_");
      const [type, id] = selectedAccount.split("_");
      if (type && id) {
        accountType = type;
        accountId = Number(id);
      }
    }

    dispatch(
      setAppliedFilters({
        fromDate: fromDate ?? undefined,
        toDate: toDate ?? undefined,
        selectedTransactionType,
        accountType,
        selectedTax,
        accountId,
        selectedAccount,
        taxIdFilter,
        contactIdFilter,
      }),
    );
    dispatch(closeFilterDialog());
  };

  const handleExportClick = (event: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(event.currentTarget);

  const handleExportClose = () => setAnchorEl(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
    setMenuAnchor(event.currentTarget);

  const handleMenuClose = () => setMenuAnchor(null);

  const handleExport = async (type: ExportType) => {
    if (!payloadExport) return;
    const {
      selectedAccount,
      accountId,
      accountType,
      fromDate,
      toDate,
      selectedTransactionType,
    } = payloadExport;

    if (!selectedAccount || !fromDate || !toDate || !selectedTransactionType) {
      return;
    }

    let payload: any = {
      fromDate,
      toDate,
      selectedTransactionType,
      exportType: type,
    };

    const isAccountExport =
      selectedAccount === "all_accounts" ||
      selectedAccount.startsWith("tax_") ||
      selectedAccount.startsWith("contact_") ||
      selectedAccount.startsWith("account_");

    if (isAccountExport) {
      payload = { ...payload, accountId, accountType };
    } else if (selectedAccount === "all_invoices") {
      payload = {
        ...payload,
        accountType: accountType ?? "all",
        entityType: "INVOICE",
      };
    } else if (selectedAccount === "all_bills") {
      payload = {
        ...payload,
        accountType: accountType ?? "all",
        entityType: "BILL",
      };
    } else {
      return;
    }

    try {
      const trigger = isAccountExport
        ? exportPdfTriggerAll
        : exportPdfTriggerInvoiceBill;

      await trigger(payload).unwrap();
      showSnackBar("Exported Successfully. Check your email.", "success");
    } catch (err: any) {
      showSnackBar(
        err?.data?.message ??
        err?.message ??
        `${type.toUpperCase()} Export failed`,
        "error",
      );
    }
  };

  const dispatchFiltersDebounced = React.useMemo(
    () =>
      debounce(
        (selectedAccount: string, start: string | null, end: string | null) => {
          dispatch(
            setAppliedFilters({
              selectedAccount,
              fromDate: start ?? undefined,
              toDate: end ?? undefined,
              selectedTransactionType: [],
              selectedTax: "",
            }),
          );
        },
        300,
      ),
    [dispatch],
  );

  const accountGroups = React.useMemo(() => {
    const accounts = Array.isArray(accountsData?.data) ? accountsData.data : [];
    if (!accounts.length) return [];
    const grouped: Record<string, any[]> = {
      Asset: [],
      Liability: [],
      Income: [],
      Expense: [],
    };
    accounts.forEach((acc: any) => {
      const type = acc.accountType?.toLowerCase() || "";
      const name = acc.accountName || acc.name || "Unnamed Account";
      const currency = acc.accountCurrency?.split("-")[0] || "";
      const formattedName = `${name} ${currency ? `(${currency})` : ""}`;
      const uniqueValue = `account_${acc.id}`;
      if (type.includes("asset"))
        grouped.Asset.push({ label: formattedName, value: uniqueValue });
      else if (type.includes("liability"))
        grouped.Liability.push({ label: formattedName, value: uniqueValue });
      else if (type.includes("income"))
        grouped.Income.push({ label: formattedName, value: uniqueValue });
      else if (type.includes("expense"))
        grouped.Expense.push({ label: formattedName, value: uniqueValue });
    });
    return Object.entries(grouped)
      .filter(([_, arr]) => arr.length)
      .map(([label, options]) => ({ label, options }));
  }, [accountsData]);

  const contactGroup = React.useMemo(() => {
    const contacts = contactsData?.data || [];
    if (!contacts.length) return [];
    return [
      {
        label: "Contacts",
        options: contacts.map((c: any) => ({
          label: c.name,
          value: `contact_${c.id}`,
        })),
      },
    ];
  }, [contactsData]);

  const taxGroup = React.useMemo(() => {
    const taxes = taxesData?.data || [];
    if (!taxes.length) return [];
    return [
      {
        label: "Taxes",
        options: taxes.map((t: any) => ({
          label: `${t.taxName} (${t.taxRate}%)`,
          value: `tax_${t.id}`,
        })),
      },
    ];
  }, [taxesData]);

  const invoicesGroup = [
    {
      label: "Invoices",
      options: [{ label: "All Invoices", value: "all_invoices" }],
    },
  ];

  const billsGroup = [
    { label: "Bills", options: [{ label: "All Bills", value: "all_bills" }] },
  ];

  const accountOptions = React.useMemo(
    () => [
      {
        label: "",
        options: [{ label: "All Accounts", value: "all_accounts" }],
      },
      ...accountGroups,
      ...contactGroup,
      ...taxGroup,
      ...invoicesGroup,
      ...billsGroup,
    ],
    [accountGroups, contactGroup, taxGroup, invoicesGroup, billsGroup],
  );

  const menuItems: MenuAtomItem[] = [
    { label: "Transfer", onClick: () => dispatch(openTransferModal()) },
    { label: "Journal", onClick: () => dispatch(openJournalModal()) },
    { label: "Invoice", onClick: () => dispatch(openInvoiceModal()) },
    { label: "Bill", onClick: () => dispatch(openBillModal()) },
  ];

  const exportItems: MenuAtomItem[] = [
    { label: "Export as PDF", onClick: () => handleExport("pdf") },
    { label: "Export as Excel", onClick: () => handleExport("excel") },
  ];

  useEffect(() => {
    if (!dateData?.data) return;

    const { minDate, maxDate } = dateData.data;

    dispatch(resetAllFilters({ minDate, maxDate }));
    dispatch(initializeDateRange({ minDate, maxDate }));
  }, [dateData?.data?.minDate, dateData?.data?.maxDate]);

  return (
    <>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        sx={{
          width: "100%",
          maxWidth: "1200px",
          px: { xs: 1, sm: 2 },
          py: 1,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems="center"
          justifyContent="center"
          gap={2}
          flexWrap="wrap"
          sx={{
            width: "100%",
            borderLeft: { md: "1px solid #ccc" },
            px: { xs: 0, md: 2 },
          }}
        >
          <SingleSelectElement
            label="Account"
            value={selectedAccount}
            onChange={(val: string) => {
              dispatch(setSelectedAccount(val));
              dispatchFiltersDebounced(val, fromDate, toDate);
            }}
            options={accountOptions}
            width={"260px"}
          />

          <DateRangePicker
            label="Date Range"
            startValue={fromDateDayjs}
            endValue={toDateDayjs}
            months={2}
            width="260px"
            onChange={([start, end]) => {
              if (!start || !end) return;
              const startStr = start.format("YYYY-MM-DD");
              const endStr = end.format("YYYY-MM-DD");
              dispatch(setFromDate(startStr));
              dispatch(setToDate(endStr));
              dispatchFiltersDebounced(selectedAccount, startStr, endStr);
            }}
          />
        </Stack>

        <Stack
          direction="row"
          gap={1.5}
          justifyContent="center"
          sx={{
            width: { xs: "100%", md: "auto" },
          }}
        >
          <PrimaryIconButton
            title="Reset"
            onClick={() =>
              dispatch(
                resetAllFilters({
                  minDate: dateData?.data?.minDate,
                  maxDate: dateData?.data?.maxDate,
                }),
              )
            }
            disabled={!isDateRangeValid}
            icon={<Replay />}
          />

          <Box sx={{ width: "1px", height: 40, backgroundColor: "divider" }} />

          <PermissionGuard permission={"manage_transactions"}>
            <PrimaryIconButton
              onClick={handleMenuOpen}
              icon={<AddIcon />}
              title="Add"
            />
          </PermissionGuard>
          <PermissionGuard permission={"export_transactions"}>
            <PrimaryIconButton
              onClick={handleExportClick}
              icon={<IosShare />}
              title="Export"
            />

          </PermissionGuard>
          {showMoreFilters && (
            <Badge
              badgeContent={activeFilters}
              color={activeFilters > 0 ? "primary" : "default"}
            >
              <PrimaryIconButton
                disabled={
                  selectedAccount === "all_invoices" ||
                  selectedAccount === "all_bills"
                }
                icon={<FilterList />}
                title="More Filters"
                onClick={() => dispatch(openFilterDialog())}
              />
            </Badge>
          )}
        </Stack>

        <MenuAtom
          items={exportItems}
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleExportClose}
          onCloseAll={handleExportClose}
        />
        <MenuAtom
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          items={menuItems}
          onCloseAll={handleMenuClose}
        />
        <ModalElement
          open={filterDialogOpen}
          title="More Filters"
          onClose={() => dispatch(closeFilterDialog())}
          maxWidth="sm"
        >
          <Stack
            component="form"
            spacing={3}
            onSubmit={(e) => {
              e.preventDefault();
              handleApplyFilters();
            }}
          >
            {loadingNames ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CustomCircularProgress size={24} />
              </Box>
            ) : (
              <MultiSelectElement
                label="Transaction Type"
                value={selectedTransactionType}
                onChange={(value) =>
                  dispatch(setSelectedTransactionType(value as string[]))
                }
                options={transactionTypeOptions}
                width="100%"
              />
            )}

            {selectedAccount?.startsWith("contact_") && (
              <MultiSelectElement
                label="Tax Specific Filter"
                options={taxTypeOptions}
                value={taxIdFilter}
                onChange={(value) =>
                  dispatch(setTaxIdFilter(value as string[]))
                }
                width="100%"
              />
            )}

            {selectedAccount?.startsWith("account_") && (
              <MultiSelectElement
                label="Contact Specific Filter"
                options={contactTypeOptions}
                value={contactIdFilter}
                onChange={(value) =>
                  dispatch(setContactIdFilter(value as string[]))
                }
                width="100%"
              />
            )}

            <Divider sx={{ my: 3 }} />
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <PrimaryButton
                variant="contained"
                onClick={handleApplyFilters}
                disabled={loadingNames}
              >
                Apply
              </PrimaryButton>
            </Stack>
          </Stack>
        </ModalElement>
      </Stack>
    </>
  );
};