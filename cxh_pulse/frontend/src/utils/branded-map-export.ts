/**
 * Branded Map Export Utility
 *
 * Exports Leaflet maps with branding matching ApexCharts export:
 * - Top Left: CxH Pulse logo (Pulse icon + "CxH Pulse" + "by DataKind")
 * - Top Center: Map Title
 * - Footer Left: "Downloaded by [User Name]"
 * - Footer Right: Timestamp (YYYY-MM-DD HH:mm:ss TZ)
 *
 * Supports:
 * - PNG export (rasterized from DOM with proper DPR handling)
 * - SVG export (standalone, styles inlined)
 * - Cross-browser: Chrome, Firefox, Safari
 */

import { toPng } from 'html-to-image';
import {
  HEADER_HEIGHT,
  FOOTER_HEIGHT,
  PADDING,
  generateFilename,
  loadImage,
  generateSvgHeaderContent,
  generateSvgFooterContent,
  drawCanvasHeader,
  drawCanvasFooter,
  getFilterInfoHeight,
  drawCanvasFilterInfo,
  generateSvgFilterInfo,
} from './branded-export-common';

export interface BrandedMapExportOptions {
  /** Map title to display in header center (also used for filename) */
  mapTitle: string;
  /** User name for "Downloaded by" footer */
  userName: string;
  /** Logo image URL (optional, uses SVG fallback if not provided) */
  logoUrl?: string;
  /** Primary brand color */
  primaryColor?: string;
  /** Background color for export (default: white) */
  backgroundColor?: string;
  /** DPR scale factor for PNG (default: 2 for retina) */
  scale?: number;
  /** Optional filter information to display in export */
  filterInfo?: {
    location?: string;
    subcounty?: string;
    ward?: string;
  };
  /** Optional date range to display in export */
  dateRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * Capture map container as a data URL using html-to-image
 */
async function captureMapAsDataUrl(
  mapContainer: HTMLElement,
  scale: number = 2,
  backgroundColor: string = '#ffffff'
): Promise<{ dataUrl: string; width: number; height: number }> {
  const rect = mapContainer.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const dataUrl = await toPng(mapContainer, {
    quality: 1.0,
    pixelRatio: scale,
    backgroundColor,
    cacheBust: true,
    // Filter out problematic elements and UI controls that shouldn't appear in export
    filter: (node: Element) => {
      // Keep all elements except some problematic ones
      if (node instanceof Element) {
        const tagName = node.tagName?.toLowerCase();
        // Filter out script tags that might interfere
        if (tagName === 'script') return false;
        // Filter out elements marked with data-export-ignore attribute (e.g., Reset button, Download button)
        if (node.getAttribute('data-export-ignore') === 'true') return false;
      }
      return true;
    },
  });

  return { dataUrl, width, height };
}

/**
 * Draw branding on canvas and return the final branded image
 */
async function createBrandedImage(
  mapDataUrl: string,
  mapWidth: number,
  mapHeight: number,
  options: BrandedMapExportOptions
): Promise<string> {
  const { mapTitle, userName, primaryColor = '#D32F2F', scale = 2, filterInfo, dateRange } = options;

  // Load the map image
  const mapImg = await loadImage(mapDataUrl);

  // Calculate canvas dimensions (scale for DPR)
  const scaledMapWidth = mapWidth * scale;
  const scaledMapHeight = mapHeight * scale;
  const scaledHeaderHeight = HEADER_HEIGHT * scale;
  const scaledPadding = PADDING * scale;

  // Calculate footer height (basic)
  const scaledFooterHeight = FOOTER_HEIGHT * scale;

  // Calculate filter info height for top section
  const filterInfoHeight = getFilterInfoHeight(filterInfo, dateRange);
  const scaledFilterInfoHeight = filterInfoHeight * scale;

  const canvasWidth = scaledMapWidth + scaledPadding * 2;
  const canvasHeight =
    scaledMapHeight + scaledHeaderHeight + scaledFilterInfoHeight + scaledFooterHeight + scaledPadding * 2;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw header with full branding (CxH Pulse logo)
  await drawCanvasHeader(ctx, canvasWidth, mapTitle, primaryColor, scale);

  // Draw filter info (top right, below header)
  drawCanvasFilterInfo(ctx, canvasWidth, scaledHeaderHeight + (4 * scale), filterInfo, dateRange, scale);

  // Draw map image
  // Lift map by reducing top padding (using half padding)
  const mapY = scaledHeaderHeight + scaledFilterInfoHeight + (scaledPadding / 2);
  
  ctx.drawImage(
    mapImg,
    scaledPadding,
    mapY,
    scaledMapWidth,
    scaledMapHeight
  );

  // Draw footer
  // Increase spacing between map and footer to prevent overlap (1.5x padding)
  const footerY = mapY + scaledMapHeight + (scaledPadding * 1.5);
  drawCanvasFooter(ctx, canvasWidth, footerY, userName, scale, filterInfo, dateRange);

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Create branded SVG document with map embedded as image
 * Note: For Leaflet maps, we embed the rasterized map as a base64 image in SVG
 * because Leaflet renders to Canvas/DOM, not pure SVG
 */
function createBrandedSvg(
  mapDataUrl: string,
  mapWidth: number,
  mapHeight: number,
  options: BrandedMapExportOptions
): string {
  const { mapTitle, userName, primaryColor = '#D32F2F', filterInfo, dateRange } = options;

  // Calculate footer height
  const totalFooterHeight = FOOTER_HEIGHT;

  // Calculate filter info height
  const filterInfoHeight = getFilterInfoHeight(filterInfo, dateRange);

  // Calculate total dimensions
  const totalWidth = mapWidth + PADDING * 2;
  const totalHeight = mapHeight + HEADER_HEIGHT + filterInfoHeight + totalFooterHeight + PADDING * 2;

  // Build the SVG document
  const svgDocument = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <defs>
    <style type="text/css">
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&amp;display=swap');
      .branding-font { font-family: 'DM Sans', 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="${totalWidth}" height="${totalHeight}" fill="#ffffff"/>
  ${generateSvgHeaderContent(totalWidth, mapTitle, primaryColor)}
  ${generateSvgFilterInfo(totalWidth, HEADER_HEIGHT + 4, filterInfo, dateRange)}
  
  <!-- Map content (embedded as image) -->
  <image 
    x="${PADDING}" 
    y="${HEADER_HEIGHT + filterInfoHeight + (PADDING / 2)}" 
    width="${mapWidth}" 
    height="${mapHeight}" 
    href="${mapDataUrl}"
    preserveAspectRatio="xMidYMid meet"
  />
  ${generateSvgFooterContent(totalWidth, mapHeight, userName, filterInfo, dateRange)}
</svg>`;

  return svgDocument;
}

/**
 * Export map as PNG with branding
 *
 * @param mapContainer - The Leaflet map container DOM element
 * @param options - Branding options (title, user, colors)
 */
export async function exportMapAsPNG(
  mapContainer: HTMLElement,
  options: BrandedMapExportOptions
): Promise<void> {
  const { mapTitle, scale = 2, backgroundColor = '#ffffff' } = options;

  try {
    // Capture the map
    const { dataUrl, width, height } = await captureMapAsDataUrl(
      mapContainer,
      scale,
      backgroundColor
    );

    // Create branded image
    const brandedDataUrl = await createBrandedImage(dataUrl, width, height, options);

    // Download
    const filename = generateFilename(mapTitle, 'png');
    const link = document.createElement('a');
    link.href = brandedDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to export map as PNG:', error);
    throw error;
  }
}

/**
 * Export map as SVG with branding
 * Note: The map content is embedded as a rasterized image since Leaflet
 * doesn't render to pure SVG. The branding (header, footer) is vector SVG.
 *
 * @param mapContainer - The Leaflet map container DOM element
 * @param options - Branding options (title, user, colors)
 */
export async function exportMapAsSVG(
  mapContainer: HTMLElement,
  options: BrandedMapExportOptions
): Promise<void> {
  const { mapTitle, scale = 2, backgroundColor = '#ffffff' } = options;

  try {
    // Capture the map as PNG data URL (Leaflet renders to Canvas, not SVG)
    const { dataUrl, width, height } = await captureMapAsDataUrl(
      mapContainer,
      scale,
      backgroundColor
    );

    // Create branded SVG with embedded map image
    const brandedSvg = createBrandedSvg(dataUrl, width, height, options);

    // Create blob and download
    const blob = new Blob([brandedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const filename = generateFilename(mapTitle, 'svg');
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export map as SVG:', error);
    throw error;
  }
}

/**
 * Helper to convert ID to title case display name
 */
function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Export map data as CSV
 *
 * @param valueMap - Map of location IDs to values
 * @param options - Export options including title for header and nameMap for display names
 */
export function exportMapDataAsCSV(
  valueMap: Record<string, number>,
  options: BrandedMapExportOptions & {
    dataMode?: 'indicator' | 'population';
    nameMap?: Record<string, string>;
  }
): void {
  const { mapTitle, dataMode = 'population', nameMap = {} } = options;

  try {
    const csvRows: string[] = [];

    // Add header
    const valueColumnName = dataMode === 'indicator' ? mapTitle : 'Population';
    csvRows.push(`Location,${valueColumnName}`);

    // Add data rows (sorted alphabetically by display name)
    Object.entries(valueMap)
      .map(([locationId, value]) => {
        // Use nameMap to get display name, fallback to title-cased ID
        const displayName = nameMap[locationId] || toTitleCase(locationId);
        return { displayName, value };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .forEach(({ displayName, value }) => {
        // Escape commas and quotes in location names
        const escapedLocation =
          displayName.includes(',') || displayName.includes('"')
            ? `"${displayName.replace(/"/g, '""')}"`
            : displayName;
        csvRows.push(`${escapedLocation},${value}`);
      });

    // Create CSV content
    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const filename = generateFilename(mapTitle, 'csv');
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export map data as CSV:', error);
    throw error;
  }
}

// Re-export types
export type { BrandedMapExportOptions as MapExportOptions };
