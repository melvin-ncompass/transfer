/**
 * Formats a string from SCREAMING_SNAKE_CASE to Title Case
 * Example: MANAGE_USER -> User
 * Special case: MANAGE_KHIS -> KHIS (removes "Manage" prefix, KHIS stays in caps)
 *
 * @param text - The text to format
 * @returns Formatted text in Title Case (without "Manage" prefix)
 */
export function formatPermissionName(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .split('_')
    .filter((word) => word !== 'manage') // Remove "manage" from the array
    .map((word) => {
      // Keep KHIS in all caps
      if (word === 'khis') {
        return 'KHIS';
      }
      if (word === 'prompts') {
        return 'PROMPTS';
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
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
