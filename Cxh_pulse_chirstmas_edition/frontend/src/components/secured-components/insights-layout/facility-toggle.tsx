import { FormControlLabel, Switch, Typography } from "@mui/material"
import { WithPermission } from "../../utils/with-permission";
import { PermissionName } from '../../../types/permissions'

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

// FacilityToggle wrapped with WithPermission - parentPermission can be passed as prop at runtime
export const FacilityToggle = WithPermission(_FacilityToggle, {
  allowedPermissions: [PermissionName.FACILITY],
});