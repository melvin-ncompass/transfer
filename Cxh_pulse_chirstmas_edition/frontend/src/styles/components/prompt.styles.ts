import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Prompt Component Styles
 * 
 * Extracted sx props for prompt components
 */

export const promptStyles = {
  /**
   * Card container
   */
  card: {
    p: { xs: 2, sm: 3 },
  } as SxProps<Theme>,

  /**
   * Loading container
   */
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: { xs: 250, sm: 300 },
  } as SxProps<Theme>,

  /**
   * Chart card container
   */
  chartCard: {
    p: { xs: 1, sm: 3 },
    position: 'relative',
    width: '100%',
  } as SxProps<Theme>,

  /**
   * Header container
   */
  headerContainer: {
    mb: { xs: 1.5, sm: 2 },
  } as SxProps<Theme>,

  /**
   * Title container
   */
  titleContainer: {
    flex: 1,
  } as SxProps<Theme>,

  /**
   * Title
   */
  title: {
    mb: { xs: 0.5, sm: 1 },
    fontWeight: 600,
    fontSize: { xs: '1rem', sm: '1.25rem' },
  } as SxProps<Theme>,

  /**
   * Description
   */
  description: {
    mb: 0,
    color: 'text.secondary',
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
  } as SxProps<Theme>,

  /**
   * Legend container
   */
  legendContainer: {
    display: 'flex',
    justifyContent: { xs: 'flex-start', sm: 'flex-end' },
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: { xs: 1, sm: 2 },
  } as SxProps<Theme>,

  /**
   * Legend item
   */
  legendItem: {
    flexShrink: 0,
  } as SxProps<Theme>,

  /**
   * Legend color box
   */
  legendColorBox: {
    width: { xs: 12, sm: 16 },
    height: { xs: 12, sm: 16 },
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'divider',
  } as SxProps<Theme>,

  /**
   * Legend text
   */
  legendText: {
    fontSize: { xs: '0.65rem', sm: '0.75rem' },
    whiteSpace: 'nowrap',
  } as SxProps<Theme>,

  /**
   * Header stack
   */
  headerStack: {
    mb: { xs: 1, sm: 1.5 },
  } as SxProps<Theme>,
};

