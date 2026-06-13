import { useMemo } from 'react';
import { Card, Typography, Box } from '@mui/material';
import { Chart } from '../../../../components/chart';
import { getYellowToRedColor } from '../../../../utils/color-gradient';
import { getMonthName } from '../../../../utils/format-time';
import { getYearMonthKey } from '../../../../utils/date-parsing';
// ----------------------------------------------------------------------
type MonthlyTemperatureHeatmapProps = {
  data: Array<{ monthdate: string; temperature: number }>;
};
/**
* formatTempValue - Format temperature values
*/
const formatTempValue = (val: number) => val.toFixed(2);
/**
* MonthlyTemperatureHeatmap - Heatmap for monthly temperature data
*
* Displays temperature data as a heatmap with months on Y-axis and years on X-axis.
* Empty/Zero values are rendered as transparent and have no tooltip.
*/
export function MonthlyTemperatureHeatmap({ data }: MonthlyTemperatureHeatmapProps) {
  // Process data for heatmap
  const { heatmapData, tempMin, tempMax, hasData, yearsCategories } = useMemo(() => {
    const tempMap = new Map<string, number>();
    data.forEach((item) => {
      // Parse ISO date string in UTC to avoid timezone issues
      // Format: "2022-01-01T00:00:00.000Z"
      const key = getYearMonthKey(item.monthdate);
      const existing = tempMap.get(key) || 0;
      tempMap.set(key, existing + item.temperature);
    });
    const tempKeys = Array.from(tempMap.keys());
    const tempYears = Array.from(new Set(tempKeys.map((k) => k.split('-')[0])))
      .map(Number)
      .sort((a, b) => a - b);
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const temperatureHeatmapSeries = months.map((month) => {
      const monthData = tempYears.map((year) => {
        const key = `${year}-${String(month).padStart(2, '0')}`;
        const tempValue = tempMap.get(key);
        // Return 0 for missing values to keep alignment.
        return {
          x: String(year),
          y: tempValue !== undefined ? tempValue : 0
        };
      });
      return {
        name: String(month),
        data: monthData,
      };
    });
    const tempValues = Array.from(tempMap.values()).filter((v) => v > 0);
    const min = tempValues.length > 0 ? Math.min(...tempValues) : 0;
    const max = tempValues.length > 0 ? Math.max(...tempValues) : 0;
    return {
      heatmapData: temperatureHeatmapSeries,
      tempMin: min,
      tempMax: max,
      hasData: max > min,
      yearsCategories: tempYears.map(String),
    };
  }, [data]);
  const hasValidData = data.length > 0 && hasData;
  return (
    <Card sx={{ p: 3, flex: '1 1 48%', minWidth: { xs: 350, md: 400 } }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Heatmap of Monthly Temperature (°C)
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
                {formatTempValue(tempMin)}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: 10,
                  borderRadius: 1,
                  background: (() => {
                    const stops: string[] = [];
                    for (let i = 0; i <= 10; i++) {
                      const normalized = i / 10;
                      const [r, g, b] = getYellowToRedColor(normalized);
                      const hexColor = `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
                      stops.push(`${hexColor} ${(i * 100) / 10}%`);
                    }
                    return `linear-gradient(to right, ${stops.join(', ')})`;
                  })(),
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                }}
              />
              <Typography variant="caption" sx={{ fontSize: '11px' }}>
                {formatTempValue(tempMax)}
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
                selection: {
                  enabled: false, // Disable selection to prevent cells from turning black on click
                },
              },
              stroke: {
                width: 1,
                colors: ['var(--background-paper)']
              },
              plotOptions: {
                heatmap: {
                  enableShades: false,
                  distributed: false,
                  shadeIntensity: 1,
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
                        const range = tempMax - tempMin;
                        const numRanges = 20;
                        for (let i = 0; i < numRanges; i++) {
                          const normalized = i / (numRanges - 1);
                          const [r, g, b] = getYellowToRedColor(normalized);
                          const hexColor = `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
                          const from = tempMin + (range * i) / numRanges;
                          const to = tempMin + (range * (i + 1)) / numRanges;
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
                  enabled: false // <--- This removes the vertical dashed line on hover
                },
                crosshairs: {
                  show: false // <--- Ensures no crosshair lines appear on empty spots
                }
              },
              legend: {
                show: false,
              },
              tooltip: {
                enabled: true,
                // Crucial: Use 'shared: false' for Heatmaps to avoid confusing triggers
                shared: false,
                intersect: true,
                custom: ({ seriesIndex, dataPointIndex, w }: any) => {
                  const series = w.globals.initialSeries[seriesIndex];
                  const dataPoint = series.data[dataPointIndex];
                  const value = dataPoint?.y ?? 0;
                  const monthNum = series.name;
                  const monthName = getMonthName(monthNum);
                  const year = dataPoint?.x ?? '';
                  // FIX: Return null instead of empty string to completely hide tooltip artifact
                  if (value === 0) return null;
                  return `
                    <div style="padding: 8px; background:var(--brand-bg);">
                        <div><strong>${monthName}</strong></div>
                        <div>${year}</div>
                        <div>Temperature: ${formatTempValue(value)}°C</div>
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





