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
  LegendItem,
  generateSvgLegendContent,
  drawCanvasLegend,
  getLegendHeight,
} from './branded-export-common';
import { toPng } from 'html-to-image';

export type { LegendItem } from './branded-export-common';

export interface BrandedExportOptions {
  chartTitle: string;
  userName: string;
  logoUrl?: string;
  primaryColor?: string;
  legendItems?: LegendItem[];
  legendElement?: HTMLElement | null;
  filterInfo?: { location?: string; subcounty?: string; ward?: string };
  dateRange?: { from: Date; to: Date };
  customFooterText?: string;
  excludeLegend?: boolean;
  legendAlignment?: 'left' | 'center' | 'right';
}

function getApexChartInstance(chartElement: HTMLElement): any {
  const chartCanvas = chartElement.querySelector('.apexcharts-canvas');
  const chartId = chartCanvas?.getAttribute('id');
  if (chartId && (window as any).Apex?.chartInstances) {
    const instance = (window as any).Apex.chartInstances.find((c: any) => c.id === chartId);
    if (instance?.chart) return instance.chart;
  }
  if (chartId && (window as any).ApexCharts?.getChartByID) {
    const chart = (window as any).ApexCharts.getChartByID(chartId);
    if (chart) return chart;
  }
  if ((window as any).Apex?.chartInstances) {
    for (const instance of (window as any).Apex.chartInstances) {
      if (instance.chart?.el && chartElement.contains(instance.chart.el)) return instance.chart;
    }
  }
  const apexCanvas = chartCanvas as any;
  if (apexCanvas?.__vue__?.$refs?.chart) return apexCanvas.__vue__.$refs.chart;
  if ((chartCanvas as any)?.__reactFiber$) {
    let fiber = (chartCanvas as any).__reactFiber$;
    for (const key in chartCanvas) {
      if (key.startsWith('__reactFiber$')) { fiber = (chartCanvas as any)[key]; break; }
    }
    while (fiber) {
      if (fiber.stateNode?.chart) return fiber.stateNode.chart;
      if (fiber.memoizedProps?.chart) return fiber.memoizedProps.chart;
      fiber = fiber.return;
    }
  }
  console.warn('Could not find ApexCharts instance for element:', chartElement);
  return null;
}

const WAIT_FOR_RENDER_MS = 800;

function waitForChartRender(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, WAIT_FOR_RENDER_MS));
}

async function getChartAsDataUrl(chartElement: HTMLElement, options?: BrandedExportOptions): Promise<string> {
  // Ensure chart is fully rendered/animated before capturing
  await waitForChartRender();

  try {
    return await toPng(chartElement, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipAutoScale: true,
      cacheBust: true,
      filter: (node) => {
        const classList = (node as HTMLElement).classList;
        if (classList?.contains('MuiIconButton-root') || classList?.contains('export-menu-button')) return false;
        if (classList?.contains('MuiFormControl-root') || classList?.contains('MuiSelect-root') ||
            classList?.contains('MuiInputBase-root') || classList?.contains('MuiToggleButtonGroup-root') ||
            classList?.contains('MuiToggleButton-root') || classList?.contains('MuiInputLabel-root')) return false;
        const excludeLegend = options?.excludeLegend ?? !!options?.legendElement;
        if (excludeLegend && classList?.contains('apexcharts-legend')) return false;
        return true;
      }
    });
  } catch (error) {
    console.warn('html-to-image capture failed, trying ApexCharts native export', error);
  }

  const apexChart = getApexChartInstance(chartElement);
  if (apexChart?.dataURI) {
    try {
      const result = await apexChart.dataURI({ scale: 2 });
      if (result?.imgURI) return result.imgURI;
    } catch { console.warn('ApexCharts dataURI failed, falling back to SVG capture'); }
  }
  const svgElement = chartElement.querySelector('svg.apexcharts-svg');
  if (svgElement) return await svgToDataUrl(svgElement as SVGElement);
  throw new Error('Could not capture chart image');
}

function getChartSvgElement(chartElement: HTMLElement): { svg: SVGElement; width: number; height: number } | null {
  const svgElement = chartElement.querySelector('svg.apexcharts-svg') as SVGElement;
  if (!svgElement) return null;
  const bbox = svgElement.getBoundingClientRect();
  return { svg: svgElement, width: bbox.width, height: bbox.height };
}

async function svgToDataUrl(svgElement: SVGElement): Promise<string> {
  const clone = svgElement.cloneNode(true) as SVGElement;
  const bbox = svgElement.getBoundingClientRect();
  clone.setAttribute('width', String(bbox.width));
  clone.setAttribute('height', String(bbox.height));
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);
  if (!svgString.includes('xmlns')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const base64 = btoa(unescape(encodeURIComponent(svgString)));
  const dataUrl = `data:image/svg+xml;base64,${base64}`;

  // Convert SVG to PNG using canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = bbox.width * 2; // 2x for retina
      canvas.height = bbox.height * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Draw branding on canvas and return the final image
 */
async function createBrandedImage(
  chartDataUrl: string,
  options: BrandedExportOptions
): Promise<string> {
  const { 
    chartTitle, 
    userName, 
    primaryColor = '#D32F2F', 
    legendItems,
    legendElement, 
    filterInfo, 
    dateRange, 
    customFooterText,
    legendAlignment = 'right'
  } = options;

  // Load the chart image
  const chartImg = await loadImage(chartDataUrl);

  const chartWidth = chartImg.width;
  const chartHeight = chartImg.height;
  
  // Calculate legend height - prefer native legendItems over HTML capture
  let legendHeight = 0;
  let legendImg: HTMLImageElement | null = null;
  const LEGEND_SPACING = 16; // Space between chart and legend
  
  if (legendItems && legendItems.length > 0) {
    // Calculate native legend height
    const maxWidth = chartWidth; // Use chart width for layout calculation
    legendHeight = getLegendHeight(legendItems, maxWidth);
  } else if (legendElement) {
    // Fallback: Capture HTML legend as image (deprecated method)
    try {
      const legendDataUrl = await toPng(legendElement, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      legendImg = await loadImage(legendDataUrl);
      legendHeight = legendImg.height / 2 + LEGEND_SPACING; // Divide by 2 because of pixelRatio
    } catch (error) {
      console.warn('Failed to capture legend, proceeding without it:', error);
    }
  }
  
  // Calculate footer height (just user and timestamp now)
  const LINE_HEIGHT = 24;
  const hasCustomFooter = !!customFooterText;
  
  // Base footer height + custom footer
  let additionalFooterHeight = 0;
  if (hasCustomFooter) additionalFooterHeight += LINE_HEIGHT;
  if (additionalFooterHeight > 0) additionalFooterHeight += 4; // Padding

  const totalFooterHeight = FOOTER_HEIGHT + additionalFooterHeight;
  
  // Calculate filter info height for top section
  const filterInfoHeight = getFilterInfoHeight(filterInfo, dateRange);

  const canvasWidth = chartWidth + PADDING * 2;
  const canvasHeight = chartHeight + legendHeight + HEADER_HEIGHT + filterInfoHeight + totalFooterHeight + PADDING * 2;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw header with full branding (CxH Pulse logo)
  await drawCanvasHeader(ctx, canvasWidth, chartTitle, primaryColor);

  // Draw filter info (top right, below header)
  drawCanvasFilterInfo(ctx, canvasWidth, HEADER_HEIGHT + 4, filterInfo, dateRange, 1);

  // Draw legend at top (right after header + filter info) if available
  let chartY = HEADER_HEIGHT + filterInfoHeight + PADDING;
  
  if (legendItems && legendItems.length > 0) {
    // Draw native canvas legend (pixel-perfect rendering)
    const drawnLegendHeight = drawCanvasLegend(ctx, legendItems, canvasWidth, chartY, 1, legendAlignment);
    if (drawnLegendHeight > 0) {
      chartY += drawnLegendHeight + LEGEND_SPACING;
    }
  } else if (legendImg) {
    // Fallback: Draw captured legend image (deprecated method)
    const legendWidth = legendImg.width / 2; // Divide by 2 because of pixelRatio
    const legendDrawHeight = legendImg.height / 2;
    // Center the legend horizontally
    const legendX = (canvasWidth - legendWidth) / 2;
    ctx.drawImage(legendImg, legendX, chartY, legendWidth, legendDrawHeight);
    chartY += legendDrawHeight + LEGEND_SPACING;
  }

  // Draw chart image below legend
  ctx.drawImage(chartImg, PADDING, chartY, chartWidth, chartHeight);

  // Draw footer
  const footerY = chartY + chartHeight + PADDING;
  drawCanvasFooter(ctx, canvasWidth, footerY, userName, 1, filterInfo, dateRange, customFooterText);

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Remove all data-* attributes from an element and its children
 */
function removeDataAttributes(element: Element): void {
  // Get all attributes that start with "data-"
  const attributesToRemove: string[] = [];
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name.startsWith('data-')) {
      attributesToRemove.push(attr.name);
    }
  }

  // Remove them
  attributesToRemove.forEach((attr) => element.removeAttribute(attr));

  // Recursively process children
  for (let i = 0; i < element.children.length; i++) {
    removeDataAttributes(element.children[i]);
  }
}

/**
 * Clean SVG content string by removing problematic attributes
 */
function cleanSvgContent(svgString: string): string {
  // Remove all data-* attributes using regex
  // This handles cases like: data-realIndex="0" or data-foo='bar'
  let cleaned = svgString.replace(/\s+data-[a-zA-Z0-9_-]+="[^"]*"/g, '');
  cleaned = cleaned.replace(/\s+data-[a-zA-Z0-9_-]+='[^']*'/g, '');

  // Remove any remaining colon-prefixed attributes that might cause issues
  // (like custom namespaced attributes without proper namespace declaration)
  cleaned = cleaned.replace(/\s+[a-zA-Z]+:[a-zA-Z]+="[^"]*"/g, '');

  // Clean up any empty style attributes
  cleaned = cleaned.replace(/\s+style=""/g, '');

  return cleaned;
}

/**
 * Create branded SVG document with chart embedded
 */
async function createBrandedSvg(
  chartSvgElement: SVGElement,
  chartWidth: number,
  chartHeight: number,
  options: BrandedExportOptions
): Promise<string> {
  const { 
    chartTitle, 
    userName, 
    primaryColor = '#D32F2F', 
    legendItems,
    legendElement, 
    customFooterText, 
    filterInfo, 
    dateRange,
    legendAlignment = 'right'
  } = options;

  const LEGEND_SPACING = 16;
  
  // Calculate legend dimensions - prefer native legendItems over HTML capture
  let legendSvgContent = '';
  let legendHeight = 0;
  let legendDataUrl: string | null = null;
  let legendImgWidth = 0;
  let legendImgHeight = 0;

  // Calculate total dimensions first (needed for legend layout)
  const totalWidth = chartWidth + PADDING * 2;

  if (legendItems && legendItems.length > 0) {
    // Generate native SVG legend (pixel-perfect rendering)
    const legendStartY = HEADER_HEIGHT + getFilterInfoHeight(filterInfo, dateRange) + PADDING;
    const legendResult = generateSvgLegendContent(legendItems, totalWidth, legendStartY, legendAlignment);
    legendSvgContent = legendResult.svg;
    legendHeight = legendResult.height > 0 ? legendResult.height + LEGEND_SPACING : 0;
  } else if (legendElement) {
    // Fallback: Capture HTML legend as image (deprecated method)
    try {
      legendDataUrl = await toPng(legendElement, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      const legendImg = await loadImage(legendDataUrl);
      legendImgWidth = legendImg.width / 2; // Divide by 2 because of pixelRatio
      legendImgHeight = legendImg.height / 2;
      legendHeight = legendImgHeight + LEGEND_SPACING;
    } catch (error) {
      console.warn('Failed to capture legend, proceeding without it:', error);
    }
  }

  // Calculate footer height (just user and timestamp now)
  const LINE_HEIGHT = 24;
  const hasCustomFooter = !!customFooterText;
  
  // Base footer height + custom footer
  let additionalFooterHeight = 0;
  if (hasCustomFooter) additionalFooterHeight += LINE_HEIGHT;
  if (additionalFooterHeight > 0) additionalFooterHeight += 4; // Padding
  
  const totalFooterHeight = FOOTER_HEIGHT + additionalFooterHeight;

  // Calculate filter info height for top section
  const filterInfoHeight = getFilterInfoHeight(filterInfo, dateRange);

  // Calculate total height
  const totalHeight = chartHeight + legendHeight + HEADER_HEIGHT + filterInfoHeight + totalFooterHeight + PADDING * 2;

  // Clone the chart SVG
  const chartClone = chartSvgElement.cloneNode(true) as SVGElement;

  // Remove data-* attributes from all elements (they cause namespace errors in standalone SVG)
  removeDataAttributes(chartClone);

  // Remove style attribute from root
  chartClone.removeAttribute('style');

  // Get the inner content of the chart SVG
  const serializer = new XMLSerializer();
  let chartContent = serializer.serializeToString(chartClone);

  // Clean the SVG content to remove any remaining problematic attributes
  chartContent = cleanSvgContent(chartContent);

  // Remove the outer svg tags from chart content since we'll wrap it in a <g> element
  chartContent = chartContent.replace(/<svg[^>]*>/, '').replace(/<\/svg>$/, '');

  // Calculate chart Y position (after header + filter info + legend)
  const chartY = HEADER_HEIGHT + filterInfoHeight + PADDING + legendHeight;

  // Build legend embed (either native SVG or image fallback)
  let legendEmbed = '';
  if (legendSvgContent) {
    // Native SVG legend (preferred)
    legendEmbed = legendSvgContent;
  } else if (legendDataUrl) {
    // Fallback: Embedded image legend (deprecated)
    legendEmbed = `
  <!-- Legend (Image Fallback) -->
  <image 
    x="${(totalWidth - legendImgWidth) / 2}" 
    y="${HEADER_HEIGHT + filterInfoHeight + PADDING}" 
    width="${legendImgWidth}" 
    height="${legendImgHeight}" 
    href="${legendDataUrl}"
    preserveAspectRatio="xMidYMid meet"
  />`;
  }

  // Build the SVG document
  const svgDocument = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <defs>
    <style type="text/css">
      .branding-font { font-family: 'DM Sans', 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="${totalWidth}" height="${totalHeight}" fill="#ffffff"/>
  ${generateSvgHeaderContent(totalWidth, chartTitle, primaryColor)}
  ${generateSvgFilterInfo(totalWidth, HEADER_HEIGHT + 4, filterInfo, dateRange)}
  ${legendEmbed}
  
  <!-- Chart content -->
  <g transform="translate(${PADDING}, ${chartY})">
    <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
      ${chartContent}
    </svg>
  </g>
  ${generateSvgFooterContent(totalWidth, chartHeight + legendHeight, userName, filterInfo, dateRange, customFooterText)}
</svg>`;

  return svgDocument;
}

/**
 * Export chart as PNG with branding
 */
export async function exportChartAsPNG(
  chartElement: HTMLElement,
  options: BrandedExportOptions
): Promise<void> {
  const { chartTitle } = options;

  try {
    // Get chart as data URL
    const chartDataUrl = await getChartAsDataUrl(chartElement, options);

    // Create branded image
    const brandedDataUrl = await createBrandedImage(chartDataUrl, options);

    // Download
    const filename = generateFilename(chartTitle, 'png');
    const link = document.createElement('a');
    link.href = brandedDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to export chart as PNG:', error);
    throw error;
  }
}

/**
 * Export chart as SVG with branding
 */
export async function exportChartAsSVG(
  chartElement: HTMLElement,
  options: BrandedExportOptions
): Promise<void> {
  const { chartTitle } = options;

  // Ensure chart is fully rendered/animated before capturing
  await waitForChartRender();

  try {
    // Enhancement: Auto-detect ApexCharts legend if not explicitly provided
    // This ensures HTML legends are included in SVG exports (embedded as image)
    if (!options.legendElement) {
      const internalLegend = chartElement.querySelector('.apexcharts-legend');
      if (internalLegend) {
        options = { ...options, legendElement: internalLegend as HTMLElement };
      }
    }

    // Get the chart SVG element
    const chartSvgData = getChartSvgElement(chartElement);

    if (!chartSvgData) {
      throw new Error('Could not find chart SVG element');
    }

    const { svg, width, height } = chartSvgData;

    // Create branded SVG
    const brandedSvg = await createBrandedSvg(svg, width, height, options);

    // Create blob and download
    const blob = new Blob([brandedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const filename = generateFilename(chartTitle, 'svg');
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export chart as SVG:', error);
    throw error;
  }
}

/**
 * Export chart as CSV
 */
export async function exportChartAsCSV(
  chartElement: HTMLElement,
  options: BrandedExportOptions
): Promise<void> {
  const { chartTitle } = options;

  // Ensure chart is fully rendered/animated before capturing
  await waitForChartRender();

  try {
    const apexChart = getApexChartInstance(chartElement);

    // Try multiple ways to access chart configuration
    let config: any = null;
    let series: any[] = [];
    let categories: any[] = [];

    // Method 1: Via chart.w.config (most common)
    if (apexChart?.w?.config) {
      config = apexChart.w.config;
      series = config.series || [];
      categories = config.xaxis?.categories || [];
    }
    // Method 2: Via chart.opts (alternative path)
    else if (apexChart?.opts) {
      config = apexChart.opts;
      series = config.series || [];
      categories = config.xaxis?.categories || [];
    }
    // Method 3: Via chart.w.globals (has initialized series data)
    else if (apexChart?.w?.globals) {
      const globals = apexChart.w.globals;
      config = { chart: { type: globals.chartType } };
      series = globals.initialSeries || [];
      categories = globals.labels || globals.categoryLabels || [];
    }

    // If we still don't have data, try to extract from window.Apex
    if (series.length === 0 && (window as any).Apex?.chartInstances) {
      const chartId = chartElement.querySelector('.apexcharts-canvas')?.getAttribute('id');
      for (const instance of (window as any).Apex.chartInstances) {
        if (instance.id === chartId && instance.chart?.w) {
          config = instance.chart.w.config;
          series = config?.series || instance.chart.w.globals?.initialSeries || [];
          categories = config?.xaxis?.categories || [];
          break;
        }
      }
    }

    if (series.length === 0) {
      console.error('CSV Export: Could not find chart data. Chart instance:', apexChart);
      throw new Error('Could not access chart data for CSV export. Please try PNG or SVG export.');
    }

    // Get chart type from config or globals
    const chartType = config?.chart?.type || apexChart?.w?.globals?.chartType || 'unknown';

    // Build CSV content
    const csvRows: string[] = [];

    // Handle heatmap charts
    if (chartType === 'heatmap' || chartType === 'treemap') {
      // Heatmap: series[].name is row label, data[].x is column label, data[].y is value
      const headers = ['Row', 'Column', 'Value'];
      csvRows.push(headers.join(','));

      series.forEach((s: any) => {
        const rowName = s.name || 'Unknown';
        if (s.data) {
          s.data.forEach((d: any) => {
            const colName = d.x || 'Unknown';
            const value = d.y != null ? d.y : '';
            csvRows.push(`"${rowName}","${colName}",${value}`);
          });
        }
      });
    }
    // Handle pie/donut charts
    else if (chartType === 'pie' || chartType === 'donut') {
      const labels = config?.labels || [];
      const headers = ['Category', 'Value'];
      csvRows.push(headers.join(','));

      series.forEach((value: any, index: number) => {
        const label = labels[index] || `Category ${index + 1}`;
        csvRows.push(`"${label}",${value}`);
      });
    }
    // Handle standard series data
    else if (series.length > 0) {
      const firstSeries = series[0];

      // Check if series has data array with x/y objects
      if (firstSeries.data && firstSeries.data.length > 0) {
        const firstDataPoint = firstSeries.data[0];

        if (
          typeof firstDataPoint === 'object' &&
          firstDataPoint !== null &&
          'x' in firstDataPoint
        ) {
          // x/y format data (common for time series)
          const headers = [
            'Date/Category',
            ...series.map((s: any) => escapeCSV(s.name || 'Value')),
          ];
          csvRows.push(headers.join(','));

          // Collect all unique x values across all series
          const allXValues = new Map<string, any>();
          series.forEach((s: any) => {
            if (s.data) {
              s.data.forEach((d: any) => {
                const key = String(d.x);
                if (!allXValues.has(key)) {
                  allXValues.set(key, d.x);
                }
              });
            }
          });

          // Sort x values
          const sortedKeys = Array.from(allXValues.keys()).sort((a, b) => {
            const valA = allXValues.get(a);
            const valB = allXValues.get(b);
            if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
            return a.localeCompare(b);
          });

          // Build rows
          sortedKeys.forEach((key) => {
            const xVal = allXValues.get(key);
            const row: string[] = [formatXValue(xVal)];
            series.forEach((s: any) => {
              const point = s.data?.find((d: any) => String(d.x) === key);
              row.push(point?.y != null ? String(point.y) : '');
            });
            csvRows.push(row.join(','));
          });
        } else if (typeof firstDataPoint === 'number') {
          // Simple numeric array format
          const headers = ['Category', ...series.map((s: any) => escapeCSV(s.name || 'Value'))];
          csvRows.push(headers.join(','));

          const maxLength = Math.max(...series.map((s: any) => s.data?.length || 0));
          for (let i = 0; i < maxLength; i++) {
            const category = categories[i] || String(i + 1);
            const row: string[] = [escapeCSV(String(category))];
            series.forEach((s: any) => {
              row.push(s.data?.[i] != null ? String(s.data[i]) : '');
            });
            csvRows.push(row.join(','));
          }
        }
      }
      // Handle simple series (array of numbers at root level, like pie charts)
      else if (typeof firstSeries === 'number') {
        const labels = config?.labels || categories || [];
        const headers = ['Category', 'Value'];
        csvRows.push(headers.join(','));

        series.forEach((value: any, index: number) => {
          const label = labels[index] || `Item ${index + 1}`;
          csvRows.push(`"${label}",${value}`);
        });
      }
    }

    // Check if we have any data rows
    if (csvRows.length === 0) {
      csvRows.push('No structured data available for export');
    }

    // Download CSV
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const filename = generateFilename(chartTitle, 'csv');

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export chart as CSV:', error);
    throw error;
  }
}

/**
 * Escape a value for CSV (wrap in quotes if contains comma, quote, or newline)
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format x value for CSV (handles timestamps)
 */
function formatXValue(x: any): string {
  if (typeof x === 'number' && x > 1000000000000) {
    // Looks like a timestamp
    const date = new Date(x);
    return date.toISOString().split('T')[0];
  }
  return String(x);
}

/**
 * Series data interface for direct CSV export
 */
export interface ChartSeriesData {
  type?: string;
  series: any[];
  categories?: string[];
}

/**
 * Export series data directly as CSV (reliable method - bypasses chart instance lookup)
 */
export async function exportSeriesAsCSV(
  seriesData: ChartSeriesData,
  options: BrandedExportOptions
): Promise<void> {
  const { chartTitle } = options;
  const { type: chartType = 'unknown', series, categories = [] } = seriesData;

  try {
    if (!series || series.length === 0) {
      throw new Error('No series data provided for CSV export');
    }

    const csvRows: string[] = [];

    // Handle heatmap charts
    if (chartType === 'heatmap' || chartType === 'treemap') {
      const headers = ['Row', 'Column', 'Value'];
      csvRows.push(headers.join(','));

      series.forEach((s: any) => {
        const rowName = s.name || 'Unknown';
        if (s.data) {
          s.data.forEach((d: any) => {
            const colName = d.x || 'Unknown';
            const value = d.y != null ? d.y : '';
            csvRows.push(
              `"${escapeCSV(String(rowName))}","${escapeCSV(String(colName))}",${value}`
            );
          });
        }
      });
    }
    // Handle pie/donut charts
    else if (chartType === 'pie' || chartType === 'donut') {
      const headers = ['Category', 'Value'];
      csvRows.push(headers.join(','));

      series.forEach((value: any, index: number) => {
        const label = categories[index] || `Category ${index + 1}`;
        csvRows.push(`"${escapeCSV(label)}",${value}`);
      });
    }
    // Handle standard series data with x/y objects
    else if (series.length > 0 && series[0].data) {
      const firstDataPoint = series[0].data[0];

      if (typeof firstDataPoint === 'object' && firstDataPoint !== null && 'x' in firstDataPoint) {
        // x/y format data
        const headers = ['Date/Category', ...series.map((s: any) => escapeCSV(s.name || 'Value'))];
        csvRows.push(headers.join(','));

        // Collect all unique x values
        const allXValues = new Map<string, any>();
        series.forEach((s: any) => {
          if (s.data) {
            s.data.forEach((d: any) => {
              const key = String(d.x);
              if (!allXValues.has(key)) {
                allXValues.set(key, d.x);
              }
            });
          }
        });

        // Sort and build rows
        const sortedKeys = Array.from(allXValues.keys()).sort((a, b) => {
          const valA = allXValues.get(a);
          const valB = allXValues.get(b);
          if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
          return a.localeCompare(b);
        });

        sortedKeys.forEach((key) => {
          const xVal = allXValues.get(key);
          const row: string[] = [formatXValue(xVal)];
          series.forEach((s: any) => {
            const point = s.data?.find((d: any) => String(d.x) === key);
            row.push(point?.y != null ? String(point.y) : '');
          });
          csvRows.push(row.join(','));
        });
      } else if (typeof firstDataPoint === 'number') {
        // Simple numeric array
        const headers = ['Category', ...series.map((s: any) => escapeCSV(s.name || 'Value'))];
        csvRows.push(headers.join(','));

        const maxLength = Math.max(...series.map((s: any) => s.data?.length || 0));
        for (let i = 0; i < maxLength; i++) {
          const category = categories[i] || String(i + 1);
          const row: string[] = [escapeCSV(String(category))];
          series.forEach((s: any) => {
            row.push(s.data?.[i] != null ? String(s.data[i]) : '');
          });
          csvRows.push(row.join(','));
        }
      }
    }

    // Download CSV
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const filename = generateFilename(chartTitle, 'csv');

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export series as CSV:', error);
    throw error;
  }
}
