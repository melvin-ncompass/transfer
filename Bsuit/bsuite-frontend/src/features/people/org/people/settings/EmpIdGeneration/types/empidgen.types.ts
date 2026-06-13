// ---------- Types ----------
/** Matches backend CreateOrUpdateSeriesConfigDto */
export interface EmployeeIdPrefixPayload {
    seriesPrefixPermanent: string;
    seriesPrefixIntern: string;
  }
  
  /** Backend returns { data, message } */
  export interface EmployeeIdPrefixResponse {
    data?: { seriesPrefixPermanent?: string; seriesPrefixIntern?: string } | null;
    message: string;
  }
  
  /** Backend delete returns { message } */
  export interface EmployeeIdPrefixDeleteResponse {
    message: string;
  }