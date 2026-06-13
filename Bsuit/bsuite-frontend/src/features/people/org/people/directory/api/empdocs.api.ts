import { baseApi } from "../../../../../../api/base.api";

export interface PayslipDate {
  payableDate: string;
  payrunId: number;
  monthlyGross: number;
}

export interface PayslipDatesApiResponse {
  success: boolean;
  statusCode: number;
  timestamp: string; // ISO date string
  message: string;
  data: PayslipDate[];
}

// =====================
// API Endpoints
// =====================

export const empdocsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPayslips: builder.query<PayslipDatesApiResponse, { employeeId: number }>({
      query: ({ employeeId }) => ({
        url: `/payroll/getPayRunDates/${employeeId}`,
        method: "GET",
      }),
      providesTags: ["Payslip"],
    }),
  }),
});

export const { useGetPayslipsQuery } = empdocsApi;