/**
 * Pull a human-readable message from RTK Query / fetch errors and typical API bodies
 * (`message`, `detail`, `error`, string or string[]).
 */
function pickMessageFromPayload(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === "string") {
    const t = data.trim();
    return t.length > 0 ? t : null;
  }
  if (typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  const fromVal = (v: unknown): string | null => {
    if (typeof v === "string") {
      const t = v.trim();
      return t.length > 0 ? t : null;
    }
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      const joined = (v as string[]).map((s) => s.trim()).filter(Boolean).join("; ");
      return joined.length > 0 ? joined : null;
    }
    return null;
  };

  return (
    fromVal(d.message) ??
    fromVal(d.detail) ??
    (typeof d.error === "string" && d.error.trim() ? d.error.trim() : null)
  );
}

/**
 * Prefer the server response message; use `fallback` only when nothing usable exists
 * (e.g. network failure with no body).
 */
export function extractApiErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (typeof err === "string") {
    const t = err.trim();
    if (t.length > 0) return t;
  }

  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;

    const fromData = pickMessageFromPayload(o.data);
    if (fromData) return fromData;

    if (typeof o.message === "string" && o.message.trim()) {
      return o.message.trim();
    }
    if (typeof o.error === "string" && o.error.trim()) {
      return o.error.trim();
    }

    const fromRoot = pickMessageFromPayload(o);
    if (fromRoot) return fromRoot;
  }

  return fallback;
}
