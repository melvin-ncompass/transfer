/**
 * Utility function to escape cell values for CSV formatting.
 * Handles commas, double-quotes, newlines, and strips HTML tags if needed.
 */
export const escapeCSVValue = (val: unknown): string => {
  if (val === undefined || val === null) return "";
  let str = String(val);
  
  // Strip HTML tags if present (e.g., <ul><li>...</li></ul>)
  if (/<[a-z/][\s\S]*>/i.test(str)) {
    str = str
      .replace(/<li[^>]*>/gi, "• ") // format list items
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]*>/g, "") // strip remaining tags
      .replace(/\n\s*\n/g, "\n") // collapse multiple newlines
      .trim();
  }

  // Escape double quotes by doubling them
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Creates and triggers a download for a CSV file.
 * Automatically prepends UTF-8 Byte Order Mark (BOM) so Excel decodes it correctly.
 */
export const exportToCSV = (
  fileName: string,
  headers: string[],
  rows: (string | number | boolean)[][]
): void => {
  const headerRow = headers.map(escapeCSVValue).join(",");
  const bodyRows = rows.map((row) => row.map(escapeCSVValue).join(",")).join("\n");
  
  // Prepend UTF-8 BOM
  const csvContent = "\uFEFF" + headerRow + "\n" + bodyRows;
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
