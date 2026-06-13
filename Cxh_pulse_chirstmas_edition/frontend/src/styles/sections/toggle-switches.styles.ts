import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Toggle Switches Styles
 * 
 * Extracted sx props for toggle-switches component
 */

const TEMPERATURE_COLOR = '#ff6b35';
const PRECIPITATION_COLOR = '#4a90e2';

export const toggleSwitchesStyles = {
  /**
   * Temperature switch
   */
  temperatureSwitch: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: TEMPERATURE_COLOR,
    },
    '& .MuiSwitch-thumb': {
      width: 15,
      marginTop: 0.43,
      marginLeft: 0.3,
      height: 15,
      borderRadius: '50%',
      backgroundColor: TEMPERATURE_COLOR,
    },
    '& .MuiSwitch-track': {
      height: 20,
      width: 36,
      borderRadius: 7,
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
  } as SxProps<Theme>,

  /**
   * Precipitation switch
   */
  precipitationSwitch: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: PRECIPITATION_COLOR,
    },
    '& .MuiSwitch-thumb': {
      width: 15,
      height: 15,
      marginTop: 0.43,
      marginLeft: 0.3,
      borderRadius: '50%',
      backgroundColor: PRECIPITATION_COLOR,
    },
    '& .MuiSwitch-track': {
      height: 20,
      width: 36,
      borderRadius: 7,
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
  } as SxProps<Theme>,

  /**
   * Form control label
   */
  formControlLabel: {
    m: 0,
    alignItems: 'center',
    justifyContent: 'center',
    '& .MuiFormControlLabel-label': {
      ml: 1,
    },
  } as SxProps<Theme>,
};
