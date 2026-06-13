/**
 * Insights Types
 * 
 * Type definitions for the insights feature, extracted from insights-view.tsx
 * to improve type organization and reusability.
 */

import type { GeoJSON } from 'geojson';

/**
 * Temperature feature properties for GeoJSON
 */
export interface TemperatureFeature {
    type: string;
    geometry: {
        type: string;
        coordinates: number[][][];
    };
    properties: {
        id: string;
        ward: string;
        sumTp: number;
        county: string;
        subCounty: string;
        meanMedianMaxD2m: number;
        meanMedianMaxT2m: number;
    };
}

/**
 * Temperature GeoJSON feature collection
 */
export type TemperatureGeoJSON = {
    type: 'FeatureCollection';
    features: TemperatureFeature[];
};

/**
 * Indicator date range metadata
 */
export interface IndicatorDateRange {
    indicator: string;
    minYear: number;
    minMonth: number;
    maxYear: number;
    maxMonth: number;
    uniquePeriods?: string[];
    section?: string;
}

/**
 * Insights data props passed to insight view components
 */
export type InsightsDataProps = {
    wardsData?: {
        [key: string]: string[];
    };
    wardsGeoJSON?: GeoJSON.FeatureCollection;
    subcountiesGeoJSON?: GeoJSON.FeatureCollection;
    facilityData?: any;
    indicatorsData?: IndicatorDateRange[];
    isLoading?: boolean;
    hasError?: boolean;
    navigateToClimateTab?: () => void;
    navigateToPromptsTab?: () => void;
    hasClimatePermission?: boolean;
    hasPromptsPermission?: boolean;
};
