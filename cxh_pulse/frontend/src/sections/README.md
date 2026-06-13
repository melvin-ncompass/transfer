# Sections Module

This directory contains all the main feature sections of the Climate Health Pulse application. Each section represents a distinct functional area of the application.

## Overview

The `sections` directory follows a modular architecture where each section is self-contained with its own views, components, API integrations, hooks, and utilities. This structure promotes code organization, reusability, and maintainability.

## Directory Structure

```
sections/
├── landing/          # Landing page with hero, features, and authentication
├── dashboard/        # Main dashboard with multiple visualization tabs
├── config/           # Configuration settings for climate-health thresholds
├── error/            # Error pages (404, access denied)
├── compare/          # (Empty - reserved for future use)
├── disease/          # (Empty - reserved for future use)
└── kepler/           # (Empty - reserved for future use)
```

## Module Organization

Each section module typically follows this structure:

```
section-name/
├── api/              # RTK Query API endpoints
├── components/       # Reusable components specific to this section
├── hooks/            # Custom React hooks
├── contexts/         # React contexts (if needed)
├── utils/            # Utility functions
├── view/             # Main view components
├── index.ts          # Public exports
└── README.md         # Module-specific documentation
```

## Sections

### [Landing](./landing/README.md)
The landing page section provides the public-facing entry point to the application. It includes hero sections, feature showcases, methodology information, and authentication flows.

### [Dashboard](./dashboard/README.md)
The main dashboard section is the core visualization hub of the application. It contains multiple tabs for different data views:
- **Overview**: Choropleth maps, indicator trends, and climate data visualization
- **Climate**: Temperature and precipitation charts and heatmaps
- **PROMPTS**: Risk treemaps, intensity heatmaps, and priority distribution charts
- **Forecast**: Predictive analytics and forecasting visualizations
- **Health**: Health indicators and ward-level pie charts

### [Config](./config/README.md)
Configuration section for managing climate-health alert thresholds, including temperature danger zones and precipitation risk thresholds.

### [Error](./error/README.md)
Error handling section providing user-friendly error pages for 404 (Not Found) and access denied scenarios.

## Best Practices

1. **Self-Contained Modules**: Each section should be as self-contained as possible, with minimal dependencies on other sections.

2. **Public API**: Use `index.ts` files to define the public API of each section, exporting only what's needed by other parts of the application.

3. **Type Safety**: All components and functions should be properly typed using TypeScript.

4. **Code Splitting**: Use React lazy loading for large sections to improve initial load performance.

5. **Permission-Based Access**: Sections should respect user permissions and only render content the user has access to.

6. **Consistent Structure**: Follow the established directory structure pattern for consistency across sections.

## Integration with Routes

Sections are integrated into the application routing system through the `routes` directory. Each section's main view component is typically mapped to a route in `src/routes/routes.tsx`.

## Related Documentation

- [Navigation System Guide](../../NAVIGATION_SYSTEM_GUIDE.md)
- [Permissions Guide](../../PERMISSIONS_GUIDE.md)
- [Migration to Sections Complete](../../MIGRATION_TO_SECTIONS_COMPLETE.md)

