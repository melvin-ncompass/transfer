// material-ui
import type { Theme } from '@mui/material/styles';
import type { ChipProps } from '@mui/material/Chip';

// project imports
import { withAlpha } from '../../utils/colorUtils';

//  OVERRIDES - CHIP  //

export default function Chip(theme: Theme) {
  const palette = theme.palette;

  return {
    MuiChip: {
      defaultProps: {
        color: 'primary' as ChipProps['color'],
        variant: 'filled' as ChipProps['variant'] // light variant replaced with standard filled
      },
      styleOverrides: {
        root: {
          variants: [
            {
              props: { variant: 'filled' }, // filled variant for light theme
              style: ({ ownerState }: { ownerState: ChipProps }) => {
                const colorKey = ownerState.color || 'primary';
                const paletteColor = (palette as any)[colorKey] || palette.primary;

                let backgroundColor = paletteColor.light || paletteColor.main;
                let textColor = paletteColor.main;

                if (ownerState.color === 'error') backgroundColor = withAlpha(paletteColor.main, 0.25);
                if (ownerState.color === 'success') backgroundColor = withAlpha(paletteColor.main, 0.5);
                if (ownerState.color === 'warning' || ownerState.color === 'success') textColor = paletteColor.dark || paletteColor.main;

                return {
                  color: textColor,
                  backgroundColor,
                  '&.MuiChip-clickable:hover': {
                    color: paletteColor.light || textColor,
                    backgroundColor: paletteColor.dark || backgroundColor
                  }
                };
              }
            },
            {
              props: { variant: 'outlined', color: 'warning' },
              style: {
                borderColor: palette.warning.dark,
                color: palette.warning.dark
              }
            },
            {
              props: { variant: 'outlined', color: 'success' },
              style: {
                borderColor: palette.success.dark,
                color: palette.success.dark
              }
            }
          ],
          '&.MuiChip-deletable .MuiChip-deleteIcon': {
            color: 'inherit'
          }
        }
      }
    }
  };
}
