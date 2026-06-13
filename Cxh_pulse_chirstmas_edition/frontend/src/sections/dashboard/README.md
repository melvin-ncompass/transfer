# Dashboard Section

The dashboard section is the core visualization hub of the Climate Health Pulse application. It provides comprehensive data visualization and analysis tools through a tabbed interface.

## Overview

The dashboard section contains multiple specialized views for different aspects of climate-health data analysis:
- **Overview**: Interactive maps, indicator trends, and climate correlations
- **Climate**: Temperature and precipitation visualizations
- **PROMPTS**: Conversational data analysis and risk visualization
- **Forecast**: Predictive analytics and forecasting

## Structure

```
dashboard/
├── dashboard-view.tsx          # Main dashboard container with tabs
├── components/                  # Shared dashboard components
│   ├── dashboard-filters.tsx
│   ├── dashboard-filters-section.tsx
│   ├── dashboard-sidebar.tsx
│   └── dashboard-sidebar-section.tsx
├── hooks/                      # Dashboard-specific hooks
│   ├── use-dashboard-filters.ts
│   ├── use-dashboard-state.ts
│   └── use-fullscreen.ts
├── overview/                   # Overview tab
│   ├── overview-view.tsx
│   ├── api/                    # API endpoints
│   ├── components/             # Overview components
│   ├── hooks/                  # Overview-specific hooks
│   └── utils/                  # Utility functions
├── climate/                    # Climate tab
│   ├── climate-view.tsx
│   ├── api/
│   ├── components/
│   ├── contexts/
│   └── utils/
├── prompts/                    # PROMPTS tab
│   ├── prompt-view.tsx
│   ├── api/
│   └── components/
├── forecast/                   # Forecast tab
│   ├── forecast-view.tsx
│   └── components/
└── index.ts                    # Public exports
```

## Main Component

### DashboardView

The main dashboard container that manages tab navigation and permission-based access.

**Features:**
- Tab-based navigation with lazy loading
- Permission-based tab visibility
- Data fetching for shared insights data
- Loading states and skeletons
- Cross-tab navigation support

**Tabs:**
1. **Overview** (id: 0) - Requires `OVERVIEW` permission
2. **PROMPTS** (id: 4) - Requires `PROMPTS` permission
3. **Climate** (id: 5) - Requires `CLIMATE` permission
4. **Forecast** (id: 6) - Requires `FORECAST` permission

**Props:** None (uses hooks and API queries internally)

## Sub-Sections

### Overview

The overview section provides a comprehensive dashboard with interactive maps and trend analysis.

**Key Features:**
- Choropleth maps with ward-level data visualization
- Indicator trends table with sparklines
- Climate data correlation charts
- Date range filtering
- Location selection (ward, subcounty, county)
- Multi-indicator selection
- Animation support for time-series data

**Components:**
- `ChoroplethMap`: Interactive map with GeoJSON layers
- `IndicatorTrendsTable`: Table with trend visualization
- `PromptsTrendsTable`: PROMPTS-specific trend table
- `OverviewFilters`: Filter controls for date range, location, and indicators

**Hooks:**
- `use-location-handlers`: Location selection logic
- `use-date-range-handlers`: Date range management
- `use-indicator-management`: Indicator selection and filtering
- `use-choropleth-layers`: Map layer management
- `use-climate-data`: Climate data fetching and processing
- `use-indicator-data`: Indicator data management

### Climate

The climate section focuses on temperature and precipitation visualization.

**Key Features:**
- Monthly temperature line charts
- Monthly rainfall line charts
- Combined temperature-precipitation charts
- Temperature heatmaps (monthly/yearly)
- Rainfall heatmaps (monthly/yearly)
- Climate-health correlation filters
- Chart hover context for cross-chart interactions

**Components:**
- `ClimateCharts`: Main chart container
- `MonthlyTemperatureLineChart`: Temperature trend visualization
- `MonthlyRainfallLineChart`: Rainfall trend visualization
- `MonthlyTemperaturePrecipitationChart`: Combined visualization
- `MonthlyTemperatureHeatmap`: Temperature heatmap
- `MonthlyRainfallHeatmap`: Rainfall heatmap
- `ClimateAndHealthFilter`: Filter for correlating climate with health data

**Contexts:**
- `ChartHoverContext`: Manages hover state across multiple charts

### PROMPTS

The PROMPTS section analyzes conversational data from pregnant women.

**Key Features:**
- Intent relative intensity heatmap
- Temperature priority distribution chart
- Risk treemaps (maternal and baby risks)
- Cross-chart filtering via context
- Interactive chart selection

**Components:**
- `IntentRelativeIntensityHeatmap`: Heatmap showing intent intensity over time
- `TemperaturePriorityDistributionChart`: Distribution of temperature-related priorities
- `RiskTreemap`: Treemap visualization for risk categories
- `PromptFilterContext`: Context provider for cross-chart filtering

**API:**
- `promptsApi.ts`: RTK Query endpoints for PROMPTS data

### Forecast

The forecast section provides predictive analytics and forecasting.

**Key Features:**
- Climate forecast (temperature and precipitation)
- Health indicator forecasts:
  - Severe MUAC Percentage
  - Stillbirth Rate
  - Low Birth Weight Percentage
  - Neonatal Mortality Rate
  - Malaria Case Rate
- 12-month prediction windows
- Danger zone identification

**Components:**
- `ForecastChart`: Individual indicator forecast chart
- `ForecastClimateChart`: Climate forecast visualization
- `ClimateChartTooltip`: Custom tooltip for forecast charts

**API:**
- Uses `useGetKhisPredictionQuery` for health indicators
- Uses `useGetCopernicusPredictionQuery` for climate data

## Shared Components

### Dashboard Filters
- `DashboardFilters`: Main filter component
- `DashboardFiltersSection`: Filter section wrapper
- `DashboardSidebar`: Sidebar navigation
- `DashboardSidebarSection`: Sidebar section wrapper

## Hooks

### use-dashboard-filters
Manages filter state and logic for the dashboard.

### use-dashboard-state
Manages overall dashboard state and data.

### use-fullscreen
Handles fullscreen mode for dashboard views.

## Data Flow

1. **DashboardView** fetches shared data (wards, indicators, GeoJSON)
2. Data is passed to individual tab components via props
3. Each tab component manages its own specific data fetching
4. Components use RTK Query for API calls
5. State management through React hooks and contexts

## Permission System

Each tab requires specific permissions:
- `PermissionName.OVERVIEW` for Overview tab
- `PermissionName.PROMPTS` for PROMPTS tab
- `PermissionName.CLIMATE` for Climate tab
- `PermissionName.FORECAST` for Forecast tab

Tabs are automatically hidden if the user lacks the required permissions.

## Performance Optimizations

- **Lazy Loading**: Tab components are lazy-loaded to reduce initial bundle size
- **Code Splitting**: Each tab is a separate code chunk
- **Memoization**: Data is memoized to prevent unnecessary re-renders
- **Suspense**: Loading states with Suspense boundaries
- **Skeleton Loading**: Skeleton components for better UX

## Styling

Uses styles from:
- `src/styles/layouts/insights.styles.ts` - Main dashboard styles
- `src/styles/layouts/overview-view.styles.ts` - Overview-specific styles

## Integration

- **Routes**: Mapped to `/dashboard` route
- **API**: Uses RTK Query endpoints from `src/api`
- **Permissions**: Integrates with `useUserPermissions` hook
- **Navigation**: Supports cross-tab navigation from Overview to Climate/PROMPTS

## Usage Example

```tsx
import { DashboardView } from 'src/sections/dashboard';

// In routes configuration
<Route path="/dashboard" element={<DashboardView />} />
```

## Related Files

- `src/pages/dashboard.tsx` - Page wrapper
- `src/routes/routes.tsx` - Route configuration
- `src/types/insights.types.ts` - Type definitions
- `src/types/indicators.ts` - Indicator type definitions
- `src/types/permissions.ts` - Permission definitions

