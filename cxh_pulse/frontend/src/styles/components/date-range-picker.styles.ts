import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Date Range Picker Styles
 *
 * Extracted sx props for date-range-picker component
 */

export const dateRangePickerStyles = {
  /**
   * Main container
   */
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    alignItems: { xs: 'stretch', md: 'center' },
    gap: 2,
  } as SxProps<Theme>,

  /**
   * Date controls container (buttons and slider)
   */
  dateControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flex: { md: 1 },
    width: '100%',
  } as SxProps<Theme>,

  /**
   * Play controls container (wraps to new line on mobile)
   */
  playControls: {
    width: { xs: '100%', md: 'auto' },
    flexShrink: 0,
    alignSelf: { xs: 'flex-end', md: 'center' },
    display: 'flex',
    justifyContent: { xs: 'flex-end', md: 'flex-start' },
  } as SxProps<Theme>,
};
