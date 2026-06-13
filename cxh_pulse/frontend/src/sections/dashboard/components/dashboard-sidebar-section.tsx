import { Box, Button, IconButton, Typography } from '@mui/material';
import { Iconify } from '../../../components/iconify';
import { insightsLayoutComponentStyles } from '../../../styles/layouts/insights-layout.styles';

type DashboardSidebarSectionProps = {
    sidebarTitle?: string;
    sidebarWidth: string | number;
    sidebarCollapsible: boolean;
    isHealthIndicatorsOpen: boolean;
    onCollapse: () => void;
    onExpand: () => void;
};

export function DashboardSidebarSection({
    sidebarTitle,
    sidebarWidth,
    sidebarCollapsible,
    isHealthIndicatorsOpen,
    onCollapse,
    onExpand,
}: DashboardSidebarSectionProps) {
    return (
        <>
            <Box sx={insightsLayoutComponentStyles.sidebarContainer(isHealthIndicatorsOpen, sidebarWidth)}>
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
                                onCollapse();
                            }}
                            startIcon={<Iconify icon={'solar:double-alt-arrow-right-bold' as any} width={18} />}
                            sx={insightsLayoutComponentStyles.collapseButton}
                            aria-label="Collapse sidebar"
                        >
                            Collapse
                        </Button>
                    )}
                </Box>
            </Box>
            {sidebarCollapsible && !isHealthIndicatorsOpen && (
                <Box sx={insightsLayoutComponentStyles.collapsedSidebarContainer}>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onExpand();
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
}

