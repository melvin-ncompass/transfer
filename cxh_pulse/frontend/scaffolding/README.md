# Scaffolding Components

Shared components and utilities directory for CXH Pulse application.

## Overview

This directory contains scaffolding-specific components, sections, and pages. **Reusable UI components** (breadcrumbs, buttons, iconify, label, logo, scrollbar, svg-color, tables, custom-dialog, custom-date-range-picker, color-utils) have been moved to `src/components/` and should be imported from there.

## Structure

```
scafolding/
├── components/     # Scaffolding-specific form components
├── sections/       # Non-visualization sections/views
├── pages/          # Non-visualization pages
└── index.ts        # Main export file
```

## Components in Scaffolding

### Form Components (Scaffolding-Specific)
- `password-creation-form` - Password form with strength indicator
- `password-success` - Password success state

## Reusable Components (in `src/components/`)

These reusable UI components are now in `src/components/` and should be imported from there:

### UI Components
- `breadcrumbs` - Navigation breadcrumbs → `src/components/breadcrumbs`
- `buttons` - Button components → `src/components/buttons`
- `custom-dialog` - Dialog/modal components → `src/components/custom-dialog`
- `iconify` - Icon components → `src/components/iconify`
- `label` - Label components → `src/components/label`
- `logo` - Logo components → `src/components/logo`
- `scrollbar` - Custom scrollbar → `src/components/scrollbar`
- `svg-color` - SVG color utilities → `src/components/svg-color`
- `tables` - Table components → `src/components/tables`

### Form Components
- `custom-date-range-picker` - Date range picker → `src/components/custom-date-range-picker`

### Utilities
- `color-utils` - Color manipulation utilities → `src/components/color-utils`

## Visualization Components (in `src/components/`)

These remain in `src/components`:
- `deck` - DeckGL map components
- `kepler` - Kepler.gl components
- `leaflet` - Leaflet map components
- `choropleth-legend` - Choropleth legend
- `precipitation-legend` - Precipitation legend
- `temperature-legend` - Temperature legend
- `health-indicators` - Health indicator charts
- `chart` - Chart components

## Usage

### Importing Reusable Components

Import reusable UI components from `src/components/`:

```typescript
// Import reusable components from root components
import { CustomBreadcrumbs } from 'src/components/breadcrumbs';
import { PrimaryButton } from 'src/components/buttons';
import { Iconify } from 'src/components/iconify';
import { DataTable } from 'src/components/tables';
import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';
```

### Importing Scaffolding Components

Import scaffolding-specific components from the scaffolding directory:

```typescript
// Import scaffolding-specific form components
import { PasswordCreationForm } from 'src/scafolding/components/password-creation-form';
import { PasswordSuccess } from 'src/scafolding/components/password-success';

// Import sections
import { SignInView } from 'src/scafolding/sections/auth';
import { UserView } from 'src/scafolding/sections/user/view';

// Import pages (using lazyScaffoldingImport for conditional loading)
import { lazyScaffoldingImport } from 'src/routes/utils/conditional-import';
const SignInPage = lazyScaffoldingImport('src/scafolding/pages/sign-in');
const UserPage = lazyScaffoldingImport('src/scafolding/pages/user');
```

## Sections Included

### Auth Sections
- `sign-in-view` - Sign in form
- `sign-up-view` - Sign up form
- `forgot-password-view` - Password recovery
- `reset-password-view` - Password reset

### Error Sections
- `access-denied-view` - Access denied page
- `not-found-view` - 404 page

### User Management Sections
- `user` - User management views
- `role` - Role management views
- `session` - Session management views

## Pages Included

All non-visualization pages have been moved to `scafolding/pages/`:
- Auth pages: sign-in, sign-up, forgot-password, reset-password, accept-invite, accept-request
- User management: user, role, session
- Dashboard: home, profile, settings, help, config, datatable, style-guide
- Error pages: access-denied, page-not-found

## Purpose

This structure allows for:
- **Reusable components** in `src/components/` - accessible throughout the application
- **Scaffolding-specific code** in `src/scafolding/` - pages, sections, and form components
- Clear separation between visualization and non-visualization code
- Easy extraction of scaffolding to a separate repository if needed in the future
- Better organization with reusable components centralized in root components directory
- Maintaining visualization components in the main repo for easier development

## Migration Notes

If you're updating existing code:
- Change `src/scafolding/components/buttons` → `src/components/buttons`
- Change `src/scafolding/components/iconify` → `src/components/iconify`
- Change `src/scafolding/components/tables` → `src/components/tables`
- And similarly for other reusable components listed above

