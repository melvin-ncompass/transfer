import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Playable Controls Styles
 * 
 * Extracted sx props for playable-controls component
 */

export const playableControlsStyles = {
  /**
   * Container
   */
  container: {
    display: 'flex',
    gap: 1,
    alignItems: 'center',
    flexShrink: 0,
  } as SxProps<Theme>,

  /**
   * Play/Pause button
   */
  playButton: {
    minWidth: 'auto',
    width: 40,
    height: 40,
    p: 0,
  } as SxProps<Theme>,

  /**
   * Loop toggle button
   */
  loopButton: {
    minWidth: 'auto',
    width: 40,
    height: 40,
    p: 0,
  } as SxProps<Theme>,

  /**
   * Show all button
   */
  showAllButton: (showAll: boolean, isPlaying: boolean): SxProps<Theme> => ({
    minWidth: 'auto',
    px: 1.5,
    height: 40,
    width: 40,
    color: showAll ? 'primary.main' : 'text.primary',
    cursor: isPlaying ? 'not-allowed' : 'pointer',
  }),
};
