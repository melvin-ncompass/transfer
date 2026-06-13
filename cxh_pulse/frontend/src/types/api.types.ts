/**
 * Shared types for API responses
 * 
 * These types are used across multiple feature APIs
 */

// DK Prompt Record
export type DKPromptRecord = {
    facility_name: string;
    'Date/Time Opened': string;
    Intent: string;
    Intent_Count: string;
    County: string;
    Subcounty: string;
    Latitude: number;
    Longitude: number;
    Ward: string;
    computed_geom: string;
    computed_geojson: {
        type: 'Point';
        coordinates: [number, number];
    };
};

// Health Facility Record
export type DKHealthFacilityRecord = {
    s: string;
    facility_name: string;
    county: string;
    subcounty: string;
    latitude: number;
    longitude: number;
    ward: string;
    computed_geom: string;
    computed_geojson: {
        type: 'Point';
        coordinates: [number, number];
    };
};

// KHIS Data Record
export type KhisDataRecord = {
    uid_record: string;
    facility_name: string;
    orgUnit: string;
    orgUnit_level: string;
    dataElement_name: string;
    dataElement_code: string;
    dataElement: string;
    dx_type: string;
    period: string;
    value: string;
    County: string;
    Subcounty: string;
    Ward: string;
    Latitude: number;
    Longitude: number;
    computed_geom: string;
    computed_geojson: string;
};

// Prompts Data Record
export type PromptsDataRecord = {
    facility_name: string;
    'Date/Time Opened': string;
    Intent: string;
    Intent_Count: string;
    County: string;
    Subcounty: string;
    Latitude: number;
    Longitude: number;
    Ward: string;
    computed_geom: string;
    computed_geojson: string;
};

// Health Facility Record (alternative name)
export type HealthFacilityRecord = DKHealthFacilityRecord;

// Re-export from healthApi (now in overview section)
export type { DKKHISRecord, KHISLocations } from '../sections/dashboard/overview/api/healthApi';

