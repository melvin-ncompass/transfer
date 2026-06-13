import { baseApi } from "../../../../../api/base.api";
import type {
  IAllContactResponse,
  IContactRegister,
  IContactResponse,
} from "../types/contact.types";

export interface GetAllContactParams {
  /** e.g. "true" to return only unarchived contacts */
  unArchivedOnly?: boolean;
  /** when true, exclude contacts that are already employees */
  excludeEmployees?: boolean;
}

// API Endpoints
const AUTH = {
  CONTACT_REGISTER: "/contact",
  CONTACT_LIST: "/contact",
  CONTACT_EDIT: "/contact",
  CONTACT_DELETE: "/contact",
  CONTACT_ARCHIVED: "/contact",
};

// ---------------- Contact API ----------------
export const ContactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Register Contact (Add new contact)
    registerContact: builder.mutation<IContactResponse, IContactRegister>({
      query: (body) => ({
        url: AUTH.CONTACT_REGISTER,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Contact"],
    }),

    // Get All Contacts
    getAllContact: builder.query<
      IAllContactResponse,
      GetAllContactParams | void
    >({
      query: (params) => ({
        url: AUTH.CONTACT_LIST,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Contact"],
    }),

    // Edit Contact
    editContact: builder.mutation<
      IContactResponse,
      { id: number; updateData: Partial<IContactRegister> }
    >({
      query: ({ id, updateData }) => ({
        url: `${AUTH.CONTACT_EDIT}/${id}`,
        method: "PATCH",
        body: updateData,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Contact",
        { type: "Contact" as const, id },
      ],
    }),

    // Delete Contact
    deleteContact: builder.mutation<{ success: boolean }, { id: number }>({
      query: ({ id }) => ({
        url: `${AUTH.CONTACT_DELETE}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Contact"],
    }),
    toggleReportForContact: builder.mutation({
      query: (id) => ({
        url: `/contact/${id}/toggle_report`,
        method: "PATCH",
      }),
      invalidatesTags: ["Contact"],
    }),
    // Archive contact
    archiveContact: builder.mutation<any, { id: number }>({
      query: ({ id }) => ({
        url: `${AUTH.CONTACT_ARCHIVED}/${id}/archive`,
        method: "PATCH",
      }),
      invalidatesTags: ["Contact"],
    }),
    exportContact: builder.mutation<   { blob: Blob; fileName: string }, void>({
      query: () => ({
        url: "/contact/export",
        method: "POST",
        responseHandler: async (response) => {
          const blob = await response.blob();
          console.log(response);
          // Extract filename from Content-Disposition
          const contentDisposition =
            response.headers.get("content-disposition") || "";
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          const fileName = fileNameMatch ? fileNameMatch[1] : "download.xlsx";

          return { blob, fileName };
        },
      }),
    }),
  }),
  overrideExisting: false,
});

// ---------------- Export Hooks ----------------
export const {
  useRegisterContactMutation,
  useGetAllContactQuery,
  useEditContactMutation,
  useDeleteContactMutation,
  useArchiveContactMutation,
  useToggleReportForContactMutation,
  useExportContactMutation,
} = ContactApi;
