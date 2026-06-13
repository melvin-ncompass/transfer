/**
 * Helper function to generate timestamped filenames (without extension, ApexCharts adds it automatically)
 */
export function generateChartFilename(prefix: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}-${timestamp}`;
}

/**
 * Default toolbar export configuration for charts
 */
export function getDefaultToolbarExportOptions(prefix: string) {
  return {
    csvFilename: generateChartFilename(`${prefix}-data`),
    pngFilename: generateChartFilename(prefix),
    csvColumnDelimiter: ',' as const,
    csvHeaderCategory: 'Date',
    csvHeaderValue: 'Value',
    csvCategoryFormatter: (value?: number) => {
      if (value == null) return '';
      const date = new Date(value);
      return date.toISOString().split('T')[0];
    },
    csvValueFormatter: (value?: number) => {
      if (value == null) return '';
      return String(Math.round(value));
    },
  };
}
