export interface IReportStructureResponse {
  fiscalYearStartDate: string | null;
  fiscalYearStartMonth: string | null;
  fiscalYearEndDate: string | null;
  fiscalYearEndMonth: string | null;
  enableFxCorrection: boolean | null;
  isCompanyName: boolean | null;
  isHeaderImage: boolean | null;
  isPageNumber: boolean | null;
  isGeneratedBy: boolean | null;
  isGeneratedDate: boolean | null;
  isGeneratedTime: boolean | null;
  footerContent: string | null;
  reportingCurrency: string;
  commaSeparation: string;
}

export interface IReportStructureUpdateRequest {
  fiscalYearStartDate: number | null;
  fiscalYearStartMonth: string | null;
  fiscalYearEndDate: number | null;
  fiscalYearEndMonth: string | null;
  enableFxCorrection: boolean;
  isCompanyName: boolean;
  isHeaderImage: boolean;
  isPageNumber: boolean;
  isGeneratedBy: boolean;
  isGeneratedDate: boolean;
  isGeneratedTime: boolean;
  footerContent: string;
  commaSeparation: string;
}

export interface IIReportStructureResponseAll {
    message : string ;
    data : IReportStructureResponse ;
}