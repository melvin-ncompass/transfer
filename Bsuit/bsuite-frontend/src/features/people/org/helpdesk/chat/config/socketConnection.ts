/**
 * Resolves where socket.io-client should connect.
 *
 * REST (`VITE_API_BASE_URL`) may include a path prefix (e.g. `/api/v1/`).
 * Socket.IO is usually mounted on the host origin at `/socket.io`, not under that prefix.
 *
 * In local dev, set `VITE_SOCKET_USE_PROXY=true` and use the Vite proxy (see vite.config.ts)
 * so polling XHR is same-origin and cookies (companyId) are sent.
 */
export function resolveSocketIoUrl(): string {
  const useDevProxy =
    import.meta.env.DEV && import.meta.env.VITE_SOCKET_USE_PROXY === "true";

  if (useDevProxy) {
    return window.location.origin;
  }

  const explicit = import.meta.env.VITE_SOCKET_IO_URL as string | undefined;
  if (explicit?.trim()) {
    return explicit.trim().replace(/\/$/, "");
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!apiBase?.trim()) {
    return window.location.origin;
  }

  try {
    return new URL(apiBase).origin;
  } catch {
    return apiBase.replace(/\/$/, "");
  }
}

export function resolveSocketIoPath(): string {
  const path = import.meta.env.VITE_SOCKET_IO_PATH as string | undefined;
  return path?.trim() || "/socket.io";
}
