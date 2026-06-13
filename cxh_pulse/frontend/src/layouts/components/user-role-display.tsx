import { Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { userRoleDisplayStyles } from '../../styles/layouts/user-role-display.styles';

export function UserRoleDisplay() {
    const { user } = useSelector((state: RootState) => state.auth as any);

    const roleName = user?.role?.name || user?.roleMappings?.[0]?.role?.name;

    if (!roleName) {
        return null;
    }

    return (
        <Typography
            variant="body2"
            sx={userRoleDisplayStyles.role(roleName.length)}
            style={{ fontSize: '11px' }}
            noWrap
        >
            {roleName}
        </Typography>
    );
}

