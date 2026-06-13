/** Config entity – from backend IncomeTaxConfig */
export interface IncomeTaxConfig {
  id: number;
  configName: string;
  isVersionEnabled: boolean;
}

/** Range/slab item for tax ranges. Send with `tax` (1–100); API may return `rate`. */
export interface IncomeTaxRangeItem {
  from?: number;
  to?: number;
  rate?: number;
  tax?: number;
  [key: string]: unknown;
}

/** Surcharge slab item. Send with `tax` (1–100); API may return `surchargePercentage`. */
export interface SurchargeSlabItem {
  from?: number;
  to?: number;
  surchargePercentage?: number;
  tax?: number;
  [key: string]: unknown;
}

/** Section item for exemptions (used in version and payload) */
export interface ExemptionSubsectionPayload {
  code: string;
  exemptionName: string;
  maxLimit: number;
  componentMapping?: string;
}

export interface ExemptionSectionPayload {
  code: string;
  sectionName: string;
  maxLimit: number;
  subsections: ExemptionSubsectionPayload[];
}

/** Version entity – from backend IncomeTaxVersion with config relation */
export interface IncomeTaxVersion {
  id: number;
  versionNo: number;
  financialYearStart: string | null;
  financialYearEnd: string | null;
  nonTaxableAmount?: number | null;
  rangeData?: IncomeTaxRangeItem[] | null;
  surchargeSlab?: SurchargeSlabItem[] | null;
  standardDeduction?: number | null;
  cess?: number | null;
  isHraEnabled?: boolean | null;
  taxableIncomeThreshold?: number | null;
  rebateAmount?: number | null;
  taxExemption?: ExemptionSectionPayload[] | null;
  config: IncomeTaxConfig;
  createdAt?: string;
  updatedAt?: string;
}

/** Create body – matches backend CreateIncomeTaxDto */
export interface CreateIncomeTaxDto {
  configName: string;
  isVersionEnabled: boolean;
  parentConfigId?: number | null;
  financialYearStart?: string | null;
  financialYearEnd?: string | null;
  nonTaxableAmount?: number | null;
  rangeData?: IncomeTaxRangeItem[] | null;
  surchargeSlab?: SurchargeSlabItem[] | null;
  isStandardDeductionEnabled?: boolean;
  isCessEnabled?: boolean;
  standardDeduction?: number | null;
  cess?: number | null;
  isHraEnabled?: boolean;
  taxableIncomeThreshold?: number;
  rebateAmount?: number;
}

/** Update body – matches backend UpdateIncomeTaxDto (same shape as create for PATCH) */
export type UpdateIncomeTaxDto = Partial<CreateIncomeTaxDto>;

/** GET list – backend returns { data: IncomeTaxVersion[], message } */
export interface IncomeTaxListResponse {
  data?: IncomeTaxVersion[];
  message?: string;
}

/** GET single – backend returns { data: IncomeTaxVersion, message } */
export interface IncomeTaxSingleResponse {
  data?: IncomeTaxVersion | null;
  message?: string;
}

/** Financial year list item – from getFinancialYearsByConfig select */
export interface FinancialYearItem {
  id: number;
  versionNo: number;
  financialYearStart: string;
  financialYearEnd: string;
}

/** GET financial_years/:id – backend returns { data: FinancialYearItem[], message } */
export interface FinancialYearsResponse {
  data?: FinancialYearItem[];
  message?: string;
}

/** POST / PATCH response – backend returns { data, message, change_of_data } */
export interface IncomeTaxCreateUpdateResponse {
  data?: IncomeTaxVersion | null;
  message?: string;
  change_of_data?: { module: string; feature: string; status: string };
}

/** DELETE response – backend returns { data: { id }, message, change_of_data } */
export interface IncomeTaxDeleteResponse {
  data?: { id: number };
  message?: string;
  change_of_data?: { module: string; feature: string; status: string };
}


/** Exemptions submit body */
export interface ExemptionsSubmitPayload {
  versionId: number;
  sections: ExemptionSectionPayload[];
}
