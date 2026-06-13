import { baseApi } from "../../../../api/base.api";
import type {
  IIReportStructureResponseAll,
  IReportStructureUpdateRequest,
} from "../types/structure.types";

const AUTH = {
  REPORT_STRUCTURE_LIST: "/setting/report_structure",
  REPORT_STRUCTURE_EDIT: "/setting/report_structure/update",
};

export const ReportStructureApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch the report structure
    getReportStructure: builder.query<IIReportStructureResponseAll, void>({
      query: () => ({
        url: AUTH.REPORT_STRUCTURE_LIST,
        method: "GET",
      }),
      providesTags: ["ReportStructure"],
    }),

    // Update the report structure (send PATCH)
    updateReportStructure: builder.mutation<
      IIReportStructureResponseAll,
      IReportStructureUpdateRequest
    >({
      query: (data) => ({
        url: AUTH.REPORT_STRUCTURE_EDIT,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["ReportStructure"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetReportStructureQuery, useUpdateReportStructureMutation } =
  ReportStructureApi;
