import { Chip } from '@mui/material';

/**
 * DefaultRoleChip - Reusable chip component to display "Default" label for default roles
 */
export function DefaultRoleChip({ sx, ...props }: { sx?: any; [key: string]: any }) {
  return (
    <Chip
      label="Default"
      size="small"
      variant="outlined"
      sx={{
        fontSize: '0.75rem',
        height: 20,
        ...sx,
      }}
      {...props}
    />
  );
}

