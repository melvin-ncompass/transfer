import { Badge, Chip, Stack } from '@mui/material';
import { UserType } from '../../../../src/types/user.types';

interface FilterStackProps {
  activeFilterType: string;
  recordsTotal: number;
  pendingRequests: {
    requests: number;
    invites: number;
  }
  handleFilterChange: (f: string) => void;
}

export default function FilterStack({
  activeFilterType,
  recordsTotal,
  pendingRequests,
  handleFilterChange,
}: FilterStackProps) {
  return (
    <Stack
      direction="column"
      spacing={1}
      sx={{ mr: { xs: 1, md: 4, lg: 4 }, alignItems: 'flex-start' }}
    >
      <Badge badgeContent={recordsTotal} color='primary'>
        <Chip
          label='All'
          onClick={() => handleFilterChange('all')}
          color={activeFilterType === 'all' ? 'primary' : 'default'}
          variant={activeFilterType === 'all' ? 'filled' : 'outlined'}
          sx={{ fontWeight: activeFilterType === 'all' ? 600 : 400 }}
        />
      </Badge>
      <Badge color="primary">
        <Chip
          label="Users"
          onClick={() => handleFilterChange('user')}
          color={activeFilterType === UserType.USER ? 'primary' : 'default'}
          variant={activeFilterType === UserType.USER ? 'filled' : 'outlined'}
          sx={{ fontWeight: activeFilterType === UserType.USER ? 600 : 400 }}
        />
      </Badge>
      <Badge badgeContent={pendingRequests.requests} color="primary">
        <Chip
          label="Requests"
          onClick={() => handleFilterChange('request')}
          color={
            activeFilterType === UserType.REQUEST
              ? 'primary'
              : pendingRequests.requests > 0
                ? 'warning'
                : 'default'
          }
          variant={activeFilterType === UserType.REQUEST ? 'filled' : 'outlined'}
          sx={{
            fontWeight: activeFilterType === UserType.REQUEST ? 600 : 400,
            ...(pendingRequests.requests > 0 &&
              activeFilterType !== UserType.REQUEST && {
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 },
              },
            }),
          }}
        />
      </Badge>
      <Badge badgeContent={pendingRequests.invites} color="primary">
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
