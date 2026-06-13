import { Stack, FormControlLabel, Switch, Typography } from '@mui/material';
import { toggleSwitchesStyles } from '../../../../styles/sections/toggle-switches.styles';
import type { ToggleSwitchesProps } from '../../../../types/sections.types';

export function ToggleSwitches({
    showTemperature,
    showPrecipitation,
    onTemperatureChange,
    onPrecipitationChange,
}: ToggleSwitchesProps) {
    return (
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
            <FormControlLabel
                control={
                    <Switch
                        checked={showTemperature}
                        onChange={(e) => onTemperatureChange(e.target.checked)}
                        size="medium"
                        sx={toggleSwitchesStyles.temperatureSwitch}
                    />
                }
                label={<Typography variant="body2">Temperature</Typography>}
                sx={toggleSwitchesStyles.formControlLabel}
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={showPrecipitation}
                        onChange={(e) => onPrecipitationChange(e.target.checked)}
                        size="medium"
                        sx={toggleSwitchesStyles.precipitationSwitch}
                    />
                }
                label={<Typography variant="body2">Precipitation</Typography>}
                sx={toggleSwitchesStyles.formControlLabel}
            />
        </Stack>
    );
}

