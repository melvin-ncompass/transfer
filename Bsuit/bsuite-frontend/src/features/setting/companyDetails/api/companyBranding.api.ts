import { baseApi } from "../../../../api/base.api";

const COMPANY = {
  GET_COMPANY_DETAILS: "/setting/company_details",
  GET_IMAGES: "/setting/get_company_images",
  SET_IMAGES: "/setting/branding",
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET COMPANY DETAILS
    getCompanyDetails: builder.query<any, void>({
      query: () => ({
        url: COMPANY.GET_COMPANY_DETAILS,
        method: "GET",
      }),
      providesTags: ["Branding"],
    }),
    getImages: builder.query<any, void>({
      query: () => ({
        url: COMPANY.GET_IMAGES,
        method: "GET",
      }),
      providesTags: ["Branding", "Company", "Header"],
    }),

    // LOGOUT
    updateImages: builder.mutation<any, any>({
      query: (payload) => {
        // If caller already passed a FormData, send it directly
        if (payload instanceof FormData) {
          return {
            url: COMPANY.SET_IMAGES,
            method: "PATCH",
            body: payload,
          };
        }

        // Build FormData when files may be present inside the payload
        const fd = new FormData();
        if (payload?.companyName) fd.append("companyName", payload.companyName);
        if (payload?.companyShortName) fd.append("companyShortName", payload.companyShortName);

        // Helper to append file/formdata to main FormData
        const isFileLike = (v: any) => v && (typeof v.size === "number" || v instanceof Blob || v instanceof File);

        const appendFileOrForm = (key: string, value: any) => {
          if (!value) return;
          // If it's a File/Blob instance
          if (isFileLike(value)) {
            fd.append(key, value as File | Blob);
            return;
          }
          // If it's a FormData, find file/blob entries and append them under the provided key
          if (value instanceof FormData) {
            for (const [, v] of Array.from((value as FormData).entries())) {
              if (isFileLike(v)) {
                fd.append(key, v as any);
                // append only files under the desired key; continue to append further file entries if present
              }
            }
            return;
          }
          // Otherwise if it's an object with a `file` property
          if (typeof value === "object" && value?.file && isFileLike(value.file)) {
            fd.append(key, value.file as File);
            return;
          }
        };

        appendFileOrForm("logo", payload.logo);
        appendFileOrForm("header_image", payload.header_image);

        return {
          url: COMPANY.SET_IMAGES,
          method: "PATCH",
          body: fd,
        };
      },
       invalidatesTags: ["Branding", "Header" , "Company"], 
    }),
  }),
});

export const {
  useGetCompanyDetailsQuery,
  useGetImagesQuery,
  useUpdateImagesMutation,
} = authApi;
