import { memo } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { Iconify } from '../../../components/iconify';
import { insightsLayoutComponentStyles } from '../../../styles/layouts/insights-layout.styles';

type DashboardSidebarProps = {
    isOpen: boolean;
    onToggle: (open: boolean) => void;
    sidebarWidth: string | number;
    sidebarTitle?: string;
    sidebarCollapsible?: boolean;
    children?: React.ReactNode;
};

/**
 * DashboardSidebar - Extracted sidebar component from DashboardLayout
 * 
 * Handles:
 * - Sidebar visibility toggle
 * - Collapse/expand animations
 * - Sidebar content rendering
 */
export const DashboardSidebar = memo(function DashboardSidebar({
    isOpen,
    onToggle,
    sidebarWidth,
    sidebarTitle = 'Dashboard',
    sidebarCollapsible = true,
    children,
}: DashboardSidebarProps) {
    return (
        <>
            {/* Sidebar Container */}
            <Box sx={insightsLayoutComponentStyles.sidebarContainer(isOpen, sidebarWidth)}>
                <Box sx={insightsLayoutComponentStyles.sidebarHeader}>
                    <Typography variant="h6" sx={insightsLayoutComponentStyles.sidebarTitle}>
                        {sidebarTitle}
                    </Typography>
                    {sidebarCollapsible && (
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggle(false);
                            }}
                            startIcon={<Iconify icon={'solar:double-alt-arrow-right-bold' as any} width={18} />}
                            sx={insightsLayoutComponentStyles.collapseButton}
                            aria-label="Collapse sidebar"
                        >
                            Collapse
                        </Button>
                    )}
                </Box>
                {children}
            </Box>

            {/* Collapsed Sidebar Toggle */}
            {sidebarCollapsible && !isOpen && (
                <Box sx={insightsLayoutComponentStyles.collapsedSidebarContainer}>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggle(true);
                        }}
                        sx={insightsLayoutComponentStyles.expandButton}
                        aria-label="Expand sidebar"
                    >
                        <Iconify icon={'solar:double-alt-arrow-left-bold' as any} width={24} />
                        <Typography variant="caption" sx={insightsLayoutComponentStyles.sidebarTitleVertical}>
                            {sidebarTitle}
                        </Typography>
                    </IconButton>
                </Box>
            )}
        </>
    );
});
