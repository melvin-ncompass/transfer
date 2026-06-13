const API_KEY_STORAGE_KEY = 'melcp.apiKey';
const API_KEY_FROM_ENV = import.meta.env.VITE_API_KEY?.trim() || '';

let cachedApiKey: string | null = API_KEY_FROM_ENV || null;

export function getApiKey(): string | null {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const keyFromStorage = window.localStorage.getItem(API_KEY_STORAGE_KEY)?.trim();
  if (keyFromStorage) {
    cachedApiKey = keyFromStorage;
    return cachedApiKey;
  }

  const url = new URL(window.location.href);
  const keyFromQuery = url.searchParams.get('apiKey')?.trim();
  if (keyFromQuery) {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, keyFromQuery);
    cachedApiKey = keyFromQuery;
    url.searchParams.delete('apiKey');
    window.history.replaceState({}, '', url.toString());
    return cachedApiKey;
  }

  return null;
}

export function withApiKeyHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  const apiKey = getApiKey();
  return apiKey ? { ...headers, 'x-api-key': apiKey } : headers;
}
