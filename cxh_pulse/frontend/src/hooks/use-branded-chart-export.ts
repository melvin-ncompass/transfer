import { useCallback, RefObject, useState, useEffect } from 'react';
import { useBranding } from '../contexts/branding-context';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/slices/authSlice';
import {
  exportChartAsPNG,
  exportChartAsSVG,
  exportChartAsCSV,
  exportSeriesAsCSV,
  BrandedExportOptions,
  LegendItem,
} from '../utils/branded-chart-export';

export type { LegendItem } from '../utils/branded-chart-export';

export interface ChartSeriesData {
  type?: string;
  series: any[];
  categories?: string[];
}

export interface UseBrandedChartExportOptions {
  chartTitle: string; 
  chartRef: RefObject<HTMLElement | null>;
  getLegendItems?: () => LegendItem[];
  legendRef?: RefObject<HTMLElement | null>;
  getSeriesData?: () => ChartSeriesData;
  filterInfo?: { location?: string; subcounty?: string; ward?: string };
  dateRange?: { from: Date; to: Date };
  customFooterText?: string;
  legendAlignment?: 'left' | 'center' | 'right';
}

export interface BrandedChartExportActions {
  exportPNG: () => Promise<void>;
  exportSVG: () => Promise<void>;
  exportCSV: () => Promise<void>;
  isReady: boolean;
}

export function useBrandedChartExport({
  chartTitle,
  chartRef,
  getLegendItems,
  legendRef,
  getSeriesData,
  filterInfo,
  dateRange,
  customFooterText,
  legendAlignment = 'right',
}: UseBrandedChartExportOptions): BrandedChartExportActions {
  const { branding } = useBranding();
  const user = useAppSelector(selectCurrentUser);
  const userName = user?.userInfo?.name || user?.name || user?.email || 'Unknown User';
  const primaryColor = branding?.colors?.primary || branding?.fgcolor || '#D32F2F';
  const logoUrl = branding?.logoData?.src || undefined;

  const getExportOptions = useCallback((): BrandedExportOptions => ({
    chartTitle,
    userName,
    logoUrl,
    primaryColor,
    legendItems: getLegendItems?.(),
    legendElement: !getLegendItems ? legendRef?.current || null : null,
    filterInfo,
    dateRange,
    customFooterText,
    legendAlignment,
    excludeLegend: !!getLegendItems,
  }), [chartTitle, userName, logoUrl, primaryColor, getLegendItems, legendRef, filterInfo, dateRange, customFooterText, legendAlignment]);

  const exportPNG = useCallback(async () => {
    if (!chartRef.current) { console.error('Chart element not available for export'); return; }
    try { await exportChartAsPNG(chartRef.current, getExportOptions()); }
    catch (error) { console.error('Failed to export chart as PNG:', error); throw error; }
  }, [chartRef, getExportOptions]);

  const exportSVG = useCallback(async () => {
    if (!chartRef.current) { console.error('Chart element not available for export'); return; }
    try { await exportChartAsSVG(chartRef.current, getExportOptions()); }
    catch (error) { console.error('Failed to export chart as SVG:', error); throw error; }
  }, [chartRef, getExportOptions]);

  const exportCSV = useCallback(async () => {
    try {
      if (getSeriesData) { await exportSeriesAsCSV(getSeriesData(), getExportOptions()); return; }
      if (!chartRef.current) { console.error('Chart element not available for export'); throw new Error('Chart not available for CSV export'); }
      await exportChartAsCSV(chartRef.current, getExportOptions());
    } catch (error) { console.error('Failed to export chart as CSV:', error); throw error; }
  }, [chartRef, getExportOptions, getSeriesData]);

  return { exportPNG, exportSVG, exportCSV, isReady: !!chartRef.current };
}
