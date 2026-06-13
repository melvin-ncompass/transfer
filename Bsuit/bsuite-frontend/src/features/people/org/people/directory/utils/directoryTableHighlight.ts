export const DIRECTORY_HIGHLIGHT_ROW_ID_PARAM = "highlightRowId";
export const DIRECTORY_HIGHLIGHT_TYPE_PARAM = "highlightType";

/** How long the directory table keeps a row highlighted after create/edit/draft save. */
export const DIRECTORY_ROW_HIGHLIGHT_DURATION_MS = 3000;

export type DirectoryHighlightType = "add" | "edit";

/** Navigate to People → Directory with row scroll + highlight after save. */
export function buildDirectoryHomePath(
  rowId: number,
  type: DirectoryHighlightType,
): string {
  const params = new URLSearchParams({
    tab: "4",
    mainTab: "0",
    [DIRECTORY_HIGHLIGHT_ROW_ID_PARAM]: String(rowId),
    [DIRECTORY_HIGHLIGHT_TYPE_PARAM]: type,
  });
  return `/people/home?${params.toString()}`;
}
