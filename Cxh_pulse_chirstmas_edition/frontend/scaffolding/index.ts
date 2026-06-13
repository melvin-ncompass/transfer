/**
 * Scaffolding Components - Main Export
 *
 * This file exports all non-visualization components, sections, and pages from the scaffolding directory.
 *
 * Note: Reusable UI components (breadcrumbs, buttons, iconify, label, logo, scrollbar, svg-color, tables,
 * custom-dialog, custom-date-range-picker, color-utils) have been moved to src/components/ and should be
 * imported directly from there.
 *
 * Visualization components (deck, kepler, leaflet, charts, legends) remain in src/components.
 */

// Form Components (scaffolding-specific)
export * from './components/password-creation-form';
export * from './components/password-success';

// Sections (re-export for convenience)
export * from './sections/auth';
export * from '../src/sections/error';
export * from './sections/role';
export * from './sections/session';
export * from './sections/user';
