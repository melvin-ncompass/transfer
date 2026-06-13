import { formatWithK } from '../../../../utils/format-number';
import { TEMPERATURE_COLOR, PRECIPITATION_COLOR } from '../../../../utils/color';
import type { ChartOptions } from '../../../../components/chart/types';

export type ToolbarExportOptions = {
  csvFilename?: string;
  pngFilename?: string;
  csvColumnDelimiter?: string;
  csvHeaderCategory?: string;
  csvHeaderValue?: string;
  csvCategoryFormatter?: (value?: number) => any;
  csvValueFormatter?: (value?: number) => any;
};

type ChartOptionsParams = {
  temperatureChartData: Array<{ x: number; y: number | null }>;
  precipitationChartData: Array<{ x: number; y: number | null }>;
  showTemperature: boolean;
  showPrecipitation: boolean;
  minTemp: number;
  maxTemp: number;
  minPrecip: number;
  maxPrecip: number;
  clickedPointIndex: number;
  clickedDate: number | null; // Add clickedDate for toggle comparison
  highlightMode: 'hover' | 'click' | 'none';
  setHoveredDate: (date: number | null) => void;
  setClickedDate: (date: number | null) => void;
  buildTooltipContent: (dataPointIndex: number) => string;
  enableToolbar?: boolean; // Optional flag to enable/disable toolbar export
  toolbarExportOptions?: ToolbarExportOptions; // Optional export configuration
};

export function buildChartOptions({
  temperatureChartData,
  precipitationChartData,
  showTemperature,
  showPrecipitation,
  minTemp,
  maxTemp,
  minPrecip,
  maxPrecip,
  clickedPointIndex,
  clickedDate,
  highlightMode,
  setHoveredDate,
  setClickedDate,
  buildTooltipContent,
  enableToolbar = false, // Default to false for backward compatibility
  toolbarExportOptions,
  isPlaying = false, // Disable downloads when playing
}: ChartOptionsParams & { isPlaying?: boolean }): ChartOptions {
  // Default export options
  const defaultExportOptions: ToolbarExportOptions = {
    csvFilename: 'temperature-precipitation-data', // No extension - ApexCharts adds it automatically
    pngFilename: 'temperature-precipitation-chart', // No extension - ApexCharts adds it automatically
    csvColumnDelimiter: ',',
    csvHeaderCategory: 'Date',
    csvHeaderValue: 'Value',
    csvCategoryFormatter: (value?: number) => {
      if (value == null) return '';
      const date = new Date(value);
      return date.toISOString().split('T')[0];
    },
  };

  // Merge with provided options
  const exportOptions = { ...defaultExportOptions, ...toolbarExportOptions };

  return {
    chart: {
      zoom: {
        enabled: false,
      },
      toolbar: enableToolbar && !isPlaying
        ? {
            show: true,
            tools: {
              download: true, // Show download button (PNG, CSV)
              selection: false, // Hide selection tool
              zoom: false, // Hide zoom tools
              zoomin: false,
              zoomout: false,
              pan: false, // Hide pan tool
              reset: false, // Hide reset tool
            },
            export: {
              csv: {
                filename: exportOptions.csvFilename,
                columnDelimiter: exportOptions.csvColumnDelimiter,
                headerCategory: exportOptions.csvHeaderCategory,
                headerValue: exportOptions.csvHeaderValue,
                ...(exportOptions.csvCategoryFormatter && {
                  categoryFormatter: exportOptions.csvCategoryFormatter,
                }),
                ...(exportOptions.csvValueFormatter && {
                  valueFormatter: exportOptions.csvValueFormatter,
                }),
              },
              png: {
                filename: exportOptions.pngFilename,
              },
              // SVG is omitted to disable it - ApexCharts only shows formats that are configured
            },
          }
        : {
            show: false,
          },
      events: {
        dataPointMouseEnter: (_: any, __: any, config: any) => {
          if (highlightMode === 'hover') {
            // Get the timestamp from the data point
            const dataPointIndex = config.dataPointIndex;
            const maxLength = Math.max(temperatureChartData.length, precipitationChartData.length);

            if (dataPointIndex >= 0 && dataPointIndex < maxLength) {
              // Use the x value (timestamp) from the first series that has data
              const timestamp =
                temperatureChartData[dataPointIndex]?.x ||
                precipitationChartData[dataPointIndex]?.x;
              // Also check if there's actual data (y value) at this point
              const hasTemperatureData =
                temperatureChartData[dataPointIndex]?.y != null &&
                !isNaN(temperatureChartData[dataPointIndex]?.y);
              const hasPrecipitationData =
                precipitationChartData[dataPointIndex]?.y != null &&
                !isNaN(precipitationChartData[dataPointIndex]?.y);

              if (timestamp && (hasTemperatureData || hasPrecipitationData)) {
                setHoveredDate(timestamp);
              } else {
                // Clear if no data at this point
                setHoveredDate(null);
              }
            } else {
              // Clear if index is out of bounds
              setHoveredDate(null);
            }
          }
        },
        dataPointMouseLeave: () => {
          if (highlightMode === 'hover') {
            setHoveredDate(null);
          }
        },
        updated: () => {
          // Clear highlight when chart updates (e.g., when data changes)
          if (highlightMode === 'hover') {
            setHoveredDate(null);
          }
        },
        click: (_: any, __: any, config: any) => {
          if (highlightMode === 'click') {
            const dataPointIndex = config.dataPointIndex;
            const maxLength = Math.max(temperatureChartData.length, precipitationChartData.length);

            if (dataPointIndex >= 0 && dataPointIndex < maxLength) {
              const timestamp =
                temperatureChartData[dataPointIndex]?.x ||
                precipitationChartData[dataPointIndex]?.x;
              // Also check if there's actual data (y value) at this point
              const hasTemperatureData =
                temperatureChartData[dataPointIndex]?.y != null &&
                !isNaN(temperatureChartData[dataPointIndex]?.y);
              const hasPrecipitationData =
                precipitationChartData[dataPointIndex]?.y != null &&
                !isNaN(precipitationChartData[dataPointIndex]?.y);

              if (timestamp && (hasTemperatureData || hasPrecipitationData)) {
                // Toggle: if clicking on already selected point, deselect it
                if (clickedDate === timestamp) {
                  setClickedDate(null);
                } else {
                  setClickedDate(timestamp);
                }
              } else {
                setClickedDate(null);
              }
            } else {
              setClickedDate(null);
            }
          }
        },
      },
    },
    stroke: {
      curve: 'smooth' as const,
      width: 2,
    },
    markers: {
      size: 4,
      hover: {
        sizeOffset: 2,
      },
      discrete:
        clickedPointIndex >= 0
          ? [
              ...(showTemperature &&
              temperatureChartData[clickedPointIndex]?.y != null &&
              !isNaN(temperatureChartData[clickedPointIndex]?.y)
                ? [
                    {
                      seriesIndex: 0,
                      dataPointIndex: clickedPointIndex,
                      fillColor: '#fff',
                      strokeColor: TEMPERATURE_COLOR,
                      size: 10,
                      shape: 'circle' as const,
                    },
                  ]
                : []),
              ...(showPrecipitation &&
              precipitationChartData[clickedPointIndex]?.y != null &&
              !isNaN(precipitationChartData[clickedPointIndex]?.y)
                ? [
                    {
                      seriesIndex: 1,
                      dataPointIndex: clickedPointIndex,
                      fillColor: '#fff',
                      strokeColor: PRECIPITATION_COLOR,
                      size: 10,
                      shape: 'circle' as const,
                    },
                  ]
                : []),
            ]
          : [], // Explicit empty array ensures previous highlights are cleared
    },
    states: {
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: 'none', // Disable default active state
        },
      },
    },
    xaxis: {
      type: 'datetime' as const,
      crosshairs: {
        show: false, // Disable x-axis crosshair on hover
      },
      tooltip: {
        enabled: false, // Disable x-axis tooltip on hover
      },
      // labels: {
      //     formatter: (value: string, timestamp?: number) => {
      //         // Use timestamp if available, otherwise parse the value string
      //         const date = timestamp ? new Date(timestamp) : new Date(value);
      //         const month = date.getUTCMonth(); // 0-11, where 0 is January
      //         const year = date.getUTCFullYear();
      //         const shortYear = year.toString().slice(-2); // Get last 2 digits of year

      //         // If it's January, show "Jan 'YY" format
      //         if (month === 0) {
      //             return `Jan '${shortYear}`;
      //         }

      //         // For other months, use the default format (e.g., "Jul '23")
      //         const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      //         return `${monthNames[month]} '${shortYear}`;
      //     },
      // },
    },
    legend: {
      show: false, // Hide default legend, we'll use custom switch
    },
    tooltip: {
      shared: true,
      intersect: false,
      style: {
        fontSize: '12px',
      },
      theme: 'dark',
      y: {
        formatter: (value: number, { seriesIndex }: any) => {
          const rounded = Math.round(value);
          // If it's the precipitation series (index 1), use k formatting
          if (seriesIndex === 1) {
            return formatWithK(rounded);
          }
          // Temperature series (index 0) - just round
          return String(rounded);
        },
      },
      onDatasetHover: {
        highlightDataSeries: false,
      },
      custom: (options: any) => {
        const { dataPointIndex } = options;
        const maxLength = Math.max(temperatureChartData.length, precipitationChartData.length);

        if (highlightMode === 'hover') {
          // Get the timestamp from the tooltip
          if (dataPointIndex >= 0 && dataPointIndex < maxLength) {
            const timestamp =
              temperatureChartData[dataPointIndex]?.x || precipitationChartData[dataPointIndex]?.x;
            // Also check if there's actual data (y value) at this point
            const hasTemperatureData =
              temperatureChartData[dataPointIndex]?.y != null &&
              !isNaN(temperatureChartData[dataPointIndex]?.y);
            const hasPrecipitationData =
              precipitationChartData[dataPointIndex]?.y != null &&
              !isNaN(precipitationChartData[dataPointIndex]?.y);

            if (timestamp && (hasTemperatureData || hasPrecipitationData)) {
              setHoveredDate(timestamp);
            } else {
              setHoveredDate(null);
            }
          } else {
            setHoveredDate(null);
          }
        }

        // Build tooltip content
        if (dataPointIndex >= 0 && dataPointIndex < maxLength) {
          const timestamp =
            temperatureChartData[dataPointIndex]?.x || precipitationChartData[dataPointIndex]?.x;
          if (!timestamp) return '';

          // Use UTC to avoid timezone issues
          const date = new Date(timestamp);
          const monthName = date.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
          const year = date.getUTCFullYear();
          const dateStr = `${monthName} ${year}`;

          const tempValue = temperatureChartData[dataPointIndex]?.y;
          const precipValue = precipitationChartData[dataPointIndex]?.y;

          let tooltipContent = `
                        <div style="padding: 10px; background: rgba(0, 0, 0, 0.8); border-radius: 4px; color: white; font-size: 12px;">
                            <div style="font-weight: 600; margin-bottom: 8px;">${dateStr}</div>
                    `;

          if (tempValue != null && !isNaN(tempValue)) {
            tooltipContent += `
                            <div style="margin-bottom: 4px;">
                                <span style="color: ${TEMPERATURE_COLOR};">●</span> Temperature: <strong>${Math.round(tempValue)}(°C)</strong>
                            </div>
                        `;
          }

          if (precipValue != null && !isNaN(precipValue)) {
            tooltipContent += `
                            <div>
                                <span style="color: ${PRECIPITATION_COLOR};">●</span> Precipitation: <strong>${formatWithK(Math.round(precipValue))}(mm)</strong>
                            </div>
                        `;
          }

          tooltipContent += '</div>';
          return tooltipContent;
        }

        return '';
      },
    },
    annotations: {
      xaxis:
        clickedPointIndex >= 0
          ? [
              {
                x:
                  temperatureChartData[clickedPointIndex]?.x ||
                  precipitationChartData[clickedPointIndex]?.x,
                strokeDashArray: 4,
                borderColor: '#999',
                borderWidth: 1,
                opacity: 0.6,
                label: {
                  borderColor: 'transparent',
                  style: {
                    background: 'transparent',
                  },
                },
              },
            ]
          : [], // Explicit empty array ensures dotted line is cleared
    },
    yaxis: [
      {
        title: {
          text: 'Temperature (°C)',
          style: {
            color: showTemperature ? TEMPERATURE_COLOR : 'transparent',
          },
        },
        labels: {
          formatter: (value: number) => String(Math.round(value)),
          style: {
            colors: showTemperature ? TEMPERATURE_COLOR : 'transparent',
          },
          minWidth: 80,
          maxWidth: 80,
        },
        show: true,
        forceNiceScale: true,
        min: minTemp,
        max: maxTemp,
        tickAmount: 5,
      },
      {
        opposite: true,
        title: {
          text: 'Precipitation (mm)',
          style: {
            color: showPrecipitation ? PRECIPITATION_COLOR : 'transparent',
          },
        },
        labels: {
          formatter: (value: number) => String(Math.round(value)),
          style: {
            colors: showPrecipitation ? PRECIPITATION_COLOR : 'transparent',
          },
          minWidth: 35, // Reduced slightly to prevent cutoff
          maxWidth: 35,
        },
        show: true,
        forceNiceScale: true,
        min: minPrecip,
        max: maxPrecip,
        tickAmount: 5,
      },
    ],
    colors: [TEMPERATURE_COLOR, PRECIPITATION_COLOR],
    fill: {
      colors: [
        TEMPERATURE_COLOR,
        // For precipitation bars, use a function to color the clicked bar dark blue
        ({ dataPointIndex }: { dataPointIndex: number }) => {
          if (clickedPointIndex >= 0 && dataPointIndex === clickedPointIndex) {
            return '#1a237e'; // Dark blue for selected bar
          }
          return PRECIPITATION_COLOR;
        },
      ],
    },
  };
}
