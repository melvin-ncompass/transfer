import { baseApi } from "../../../../api/base.api";

export const taxApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTaxes: build.query<any, void>({
      query: () => ({
        url: "/tax",
        method: "GET",
      }),
      providesTags: ["Tax"],
    }),
    addTax: build.mutation<
      any,
      {
        taxName: string;
        abbreviation: string;
        taxRate: number;
        taxNumber: number;
      }
    >({
      query: (body) => ({
        url: "/tax/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tax"],
    }),
    updateTax: build.mutation({
      query: ({ id, body }) => ({
        url: `/tax/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Tax"],
    }),

    deleteTax: build.mutation({
      query: ({ id }) => ({
        url: `/tax/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tax"],
    }),
    exportTax: build.mutation<{ blob: Blob; fileName: string }, void>({
      query: () => ({
        url: "/tax/export",
        method: "POST",
        responseHandler: async (response) => {
          const blob = await response.blob();
          console.log(response);
          // Extract filename from Content-Disposition
          const contentDisposition =
            response.headers.get("content-disposition") || "";
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          const fileName = fileNameMatch ? fileNameMatch[1] : "download.xlsx";
          console.log(fileName);
          return { blob, fileName };
        },
      }),
    }),
  }),
});

export const {
  useGetTaxesQuery,
  useUpdateTaxMutation,
  useDeleteTaxMutation,
  useAddTaxMutation,
  useExportTaxMutation,
} = taxApi;
