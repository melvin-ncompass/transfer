export interface AccountsTableProps {
  type: "Asset" | "Liability" | "Income" | "Expense";
  search: string;
  onOpenCreateGroup?: (groupType: string) => void;
  zeroBalance ?: boolean ;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  transactionCount: number;
  reports: string;
  default:boolean
  [key: string]: any; // allows extra fields
}

export interface AccountGroup {
  groupName: string;
  accounts: Account[];
}

export interface AccountsData {
  Asset: AccountGroup[];
  Liability: AccountGroup[];
  Income: AccountGroup[];
  Expense: AccountGroup[];
}
