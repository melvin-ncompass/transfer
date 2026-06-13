# Config Section

The config section provides a user interface for managing climate-health alert thresholds and configuration settings.

## Overview

The configuration section allows administrators and authorized users to adjust critical thresholds that trigger alerts and warnings in the Climate Health Pulse application. These thresholds directly impact how the system identifies and reports climate-related health risks.

## Structure

```
config/
├── view/
│   └── config-view.tsx      # Main configuration view component
└── api/
    └── dataConfigApi.ts      # RTK Query API endpoints for configuration
```

## Components

### ConfigView

The main configuration view component that provides a user interface for managing alert thresholds.

**Features:**
- Temperature danger zone threshold configuration
- Precipitation risk threshold configuration
- Real-time threshold value display
- Impact preview for each threshold
- Save functionality with loading states
- Success/error notifications via snackbar

**Configuration Options:**

1. **Temperature Danger Zone**
   - Threshold range: 20°C to 40°C
   - Default: 28.5°C
   - Step: 0.1°C
   - Purpose: Maximum temperature threshold for heat stress alerts
   - Impact: When exceeded, triggers warnings about:
     - Maternal distress indicators (15-20% increase)
     - SMS guidance deployment recommendations
     - Clinic hours adjustment suggestions

2. **Precipitation Risk Threshold**
   - Threshold range: 100mm to 300mm
   - Default: 170mm
   - Step: 1mm
   - Purpose: Monthly rainfall threshold for malaria risk prediction
   - Impact: When exceeded, indicates:
     - Increased malaria incidence (2-3 weeks after heavy rainfall)
     - Need for antimalarial stock review
     - Vector control intervention recommendations

**State Management:**
- Uses RTK Query for fetching and updating configuration
- Local state for form values
- Change detection to enable/disable save button
- Snackbar state for notifications

## API Integration

### dataConfigApi.ts

RTK Query endpoints for configuration management:

- `useGetConfigurationQuery`: Fetches current configuration
- `useUpdateConfigurationMutation`: Updates configuration with new thresholds

**Configuration Object:**
```typescript
{
  config: {
    temperatureThreshold: number;  // Default: 28.5
    precipitationThreshold: number; // Default: 170
  }
}
```

## User Experience

1. **Loading State**: Shows loading indicator while fetching configuration
2. **Form Controls**: Slider controls with value labels for easy adjustment
3. **Visual Feedback**: 
   - Real-time value display
   - Impact preview sections
   - Disabled save button when no changes detected
4. **Notifications**: Success/error snackbars for save operations
5. **Validation**: Automatic validation of threshold ranges

## Styling

Uses styles from `src/styles/pages/config.styles.ts`:
- Container styles
- Card content styles
- Slider styles
- Threshold value display
- Button container styles
- Snackbar alert styles

## Permission Requirements

The configuration page should be protected by appropriate permissions. Users must have configuration management permissions to access and modify these settings.

## Integration

- **Routes**: Typically mapped to `/config` route
- **API**: Integrates with backend configuration API
- **State**: Uses RTK Query for server state management
- **Notifications**: Uses Material-UI Snackbar for user feedback

## Usage Example

```tsx
import { ConfigView } from 'src/sections/config/view/config-view';

// In routes configuration
<Route path="/config" element={<ConfigView />} />
```

## Related Files

- `src/pages/config.tsx` - Page wrapper (if exists)
- `src/routes/routes.tsx` - Route configuration
- `src/api/index.ts` - API exports
- `src/styles/pages/config.styles.ts` - Styling definitions

## Best Practices

1. **Validation**: Always validate threshold values before saving
2. **Error Handling**: Provide clear error messages for failed operations
3. **Default Values**: Use sensible defaults when configuration is unavailable
4. **Change Detection**: Only enable save when actual changes are detected
5. **User Feedback**: Always provide feedback for save operations (success/error)

