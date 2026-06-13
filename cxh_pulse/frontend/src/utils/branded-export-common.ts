export const HEADER_HEIGHT = 90;
export const FOOTER_HEIGHT = 40;
export const PADDING = 20;
export const FONT_FAMILY =
  '"Inter", "Helvetica Neue", Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
export const FONT_FAMILY_SVG =
  "'Inter', 'Helvetica Neue', Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export const LEGEND_ITEM_SPACING = 20;
export const LEGEND_MARKER_SIZE = 8;
export const LEGEND_MARKER_TEXT_GAP = 6;
export const LEGEND_FONT_SIZE = 12;
export const LEGEND_LINE_HEIGHT = 20;
export const LEGEND_ROW_GAP = 8;

export interface LegendItem {
  name: string;
  color: string;
  visible?: boolean;
  markerType?: 'circle' | 'square' | 'line';
  dashed?: boolean;
}

export const LOGO_HEIGHT = 40;
export const LOGO_ASPECT_RATIO = 460 / 70;
export const LOGO_WIDTH = LOGO_HEIGHT * LOGO_ASPECT_RATIO;

export function formatDownloadTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const formatter = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' });
  const parts = formatter.formatToParts(now);
  const timezonePart = parts.find((part) => part.type === 'timeZoneName');
  let timezone = timezonePart?.value || '';
  if (timezone.startsWith('GMT') || timezone.startsWith('UTC')) {
    const longFormatter = new Intl.DateTimeFormat('en-US', { timeZoneName: 'long' });
    const longParts = longFormatter.formatToParts(now);
    const longTimezonePart = longParts.find((part) => part.type === 'timeZoneName');
    const longTimezone = longTimezonePart?.value || '';
    const words = longTimezone.split(' ');
    if (words.length >= 2) {
      const abbreviation = words.map((word) => word[0]).join('');
      if (abbreviation.length >= 2 && abbreviation.length <= 5) {
        timezone = abbreviation;
      }
    }
  }
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${timezone}`;
}

export function generateFilename(title: string, extension: string): string {
  const sanitizedTitle = title.replace(/[<>:"/\\|?*]/g, '').trim();
  return `CxH P - ${sanitizedTitle}.${extension}`;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export function getPulseSvgPath(primaryColor: string): string {
  return `<path d="M16 36 L24 36 L30 26 L36 46 L42 32 L48 36 L58 36" fill="none" stroke="${primaryColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
}

export function getCxHPulseLogoDataUrl(primaryColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" viewBox="0 0 460 70">
    <path d="M16 36 L24 36 L30 26 L36 46 L42 32 L48 36 L58 36" fill="none" stroke="${primaryColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="70" y="46" font-family="Arial, Helvetica, sans-serif" font-weight="600" fill="${primaryColor}" font-size="40" letter-spacing="-1.5">C</text>
    <text x="99" y="43" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="${primaryColor}" font-size="32">x</text>
    <text x="120" y="46" font-family="Arial, Helvetica, sans-serif" font-weight="600" fill="${primaryColor}" font-size="40" letter-spacing="-1.5">H Pulse</text>
    <text x="268" y="26" font-family="Arial, Helvetica, sans-serif" font-weight="500" fill="${primaryColor}" font-size="12">by</text>
    <text x="268" y="46" font-family="Arial, Helvetica, sans-serif" font-weight="800" fill="${primaryColor}" font-size="15.5" letter-spacing="-0.3">DataKind<tspan dx="1" dy="-6" font-size="9">®</tspan></text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function escapeForSvg(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function generateSvgHeaderContent(totalWidth: number, title: string, primaryColor: string): string {
  const logoRowHeight = 50;
  const titleRowHeight = HEADER_HEIGHT - logoRowHeight;
  const logoY = (logoRowHeight - LOGO_HEIGHT) / 2;
  const escapedTitle = escapeForSvg(title);
  return `
  <g class="header">
    <line x1="${PADDING}" y1="${HEADER_HEIGHT}" x2="${totalWidth - PADDING}" y2="${HEADER_HEIGHT}" stroke="#e0e0e0" stroke-width="1"/>
    <g transform="translate(${PADDING}, ${logoY})">
      <svg width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" viewBox="0 0 460 70">
        <path d="M16 36 L24 36 L30 26 L36 46 L42 32 L48 36 L58 36" fill="none" stroke="${primaryColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="70" y="46" font-family="Arial, Helvetica, sans-serif" font-weight="600" fill="${primaryColor}" font-size="40" letter-spacing="-1.5">C</text>
        <text x="99" y="43" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="${primaryColor}" font-size="32">x</text>
        <text x="120" y="46" font-family="Arial, Helvetica, sans-serif" font-weight="600" fill="${primaryColor}" font-size="40" letter-spacing="-1.5">H Pulse</text>
        <text x="268" y="26" font-family="Arial, Helvetica, sans-serif" font-weight="500" fill="${primaryColor}" font-size="12">by</text>
        <text x="268" y="46" font-family="Arial, Helvetica, sans-serif" font-weight="800" fill="${primaryColor}" font-size="15.5" letter-spacing="-0.3">DataKind<tspan dx="1" dy="-6" font-size="9">®</tspan></text>
      </svg>
    </g>
    <text x="${totalWidth / 2}" y="${logoRowHeight + titleRowHeight / 2}" class="branding-font" font-size="18" font-weight="600" fill="#1a1a1a" text-anchor="middle" dominant-baseline="middle">${escapedTitle}</text>
  </g>`;
}

export function formatMonthYearLong(date: Date): string {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function formatDateRange(dateRange?: { from: Date; to: Date }): string {
  if (!dateRange) return '';
  const isSameMonthYear = dateRange.from.getMonth() === dateRange.to.getMonth() && dateRange.from.getFullYear() === dateRange.to.getFullYear();
  if (isSameMonthYear) return formatMonthYearLong(dateRange.from);
  const formatDate = (date: Date): string => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };
  return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
}

export function formatFilterInfo(filterInfo?: { location?: string; subcounty?: string; ward?: string }): string {
  if (!filterInfo) return '';
  const parts: string[] = [];
  if (filterInfo.ward) {
    parts.push(`Ward: ${filterInfo.ward}`);
  } else if (filterInfo.subcounty) {
    parts.push(`Subcounty: ${filterInfo.subcounty}`);
  } else if (filterInfo.location) {
    const locationLower = filterInfo.location.toLowerCase();
    if (locationLower.includes('ward:') || locationLower.includes('subcounty:') || 
        locationLower.includes('risk level:') || locationLower.includes('category:') ||
        locationLower.includes('priority:') || locationLower.includes('mode:')) {
      parts.push(filterInfo.location);
    } else {
      parts.push(`Location: ${filterInfo.location}`);
    }
  }
  return parts.join(', ');
}

export function generateSvgFooterContent(
  totalWidth: number,
  contentHeight: number,
  userName: string,
  filterInfo?: { location?: string; subcounty?: string; ward?: string },
  dateRange?: { from: Date; to: Date },
  customFooterText?: string
): string {
  const timestamp = formatDownloadTimestamp();
  const escapedUserName = escapeForSvg(userName);
  const filterInfoHeight = getFilterInfoHeight(filterInfo, dateRange);
  const footerY = HEADER_HEIGHT + filterInfoHeight + PADDING + contentHeight + PADDING;
  const hasCustomFooter = !!customFooterText;
  const customFooterElement = hasCustomFooter ? `
    <text x="${PADDING}" y="${footerY + FOOTER_HEIGHT + 4}" class="branding-font" font-size="14" font-weight="600" fill="#333333" dominant-baseline="hanging">${escapeForSvg(customFooterText || '')}</text>` : '';
  return `
  <g class="footer">
    <line x1="${PADDING}" y1="${footerY}" x2="${totalWidth - PADDING}" y2="${footerY}" stroke="#e0e0e0" stroke-width="1"/>
    <text x="${PADDING}" y="${footerY + FOOTER_HEIGHT / 2}" class="branding-font" font-size="12" fill="#666666" dominant-baseline="middle">Downloaded by ${escapedUserName}</text>
    <text x="${totalWidth - PADDING}" y="${footerY + FOOTER_HEIGHT / 2}" class="branding-font" font-size="12" fill="#666666" text-anchor="end" dominant-baseline="middle">${timestamp}</text>
    ${customFooterElement}
  </g>`;
}

export async function drawCanvasHeader(
  ctx: CanvasRenderingContext2D, canvasWidth: number, title: string, primaryColor: string, scale: number = 1
): Promise<void> {
  const scaledHeaderHeight = HEADER_HEIGHT * scale;
  const scaledPadding = PADDING * scale;
  const scaledLogoHeight = LOGO_HEIGHT * scale;
  const scaledLogoWidth = LOGO_WIDTH * scale;
  const logoRowHeight = 50 * scale;
  const titleRowHeight = scaledHeaderHeight - logoRowHeight;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, scaledHeaderHeight);
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = scale;
  ctx.beginPath();
  ctx.moveTo(scaledPadding, scaledHeaderHeight);
  ctx.lineTo(canvasWidth - scaledPadding, scaledHeaderHeight);
  ctx.stroke();
  const logoX = scaledPadding;
  const logoY = (logoRowHeight - scaledLogoHeight) / 2;
  try {
    const logoDataUrl = getCxHPulseLogoDataUrl(primaryColor);
    const logoImg = await loadImage(logoDataUrl);
    ctx.drawImage(logoImg, logoX, logoY, scaledLogoWidth, scaledLogoHeight);
  } catch (error) {
    console.error('Failed to load CxH Pulse logo:', error);
    ctx.fillStyle = primaryColor;
    ctx.font = `600 ${16 * scale}px ${FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('CxH Pulse', scaledPadding, logoRowHeight / 2);
  }
  ctx.font = `600 ${18 * scale}px ${FONT_FAMILY}`;
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, canvasWidth / 2, logoRowHeight + titleRowHeight / 2);
}

export function drawCanvasFooter(
  ctx: CanvasRenderingContext2D, canvasWidth: number, footerY: number, userName: string,
  scale: number = 1, filterInfo?: { location?: string; subcounty?: string; ward?: string },
  dateRange?: { from: Date; to: Date }, customFooterText?: string
): void {
  const scaledPadding = PADDING * scale;
  const scaledFooterHeight = FOOTER_HEIGHT * scale;
  const timestamp = formatDownloadTimestamp();
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = scale;
  ctx.beginPath();
  ctx.moveTo(scaledPadding, footerY);
  ctx.lineTo(canvasWidth - scaledPadding, footerY);
  ctx.stroke();
  ctx.font = `400 ${12 * scale}px ${FONT_FAMILY}`;
  ctx.fillStyle = '#666666';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const footerTextY = footerY + scaledFooterHeight / 2;
  ctx.fillText(`Downloaded by ${userName}`, scaledPadding, footerTextY);
  ctx.textAlign = 'right';
  ctx.fillText(timestamp, canvasWidth - scaledPadding, footerTextY);
  if (customFooterText) {
    const infoY = footerY + scaledFooterHeight + (4 * scale);
    ctx.font = `600 ${14 * scale}px ${FONT_FAMILY}`;
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'hanging';
    ctx.fillText(customFooterText, scaledPadding, infoY);
  }
}

export function getFilterInfoHeight(
  filterInfo?: { location?: string; subcounty?: string; ward?: string },
  dateRange?: { from: Date; to: Date }
): number {
  const filterText = formatFilterInfo(filterInfo);
  const dateRangeText = formatDateRange(dateRange);
  if (!filterText && !dateRangeText) return 0;
  let height = 0;
  const LINE_HEIGHT = 20;
  if (filterText) height += LINE_HEIGHT;
  if (dateRangeText) height += LINE_HEIGHT;
  if (height > 0) height += 10;
  return height;
}

export function generateSvgFilterInfo(
  totalWidth: number, startY: number,
  filterInfo?: { location?: string; subcounty?: string; ward?: string },
  dateRange?: { from: Date; to: Date }
): string {
  const filterText = formatFilterInfo(filterInfo);
  const dateRangeText = formatDateRange(dateRange);
  if (!filterText && !dateRangeText) return '';
  const escapedFilterText = escapeForSvg(filterText);
  const escapedDateRangeText = escapeForSvg(dateRangeText);
  const x = totalWidth - PADDING;
  let currentY = startY;
  let content = '';
  if (filterText) {
    content += `<text x="${x}" y="${currentY}" class="branding-font" font-size="14" font-weight="600" fill="#333333" text-anchor="end" dominant-baseline="hanging">${escapedFilterText}</text>`;
    currentY += 20;
  }
  if (dateRangeText) {
    content += `<text x="${x}" y="${currentY}" class="branding-font" font-size="12" font-weight="400" fill="#666666" text-anchor="end" dominant-baseline="hanging">${escapedDateRangeText}</text>`;
  }
  return `<g>${content}</g>`;
}

export function drawCanvasFilterInfo(
  ctx: CanvasRenderingContext2D, canvasWidth: number, startY: number,
  filterInfo?: { location?: string; subcounty?: string; ward?: string },
  dateRange?: { from: Date; to: Date }, scale: number = 1
): void {
  const filterText = formatFilterInfo(filterInfo);
  const dateRangeText = formatDateRange(dateRange);
  if (!filterText && !dateRangeText) return;
  const scaledPadding = PADDING * scale;
  const x = canvasWidth - scaledPadding;
  let currentY = startY;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'hanging';
  if (filterText) {
    ctx.font = `600 ${14 * scale}px ${FONT_FAMILY}`;
    ctx.fillStyle = '#333333';
    ctx.fillText(filterText, x, currentY);
    currentY += 20 * scale;
  }
  if (dateRangeText) {
    ctx.font = `400 ${12 * scale}px ${FONT_FAMILY}`;
    ctx.fillStyle = '#666666';
    ctx.fillText(dateRangeText, x, currentY);
  }
}

function calculateLegendItemWidth(name: string): number {
  const textWidth = name.length * 7;
  return LEGEND_MARKER_SIZE + LEGEND_MARKER_TEXT_GAP + textWidth;
}

export function calculateLegendLayout(legendItems: LegendItem[], maxWidth: number): { width: number; height: number; rows: LegendItem[][] } {
  const visibleItems = legendItems.filter(item => item.visible !== false);
  if (visibleItems.length === 0) return { width: 0, height: 0, rows: [] };
  const rows: LegendItem[][] = [];
  let currentRow: LegendItem[] = [];
  let currentRowWidth = 0;
  let maxRowWidth = 0;
  visibleItems.forEach((item) => {
    const itemWidth = calculateLegendItemWidth(item.name);
    const spacing = currentRow.length > 0 ? LEGEND_ITEM_SPACING : 0;
    if (currentRowWidth + spacing + itemWidth > maxWidth && currentRow.length > 0) {
      maxRowWidth = Math.max(maxRowWidth, currentRowWidth);
      rows.push(currentRow);
      currentRow = [item];
      currentRowWidth = itemWidth;
    } else {
      currentRow.push(item);
      currentRowWidth += spacing + itemWidth;
    }
  });
  if (currentRow.length > 0) {
    maxRowWidth = Math.max(maxRowWidth, currentRowWidth);
    rows.push(currentRow);
  }
  const totalHeight = rows.length * LEGEND_LINE_HEIGHT + (rows.length - 1) * LEGEND_ROW_GAP;
  return { width: maxRowWidth, height: totalHeight, rows };
}

function generateSvgLegendMarker(x: number, y: number, color: string, markerType: 'circle' | 'square' | 'line' = 'circle', dashed: boolean = false): string {
  const halfSize = LEGEND_MARKER_SIZE / 2;
  const centerY = y + LEGEND_LINE_HEIGHT / 2;
  switch (markerType) {
    case 'square':
      return `<rect x="${x}" y="${centerY - halfSize}" width="${LEGEND_MARKER_SIZE}" height="${LEGEND_MARKER_SIZE}" fill="${color}" rx="2"/>`;
    case 'line': {
      const dashAttr = dashed ? ` stroke-dasharray="4,2"` : '';
      return `<line x1="${x}" y1="${centerY}" x2="${x + LEGEND_MARKER_SIZE}" y2="${centerY}" stroke="${color}" stroke-width="2"${dashAttr}/>`;
    }
    case 'circle':
    default:
      return `<circle cx="${x + halfSize}" cy="${centerY}" r="${halfSize}" fill="${color}"/>`;
  }
}

export function generateSvgLegendContent(
  legendItems: LegendItem[], totalWidth: number, startY: number, alignment: 'left' | 'center' | 'right' = 'right'
): { svg: string; height: number } {
  const visibleItems = legendItems.filter(item => item.visible !== false);
  if (visibleItems.length === 0) return { svg: '', height: 0 };
  const maxWidth = totalWidth - PADDING * 2;
  const layout = calculateLegendLayout(visibleItems, maxWidth);
  if (layout.rows.length === 0) return { svg: '', height: 0 };
  let svgContent = `<g class="chart-legend" transform="translate(0, ${startY})">`;
  let currentY = 0;
  layout.rows.forEach((row) => {
    let rowWidth = 0;
    row.forEach((item, idx) => {
      rowWidth += calculateLegendItemWidth(item.name);
      if (idx < row.length - 1) rowWidth += LEGEND_ITEM_SPACING;
    });
    let startX: number;
    switch (alignment) {
      case 'left': startX = PADDING; break;
      case 'center': startX = (totalWidth - rowWidth) / 2; break;
      case 'right': default: startX = totalWidth - PADDING - rowWidth; break;
    }
    let currentX = startX;
    row.forEach((item) => {
      svgContent += generateSvgLegendMarker(currentX, currentY, item.color, item.markerType || 'circle', item.dashed || false);
      const textX = currentX + LEGEND_MARKER_SIZE + LEGEND_MARKER_TEXT_GAP;
      const textY = currentY + LEGEND_LINE_HEIGHT / 2;
      svgContent += `<text x="${textX}" y="${textY}" font-family="${FONT_FAMILY_SVG}" font-size="${LEGEND_FONT_SIZE}" fill="#333333" dominant-baseline="middle">${escapeForSvg(item.name)}</text>`;
      currentX += calculateLegendItemWidth(item.name) + LEGEND_ITEM_SPACING;
    });
    currentY += LEGEND_LINE_HEIGHT + LEGEND_ROW_GAP;
  });
  svgContent += `</g>`;
  return { svg: svgContent, height: layout.height };
}

export function drawCanvasLegend(
  ctx: CanvasRenderingContext2D, legendItems: LegendItem[], canvasWidth: number,
  startY: number, scale: number = 1, alignment: 'left' | 'center' | 'right' = 'right'
): number {
  const visibleItems = legendItems.filter(item => item.visible !== false);
  if (visibleItems.length === 0) return 0;
  const scaledPadding = PADDING * scale;
  const scaledMarkerSize = LEGEND_MARKER_SIZE * scale;
  const scaledTextGap = LEGEND_MARKER_TEXT_GAP * scale;
  const scaledItemSpacing = LEGEND_ITEM_SPACING * scale;
  const scaledLineHeight = LEGEND_LINE_HEIGHT * scale;
  const scaledRowGap = LEGEND_ROW_GAP * scale;
  const scaledFontSize = LEGEND_FONT_SIZE * scale;
  const maxWidth = canvasWidth - scaledPadding * 2;
  const layout = calculateLegendLayout(visibleItems, maxWidth / scale);
  if (layout.rows.length === 0) return 0;
  let currentY = startY;
  ctx.font = `400 ${scaledFontSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = 'middle';
  layout.rows.forEach((row) => {
    let rowWidth = 0;
    row.forEach((item, idx) => {
      rowWidth += calculateLegendItemWidth(item.name) * scale;
      if (idx < row.length - 1) rowWidth += scaledItemSpacing;
    });
    let startX: number;
    switch (alignment) {
      case 'left': startX = scaledPadding; break;
      case 'center': startX = (canvasWidth - rowWidth) / 2; break;
      case 'right': default: startX = canvasWidth - scaledPadding - rowWidth; break;
    }
    let currentX = startX;
    row.forEach((item) => {
      const centerY = currentY + scaledLineHeight / 2;
      const halfMarkerSize = scaledMarkerSize / 2;
      ctx.fillStyle = item.color;
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2 * scale;
      const markerType = item.markerType || 'circle';
      switch (markerType) {
        case 'square':
          ctx.fillRect(currentX, centerY - halfMarkerSize, scaledMarkerSize, scaledMarkerSize);
          break;
        case 'line':
          ctx.beginPath();
          ctx.setLineDash(item.dashed ? [4 * scale, 2 * scale] : []);
          ctx.moveTo(currentX, centerY);
          ctx.lineTo(currentX + scaledMarkerSize, centerY);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        case 'circle': default:
          ctx.beginPath();
          ctx.arc(currentX + halfMarkerSize, centerY, halfMarkerSize, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';
      ctx.fillText(item.name, currentX + scaledMarkerSize + scaledTextGap, centerY);
      currentX += calculateLegendItemWidth(item.name) * scale + scaledItemSpacing;
    });
    currentY += scaledLineHeight + scaledRowGap;
  });
  return layout.height * scale;
}

export function getLegendHeight(legendItems: LegendItem[], maxWidth: number): number {
  const layout = calculateLegendLayout(legendItems, maxWidth);
  return layout.height > 0 ? layout.height + PADDING : 0;
}

