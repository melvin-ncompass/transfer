/** RTK Query / fetch-base-query error `status` when present. */
export function getFetchErrorStatus(error: unknown): number | string | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const s = (error as { status: unknown }).status;
    if (typeof s === "number" || typeof s === "string") return s;
  }
  return undefined;
}

export function isUnauthorizedError(error: unknown): boolean {
  const s = getFetchErrorStatus(error);
  return s === 401 || s === 403;
}
