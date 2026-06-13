import { Box } from '@mui/material';
import {
  RiskTreemap,
  IntentRelativeIntensityHeatmap,
  TemperaturePriorityDistributionChart,
} from './components';
import { PromptFilterProvider } from './components/prompt-filter-context';

// ----------------------------------------------------------------------
/**
 * PromptViewContent - Inner component that uses the filter context
 */
function PromptViewContent() {
  // Filter context is used by child components

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 3 }, marginTop: { xs: 1.5, md: 2 } }}>
      {/* Intent Relative Intensity Heatmap - Top of all charts */}
      <Box sx={{ width: '100%' }}>
        <IntentRelativeIntensityHeatmap />
      </Box>
      {/* Temperature Priority Distribution Chart */}
      <Box sx={{ width: '100%' }}>
        <TemperaturePriorityDistributionChart />
      </Box>
      <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 3 }, flexWrap: 'wrap' }}>
        <RiskTreemap category="maternal_risk" title="Maternal Risk" />
        <RiskTreemap category="baby_risk" title="Baby Risk" />
      </Box>
    </Box>
  );
}

/**
 * PromptView - Prompt visualization view with risk charts and climate charts
 *
 * Displays:
 * - Stacked bar chart and heatmap for category by priority
 * - Risk treemaps for maternal and baby risks
 * - Line charts for monthly temperature and precipitation trends
 * - Heatmaps for temperature and precipitation by month and year
 *
 * Features:
 * - Cross-chart filtering via context
 * - Click on any chart to filter all charts
 */
export function PromptView() {
  return (
    <PromptFilterProvider>
      <PromptViewContent />
    </PromptFilterProvider>
  );
}
