import { useMemo } from 'react';
import { Card, Typography, Box } from '@mui/material';
import { Chart } from '../../../../components/chart';
import { getLightBlueToDarkBlueColor } from '../../../../utils/color-gradient';
import { formatWithK } from '../../../../utils/format-number';
import { getMonthName } from '../../../../utils/format-time';
import { getYearMonthKey } from '../../../../utils/date-parsing';
// ----------------------------------------------------------------------
type MonthlyRainfallHeatmapProps = {
  data: Array<{ monthdate: string; precipitation: number }>;
};
/**
* MonthlyRainfallHeatmap - Heatmap for monthly rainfall data
*
* Displays precipitation data as a heatmap with months on Y-axis and years on X-axis.
* Empty/Zero values are rendered as transparent with visible grid lines.
*/
export function MonthlyRainfallHeatmap({ data }: MonthlyRainfallHeatmapProps) {
  // Process data for heatmap
  const { heatmapData, precipMin, precipMax, hasData, yearsCategories } = useMemo(() => {
    const precipMap = new Map<string, number>();
    data.forEach((item) => {
      // Parse ISO date string in UTC to avoid timezone issues
      // Format: "2022-01-01T00:00:00.000Z"
      const key = getYearMonthKey(item.monthdate);
      const existing = precipMap.get(key) || 0;
      precipMap.set(key, Number((existing + item.precipitation).toFixed(2)));
    });
    const precipKeys = Array.from(precipMap.keys());
    // Get all unique years and sort them
    const precipYears = Array.from(new Set(precipKeys.map((k) => k.split('-')[0])))
      .map(Number)
      .sort((a, b) => a - b);
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const precipitationHeatmapSeries = months.map((month) => {
      const monthData = precipYears.map((year) => {
        const key = `${year}-${String(month).padStart(2, '0')}`;
        const precipValue = precipMap.get(key);
        // Return 0 for missing values to keep alignment.
        // We will color 0 as transparent later.
        return {
          x: String(year),
          y: precipValue !== undefined ? precipValue : 0
        };
      });
      return {
        name: String(month),
        data: monthData,
      };
    });
    // Calculate Min/Max based only on non-zero values for the color scale
    const precipValues = Array.from(precipMap.values()).filter((v) => v > 0);
    const min = precipValues.length > 0 ? Math.min(...precipValues) : 0;
    const max = precipValues.length > 0 ? Math.max(...precipValues) : 0;
    return {
      heatmapData: precipitationHeatmapSeries,
      precipMin: min,
      precipMax: max,
      hasData: max > min,
      yearsCategories: precipYears.map(String),
    };
  }, [data]);
  const hasValidData = data.length > 0 && hasData;
  return (
    <Card sx={{ p: 3, flex: '1 1 48%', minWidth: { xs: 350, md: 400 } }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Heatmap of Monthly Precipitation (mm)
      </Typography>
      {!hasValidData ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 350,
            color: 'text.secondary',
          }}
        >
          <Typography variant="body2">No data found</Typography>
        </Box>
      ) : (
        <>
          {/* Color Scale Bar */}
          {hasData && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ fontSize: '11px' }}>
                {formatWithK(precipMin)}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: 10,
                  borderRadius: 1,
                  background: (() => {
                    // Generate gradient using light blue to dark blue function
                    const stops: string[] = [];
                    for (let i = 0; i <= 10; i++) {
                      const normalized = i / 10;
                      const [r, g, b] = getLightBlueToDarkBlueColor(normalized);
                      const hexColor = `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
                      stops.push(`${hexColor} ${(i * 100) / 10}%`);
                    }
                    return `linear-gradient(to right, ${stops.join(', ')})`;
                  })(),
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
              />
              <Typography variant="caption" sx={{ fontSize: '11px' }}>
                {formatWithK(precipMax)}
              </Typography>
            </Box>
          )}
          <Chart
            type="heatmap"
            series={heatmapData}
            options={{
              chart: {
                type: 'heatmap',
                toolbar: { show: false },
                height: 350,
                background: 'transparent',
                selection: {
                  enabled: false, // Disable selection to prevent cells from turning black on click
                },
              },
              // --- ADDED GRID CONFIGURATION HERE ---
              // grid: {
              //   show: true,
              //   borderColor: theme.palette.divider,
              //   xaxis: {
              //     lines: { show: true }
              //   },
              //   yaxis: {
              //     lines: { show: true }
              //   },
              // },
              stroke: {
                width: 1,
                colors: ['var(--background-paper)']
              },
              plotOptions: {
                heatmap: {
                  enableShades: false,
                  distributed: false,
                  shadeIntensity: 0,
                  radius: 4,
                  useFillColorAsStroke: false,
                  colorScale: hasData
                    ? {
                      ranges: (() => {
                        const ranges = [];
                        // 1. Handle 0 values - use background color instead of transparent to prevent black on click
                        ranges.push({
                          from: -999,
                          to: 0.00001,
                          color: '#F9FAFB', // Use light gray background that matches theme instead of transparent
                          name: 'No Data'
                        });
                        // 2. Generate gradient for values > 0
                        const range = precipMax - precipMin;
                        const numRanges = 20;
                        for (let i = 0; i < numRanges; i++) {
                          const normalized = i / (numRanges - 1);
                          const [r, g, b] = getLightBlueToDarkBlueColor(normalized);
                          const hexColor = `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
                          const from = precipMin + (range * i) / numRanges;
                          // For the last range, extend slightly beyond max to catch edge cases and floating point precision issues
                          const to = i === numRanges - 1
                            ? precipMax + (range * 0.01) // Add 1% buffer for the last range
                            : precipMin + (range * (i + 1)) / numRanges;
                          ranges.push({
                            from: from < 0.00001 ? 0.00001 : from,
                            to,
                            color: hexColor,
                          });
                        }
                        return ranges;
                      })(),
                      inverse: false,
                    }
                    : undefined,
                },
              },
              dataLabels: {
                enabled: false,
              },
              xaxis: {
                type: 'category',
                categories: yearsCategories,
                tooltip: {
                  enabled: false // Removes the vertical dashed line
                },
                crosshairs: {
                  show: false // Ensures no crosshair lines appear
                }
              },
              legend: {
                show: false,
              },
              tooltip: {
                enabled: true,
                shared: false,
                intersect: true,
                custom: ({ seriesIndex, dataPointIndex, w }: any) => {
                  const series = w.globals.initialSeries[seriesIndex];
                  const dataPoint = series.data[dataPointIndex];
                  const value = dataPoint?.y ?? 0;
                  const monthNum = series.name;
                  const monthName = getMonthName(monthNum);
                  const year = dataPoint?.x ?? '';
                  // Return null to completely hide the tooltip for 0 values
                  if (value === 0) return null;
                  return `
                    <div style="padding: 8px; background:var(--brand-bg);">
                        <div><strong>${monthName}</strong></div>
                        <div>${year}</div>
                        <div>Precipitation: ${formatWithK(Math.round(value))}</div>
                    </div>
                  `;
                },
              },
            }}
          />
        </>
      )}
    </Card>
  );
}
