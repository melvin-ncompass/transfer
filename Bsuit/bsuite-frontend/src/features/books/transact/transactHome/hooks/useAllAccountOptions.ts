/**
 * useAllAccountOptions
 *
 * Returns grouped account/contact/tax options for dropdowns. Options can be
 * hidden by name and restricted by account type.
 *
 * --- Hiding options by name (exclusionPreset) ---
 * Any account/contact/tax whose name CONTAINS one of the preset strings
 * (case-insensitive) is excluded from the returned options.
 *
 * Presets:
 * - "full" (default): hide misc income/expense, AR, AP, in transit, fx gain/loss.
 *   Use for: Invoice, Bill, uncategorized import UploadCSV, OpeningBalanceView.
 * - "in_transit_only": hide only "in transit".
 *   Use for: Transfer, AdvanceJournal.
 * - "allow_misc": hide AR, AP, in transit, fx gain/loss (misc income/expense shown).
 *   Use for: uncategorized TransferModal.
 *
 * --- Restricting by account type (accountTypesFilter) ---
 * When passed (e.g. ["Asset", "Liability"]), only those account-type groups
 * are returned; Income/Expense groups are omitted. Contacts and Taxes are
 * unchanged. Use for: uncategorized import UploadCSV (Asset + Liability only).
 *
 * --- Call-site reference ---
 * | Screen/Component           | exclusionPreset   | accountTypesFilter   |
 * |---------------------------|-------------------|----------------------|
 * | Invoice/Bill              | "full"            | -                    |
 * | Transfer, AdvanceJournal  | "in_transit_only"  | -                    |
 * | TransferModal (uncat.)    | "allow_misc"      | -                    |
 * | HomePage                  | "full"            | -                    |
 * | Uncategorized import CSV | "full"            | ["Asset","Liability"]|
 * | OpeningBalanceView       | "full" (default)  | -                    |
 * | RecordPaymentModal       | "full"            | ["Asset","Liability"]|
 *
 * --- When not using this hook ---
 * If you build options from useGetAccountsQuery (or similar) in the component,
 * apply your own filter there (e.g. HomePage "Filter by Accounts" uses
 * FILTER_EXCLUDED_NAMES + Asset/Liability filter on groupedAccountOptions).
 */
import { useMemo } from "react";
import { useGetTaxesQuery } from "../../../coa/tax/tax.api";
import { useGetAllContactQuery } from "../../../coa/contact/api/contact.api";
import { useGetAccountsQuery } from "../../../coa/account/api/accounts.api";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";

type AccountType = "Asset" | "Income" | "Expense" | "Liability";

type OptionGroup = {
  label: string;
  options: { label: string; value: string }[];
};

/** full: all special accounts hidden (Invoice, Bill, import, etc.) */
const EXCLUDED_NAMES_FULL = [
  "miscellaneous income",
  "miscellaneous expense",
  "accounts receivable",
  "accounts payable",
  "in transit",
  "fx gain/ loss",
];

/** in_transit_only: only "in transit" hidden (Transfer, AdvanceJournal) */
const EXCLUDED_NAMES_IN_TRANSIT_ONLY = ["in transit"];

/** allow_misc: AR, AP, in transit, fx gain/loss hidden; misc income/expense shown (TransferModal) */
const EXCLUDED_NAMES_ALLOW_MISC = [
  "accounts receivable",
  "accounts payable",
  "in transit",
  "fx gain/ loss",
];

export type ExclusionPreset = "full" | "in_transit_only" | "allow_misc";

const PRESET_MAP: Record<ExclusionPreset, string[]> = {
  full: EXCLUDED_NAMES_FULL,
  in_transit_only: EXCLUDED_NAMES_IN_TRANSIT_ONLY,
  allow_misc: EXCLUDED_NAMES_ALLOW_MISC,
};

/** Returns true if name contains any excluded phrase (case-insensitive). */
const makeIsExcluded = (excludedNames: string[]) => (name?: string) =>
  !!name &&
  excludedNames.some((excluded) =>
    name.toLowerCase().includes(excluded)
  );

export function useAllAccountOptions(
  type: AccountType | null = null,
  unArchivedOnly: boolean = true,
  exclusionPreset: ExclusionPreset = "full",
  accountTypesFilter?: AccountType[],
  excludeEmployees?: boolean,
  onlyReportingCurrency: boolean = false,
  hidePayrollLiabilityAccounts: boolean = false
) {


  const excludedNames = PRESET_MAP[exclusionPreset];
  const isExcluded = useMemo(
    () => makeIsExcluded(excludedNames),
    [exclusionPreset],
  );

  const { data: taxesData, isLoading: isTaxesLoading, refetch: refetchTaxes } = useGetTaxesQuery();
  const { data: contactsData, isLoading: isContactsLoading } = useGetAllContactQuery({ unArchivedOnly, excludeEmployees });
  const { data: headerData, isLoading: isHeaderLoading } = useGetHeaderDataQuery();
  const reportingCurrency =
    headerData?.data?.reportingCurrency?.split(" - ")[0] ?? "";

  const accountTypeParam = type ?? "";

  const { data: accountsData, isLoading: isAccountsLoading } = useGetAccountsQuery({ type: accountTypeParam, unArchivedOnly });

  // --- Group Accounts (exclusionPreset hides by name; accountTypesFilter keeps only chosen types) ---
  const accountGroups = useMemo<OptionGroup[]>(() => {
    const accounts = Array.isArray(accountsData?.data)
      ? accountsData.data
      : [];

    if (!accounts.length) return [];

    const grouped = {
      Asset: [] as any[],
      Liability: [] as any[],
      Income: [] as any[],
      Expense: [] as any[],
    };

    accounts
      .filter((acc: any) => !isExcluded(acc.accountName || acc.name))
      .filter((acc: any) => {
        if (!hidePayrollLiabilityAccounts) return true;
        const accType = acc.accountType?.toLowerCase?.() || "";
        const name = (acc.accountName || acc.name || "").trim().toLowerCase();
        // Hide liability accounts prefixed with "Payroll-"
        if (accType.includes("liability") && name.startsWith("payroll-")) return false;
        return true;
      })
      .filter((acc: any) => {
        if (!onlyReportingCurrency || !reportingCurrency) return true;
        const accountCurrency = (acc.accountCurrency?.split("-")[0] ?? "").trim();
        return accountCurrency === reportingCurrency;
      })
      .forEach((acc: any) => {
        const accType = acc.accountType?.toLowerCase?.() || "";
        const name = acc.accountName || acc.name || "Unnamed Account";
        const currency = (acc.accountCurrency?.split("-")[0] ?? "").trim();
        const formattedName = `${name}${currency ? ` (${currency})` : ""}`;
        const uniqueValue = `account_${acc.id}`;

        if (accType.includes("asset"))
          grouped.Asset.push({ label: formattedName, value: uniqueValue });
        else if (accType.includes("liability"))
          grouped.Liability.push({ label: formattedName, value: uniqueValue });
        else if (accType.includes("income"))
          grouped.Income.push({ label: formattedName, value: uniqueValue });
        else if (accType.includes("expense"))
          grouped.Expense.push({ label: formattedName, value: uniqueValue });
      });

    // If accountTypesFilter set (e.g. ["Asset","Liability"]), drop other groups
    return Object.entries(grouped)
      .filter(
        ([label, arr]) =>
          arr.length &&
          (!accountTypesFilter || accountTypesFilter.includes(label as AccountType))
      )
      .map(([label, options]) => ({ label, options }));
  }, [
    accountsData,
    isExcluded,
    accountTypesFilter,
    onlyReportingCurrency,
    reportingCurrency,
    hidePayrollLiabilityAccounts,
  ]);

  // --- Group Contacts ---
  const contactGroup = useMemo<OptionGroup[]>(() => {
    const contacts = contactsData?.data || [];
    if (!contacts.length) return [];

    return [
      {
        label: "Contacts",
        options: contacts
          .filter((c: any) => !isExcluded(c.name))
          .map((c: any) => ({
            label: `${c.name}${reportingCurrency ? ` (${reportingCurrency})` : ""}`,
            value: `contact_${c.id}`,
          })),
      },
    ];
  }, [contactsData, reportingCurrency, isExcluded]);

  // --- Group Taxes ---
  const taxGroup = useMemo<OptionGroup[]>(() => {
    const taxes = taxesData?.data || [];
    if (!taxes.length) return [];

    return [
      {
        label: "Taxes",
        options: taxes
          .filter((t: any) => !isExcluded(t.taxName))
          .map((t: any) => ({
            label: `${t.abbreviation}${reportingCurrency ? ` (${reportingCurrency})` : ""}`,
            value: `tax_${t.id}`,
          })),
      },
    ];
  }, [taxesData, reportingCurrency, isExcluded]);

  // --- Combine all groups ---
  const allAccountOptions = useMemo(
    () => [...accountGroups, ...contactGroup, ...taxGroup],
    [accountGroups, contactGroup, taxGroup]
  );

  const isLoading = isTaxesLoading || isContactsLoading || isHeaderLoading || isAccountsLoading;

  return {
    allAccountOptions,
    accountGroups,
    contactGroup,
    taxGroup,
    accountsData,
    contactsData,
    taxesData,
    refetchTaxes,
    isLoading,
    reportingCurrency,
  };
}
