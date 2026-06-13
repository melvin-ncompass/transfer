// ---------------- Interfaces ----------------
export interface ICompanyToRegister {
  companyName: string;
  companyShortName: string;
  reportingCurrency: string;
}

export interface ICompanyDefault {
  companyId: string;
}

export interface ICompanyResponse {
  id: number;
  companyId: string;
  companyName: string;
  companyShortName: string;
  companyLogo: string;
  isDefault: boolean;
  noOfUsers: number;
}

export interface IAllCompanyResponse {
  message: string;
  data: ICompanyResponse[];
}

export interface ICurrencyItem {
  cc: string;
  symbol: string;
  name: string;
}

export interface ColumnParams {
  setCompanyId:({companyId}:{companyId: string}) => void;
  handleSetDefault: (companyId: string) => void;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>, id: number) => void;
  anchorEl: HTMLElement | null;
  selectedRow: number | null;
  handleMenuClose: () => void;
  handleEdit: () => void;
  setDeleteDialog: (open: boolean) => void;
  navigate: any; 
}