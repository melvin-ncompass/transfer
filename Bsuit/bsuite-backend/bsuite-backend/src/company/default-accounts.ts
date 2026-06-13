import { AccountType } from "src/common/enum/account-type.enum";

export const GROUPS_CONFIG = [
  { name: "Short Term Asset", type: AccountType.ASSET },
  { name: "Short Term Liability", type: AccountType.LIABILITY },
  { name: "Long Term Liability", type: AccountType.LIABILITY },
  { name: "Income", type: AccountType.INCOME },
  { name: "Foreign Exchange", type: AccountType.EXPENSE },
  { name: "Cost of Goods Sold", type: AccountType.EXPENSE },
];

export const ACCOUNTS_CONFIG = [
  {
    name: "Common Shares",
    type: AccountType.LIABILITY,
    group: "Long Term Liability",
    notes:
      "Common shares of a corporation can be issued to business owners, investors, and employees.",
  },
  { name: "FX Gain/ Loss", type: AccountType.EXPENSE, group: "Foreign Exchange" },
  { name: "Accounts Payable", type: AccountType.LIABILITY, group: "Short Term Liability" },
  { name: "Accounts Receivable", type: AccountType.ASSET, group: "Short Term Asset" },
  { name: "In Transit", type: AccountType.ASSET, isArchived: true },
  { name: "Sales", type: AccountType.INCOME, group: "Income" },
  { name: "Service", type: AccountType.INCOME, group: "Income" },
  { name: "Miscellaneous Income", type: AccountType.INCOME, group: "Income" },
  { name: "Miscellaneous Expense", type: AccountType.EXPENSE },
];

export const TAX_CONFIG = [{ name: "TDS", abbreviation: "TDS", rate: 10 }];
