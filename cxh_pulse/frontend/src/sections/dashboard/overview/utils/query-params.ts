export function buildTemperatureParams(ward: string, county: string, dateRange: { from: Date; to: Date }) {
    return {
        wardId: ward || undefined,
        countyId: 'Hsk1YV8kHkT',
        subcountyId: county || undefined,
        startYear: dateRange.from.getFullYear(),
        startMonth: dateRange.from.getMonth() + 1,
        endYear: dateRange.to.getFullYear(),
        endMonth: dateRange.to.getMonth() + 1,
    };
}

export function buildRainfallParams(ward: string, county: string, dateRange: { from: Date; to: Date }) {
    return buildTemperatureParams(ward, county, dateRange);
}

