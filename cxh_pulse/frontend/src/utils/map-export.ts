/**
 * Map Export Utilities
 *
 * Functions to export map data as PNG and CSV
 */

/**
 * Export map as PNG using html-to-image
 * @param mapContainer - The map container DOM element
 * @param filename - Optional filename (default: 'choropleth-map.png')
 */
export async function exportMapAsPNG(
  mapContainer: HTMLElement,
  filename: string = 'choropleth-map.png'
): Promise<void> {
  try {
    // Dynamic import to avoid issues if html-to-image is not installed
    // Using eval to prevent Vite from statically analyzing this import at build time
    // This makes it a truly runtime-only import that won't cause build errors
    let toPng: any;
    try {
      const htmlToImageModule = await (0, eval)('import("html-to-image")');
      toPng = htmlToImageModule.toPng;
    } catch (importError: any) {
      // Check if it's a module resolution error
      if (
        importError?.message?.includes('Failed to resolve') ||
        importError?.message?.includes('Cannot find module') ||
        importError?.code === 'ERR_MODULE_NOT_FOUND'
      ) {
        throw new Error(
          'html-to-image is not installed. Please run: npm install html-to-image (or yarn add html-to-image)'
        );
      }
      throw importError;
    }

    // Use html-to-image to convert the map container to PNG
    const dataUrl = await toPng(mapContainer, {
      quality: 1.0,
      pixelRatio: 2, // Higher quality
      backgroundColor: '#ffffff',
      useCORS: true,
    });

    // Convert data URL to blob and download
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting map as PNG:', error);
    throw new Error('Failed to export map as PNG. Please ensure html-to-image is installed.');
  }
}

/**
 * Export map data as CSV
 * @param valueMap - Map of location names to values
 * @param dataMode - 'indicator' or 'population'
 * @param title - Title/indicator name for CSV header
 * @param filename - Optional filename (default: 'map-data.csv')
 */
export function exportMapDataAsCSV(
  valueMap: Record<string, number>,
  dataMode: 'indicator' | 'population',
  title: string = 'Data',
  filename: string = 'map-data.csv'
): void {
  try {
    const csvRows: string[] = [];

    // Add header
    const valueColumnName = dataMode === 'indicator' ? title : 'Population';
    csvRows.push(`Location,${valueColumnName}`);

    // Add data rows
    Object.entries(valueMap)
      .sort(([a], [b]) => a.localeCompare(b)) // Sort alphabetically
      .forEach(([location, value]) => {
        // Escape commas and quotes in location names
        const escapedLocation =
          location.includes(',') || location.includes('"')
            ? `"${location.replace(/"/g, '""')}"`
            : location;
        csvRows.push(`${escapedLocation},${value}`);
      });

    // Create CSV content
    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting map data as CSV:', error);
    throw new Error('Failed to export map data as CSV');
  }
}

/**
 * Generate filename with timestamp
 * @param prefix - Filename prefix
 * @param extension - File extension (without dot)
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}-${timestamp}.${extension}`;
}
