import { Box, useTheme, Typography } from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { PermissionName, getAllPermissionNames } from '../../types/permissions';
import { cxhNavHeaderStyles } from '../../styles/layouts/cxh-nav-header.styles';

interface NavigationLink {
    href: string;
    label: string;
    requiredPermissions: string[];
}

const NAVIGATION_LINKS: NavigationLink[] = [
    {
        href: '/dashboard',
        label: 'Dashboard',
        requiredPermissions: [PermissionName.DASHBOARD],
    },
    {
        href: '/datatable',
        label: 'Data',
        requiredPermissions: [PermissionName.DATA],
    },
    {
        href: '/config',
        label: 'Config',
        requiredPermissions: [PermissionName.CONFIG],
    },
    {
        href: '/help',
        label: 'Help',
        requiredPermissions: [PermissionName.HELP],
    },
];

/**
 * Check if user has any of the required permissions
 */
const hasPermission = (
    userPermissions: { system?: string[]; business?: any[] } | undefined,
    requiredPermissions: string[]
): boolean => {
    if (!userPermissions) return false;

    // Extract all permission names from the nested structure
    const allPerms = getAllPermissionNames({
        system: userPermissions.system || [],
        business: userPermissions.business || []
    });
    return requiredPermissions.some(perm => allPerms.includes(perm));
};

const CXHNavHeader = () => {
    const theme = useTheme();
    const location = useLocation();
    const user = useAppSelector(selectCurrentUser);

    // Filter navigation links based on user permissions
    const allowedLinks = NAVIGATION_LINKS.filter((link) => {
        if (!user?.permissions) return false;
        return hasPermission(user.permissions, link.requiredPermissions);
    });

    return (
        <>
            {allowedLinks.map((link) => (
                <NavLink
                    key={link.href}
                    to={link.href}
                    style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                    <Box
                        sx={cxhNavHeaderStyles.navLinkBox(
                            theme,
                            location.pathname === link.href || location.pathname.startsWith(link.href)
                        )}
                    >
                        <Typography variant="h6">{link.label}</Typography>
                    </Box>
                </NavLink>
            ))}
        </>
    );
}



export default CXHNavHeader;