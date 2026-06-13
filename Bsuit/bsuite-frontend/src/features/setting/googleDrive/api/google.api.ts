import { baseApi } from "../../../../api/base.api";

type SaveFolderResponse = { success: boolean };

export const GoogleDriveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    verifyGoogleToken: builder.mutation<any, { token: string }>({
      query: ({ token }) => ({
        url: "/storage/verify_token",
        method: "POST",
        params: { token },
      }),
    }),

    saveGoogleFolder: builder.mutation<
      SaveFolderResponse,
      { folderId: string; folderName: string; driveState: string | null }
    >({
      query: ({ folderId, folderName, driveState }) => ({
        url: "/storage/migrate/to_drive",
        method: "POST",
        body: { folderId, folderName, driveState },
      }),
      invalidatesTags: ["Storage"],
      transformResponse: (response: SaveFolderResponse) => response,
    }),

    saveFolderForDriveToBucket: builder.mutation<any, any>({
      query: ({ action, retain }) => ({
        url: "/storage/migrate/to_bucket",
        method: "POST",
        body: { action, retain },
      }),
      invalidatesTags: ["Storage"],
    }),
    getStorageData: builder.query<any, void>({
      query: () => ({
        url: "/storage/current_storage",
        method: "Get",
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["Storage"],
    }),

    getDriveAttachments: builder.query<any, void>({
      query: () => ({
        url: "/transact/transact_attachment_count",
        method: "Get",
      }),
      transformResponse: (res: any) => res.data,
    }),
  }),
});

export const {
  useVerifyGoogleTokenMutation,
  useSaveGoogleFolderMutation,
  useGetStorageDataQuery,
  useGetDriveAttachmentsQuery,
  useSaveFolderForDriveToBucketMutation,
} = GoogleDriveApi;
