import { baseApi } from "../../../../../api/base.api";

/** Dynamic date columns (ISO date keys) plus the row label */
export type SalaryReportLine = {
  name: string;
  /** Present when groupByRevision=true */
  amount?: Array<string | number | null | undefined>;
} & Record<string, string | number | undefined>;

export interface SalaryReportData {
  payableDates: string[];
  earnings: SalaryReportLine[];
  deductions: SalaryReportLine[];
  netPay: SalaryReportLine[];
}

export interface SalaryReportResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: SalaryReportData;
}

export interface SalaryReportQueryArgs {
  employeeId: number;
  from: string;
  to: string;
  excludeLop: boolean;
  groupByRevision: boolean;
}

export interface SalaryReportExportArgs extends SalaryReportQueryArgs {
  exportType: "pdf" | "excel";
}

export const salaryReportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSalaryReport: builder.query<SalaryReportResponse, SalaryReportQueryArgs>({
      query: ({ employeeId, from, to, excludeLop, groupByRevision }) => ({
        url: `/reports/salary/${employeeId}`,
        method: "GET",
        params: { from, to, excludeLop, groupByRevision },
      }),
    }),
    exportSalaryReport: builder.mutation<{ blob: Blob; fileName: string }, SalaryReportExportArgs>({
      query: ({ employeeId, exportType, from, to, excludeLop, groupByRevision }) => ({
        url: `/reports/salary/export/${employeeId}`,
        method: "GET",
        params: { exportType, from, to, excludeLop, groupByRevision },
        responseHandler: async (response) => {
          const blob = await response.blob();
          const contentDisposition = response.headers.get("content-disposition") || "";
          const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          const extension = exportType === "excel" ? "xlsx" : "pdf";
          const fileName = fileNameMatch ? fileNameMatch[1] : `salary-report-${employeeId}.${extension}`;
          return { blob, fileName };
        },
      }),
    }),
  }),
});

export const { useLazyGetSalaryReportQuery, useExportSalaryReportMutation } = salaryReportApi;
