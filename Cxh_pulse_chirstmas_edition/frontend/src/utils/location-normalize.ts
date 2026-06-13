/**
 * Normalizes location names (ward, subcounty, county) for consistent matching
 *
 * Removes common suffixes, whitespace, and special characters to create
 * a standardized format for comparison.
 *
 * @param str - The location name to normalize
 * @returns Normalized string (lowercase, no spaces, no special chars, suffixes removed)
 *
 * @example
 * normalizeLocationName("Olkeri Ward") // "olkeri"
 * normalizeLocationName("Ngong Sub County") // "ngong"
 * normalizeLocationName("KAJIADO") // "kajiado"
 */
export function normalizeLocationName(str: string): string {
  if (!str) return '';
  return (
    str
      .trim()
      .toLowerCase()
      // Remove ward suffixes
      .replace(/\s+ward$/i, '')
      .replace(/ward$/i, '')
      // Remove subcounty suffixes
      .replace(/\s+sub\s+county$/i, '')
      .replace(/subcounty$/i, '')
      // Remove all whitespace
      .replace(/\s+/g, '')
      // Remove all non-alphanumeric characters
      .replace(/[^a-z0-9]/g, '')
  );
}
