import type { BoxProps } from '@mui/material/Box';

import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';

import { layoutClasses } from '../core/classes';
import { authContentStyles } from '../../styles/layouts/auth-content.styles';

// ----------------------------------------------------------------------

export type AuthContentProps = BoxProps;

export function AuthContent({ sx, children, className, ...other }: AuthContentProps) {
  return (
    <Box
      className={mergeClasses([layoutClasses.content, className])}
      sx={[
        authContentStyles.container,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {children}
    </Box>
  );
}
