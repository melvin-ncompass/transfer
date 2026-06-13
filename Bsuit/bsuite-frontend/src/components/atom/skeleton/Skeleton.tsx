import React from 'react';

// material-ui
import { Skeleton, Box, Typography } from '@mui/material';

// ==============================|| SKELETON - TEXT ||============================== //

interface SkeletonTextProps {
  width?: string | number;
  height?: number;
  variant?: 'text' | 'rectangular' | 'circular';
}

export function SkeletonText({ width = '100%', height = 20, variant = 'text' }: SkeletonTextProps) {
  return (
    <Skeleton
      variant={variant}
      width={width}
      height={height}
      sx={{ borderRadius: variant === 'text' ? '4px' : undefined }}
    />
  );
}

// ==============================|| SKELETON - PROFILE INFO ||============================== //

interface SkeletonProfileInfoProps {
  lines?: number;
}

export function SkeletonProfileInfo({ lines = 3 }: SkeletonProfileInfoProps) {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {Array.from({ length: lines }).map((_, index) => (
        <Box key={index} display="flex" alignItems="center" gap={1}>
          <Box sx={{ minWidth: '120px' }}>
            <Typography variant="subtitle2">
              {index === 0 ? 'Display Name:' : index === 1 ? 'Email:' : 'Default Company:'}
            </Typography>
          </Box>
          <SkeletonText width="60%" height={24} />
        </Box>
      ))}
    </Box>
  );
}

export default SkeletonText;