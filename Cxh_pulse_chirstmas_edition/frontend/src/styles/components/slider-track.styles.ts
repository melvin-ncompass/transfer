import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Slider Track Styles
 * 
 * Extracted sx props for slider-track component
 */

export const sliderTrackStyles = {
  /**
   * Track container
   */
  track: (playable: boolean, isPlaying: boolean): SxProps<Theme> => ({
    backgroundColor: '#ddd',
    borderRadius: 3,
    cursor: playable && isPlaying ? 'default' : 'pointer',
    outline: 'none',
    overflow: 'visible',
    zIndex: 1,
  }),

  /**
   * Date range label (tooltip)
   */
  dateLabel: (theme: Theme): SxProps<Theme> => ({
    bgcolor: 'primary.main',
    color: 'white',
    px: 1.5,
    py: 0.1,
    borderRadius: 1.5,
    fontSize: '12px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    boxShadow: 2,
    pointerEvents: 'none',
    zIndex: 5,
    position: 'absolute',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -6,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 0,
      height: 0,
      borderLeft: '8px solid transparent',
      borderRight: '8px solid transparent',
      borderTop: `6px solid ${theme.palette.primary.main}`,
    },
  }),

  /**
   * Selected range bar
   */
  selectedRange: (playable: boolean, isPlaying: boolean, dragTarget: 'start' | 'end' | 'middle' | 'thumb' | null): SxProps<Theme> => ({
    backgroundColor: 'primary.main',
    borderRadius: 3,
    transition: 'left 0.2s, width 0.2s',
    cursor:
      playable && isPlaying
        ? 'default'
        : dragTarget === 'middle'
          ? 'grabbing'
          : dragTarget === 'start' || dragTarget === 'end'
            ? 'ew-resize'
            : 'grab',
    opacity: playable && isPlaying ? 0.5 : 1,
  }),

  /**
   * Current frame thumb (playable mode)
   */
  frameThumb: (isPlaying: boolean): SxProps<Theme> => ({
    transform: 'translate(-50%, -50%)',
    width: 16,
    height: 16,
    borderRadius: '50%',
    bgcolor: 'primary.main',
    border: '2px solid white',
    boxShadow: 2,
    zIndex: 10,
    cursor: isPlaying ? 'pointer' : 'grab',
    '&:active': {
      cursor: 'grabbing',
    },
  }),

  /**
   * Handle (start/end)
   */
  handle: (playable: boolean): SxProps<Theme> => ({
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'transparent',
    borderRadius: '50%',
    cursor: 'ew-resize',
    zIndex: playable ? 11 : 1,
    pointerEvents: 'all',
    opacity: 0,
  }),
};
