export interface PayslipTemplate {
  id: number;
  templateName: string;
  showHeader: boolean;
  headerSize: string;
  showLogo: boolean;
  logoSize: string;
  showOrgAddress: boolean;
  showWorkLocation: boolean;
  showDesignation: boolean;
  showDepartment: boolean;
  showPan: boolean;
  showBankAccountNumber: boolean;
  showUanNumber: boolean;
  showBasedOnGross: boolean;
  isDefault: boolean;
}

// Request body types
export interface CreateUpdatePayslipTemplatePayload {
  templateName: string;
  showHeader: boolean;
  headerSize: string;
  showLogo: boolean;
  logoSize?: string;
  showOrgAddress: boolean;
  showWorkLocation: boolean;
  showDesignation: boolean;
  showDepartment: boolean;
  showPan: boolean;
  showBankAccountNumber: boolean;
  showUanNumber: boolean;
  showBasedOnGross: boolean;
}
