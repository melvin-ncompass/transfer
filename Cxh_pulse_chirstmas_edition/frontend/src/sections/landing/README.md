# Landing Section

The landing section provides the public-facing entry point to the Climate Health Pulse application. It features a modern, interactive landing page with authentication integration.

## Overview

The landing page serves as the first point of contact for users, showcasing the application's features, data sources, analytics approach, and use cases. It includes a flip-card design that transitions between the hero section and authentication forms.

## Structure

```
landing/
└── view/
    ├── landing-view.tsx          # Main landing page component
    └── components/
        ├── hero-section.tsx      # Hero section with CTA
        ├── auth-section.tsx      # Authentication forms (sign-in/sign-up)
        ├── feature-card.tsx      # Reusable feature card component
        ├── methodology-section.tsx # Methodology and approach information
        ├── landing-footer.tsx    # Footer component
        └── index.ts              # Component exports
```

## Components

### LandingView
The main landing page component that orchestrates the entire landing experience.

**Features:**
- Flip-card animation between hero and auth sections
- Automatic authentication verification
- URL parameter support for direct navigation to auth (`?showAuth=true&authTab=sign-in`)
- Feature showcase with data sources, analytics, and use cases
- Methodology section explaining the approach

**Props:** None (uses hooks and context internally)

### HeroSection
The hero section displays the main value proposition and call-to-action.

**Props:**
- `heroImage`: Image source for the hero background
- `loading`: Loading state for the explore button
- `onExploreClick`: Handler for the explore button click

### AuthSection
The authentication section containing sign-in and sign-up forms.

**Props:**
- `heroImage`: Image source for the background
- `authTab`: Current active tab ('sign-in' | 'sign-up')
- `onBackToHero`: Handler to return to hero section

### FeatureCard
Reusable card component for displaying features with icons and descriptions.

**Props:**
- `icon`: Iconify icon name
- `title`: Card title
- `subtitle`: Card subtitle
- `items`: Array of feature items with icon, label, and description

### MethodologySection
Displays the methodology and analytical approach used in the application.

### LandingFooter
Footer component with additional information and links.

## Authentication Flow

1. User clicks "Explore" button on hero section
2. System attempts to verify existing authentication
3. If authenticated, user is redirected to their first accessible navigation path
4. If not authenticated, the card flips to show authentication forms
5. Users can switch between sign-in and sign-up tabs
6. After successful authentication, users are redirected to the dashboard

## URL Parameters

The landing page supports the following URL parameters:

- `showAuth=true`: Automatically shows the authentication section
- `authTab=sign-in` or `authTab=sign-up`: Sets the initial auth tab

## Styling

Uses styles from `src/styles/pages/landing.styles.ts` with a flip-card animation system.

## Integration

- **Routes**: Mapped to the root route (`/`) in the routing system
- **Authentication**: Integrates with `authSlice` and `useLazyGetCurrentUserQuery` for user verification
- **Navigation**: Uses `getFirstAccessibleNavPath` to determine user's initial destination

## Usage Example

```tsx
import { LandingView } from 'src/sections/landing/view/landing-view';

// In routes configuration
<Route path="/" element={<LandingView />} />
```

## Related Files

- `src/pages/landing.tsx` - Page wrapper (if exists)
- `src/routes/routes.tsx` - Route configuration
- `src/store/slices/authSlice.ts` - Authentication state management

