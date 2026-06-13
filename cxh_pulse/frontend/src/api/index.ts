/**
 * RTK Query API Services
 * 
 * Central export point for all API services and hooks
 * 
 * All APIs are organized by domain (auth, user, admin, settings)
 * and are located in the /src/api folder.
 */

export { baseApi } from './baseApi';

// Dashboard APIs (organized by domain/section) - Always available
export * from '../sections/dashboard/climate/api/climateApi';
export * from '../sections/dashboard/overview/api/healthApi';
export * from '../sections/dashboard/overview/api/populationApi';
export * from '../sections/dashboard/prompts/api/promptsApi';
export * from '../sections/config/api/dataConfigApi';

// Shared types - Always available
export * from '../types/api.types';
// Explicit type re-exports for better IDE support
export type {
    DKPromptRecord,
    DKHealthFacilityRecord,
    KhisDataRecord,
    PromptsDataRecord,
    HealthFacilityRecord,
    DKKHISRecord,
    KHISLocations,
} from '../types/api.types';

// Auth APIs
export * from './authApi';
export * from './sessionApi';

// User APIs
export * from './userApi';
export * from './inviteApi';

// Admin APIs
export * from './roleApi';
export * from './permissionApi';

// Settings APIs
export * from './settingsApi';
export * from './brandingApi';

