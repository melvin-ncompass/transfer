import SimpleBar from 'simplebar-react';
import { mergeClasses } from 'minimal-shared/utils';

import { styled } from '@mui/material/styles';

import { scrollbarClasses } from './classes';
import { scrollbarStyles } from '../../styles/components/scrollbar.styles';

import type { ScrollbarProps } from './types';

// ----------------------------------------------------------------------

/**
 * Custom scrollbar component with smooth scrolling and modern styling
 * 
 * Wraps SimpleBar to provide:
 * - Custom styled scrollbars
 * - Smooth scrolling behavior
 * - Configurable content filling
 * - Customizable scrollbar appearance
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Scrollbar>
 *   <LongContentList />
 * </Scrollbar>
 * 
 * // With custom styling
 * <Scrollbar sx={{ height: 400 }}>
 *   <Content />
 * </Scrollbar>
 * ```
 */
export function Scrollbar({
  sx,
  ref,
  children,
  className,
  slotProps,
  fillContent = true, // If true, content fills the entire height
  ...other
}: ScrollbarProps) {
  return (
    <ScrollbarRoot
      scrollableNodeProps={{ ref }}
      clickOnTrack={false} // Prevents scrolling by clicking on track
      fillContent={fillContent}
      className={mergeClasses([scrollbarClasses.root, className])}
      sx={[
        scrollbarStyles.root(slotProps),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {children}
    </ScrollbarRoot>
  );
}

// ----------------------------------------------------------------------

const ScrollbarRoot = styled(SimpleBar, {
  shouldForwardProp: (prop: string) => !['fillContent', 'sx'].includes(prop),
})<Pick<ScrollbarProps, 'fillContent'>>(({ fillContent }) => ({
  minWidth: 0,
  minHeight: 0,
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  ...(fillContent && {
    '& .simplebar-content': {
      display: 'flex',
      flex: '1 1 auto',
      minHeight: '100%',
      flexDirection: 'column',
    },
  }),
}));
