import { CONFIG } from '../../config-global';
import { FlipContentView } from '../../sections/landing/types';
import type { AuthTabType } from '../../sections/landing/types';

/**
 * Key for storing the redirect URL in sessionStorage
 * Used to preserve the original URL when redirecting unauthenticated users to sign-in
 */
export const REDIRECT_URL_KEY = 'auth_redirect_url';

/**
 * Get the authentication URL based on CONFIG.useFlipCardLanding
 *
 * @param tab - The auth tab (AuthTabType: 'sign-in' | 'sign-up')
 * @returns The URL string for the authentication page
 *
 * @example
 * getAuthUrl('sign-in') // Returns '/${tab}' or '/get-started?showAuth=true&authTab=sign-in'
 */
export function getAuthUrl(tab: AuthTabType): string {
  if (CONFIG.useFlipCardLanding) {
    // New flip card format - URL-driven with view and tab params
    return `/${tab}`;
  }
  // Old get-started format - navigates to /get-started page
  return `/get-started?showAuth=true&authTab=${tab}`;
}

/**
 * Checks if the given pathname is an authentication page
 * @param pathname - The pathname to check
 * @returns true if the pathname is an auth page, false otherwise
 */
function isAuthPage(pathname: string): boolean {
  return pathname === '/';
}

/**
 * Saves the current URL as a redirect URL to sessionStorage
 * Only saves if the current path is not an auth page and no redirect URL is already saved
 *
 * @param pathname - The current pathname
 * @param search - The current search params (query string)
 * @returns void
 */
export function saveRedirectUrl(pathname: string, search: string): void {
  if (isAuthPage(pathname)) {
    return;
  }

  // Only save if not already saved (to prevent overwriting)
  if (!sessionStorage.getItem(REDIRECT_URL_KEY)) {
    const redirectUrl = pathname + search;
    sessionStorage.setItem(REDIRECT_URL_KEY, redirectUrl);
  }
}

/**
 * Gets the saved redirect URL from sessionStorage
 * @returns The saved redirect URL or null if none exists
 */
export function getSavedRedirectUrl(): string | null {
  return sessionStorage.getItem(REDIRECT_URL_KEY);
}

/**
 * Clears the saved redirect URL from sessionStorage
 * @returns void
 */
export function clearSavedRedirectUrl(): void {
  sessionStorage.removeItem(REDIRECT_URL_KEY);
}
