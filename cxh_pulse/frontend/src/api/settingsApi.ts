import { baseApi } from './baseApi';

/**
 * Settings interface
 */
export interface Settings {
  smtpHost?: string;
  smtpPort?: number;
  username?: string; // API uses 'username' instead of 'smtpUser'
  password?: string; // API uses 'password' instead of 'smtpPass'
  smtpUser?: string; // Keep for backward compatibility
  smtpPass?: string; // Keep for backward compatibility
  fromEmail?: string;
  storagePath?: string;
  [key: string]: any; // Allow additional settings
}

type ApiResponse<T> = {
  data: T;
  [key: string]: unknown;
};

const unwrapResponse = <T>(response: T | ApiResponse<T>): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }

  return response as T;
};

/**
 * RTK Query API for Settings
 *
 * Provides auto-generated hooks for:
 * - useGetSettingsQuery - Get application settings
 */
export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get application settings by name
     * @param name - Setting name (optional, if you want to get all settings, pass undefined)
     * @returns Settings data
     */
    getSettings: builder.query<Settings, string | void>({
      query: (name) => (name ? `settings/${name}` : 'settings'),
      transformResponse: (response: ApiResponse<Settings> | Settings) => unwrapResponse(response),
      providesTags: ['Settings'],
    }),
    getStoragePath: builder.query<{ storagePath: string }, void>({
      query: () => 'settings/path',
      transformResponse: (
        response: ApiResponse<{ storagePath: string }> | { storagePath: string }
      ) => unwrapResponse(response),
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation<void, Settings>({
      query: (settings) => ({
        url: `settings`,
        method: 'PUT',
        body: {
          name: 'email',
          config: {
            ...settings,
          },
        },
      }),
      invalidatesTags: ['Settings'],
    }),
    updateStoragePath: builder.mutation<void, { path: string }>({
      query: (data) => ({
        url: `settings/upload-path`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

/**
 * Auto-generated hooks for settings operations
 */
export const {
  useGetSettingsQuery,
  useLazyGetSettingsQuery,
  useGetStoragePathQuery,
  useUpdateSettingsMutation,
  useUpdateStoragePathMutation,
} = settingsApi;
