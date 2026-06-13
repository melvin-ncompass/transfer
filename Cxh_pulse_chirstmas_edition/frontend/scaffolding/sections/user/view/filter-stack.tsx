import { Badge, Chip, Stack } from '@mui/material';

interface FilterStackProps {
  activeFilterType: string;
  pendingRequestsCount: number;
  filterCounts: Record<string, number>;
  handleFilterChange: (f: string) => void;
}

export default function FilterStack({
  activeFilterType,
  pendingRequestsCount,
  filterCounts,
  handleFilterChange,
}: FilterStackProps) {
  return (
    <Stack
      direction="column"
      spacing={1}
      sx={{ mr: { xs: 1, md: 4, lg: 4 }, alignItems: 'flex-start' }}
    >
      <Chip
        label="All"
        onClick={() => handleFilterChange('all')}
        color={activeFilterType === 'all' ? 'primary' : 'default'}
        variant={activeFilterType === 'all' ? 'filled' : 'outlined'}
        sx={{ fontWeight: activeFilterType === 'all' ? 600 : 400 }}
      />
      <Badge color="primary">
        <Chip
          label="Users"
          onClick={() => handleFilterChange('user')}
          color={activeFilterType === 'user' ? 'primary' : 'default'}
          variant={activeFilterType === 'user' ? 'filled' : 'outlined'}
          sx={{ fontWeight: activeFilterType === 'user' ? 600 : 400 }}
        />
      </Badge>
      <Badge badgeContent={filterCounts['request'] || 0} color="primary">
        <Chip
          label="Requests"
          onClick={() => handleFilterChange('request')}
          color={
            activeFilterType === 'request'
              ? 'primary'
              : pendingRequestsCount > 0
                ? 'warning'
                : 'default'
          }
          variant={activeFilterType === 'request' ? 'filled' : 'outlined'}
          sx={{
            fontWeight: activeFilterType === 'request' ? 600 : 400,
            ...(pendingRequestsCount > 0 &&
              activeFilterType !== 'request' && {
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                },
              }),
          }}
        />
      </Badge>
      <Badge badgeContent={filterCounts['invite'] || 0} color="primary">
        <Chip
          label="Invites"
          onClick={() => handleFilterChange('invite')}
          color={activeFilterType === 'invite' ? 'primary' : 'default'}
          variant={activeFilterType === 'invite' ? 'filled' : 'outlined'}
          sx={{ fontWeight: activeFilterType === 'invite' ? 600 : 400 }}
        />
      </Badge>
    </Stack>
  );
}
