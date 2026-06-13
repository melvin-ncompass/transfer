import { KhisIndicatorCountResponseDto, KhisIndicatorDateResponseDto, KhisIndicatorTrendResponseDto, KhisKajiadoFacilityResponseDto, KhisKajiadoWardsResponseDto, KhisSubcountyResponseDto, PopulationSubcountyChloropethResponseDto, PopulationWardChloropethResponseDto, SubcountyGeoJSONResponseDto } from "src/visualizationV1/dto/visualization-swagger-response.dto";

export const OverviewSwagger = {
  POPULATION_WARD_CHLOROPETH: {
    summary: 'Fetch population ward chloropeth data',
    description: 'Returns the recent population count for each ward for a given specified time window.',
    tags: ['Business/Dashboard/Overview'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Population ward chloropeth data fetched successfully',
        dataType: PopulationWardChloropethResponseDto,
        isArray: true
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },

  POPULATION_SUBCOUNTY_CHLOROPETH: {
    summary: 'Fetch population subcounty chloropeth data',
    description: 'Returns the most recent population figure for each sub-county based on the input time window',
    tags: ['Business/Dashboard/Overview'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Population subcounty chloropeth data fetched successfully',
        dataType: PopulationSubcountyChloropethResponseDto,
        isArray: true
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },

  POPULATION_CHLOROPETH_SUBCOUNTY_GEOJSON: {
    summary: 'Fetch Population chloropeth subcounty geoJSON data',
    description: 'Returns subcounty boundaries as GeoJSON for choropleth mapping, with optional filtering.',
    tags: ['Business/Dashboard/Overview'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Population chloropeth subcounty geoJSON data fetched successfully',
        dataType: SubcountyGeoJSONResponseDto
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },

  WARD_SUBCOUNTY: {
    summary: 'Fetch Kajiado sub county and ward list',
    description: 'Fetches a list of Kajiado sub counties and their corresponding wards sorted alphabetically',
    tags: ['Business/Dashboard/Overview'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Kajiado subcounty and ward list fetched successfully',
        dataType: KhisSubcountyResponseDto
      },
      {
        status: 403,
        description: 'Forbidden - Insufficient permissions',
      },
    ],
  },

  KHIS_INDICATOR_DATE_FILTER: {
    summary: 'Get indicator date range',
    description: 'Fetches the minimum and maximum year and month for the specified indicator',
    tags: ['Business/Dashboard/Overview'],
    bearerAuth: true,
    query: [
      {
        name: 'indicator',
        type: String
      }
    ],
    responses: [
      {
        status: 200,
        description: 'KHIS indicators within global date range fetched successfully',
        dataType: KhisIndicatorDateResponseDto,
        isArray: true
      },
      {
        status: 403,
        description: 'Forbidden ',
      },
    ],
  },

  KAJIADO_WARDS: {
    summary: 'Fetch Kajiado wards list',
    description: 'Returns Kajiado ward geometries as a GeoJSON FeatureCollection with optional county, subcounty, and ward filters.',
    tags: ['Business/Dashboard/Overview'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Fetched list of Kajiado Wards successfully',
        dataType: KhisKajiadoWardsResponseDto
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },


  KHIS_KAJIADO_FACILITY: {
    summary: 'Fetch Kajiado facility list',
    description: 'Returns Kajiado facility geometries as a GeoJSON FeatureCollection with optional county, subcounty, and ward filters.',
    tags: ['Business/Dashboard/Overview'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Fetched list of Kajiado Facilities successfully',
        dataType: KhisKajiadoFacilityResponseDto
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
      {
        status: 400,
        description: 'Filters countyId, subCountyId and wardId are missing',
      },
      {
        status: 404,
        description: 'No facility data found for the given filters',
      },
    ],
  },

  KHIS_INDICATOR_COUNT_DATE_RANGE: {
    summary: 'Fetch KHIS indicator count by date range',
    description: 'Returns a geospatial time-series report that breaks down a specific data element by Ward and Month.',
    tags: ['Business/Dashboard/Overview'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'KHIS indicator count by date range fetched successfully',
        dataType: KhisIndicatorCountResponseDto,
        isArray: true
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },

  KHIS_EACH_INDICATOR_TREND: {
    summary: 'Fetch KHIS each indicator trend data',
    description: 'Fetches month-by-month trend data for KHIS indicators within a specified date range.',
    tags: ['Business/Dashboard/Overview'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'KHIS each indicator trend data fetched successfully',
        dataType: KhisIndicatorTrendResponseDto,
        isArray: true
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },
  EACH_INTENT_CSV: {
    summary: 'Fetch prompts each intent trend data',
    description: 'Retrieves monthly trend data for each prompt intent, aggregated over time and optionally filtered by ward, subcounty, category, and date range in csv format',
    tags: ['Business/Dashboard/Overview'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'CSV file generated successfully',
        rawSchema: {
          type: 'string',
          format: 'binary',
          example: `Intent,Category,Priority,24/11,24/12,25/01,25/02,InitialValue,FinalValue,OverallPercentChange,TotalCount`
        },
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],

  },
  EACH_INDICATOR_CSV: {
    summary: 'Fetch KHIS each indicator trend data',
    description: 'Fetches month-by-month trend data for KHIS indicators within a specified date range in csv format.',
    tags: ['Business/Dashboard/Overview'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'CSV file generated successfully',
        rawSchema: {
          type: 'string',
          format: 'binary',
          example:
            `IndicatorId,IndicatorName,Category,24/11,24/12,25/01,25/02,25/03,25/04`
        },
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  }
}