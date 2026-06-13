// material-ui
import type { Theme } from '@mui/material/styles';
import type { AlertProps } from '@mui/material/Alert';

// project imports
import { withAlpha } from '../../utils/colorUtils';

// assets
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

//  OVERRIDES - ALERT  //

export default function Alert(theme: Theme) {
  const palette = theme.palette;

  const getPaletteColor = (severity: AlertProps['severity']) => {
    switch (severity) {
      case 'error':
        return palette.error;
      case 'warning':
        return palette.warning;
      case 'success':
        return palette.success;
      case 'info':
      default:
        return palette.info;
    }
  };

  const standardVariant = ({ ownerState }: { ownerState: AlertProps }) => {
    const color = getPaletteColor(ownerState.severity);
    return {
      color: color.main,
      backgroundColor: withAlpha(color.main, 0.075),
      '& .MuiAlert-icon': {
        color: color.main
      }
    };
  };

  const outlinedVariant = ({ ownerState }: { ownerState: AlertProps }) => {
    const color = getPaletteColor(ownerState.severity);
    return {
      color: color.main,
      borderColor: color.main,
      '& .MuiAlert-icon': {
        color: color.main
      }
    };
  };

  const filledVariant = ({ ownerState }: { ownerState: AlertProps }) => {
    const color = getPaletteColor(ownerState.severity);
    return {
      color: palette.common.white,
      backgroundColor: color.main,
      '& .MuiAlert-icon': {
        color: palette.common.white
      }
    };
  };

  return {
    MuiAlert: {
      defaultProps: {
        iconMapping: {
          info: <InfoOutlinedIcon sx={{ fontSize: 'inherit' }} />
        }
      },
      styleOverrides: {
        root: ({ ownerState }: { ownerState: AlertProps }) => {
          switch (ownerState.variant) {
            case 'outlined':
              return outlinedVariant({ ownerState });
            case 'filled':
              return filledVariant({ ownerState });
            case 'standard':
            default:
              return standardVariant({ ownerState });
          }
        }
      }
    }
  };
}
