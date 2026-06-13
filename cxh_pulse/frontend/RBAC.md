import { FormControlLabel, Switch, Typography } from "@mui/material"
import { useUserPermissions } from "src/hooks"
import type { Permission } from "src/types"


```tsx
import React from "react";
import { FormControlLabel, Switch, Typography } from "@mui/material";
import { useUserPermissions } from "src/hooks";
import type { Permission } from "src/types";

// ========================================================
//  BUSINESS PERMISSION ENUM
// ========================================================
export const enum BusinessPermission {
  CAN_SEE_FACILITIES = "CAN_SEE_FACILITIES",
  CAN_SEE_TIME_SERIES = "CAN_SEE_TIME_SERIES",
}

// =======================================================
//  BASE COMPONENT: _FacilityToggle
// =======================================================
export const _FacilityToggle = ({
  showFacilities,
  setShowFacilities,
  isLoadingTemperature,
}: {
  showFacilities: boolean;
  setShowFacilities: (checked: boolean) => void;
  isLoadingTemperature: boolean;
}) => (
  <FormControlLabel
    control={
      <Switch
        size="medium"
        checked={showFacilities}
        onChange={(_, checked) => setShowFacilities(checked)}
        disabled={isLoadingTemperature}
      />
    }
    label={
      <Typography variant="body2" sx={{ ml: 1 }}>
        Facilities
      </Typography>
    }
  />
);

// ========================================================
//  HIGHER-ORDER COMPONENT: withPermission
// ========================================================
const withPermission =
  <P extends object>(
    Component: React.ComponentType<P>,
    allowedPermissions: BusinessPermission[]
  ) =>
  (props: P) => {
    // Retrieve current user permissions.
    // NOTE: BACKEND HAS NOT ENABLED ANY BUSINESS PERMISSION YET FROM API. THIS LINE IS FOR REFERENCE.
    const userPermissions = useUserPermissions();

    // Check if the user has at least one allowed permission
    const hasPermission = Array.isArray(allowedPermissions)
      ? allowedPermissions.some((perm) => userPermissions.includes(perm))
      : userPermissions.includes(allowedPermissions);

    if (!hasPermission) {
      return null; 
    }

    return <Component {...props} />;
  };

// ========================================================
//  WRAP COMPONENT WITH PERMISSION CHECK
// ========================================================
export const FacilityToggle = withPermission(_FacilityToggle, [
  BusinessPermission.CAN_SEE_FACILITIES,
  BusinessPermission.CAN_SEE_TIME_SERIES,
]);