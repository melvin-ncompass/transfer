import type { TemperatureGeoJSON } from '../../../types/insights.types';

export type UseDashboardFiltersReturn = {
    // State
    selectedIndicator: string;
    setSelectedIndicator: (value: string) => void;
    isPopulationMode: boolean;
    dateRange: { from: Date; to: Date } | null;
    setDateRange: (range: { from: Date; to: Date } | null) => void;
    selectedMonthRange: [string, string] | null;
    setSelectedMonthRange: (range: [string, string] | null) => void;
    selectedSubcounty: string;
    setSelectedSubcounty: (value: string) => void;
    selectedWard: string;
    setSelectedWard: (value: string) => void;
    selectionMode: 'subcounty' | 'ward';
    setSelectionMode: (mode: 'subcounty' | 'ward') => void;
    showTemperature: boolean;
    setShowTemperature: (value: boolean) => void;
    showFacilities: boolean;
    setShowFacilities: (value: boolean) => void;
    showPrecipitation: boolean;
    setShowPrecipitation: (value: boolean) => void;
    // Computed
    minMonth?: string;
    maxMonth?: string;
    availableSubcounties: string[];
    availableWards: string[];
    // Data
    temperatureData?: TemperatureGeoJSON;
    isLoadingTemperature: boolean;
    isLoadingPrecipitation: boolean;
    temperatureError?: any;
    isLoadingChoropleth: boolean;
    choroplethData: any[];
    originalChoroplethData: any[];
    filteredChoroplethData: any[];
    // Animation
    isPlaying: boolean;
    setIsPlaying: (value: boolean) => void;
    isLooping: boolean;
    setIsLooping: (value: boolean | ((prev: boolean) => boolean)) => void;
    playing: boolean;
    setPlaying: (value: boolean) => void;
    frames: any[];
    frameDates: Date[];
    currentFrame: any;
    currentFrameDate: Date | null;
    filteredIndicatorData?: any[];
    indicatorValueMap: Record<string, number>;
    indicatorColorScale: { min: number; max: number; getColor: (value: number) => [number, number, number, number] } | null;
    frameIdx: number;
    setFrameIdx: (value: number) => void;
    // Population mode
    subcountiesGeoJSON?: GeoJSON.FeatureCollection;
    isLoadingSubcountiesGeoJSON?: boolean;
    // Callbacks
    handleSetSubcountyFilter: (subcounty: string) => void;
    handleSetWardFilter: (ward: string) => void;
    handleResetFilters: () => void;
};

