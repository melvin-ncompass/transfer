/**
 * Landing View Types and Enums
 *
 * Centralized types and enums for the landing page flip card functionality.
 * Adding new modes here will automatically be available throughout the codebase.
 */

/**
 * Enum for flip card content views
 */
export enum FlipContentView {
    HERO = 'hero',
    DATA_INTEGRATION = 'data-integration',
    AUTH = 'auth',
}

/**
 * Array of all valid flip content views (for validation)
 */
export const VALID_FLIP_CONTENT_VIEWS = Object.values(FlipContentView) as string[];

/**
 * Type alias for flip content view
 */
export type FlipContent = FlipContentView;

/**
 * Enum for authentication tabs
 */
export enum AuthTab {
    SIGN_IN = 'login',
    SIGN_UP = 'register',
}

/**
 * Array of all valid auth tabs (for validation)
 */
export const VALID_AUTH_TABS = Object.values(AuthTab) as string[];

/**
 * Type alias for auth tab
 */
export type AuthTabType = AuthTab;

