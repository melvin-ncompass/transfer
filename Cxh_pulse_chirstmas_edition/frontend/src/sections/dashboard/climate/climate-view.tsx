import { Box } from '@mui/material';
import { ClimateCharts } from './components';

// ----------------------------------------------------------------------

/**
 * ClimateView - Climate visualization view with temperature and precipitation charts
 *
 * Displays:
 * - Line charts for monthly temperature and precipitation trends
 * - Combined temperature and precipitation line chart
 * - Heatmaps for temperature and precipitation by month and year
 */
export function ClimateView() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ClimateCharts />
        </Box>
    );
}

