import type { Theme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export function dashboardLayoutVars(theme: Theme, isNavCollapsed = false) {
  return {
    '--layout-transition-easing': 'linear',
    '--layout-transition-duration': '120ms',
    '--layout-nav-vertical-width': isNavCollapsed ? '72px' : '260px',
    '--layout-nav-collapsed-width': '72px',
    '--layout-dashboard-content-pt': theme.spacing(3),
    '--layout-dashboard-content-pb': theme.spacing(10),
    '--layout-dashboard-content-px': theme.spacing(3),
  };
}
