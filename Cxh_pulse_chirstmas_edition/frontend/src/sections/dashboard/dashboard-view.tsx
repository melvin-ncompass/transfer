import { useState, useEffect, useMemo, Suspense, lazy, useCallback } from 'react';
import { Box, Tab, Tabs, Stack, CircularProgress, Skeleton } from '@mui/material';
import { Iconify } from '../../components/iconify';
import type { IconifyName } from '../../components/iconify/register-icons';
import {
    useGetDkhisWardsQuery,
    useGetDkhisIndicatorDateFilterQuery,
    useGetDkhsWardsCountiesQuery,
} from '../../api';
import { PermissionName, getAllPermissionNames } from '../../types/permissions';
import { useUserPermissions } from '../../hooks/use-permissions';
import { insightsLayoutStyles } from '../../styles/layouts/insights.styles';
import type { InsightsDataProps } from '../../types/insights.types';

// Lazy load tab components for better performance
const OverviewView = lazy(() => import('./overview/overview-view').then(module => ({ default: module.OverviewView })));
const ClimateView = lazy(() => import('./climate/climate-view').then(module => ({ default: module.ClimateView })));
const PromptView = lazy(() => import('./prompts/prompt-view').then(module => ({ default: module.PromptView })));
const ForecastView = lazy(() => import('./forecast/forecast-view').then(module => ({ default: module.ForecastView })));

type TabConfig = {
    id: number;
    label: string;
    icon: IconifyName;
    component: React.LazyExoticComponent<React.ComponentType<any>>;
    enabled?: boolean;
    requiredPermissions?: PermissionName[];
};


const TAB_CONFIG: TabConfig[] = [
    {
        id: 0,
        label: 'Overview',
        icon: 'solar:chart-2-bold-duotone',
        component: OverviewView,
        enabled: true,
        requiredPermissions: [PermissionName.OVERVIEW],
    },
    {
        id: 4,
        label: 'PROMPTS',
        icon: 'solar:chat-round-bold-duotone',
        component: PromptView,
        enabled: true,
        requiredPermissions: [PermissionName.PROMPTS],
    },
    {
        id: 5,
        label: 'Climate',
        icon: 'solar:cloud-bold-duotone',
        component: ClimateView,
        enabled: true,
        requiredPermissions: [PermissionName.CLIMATE],
    },
    {
        id: 6,
        label: 'Forecast',
        icon: 'solar:graph-up-bold-duotone',
        component: ForecastView,
        enabled: true,
        requiredPermissions: [PermissionName.FORECAST],
    },
];

/**
 * Loading skeleton component for Overview tabs
 */
function OverviewTabSkeleton() {
    return (
        <Stack spacing={2} sx={insightsLayoutStyles.skeletonContainer}>
            {/* Filter section skeleton */}
            <Stack direction="row" spacing={2} sx={insightsLayoutStyles.skeletonFilter}>
                <Skeleton variant="rectangular" width={200} height={40} />
                <Skeleton variant="rectangular" width={200} height={40} />
                <Skeleton variant="rectangular" width={300} height={40} />
            </Stack>
            {/* Map/Chart area skeleton */}
            <Stack direction="row" spacing={2} sx={insightsLayoutStyles.skeletonMap}>
                <Skeleton variant="rectangular" width="60%" height="100%" />
                <Stack spacing={2} sx={insightsLayoutStyles.skeletonStack}>
                    <Skeleton variant="rectangular" height={200} />
                    <Skeleton variant="rectangular" height={150} />
                    <Skeleton variant="rectangular" height={150} />
                </Stack>
            </Stack>
        </Stack>
    );
}

/**
 * Generic tab loading fallback
 */
function TabLoadingFallback() {
    return (
        <Box sx={insightsLayoutStyles.loadingContainer}>
            <CircularProgress size={48} />
            <Box sx={insightsLayoutStyles.loadingText}>
                Loading...
            </Box>
        </Box>
    );
}

/**
* DashboardView - Data dashboard visualization with map plotting
*
* Displays navigation tabs for:
* - Overview: Overview dashboard with map and charts
* - Climate: Climate and health visualization
* - Prompts: Prompts visualization
* - Forecast: Forecast visualization
*
*/
export function DashboardView() {
    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
    const userPermissions = useUserPermissions();

    const enabledTabs = useMemo(() => {
        const allPerms = getAllPermissionNames(userPermissions);

        return TAB_CONFIG.filter((tab) => {
            // Filter out disabled tabs
            if (tab.enabled === false) {
                return false;
            }

            // If no permissions required, show the tab
            if (!tab.requiredPermissions || tab.requiredPermissions.length === 0) {
                return true;
            }

            // Check if user has at least one of the required permissions
            return tab.requiredPermissions.some(permission =>
                allPerms.includes(permission)
            );
        });
    }, [userPermissions]);

    // Fetch data for insights - queries run in parallel automatically with RTK Query
    const { data: wardsData } = useGetDkhisWardsQuery();
    const { data: indicatorsData } = useGetDkhisIndicatorDateFilterQuery();
    const { data: wardsCountiesData, isLoading: isLoadingWardsCounties } = useGetDkhsWardsCountiesQuery({}, {
        skip: false,
    });
    
    useEffect(() => {
        if (activeTabIndex >= enabledTabs.length && enabledTabs.length > 0) {
            setActiveTabIndex(0);
        }
    }, [enabledTabs, activeTabIndex]);

    const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
        setActiveTabIndex(newValue);
    }, []);

    return (
        <Stack direction="column" spacing={1} p={{ xs: 0.25, md: 3 }} pt={{ xs: 1, md: 0 }}>
            <Box sx={insightsLayoutStyles.tabsContainer}>
                <Tabs
                    value={activeTabIndex}
                    onChange={handleTabChange}
                    aria-label="dashboard tabs"
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={insightsLayoutStyles.tabs}
                >
                    {enabledTabs.map((tab) => (
                        <Tab
                            key={tab.id}
                            icon={<Iconify icon={tab.icon} width={20} />}
                            iconPosition="start"
                            label={tab.label}
                            sx={insightsLayoutStyles.tabIcon}
                        />
                    ))}
                </Tabs>
            </Box>
            <Box sx={insightsLayoutStyles.tabContent}>
                {enabledTabs[activeTabIndex] && (() => {
                    const currentTab = enabledTabs[activeTabIndex];
                    const TabComponent = currentTab.component;
                    // Find Climate tab index for navigation
                    const climateTabIndex = enabledTabs.findIndex(tab => tab.label === 'Climate');
                    const navigateToClimateTab = climateTabIndex >= 0 ? () => setActiveTabIndex(climateTabIndex) : undefined;
                    // Find PROMPTS tab index for navigation
                    const promptsTabIndex = enabledTabs.findIndex(tab => tab.label === 'PROMPTS');
                    const navigateToPromptsTab = promptsTabIndex >= 0 ? () => setActiveTabIndex(promptsTabIndex) : undefined;
                    // Check if user has CLIMATE permission
                    const allPerms = getAllPermissionNames(userPermissions);
                    const hasClimatePermission = allPerms.includes(PermissionName.CLIMATE);
                    const hasPromptsPermission = allPerms.includes(PermissionName.PROMPTS);

                    // Pass appropriate props based on tab type
                    const componentProps = (currentTab.label === 'Overview')
                        && {
                            wardsGeoJSON: wardsCountiesData,
                            navigateToClimateTab,
                            hasClimatePermission,
                            navigateToPromptsTab,
                            hasPromptsPermission,
                        }

                    return (
                        <Box key={currentTab.id} sx={insightsLayoutStyles.tabContentBox}>
                            <Suspense fallback={<TabLoadingFallback />}>
                                <TabComponent {...componentProps} />
                            </Suspense>
                        </Box>
                    );
                })()}
            </Box>
        </Stack>
    );
}