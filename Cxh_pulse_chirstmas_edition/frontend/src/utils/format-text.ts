/**
 * Formats a string from SCREAMING_SNAKE_CASE to Title Case
 * Example: MANAGE_USER -> Manage User
 *
 * @param text - The text to format
 * @returns Formatted text in Title Case
 */
export function formatPermissionName(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats a string from snake_case or SCREAMING_SNAKE_CASE to Title Case
 * Example: manage_user -> Manage User
 *
 * @param text - The text to format
 * @returns Formatted text in Title Case
 */
export function toTitleCase(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const toSmallTitleCase = (str: string): string => {
  if (!str) return str;
  return str
    .toLowerCase()
    .replace(/(^|[/\-\s])([a-z])/g, (match, delimiter, letter) => delimiter + letter.toUpperCase());
};

export { toSmallTitleCase };
