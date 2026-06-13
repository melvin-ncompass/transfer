import { Box, Chip, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { userInfoDisplayStyles } from '../../styles/layouts/user-info-display.styles';

/**
 * UserInfoDisplay - Component to display user information (name, email, role)
 *
 * Fetches user data from Redux store and displays:
 * - User name with role as chip on same line
 * - User email on next line
 *
 * Can be reused anywhere in the application, including:
 * - Account popover header
 * - Layout header near account button
 * - Any other location where user info is needed
 */
export function UserInfoDisplay() {
  const { user } = useSelector((state: RootState) => state.auth as any);

  if (!user?.userInfo) {
    return null;
  }

  const roleName = user?.role?.name || user?.roleMappings?.[0]?.role?.name;

  return (
    <Box sx={userInfoDisplayStyles.container}>
      <Box sx={userInfoDisplayStyles.nameRoleContainer}>
        <Typography
          variant="subtitle2"
          noWrap
          sx={userInfoDisplayStyles.name(user?.userInfo?.name?.length || 0)}
        >
          {user?.userInfo?.name}
        </Typography>
        {roleName && (
          <Chip
            label={roleName}
            size="small"
            sx={userInfoDisplayStyles.roleChip}
          />
        )}
      </Box>

      <Typography
        variant="body2"
        sx={userInfoDisplayStyles.email(user?.userInfo?.email?.length || 0)}
        noWrap
      >
        {user?.userInfo?.email}
      </Typography>
    </Box>
  );
}
