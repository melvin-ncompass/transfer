import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BizComputedCopernicusEra5 } from 'src/visualizationV1/entity/biz_computed_copernicus_era5.entity';
import { BizComputedKajiadoMasterHealthFacilities } from 'src/visualizationV1/entity/biz_computed_kajiado_master_health_facilities.entity';
import { BizComputedKhisWardMonth } from 'src/visualizationV1/entity/biz_computed_khis_ward_month.entity';
import { BizComputedPromptsWardMonth } from 'src/visualizationV1/entity/biz_computed_prompts_ward_month.entity';
import { BizAggregatedCopernicusEra5WardMonth } from 'src/visualizationV1/entity/biz_aggregated_copernicus_era5_ward_month.entity';
import { BizComputedKajiadoWards } from 'src/visualizationV1/entity/biz_computed_kajiado_wards.entity';
import { Repository } from 'typeorm';
import {
  CopernicusPredictionDto,
  COUNTY_MAP,
  EachIndicatorTrendFilterDto,
  EachIntentTrendFilterDto,
  getPopulationChloropethSubCountyGeoJSONDto,
  IndicatorCountByClimateFilterDto,
  IndicatorCountByDateRangeDto,
  IndicatorCountTrendDto,
  KhisPredictionDto,
  PopulationSubCountyChloropethDto,
  PopulationWardChloropethDto,
  PromptsFilterDto,
  PromptsIntentPriorityFrequencyDto,
  PromptsIntentRelativeIntensityDto,
  PromptsRiskDto,
  WARD_MAP,
} from './dto/visualization.dto';
import { BizRawKajiadoPopulation } from './entity/biz_raw_kajiado_population.entity';
import { BizComputedKhisWardMonthV2 } from './entity/biz_computed_khis_ward_month_v2.entity';
import { BizAggregatedCopernicusEra5WardMonthV2 } from './entity/biz_aggregated_copernicus_era5_ward_month_v2.entity';
import { BizComputedKajiadoClimateProjections } from './entity/biz_computed_kajiado_climate_projects.entity';
const defaultIndicators = {
  Mother: [
    // 'MOH 711 ANC Client given folic',
    // 'MOH 711 ANC Client given Iron',
    // 'MOH 711 APH (Ante partum Haemorrage)',
    // 'MOH 711 Birth with diformities',
    // 'MOH 711 Eclampsia',
    'MOH 711 PPH (Post Partum Haemorrage)',
    'MOH 717 Revised 2020 _Maternal deaths',
  ],
  Baby: [
    'MOH 711 Fresh Still Birth',
    'MOH 711 Live birth',
    'MOH 711 Low Birth Weight <2500gms',
    'MOH 711 MUAC 6 - 59 months Moderate (Yellow)',
    'MOH 711 MUAC 6 - 59 months Normal (Green)',
    'MOH 711 MUAC 6 - 59 months Severe (Red)',
    'MOH 711 Neonatal deaths 0-28 Days',
    'MOH 711 Macerated still Birth',
  ],
  Other: [
    'Confirmed Malaria Cases',
    // 'IDSR Malaria Cases',
    // 'Confirmed Malaria cases Per 1000 Population',
    // 'IDSR Malaria Deaths'
  ],
};

const SUBCOUNTY_MAP_PROMPTS: Record<string, string> = {
  'Kajiado East Sub County': 'Kajiado East',
  'Kajiado Central Sub County': 'Kajiado Central',
  'Loitokitok Sub County': 'Loitokitok',
  'Kajiado North Sub County': 'Kajiado North',
  'Kajiado West Sub County': 'Kajiado West',
};

const indicatorNameMap: Record<string, string> = {
  // 'MOH 711: ANC Clients Given Folic Acid': 'MOH 711 ANC Client given folic',
  // 'MOH 711: ANC Clients Given Iron': 'MOH 711 ANC Client given Iron',
  // 'MOH 711: APH – Antepartum Hemorrhage':
  //   'MOH 711 APH (Ante partum Haemorrage)',
  // 'MOH 711: Birth with Deformities': 'MOH 711 Birth with diformities',
  // 'MOH 711: Eclampsia': 'MOH 711 Eclampsia',
  'MOH 711: PPH – Postpartum Hemorrhage':
    'MOH 711 PPH (Post Partum Haemorrage)',
  'MOH 711: Fresh Stillbirths': 'MOH 711 Fresh Still Birth',
  'MOH 711: Live Births': 'MOH 711 Live birth',
  'MOH 711: Low Birth Weight (<2500g)': 'MOH 711 Low Birth Weight <2500gms',
  'MOH 711: MUAC (6–59 Months) Moderate – Yellow Zone':
    'MOH 711 MUAC 6 - 59 months Moderate (Yellow)',
  'MOH 711: MUAC (6–59 Months) Normal – Green Zone':
    'MOH 711 MUAC 6 - 59 months Normal (Green)',
  'MOH 711: MUAC (6–59 Months) Severe – Red Zone':
    'MOH 711 MUAC 6 - 59 months Severe (Red)',
  'MOH 711: Neonatal Deaths (0–28 Days)': 'MOH 711 Neonatal deaths 0-28 Days',
  // 'IDSR: Malaria Cases': 'IDSR Malaria Cases',
  // 'IDSR: Malaria Deaths': 'IDSR Malaria Deaths',

  'MOH 717 Revised 2020 Maternal Deaths':
    'MOH 717 Revised 2020 _Maternal deaths',

  'Confirmed Malaria Cases': 'Confirmed Malaria Cases',

  'MOH 711 Macerated Still Birth': 'MOH 711 Macerated still Birth',
};

@Injectable()
export class VisualizationV1Service {
  private readonly logger = new Logger(VisualizationV1Service.name);

  constructor(
    // @InjectRepository(BizComputedCopernicusEra5, 'visualizationConnection')
    // private readonly bizComputedCopernicusEra5: Repository<BizComputedCopernicusEra5>,
    // @InjectRepository(
    //   BizAggregatedCopernicusEra5WardMonth,
    //   'visualizationConnection',
    // )
    // private readonly bizAggregatedCopernicusEra5WardMonth: Repository<BizAggregatedCopernicusEra5WardMonth>,
    // @InjectRepository(BizComputedKhisWardMonth, 'visualizationConnection')
    // private readonly bizComputedKhisWardMonth: Repository<BizComputedKhisWardMonth>,
    // @InjectRepository(BizComputedPromptsWardMonth, 'visualizationConnection')
    // private readonly bizComputedPromptsWardMonth: Repository<BizComputedPromptsWardMonth>,
    // @InjectRepository(
    //   BizComputedKajiadoMasterHealthFacilities,
    //   'visualizationConnection',
    // )
    // private readonly bizComputedKajiadoMasterHealthFacilities: Repository<BizComputedKajiadoMasterHealthFacilities>,
    // @InjectRepository(BizComputedKajiadoWards, 'visualizationConnection')
    // private readonly bizComputedKajiadoWards: Repository<BizComputedKajiadoWards>,

    @InjectRepository(BizComputedCopernicusEra5)
    private readonly bizComputedCopernicusEra5: Repository<BizComputedCopernicusEra5>,
    @InjectRepository(BizAggregatedCopernicusEra5WardMonth)
    private readonly bizAggregatedCopernicusEra5WardMonth: Repository<BizAggregatedCopernicusEra5WardMonth>,
    @InjectRepository(BizAggregatedCopernicusEra5WardMonthV2)
    private readonly bizAggregatedCopernicusEra5WardMonthV2: Repository<BizAggregatedCopernicusEra5WardMonthV2>,
    @InjectRepository(BizComputedKhisWardMonth)
    private readonly bizComputedKhisWardMonth: Repository<BizComputedKhisWardMonth>,
    @InjectRepository(BizComputedKhisWardMonthV2)
    private readonly bizComputedKhisWardMonthV2: Repository<BizComputedKhisWardMonthV2>,
    @InjectRepository(BizComputedPromptsWardMonth)
    private readonly bizComputedPromptsWardMonth: Repository<BizComputedPromptsWardMonth>,
    @InjectRepository(BizComputedKajiadoMasterHealthFacilities)
    private readonly bizComputedKajiadoMasterHealthFacilities: Repository<BizComputedKajiadoMasterHealthFacilities>,
    @InjectRepository(BizComputedKajiadoWards)
    private readonly bizComputedKajiadoWards: Repository<BizComputedKajiadoWards>,
    @InjectRepository(BizRawKajiadoPopulation)
    private readonly bizRawKajiadoPopulation: Repository<BizRawKajiadoPopulation>,
    @InjectRepository(BizComputedKajiadoClimateProjections)
    private readonly bizComputedKajiadoClimateProjections: Repository<BizComputedKajiadoClimateProjections>,
  ) {}

  async getKajiadoSubcountyWardList(): Promise<Record<string, string[]>> {
    try {
      const rawData = await this.bizComputedKajiadoWards
        .createQueryBuilder('ward')
        .select([
          'ward.raw_subcounty AS rawsubcounty',
          'ward.raw_ward AS rawward',
        ])
        .orderBy('ward.raw_subcounty', 'ASC')
        .addOrderBy('ward.raw_ward', 'ASC')
        .getRawMany();

      const subcountyWardMap: Record<string, string[]> = {};

      for (const row of rawData) {
        const subcounty = row.rawsubcounty;
        const ward = row.rawward;

        if (!subcounty || !ward) continue;

        if (!subcountyWardMap[subcounty]) {
          subcountyWardMap[subcounty] = [];
        }

        subcountyWardMap[subcounty].push(ward);
      }

      return subcountyWardMap;
    } catch (error) {
      this.logger.error(`Error fetching subcounty-ward list: ${error.message}`);
      throw error;
    }
  }

  // async getIndicatorDateRange(indicatorName?: string) {
  //   try {
  //     const qb = this.bizComputedKhisWardMonth
  //       .createQueryBuilder('khis')
  //       .select('khis.raw_dataelement_name', 'indicator')
  //       .addSelect('MIN(khis.com_year)', 'minYear')
  //       .addSelect('MIN(khis.com_month)', 'minMonth')
  //       .addSelect('MAX(khis.com_year)', 'maxYear')
  //       .addSelect('MAX(khis.com_month)', 'maxMonth')
  //       .groupBy('khis.raw_dataelement_name')
  //       .orderBy('khis.raw_dataelement_name', 'ASC');

  //     if (indicatorName?.trim()) {
  //       qb.where('khis.raw_dataelement_name = :indicatorName', {
  //         indicatorName,
  //       });
  //     }

  //     const result = await qb.getRawMany();

  //     if (indicatorName?.trim() && result.length === 0) {
  //       throw new NotFoundException(`Indicator '${indicatorName}' not found`);
  //     }

  //     // Add section to each result based on defaultIndicators
  //     const resultWithSection = result.map((item) => {
  //       let section = 'Other'; // Default fallback

  //       for (const [sectionKey, indicators] of Object.entries(
  //         defaultIndicators,
  //       )) {
  //         if (indicators.includes(item.indicator)) {
  //           section = sectionKey;
  //           break;
  //         }
  //       }

  //       return {
  //         ...item,
  //         section,
  //       };
  //     });

  //     return resultWithSection;
  //   } catch (error) {
  //     this.logger.error(`Error fetching disease date range: ${error.message}`);
  //     throw error;
  //   }
  // }
  async getIndicatorDateRange(indicatorName?: string) {
    try {
      const qb = this.bizComputedKhisWardMonthV2
        .createQueryBuilder('khis')
        .select('khis.raw_dataelement_name', 'indicator')
        .addSelect('MIN(khis.com_year)', 'minYear')
        .addSelect('MIN(khis.com_month)', 'minMonth')
        .addSelect('MAX(khis.com_year)', 'maxYear')
        .addSelect('MAX(khis.com_month)', 'maxMonth')
        .groupBy('khis.raw_dataelement_name')
        .orderBy('khis.raw_dataelement_name', 'ASC');

      if (indicatorName?.trim()) {
        qb.where('khis.raw_dataelement_name = :indicatorName', {
          indicatorName,
        });
      }

      const result = await qb.getRawMany();

      if (indicatorName?.trim() && result.length === 0) {
        throw new NotFoundException(`Indicator '${indicatorName}' not found`);
      }

      // Filter and add section info only for default indicators
      const resultWithSection = result
        .map((item) => {
          let section = null;

          for (const [sectionKey, indicators] of Object.entries(
            defaultIndicators,
          )) {
            if (indicators.includes(item.indicator)) {
              section = sectionKey;
              break;
            }
          }

          // Skip if not in default indicators
          if (!section) {
            return null;
          }

          // Find the mapped indicator name (key) from the indicatorNameMap
          const mappedIndicatorKey = Object.keys(indicatorNameMap).find(
            (key) => indicatorNameMap[key] === item.indicator,
          );

          return {
            ...item,
            section,
            mappedIndicatorName: mappedIndicatorKey || null,
          };
        })
        .filter(Boolean); // Remove null values

      return resultWithSection;
    } catch (error) {
      this.logger.error(`Error fetching disease date range: ${error.message}`);
      throw error;
    }
  }

  // async getCopernicusClimateDataV1(filters?: {
  //   startYear?: number;
  //   startMonth?: number;
  //   endYear?: number;
  //   endMonth?: number;
  //   county?: string;
  //   subcounty?: string;
  //   ward?: string;
  // }) {
  //   try {
  //     const {
  //       startYear = 2024,
  //       startMonth = 10,
  //       endYear = 2025,
  //       endMonth = 3,
  //       county,
  //       subcounty,
  //       ward,
  //     } = filters || {};

  //     // Build the query
  //     const qb = this.bizAggregatedCopernicusEra5WardMonth
  //       .createQueryBuilder('b')
  //       .select([
  //         'b.com_ward',
  //         'b.com_subcounty',
  //         'b.com_county',
  //         'ST_AsGeoJSON(b.com_geom) as geom',
  //         'b.com_mean_median_max_t2m',
  //         'b.com_mean_median_max_d2m',
  //         'b.com_sum_tp',
  //         'b.com_year',
  //         'b.com_month',
  //       ])
  //       .where(
  //         '(b.com_year > :startYear OR (b.com_year = :startYear AND b.com_month >= :startMonth))',
  //         { startYear, startMonth },
  //       )
  //       .andWhere(
  //         '(b.com_year < :endYear OR (b.com_year = :endYear AND b.com_month <= :endMonth))',
  //         { endYear, endMonth },
  //       );

  //     if (county) {
  //       qb.andWhere('b.com_county = :county', { county });
  //     }
  //     if (subcounty) {
  //       qb.andWhere('b.com_subcounty = :subcounty', { subcounty });
  //     }
  //     if (ward) {
  //       console.log(ward);
  //       qb.andWhere('b.com_ward = :ward', { ward });
  //     }

  //     const rawData = await qb.getRawMany();

  //     if (rawData.length === 0) {
  //       return {
  //         type: 'FeatureCollection',
  //         start_year: startYear,
  //         start_month: startMonth,
  //         end_year: endYear,
  //         end_month: endMonth,
  //         features: [],
  //       };
  //     }

  //     // Check if single month mode
  //     const isSingleMonth = startYear === endYear && startMonth === endMonth;

  //     // Group data by ward for aggregation
  //     const groupedData = rawData.reduce((acc, row) => {
  //       const key = `${row.b_com_ward}-${row.b_com_subcounty}-${row.b_com_county}`;
  //       if (!acc[key]) {
  //         acc[key] = {
  //           ward: row.b_com_ward,
  //           subcounty: row.b_com_subcounty,
  //           county: row.b_com_county,
  //           geom: row.geom,
  //           t2m_values: [],
  //           d2m_values: [],
  //           tp_values: [],
  //         };
  //       }
  //       acc[key].t2m_values.push(row.b_com_mean_median_max_t2m);
  //       acc[key].d2m_values.push(row.b_com_mean_median_max_d2m);
  //       acc[key].tp_values.push(row.b_com_sum_tp);
  //       return acc;
  //     }, {});

  //     // Build features
  //     const features = [];

  //     for (const group of Object.values(groupedData) as any[]) {
  //       // Aggregate values based on mode
  //       const t2m = isSingleMonth
  //         ? Math.max(...group.t2m_values)
  //         : group.t2m_values.reduce((sum, val) => sum + val, 0) /
  //           group.t2m_values.length;

  //       const d2m = isSingleMonth
  //         ? Math.max(...group.d2m_values)
  //         : group.d2m_values.reduce((sum, val) => sum + val, 0) /
  //           group.d2m_values.length;

  //       const tp = isSingleMonth
  //         ? Math.max(...group.tp_values)
  //         : group.tp_values.reduce((sum, val) => sum + val, 0);

  //       // Parse GeoJSON geometry
  //       const geometry = JSON.parse(group.geom);

  //       features.push({
  //         type: 'Feature',
  //         geometry,
  //         properties: {
  //           com_ward: group.ward,
  //           com_subcounty: group.subcounty,
  //           com_county: group.county,
  //           com_mean_median_max_t2m: t2m,
  //           com_mean_median_max_d2m: d2m,
  //           com_sum_tp: tp,
  //         },
  //       });
  //     }

  //     return {
  //       type: 'FeatureCollection',
  //       start_year: startYear,
  //       start_month: startMonth,
  //       end_year: endYear,
  //       end_month: endMonth,
  //       features,
  //     };
  //   } catch (error) {
  //     this.logger.error(
  //       `Error fetching copernicus climate data: ${error.message}`,
  //     );
  //     throw error;
  //   }
  // }

  async getCopernicusClimateDataV2(filters?: {
    startYear?: number;
    startMonth?: number;
    endYear?: number;
    endMonth?: number;
    county?: string;
    subcounty?: string;
    ward?: string;
  }) {
    try {
      const {
        startYear = 2024,
        startMonth = 10,
        endYear = 2025,
        endMonth = 3,
        county,
        subcounty,
        ward,
      } = filters || {};

      const query = `
            WITH input AS (
              SELECT
                $1::integer AS startYear,
                $2::integer AS startMonth,
                $3::integer AS endYear,
                $4::integer AS endMonth,
                $5::text AS countyFilter,
                $6::text AS subcountyFilter,
                $7::text AS wardFilter
            ),
            filteredData AS (
              SELECT
                b.com_ward,
                b.com_subcounty,
                b.com_county,
                b.com_geom,
                b.com_mean_t2m,
                b.com_sum_tp,
                i.startYear,
                i.startMonth,
                i.endYear,
                i.endMonth
              FROM biz_aggregated_copernicus_era5_ward_month_v2 b
              CROSS JOIN input i
              WHERE
                (b.com_year > i.startYear OR (b.com_year = i.startYear AND b.com_month >= i.startMonth)) AND
                (b.com_year < i.endYear OR (b.com_year = i.endYear AND b.com_month <= i.endMonth))
                AND (i.countyFilter IS NULL OR b.com_county = i.countyFilter)
                AND (i.subcountyFilter IS NULL OR b.com_subcounty = i.subcountyFilter)
                AND (i.wardFilter IS NULL OR b.com_ward = i.wardFilter)
            ),
            modeCheck AS (
              SELECT DISTINCT
                startYear, startMonth, endYear, endMonth,
                (startYear = endYear AND startMonth = endMonth) AS isSingleMonth
              FROM filteredData
            ),
            aggregatedData AS (
              SELECT
                com_ward,
                com_subcounty,
                com_county,
                com_geom,
                CASE WHEN m.isSingleMonth THEN MAX(com_mean_t2m)
                     ELSE AVG(com_mean_t2m) END AS t2m,
                CASE WHEN m.isSingleMonth THEN MAX(com_sum_tp)
                     ELSE SUM(com_sum_tp) END AS tp,
                ST_XMin(ST_Envelope(com_geom)) AS featureXmin,
                ST_YMin(ST_Envelope(com_geom)) AS featureYmin,
                ST_XMax(ST_Envelope(com_geom)) AS featureXmax,
                ST_YMax(ST_Envelope(com_geom)) AS featureYmax,
                ST_AsGeoJSON(com_geom)::jsonb AS geometryJson,
                m.startYear, m.startMonth, m.endYear, m.endMonth
              FROM filteredData f
              JOIN modeCheck m ON TRUE
              GROUP BY com_ward, com_subcounty, com_county, com_geom,
                       m.startYear, m.startMonth, m.endYear, m.endMonth, m.isSingleMonth
            ),
            collectionBbox AS (
              SELECT
                ST_XMin(extent) AS collectionXmin,
                ST_YMin(extent) AS collectionYmin,
                ST_XMax(extent) AS collectionXmax,
                ST_YMax(extent) AS collectionYmax
              FROM (
                SELECT ST_Extent(com_geom) AS extent
                FROM aggregatedData
              ) AS sub
            )
            SELECT jsonb_build_object(
              'type', 'FeatureCollection',
              'startYear', startYear,
              'startMonth', startMonth,
              'endYear', endYear,
              'endMonth', endMonth,
              'bbox', (
                SELECT jsonb_build_array(
                  collectionXmin,
                  collectionYmin,
                  collectionXmax,
                  collectionYmax
                )
                FROM collectionBbox
              ),
              'features', jsonb_agg(
                jsonb_build_object(
                  'type', 'Feature',
                  'geometry', geometryJson,
                  'bbox', jsonb_build_array(featureXmin, featureYmin, featureXmax, featureYmax),
                  'properties', jsonb_build_object(
                    'ward', com_ward,
                    'subCounty', com_subcounty,
                    'county', com_county,
                    'meanMedianMaxT2m', t2m,
                    'meanMedianMaxD2m', d2m,
                    'sumTp', tp
                  )
                )
              )
            ) AS result
            FROM aggregatedData
            GROUP BY startYear, startMonth, endYear, endMonth;
          `;

      const result = await this.bizAggregatedCopernicusEra5WardMonth.query(
        query,
        [startYear, startMonth, endYear, endMonth, county, subcounty, ward],
      );

      return (
        result[0]?.result || {
          type: 'FeatureCollection',
          startYear: startYear,
          startMonth: startMonth,
          endYear: endYear,
          endMonth: endMonth,
          features: [],
        }
      );
    } catch (error) {
      this.logger.error(
        `Error fetching copernicus climate data: ${error.message}`,
      );
      throw error;
    }
  }

  async getKajiadoWardList(filters?: {
    county?: string;
    subcounty?: string;
    ward?: string;
  }) {
    try {
      const { county, subcounty, ward } = filters || {};

      const result = await this.bizComputedKajiadoWards.query(
        `
      WITH input AS (
        SELECT
          $1::text AS countyFilter,
          $2::text AS subcountyFilter,
          $3::text AS wardFilter
      ),
      filtered AS (
        SELECT *
        FROM biz_computed_kajiado_wards w
        CROSS JOIN input i
        WHERE 
          (i.countyFilter IS NULL OR w.raw_county = i.countyFilter)
          AND (i.subcountyFilter IS NULL OR w.raw_subcounty = i.subcountyFilter)
          AND (i.wardFilter IS NULL OR w.raw_ward = i.wardFilter)
      ),
      globalBbox AS (
        SELECT
          ST_XMin(env) AS minX,
          ST_YMin(env) AS minY,
          ST_XMax(env) AS maxX,
          ST_YMax(env) AS maxY
        FROM (
          SELECT ST_Extent(raw_geom) AS env FROM filtered
        ) AS e
      ),
      features AS (
        SELECT jsonb_agg(
          jsonb_build_object(
            'type', 'Feature',
            'bbox', jsonb_build_array(
              ST_XMin(env),
              ST_YMin(env),
              ST_XMax(env),
              ST_YMax(env)
            ),
            'geometry', ST_AsGeoJSON(f.raw_geom)::jsonb,
            'properties', jsonb_build_object(
              'id', f.raw_id,
              'county', f.raw_county,
              'subCounty', f.raw_subcounty,
              'ward', f.raw_ward,
              'population2009', f.raw_pop_2009
            )
          )
        ) AS featureList
        FROM (
          SELECT f.*, ST_Envelope(f.raw_geom) AS env
          FROM filtered f
        ) f
      )
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'bbox', jsonb_build_array(g.minX, g.minY, g.maxX, g.maxY),
        'features', fea.featureList
      ) AS geojson
      FROM globalBbox g, features fea;
    `,
        [county, subcounty, ward],
      );

      const geojson = result?.[0]?.geojson;

      if (!geojson || !geojson.features || geojson.features.length === 0) {
        throw new NotFoundException(
          'No spatial data found for the given filters',
        );
      }

      return geojson;
    } catch (error) {
      this.logger.error(`GeoJSON generation failed: ${error.message}`);
      throw error;
    }
  }

  async getCopernicusTemperatureData(filters?: {
    startYear?: number;
    startMonth?: number;
    endYear?: number;
    endMonth?: number;
    county?: string;
    subcounty?: string;
    ward?: string;
  }) {
    try {
      const {
        startYear = 2025,
        startMonth = 10,
        endYear = 2025,
        endMonth = 10,
        county,
        subcounty,
        ward,
      } = filters || {};

      const result = await this.bizAggregatedCopernicusEra5WardMonth.query(
        `
      WITH filteredData AS (
        SELECT
          id,
          com_geom,
          com_ward,
          com_subcounty,
          com_county,
          com_mean_t2m,
          com_sum_tp,
          ST_XMin(ST_Envelope(com_geom)) AS featureXmin,
          ST_YMin(ST_Envelope(com_geom)) AS featureYmin,
          ST_XMax(ST_Envelope(com_geom)) AS featureXmax,
          ST_YMax(ST_Envelope(com_geom)) AS featureYmax,
          ST_AsGeoJSON(com_geom)::jsonb AS geometryJson
        FROM biz_aggregated_copernicus_era5_ward_month_v2
        WHERE 
          (com_year > $1 OR (com_year = $1 AND com_month >= $2))
          AND (com_year < $3 OR (com_year = $3 AND com_month <= $4))
          AND ($5::text IS NULL OR com_county = $5)
          AND ($6::text IS NULL OR com_subcounty = $6)
          AND ($7::text IS NULL OR com_ward = $7)
      )
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'startYear', $1,
        'startMonth', $2,
        'endYear', $3,
        'endMonth', $4,
        'bbox', (
          SELECT jsonb_build_array(
            ST_XMin(extent),
            ST_YMin(extent),
            ST_XMax(extent),
            ST_YMax(extent)
          )
          FROM (
            SELECT ST_Extent(com_geom) AS extent
            FROM filteredData
          ) AS bbox
        ),
        'features', jsonb_agg(
          jsonb_build_object(
            'type', 'Feature',
            'geometry', geometryJson,
            'bbox', jsonb_build_array(
              featureXmin, featureYmin, featureXmax, featureYmax
            ),
            'properties', jsonb_build_object(
              'id', id,
              'ward', com_ward,
              'subCounty', com_subcounty,
              'county', com_county,
              'meanMedianMaxT2m', com_mean_t2m,
              'sumTp', com_sum_tp
            )
          )
        )
      ) AS geojson
      FROM filteredData;
    `,
        [startYear, startMonth, endYear, endMonth, county, subcounty, ward],
      );

      return (
        result?.[0]?.geojson || {
          type: 'FeatureCollection',
          startYear: startYear,
          startMonth: startMonth,
          endYear: endYear,
          endMonth: endMonth,
          features: [],
        }
      );
    } catch (error) {
      this.logger.error(
        `Error running Copernicus temperature query: ${error.message}`,
      );
      throw error;
    }
  }

  async getCopernicusPrecipitationData(filters?: {
    startYear?: number;
    startMonth?: number;
    endYear?: number;
    endMonth?: number;
    county?: string;
    subcounty?: string;
    ward?: string;
  }) {
    try {
      const {
        startYear = 2024,
        startMonth = 10,
        endYear = 2025,
        endMonth = 3,
        county,
        subcounty,
        ward,
      } = filters || {};

      const result = await this.bizAggregatedCopernicusEra5WardMonth.query(
        `
      WITH filteredData AS (
        SELECT
          id,
          com_geom,
          com_ward,
          com_subcounty,
          com_county,
          com_mean_t2m,
          com_sum_tp
        FROM biz_aggregated_copernicus_era5_ward_month_v2
        WHERE (com_year > $1 OR (com_year = $1 AND com_month >= $2))
          AND (com_year < $3 OR (com_year = $3 AND com_month <= $4))
          AND ($5::text IS NULL OR com_county = $5)
          AND ($6::text IS NULL OR com_subcounty = $6)
          AND ($7::text IS NULL OR com_ward = $7)
      ),
      aggregatedData AS (
        SELECT
          id,
          com_geom,
          com_ward,
          com_subcounty,
          com_county,
          AVG(com_mean_t2m) AS avgT2m,
          SUM(com_sum_tp) AS sumTp,
          ST_XMin(ST_Envelope(com_geom)) AS featureXmin,
          ST_YMin(ST_Envelope(com_geom)) AS featureYmin,
          ST_XMax(ST_Envelope(com_geom)) AS featureXmax,
          ST_YMax(ST_Envelope(com_geom)) AS featureYmax,
          ST_AsGeoJSON(com_geom)::jsonb AS geometryJson
        FROM filteredData
        GROUP BY id, com_geom, com_ward, com_subcounty, com_county
      ),
      collectionBbox AS (
        SELECT
          ST_XMin(extent) AS collectionXmin,
          ST_YMin(extent) AS collectionYmin,
          ST_XMax(extent) AS collectionXmax,
          ST_YMax(extent) AS collectionYmax
        FROM (
          SELECT ST_Extent(com_geom) AS extent
          FROM aggregatedData
        ) AS sub
      )
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'startYear', $1,
        'startMonth', $2,
        'endYear', $3,
        'endMonth', $4,
        'bbox', (
          SELECT jsonb_build_array(
            collectionBbox.collectionXmin,
            collectionBbox.collectionYmin,
            collectionBbox.collectionXmax,
            collectionBbox.collectionYmax
          )
          FROM collectionBbox
        ),
        'features', jsonb_agg(
          jsonb_build_object(
            'type', 'Feature',
            'geometry', geometryJson,
            'bbox', jsonb_build_array(
              featureXmin, featureYmin, featureXmax, featureYmax
            ),
            'properties', jsonb_build_object(
              'id', id,
              'ward', com_ward,
              'subCounty', com_subcounty,
              'county', com_county,
              'avgMeanMedianMaxT2m', avgT2m,
              'avgMeanMedianMaxD2m', avgD2m,
              'sumTp', sumTp
            )
          )
        )
      ) AS geojson
      FROM aggregatedData;
    `,
        [startYear, startMonth, endYear, endMonth, county, subcounty, ward],
      );

      const geojson = result?.[0]?.geojson;
      if (!geojson || !geojson.features || geojson.features.length === 0) {
        throw new NotFoundException(
          'No aggregated data found for the specified range',
        );
      }

      return geojson;
    } catch (error) {
      this.logger.error(
        `Error fetching aggregated Copernicus precipitation data: ${error.message}`,
      );
      throw error;
    }
  }

  async getKhisIndicatorCount(filters?: {
    startYear?: number;
    startMonth?: number;
    endYear?: number;
    endMonth?: number;
    indicators?: string;
    county?: string;
    subcounty?: string;
    ward?: string;
  }) {
    try {
      const {
        startYear = 2022,
        startMonth = 1,
        endYear = 2025,
        endMonth = 10,
        indicators,
        county,
        subcounty,
        ward,
      } = filters || {};

      const rawDataelementName = indicators;

      // Map filters to correct names
      const mappedCounty = county ? COUNTY_MAP[county] || county : county;
      const mappedWard = ward ? WARD_MAP[ward] || ward : ward;

      const result = await this.bizComputedKhisWardMonthV2.query(
        `
      WITH params AS (
        SELECT
            $1::integer AS startYear,
            $2::integer AS startMonth,
            $3::integer AS endYear,
            $4::integer AS endMonth,
            $5::text AS rawDataelementName,
            $6::text AS countyFilter,
            $7::text AS subcountyFilter,
            $8::text AS wardFilter
        ),
        filtered AS (
        SELECT
            b.raw_ward,
            b.raw_subcounty,
            b.raw_county,
            b.com_geom,
            b.com_total_value,
            p.startYear,
            p.startMonth,
            p.endYear,
            p.endMonth,
            p.rawDataelementName
        FROM biz_computed_khis_ward_month_v2 b
        JOIN params p ON b.raw_dataelement_name = p.rawDataelementName
        WHERE (b.com_year > p.startYear OR (b.com_year = p.startYear AND b.com_month >= p.startMonth))
            AND (b.com_year < p.endYear OR (b.com_year = p.endYear AND b.com_month <= p.endMonth))
            AND (p.countyFilter IS NULL OR b.raw_county = p.countyFilter)
            AND (p.subcountyFilter IS NULL OR b.raw_subcounty = p.subcountyFilter)
            AND (p.wardFilter IS NULL OR b.raw_ward = p.wardFilter)
        ),
        wardAggregates AS (
        SELECT
            raw_ward,
            raw_subcounty,
            raw_county,
            SUM(com_total_value) AS totalValue,
            MAX(com_geom) AS geom,
            startYear,
            startMonth,
            endYear,
            endMonth,
            rawDataelementName
        FROM filtered
        GROUP BY raw_ward, raw_subcounty, raw_county, startYear, startMonth, endYear, endMonth, rawDataelementName
        )
        SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'startYear', MIN(startYear),
        'startMonth', MIN(startMonth),
        'endYear', MIN(endYear),
        'endMonth', MIN(endMonth),
        'features', jsonb_agg(
            jsonb_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(geom)::jsonb,
            'properties', jsonb_build_object(
                'ward', raw_ward,
                'subCounty', raw_subcounty,
                'county', raw_county,
                'indicatorName', rawDataelementName,
                'totalValue', totalValue
            )
            )
        )
        ) AS geojson
        FROM wardAggregates;
    `,
        [
          startYear,
          startMonth,
          endYear,
          endMonth,
          rawDataelementName,
          mappedCounty,
          subcounty,
          mappedWard,
        ],
      );

      console.log(result);

      const geojson = result?.[0]?.geojson;
      if (!geojson || !geojson.features || geojson.features.length === 0) {
        throw new NotFoundException(
          'No aggregated data found for the specified range',
        );
      }

      return geojson;
    } catch (error) {
      this.logger.error(
        `Error fetching khis indicator count: ${error.message}`,
      );
      throw error;
    }
  }

  async getKajiadoFacilities() {
    try {
      const result = await this.bizComputedKajiadoMasterHealthFacilities.query(`
        SELECT jsonb_build_object(
          'type', 'FeatureCollection',
          'features', jsonb_agg(
            jsonb_build_object(
              'type', 'Feature',
              'geometry', ST_AsGeoJSON(
                ST_SetSRID(ST_MakePoint(raw_longitude, raw_latitude), 4326)
              )::jsonb,
              'properties', jsonb_build_object(
                'raw_facility_name', raw_facility_name,
                'com_ward', com_ward,
                'raw_subcounty', raw_subcounty,
                'raw_county', raw_county
              )
            )
          )
        ) AS geojson
        FROM biz_computed_kajiado_master_health_facilities
        WHERE
          raw_latitude IS NOT NULL
          AND raw_longitude IS NOT NULL;
      `);

      return (
        result?.[0]?.geojson || {
          type: 'FeatureCollection',
          features: [],
        }
      );
    } catch (error) {
      this.logger.error(`Error fetching Kajiado facilities: ${error.message}`);
      throw error;
    }
  }

  async getPromptsIntents(filters?: { broaderCategory?: string }) {
    try {
      const { broaderCategory } = filters || {};

      const qb = this.bizComputedPromptsWardMonth
        .createQueryBuilder('prompts')
        .select('DISTINCT prompts.com_intent', 'intent')
        .addSelect('prompts.raw_broader_category', 'category')
        .addSelect('MIN(prompts.com_year)', 'minYear')
        .addSelect('MIN(prompts.com_month)', 'minMonth')
        .addSelect('MAX(prompts.com_year)', 'maxYear')
        .addSelect('MAX(prompts.com_month)', 'maxMonth')
        .addSelect('SUM(prompts.com_intent_count)', 'totalCount')
        .groupBy('prompts.com_intent, prompts.raw_broader_category')
        .orderBy('prompts.com_intent', 'ASC');

      if (broaderCategory?.trim()) {
        qb.where('prompts.raw_broader_category = :broaderCategory', {
          broaderCategory,
        });
      }

      const result = await qb.getRawMany();

      return result;
    } catch (error) {
      this.logger.error(`Error fetching prompts intents: ${error.message}`);
      throw error;
    }
  }

  // async getMonthlyTemperature() {
  //   try {
  //     const query = `
  //       SELECT DATE_TRUNC('month', monthDate) AS monthDate, avg(temperature) AS "temperature"
  //       FROM (
  //         SELECT
  //           com_county,
  //           com_subcounty,
  //           com_ward,
  //           make_date(com_year::int,com_month::int,1) AS monthDate,
  //           com_mean_median_max_t2m - 273.15 AS temperature,
  //           com_sum_tp * 1000 AS precipitation,
  //           com_year,
  //           com_month,
  //           com_geom
  //         FROM biz_aggregated_copernicus_era5_ward_month
  //       ) AS virtual_table
  //       GROUP BY DATE_TRUNC('month', monthDate)
  //       ORDER BY "temperature" DESC
  //     `;

  //     const result =
  //       await this.bizAggregatedCopernicusEra5WardMonth.query(query);

  //     return result;
  //   } catch (error) {
  //     this.logger.error(`Error fetching monthly temperature: ${error.message}`);
  //     throw error;
  //   }
  // }

  async getMonthlyTemperature(filters?: PromptsFilterDto) {
    try {
      const { startYear, startMonth, endYear, endMonth, subcounty, ward } =
        filters || {};

      // const mappedWard = ward ? WARD_MAP[ward] || ward : ward;

      const query = `
          WITH user_input AS (
            SELECT
              $1::int AS start_year,
              $2::int AS start_month,
              $3::int AS end_year,
              $4::int AS end_month,
              $5::text AS filter_subcounty,
              $6::text AS filter_ward
          ),
          filtered AS (
            SELECT
              make_date(com_year::int, com_month::int, 1) AS monthDate,
              com_mean_t2m - 273.15 AS temperature,
              com_sum_tp * 1000 AS precipitation,
              com_subcounty,
              com_ward
            FROM public.biz_aggregated_copernicus_era5_ward_month_v2 era5
            LEFT JOIN user_input ui ON TRUE
            WHERE 
              ($1::int IS NULL OR $2::int IS NULL OR era5.com_year > $1 OR (era5.com_year = $1 AND era5.com_month >= $2))
              AND ($3::int IS NULL OR $4::int IS NULL OR era5.com_year < $3 OR (era5.com_year = $3 AND era5.com_month <= $4))
              AND (
                ($6::text IS NOT NULL AND era5.com_ward = $6)
                OR ($6::text IS NULL AND $5::text IS NOT NULL AND era5.com_subcounty = $5)
                OR ($6::text IS NULL AND $5::text IS NULL)
              )
          )
          SELECT
            DATE_TRUNC('month', monthDate) AS monthDate,
            AVG(temperature) AS temperature
          FROM filtered
          GROUP BY DATE_TRUNC('month', monthDate)
          ORDER BY DATE_TRUNC('month', monthDate) ASC;
        `;

      const result = await this.bizAggregatedCopernicusEra5WardMonth.query(
        query,
        [startYear, startMonth, endYear, endMonth, subcounty, ward],
      );

      return result;
    } catch (error) {
      this.logger.error(`Error fetching monthly temperature: ${error.message}`);
      throw error;
    }
  }

  // async getMonthlyRainfall() {
  //   try {
  //     const query = `
  //       SELECT DATE_TRUNC('month', monthDate) AS monthDate, avg(precipitation) AS "precipitation"
  //       FROM (SELECT
  //         com_county,
  //         com_subcounty,
  //         com_ward,
  //         make_date(com_year::int,com_month::int,1) AS monthDate,
  //         com_mean_median_max_t2m - 273.15 AS temperature,
  //         com_sum_tp * 1000 AS precipitation,
  //         com_year,
  //         com_month,
  //         com_geom
  //       FROM biz_aggregated_copernicus_era5_ward_month
  //       ) AS virtual_table
  //       GROUP BY DATE_TRUNC('month', monthDate)
  //       ORDER BY "precipitation" DESC
  //     `;

  //     const result =
  //       await this.bizAggregatedCopernicusEra5WardMonth.query(query);

  //     return result;
  //   } catch (error) {
  //     this.logger.error(`Error fetching monthly rainfall: ${error.message}`);
  //     throw error;
  //   }
  // }

  async getMonthlyRainfall(filters?: PromptsFilterDto) {
    try {
      const { startYear, startMonth, endYear, endMonth, subcounty, ward } =
        filters || {};

      // const mappedWard = ward ? WARD_MAP[ward] || ward : ward;

      const query = `
          WITH user_input AS (
            SELECT
              $1::int AS start_year,
              $2::int AS start_month,
              $3::int AS end_year,
              $4::int AS end_month,
              $5::text AS filter_subcounty,
              $6::text AS filter_ward
          ),
          filtered AS (
            SELECT
              make_date(com_year::int, com_month::int, 1) AS monthDate,
              com_mean_t2m - 273.15 AS temperature,
              com_sum_tp * 1000 AS precipitation,
              com_subcounty,
              com_ward
            FROM public.biz_aggregated_copernicus_era5_ward_month_v2 era5
            LEFT JOIN user_input ui ON TRUE
            WHERE 
              ($1::int IS NULL OR $2::int IS NULL OR era5.com_year > $1 OR (era5.com_year = $1 AND era5.com_month >= $2))
              AND ($3::int IS NULL OR $4::int IS NULL OR era5.com_year < $3 OR (era5.com_year = $3 AND era5.com_month <= $4))
              AND (
                ($6::text IS NOT NULL AND era5.com_ward = $6)
                OR ($6::text IS NULL AND $5::text IS NOT NULL AND era5.com_subcounty = $5)
                OR ($6::text IS NULL AND $5::text IS NULL)
              )
          )
          SELECT
            DATE_TRUNC('month', monthDate) AS monthDate,
            AVG(precipitation) AS precipitation
          FROM filtered
          GROUP BY DATE_TRUNC('month', monthDate)
          ORDER BY DATE_TRUNC('month', monthDate) ASC;
        `;

      const result = await this.bizAggregatedCopernicusEra5WardMonth.query(
        query,
        [startYear, startMonth, endYear, endMonth, subcounty, ward],
      );

      return result;
    } catch (error) {
      this.logger.error(`Error fetching monthly rainfall: ${error.message}`);
      throw error;
    }
  }

  async getMonthlyTemperaturePrecipitation() {
    try {
      // todo: standardize the naming conventions
      const query = `
        SELECT
          DATE_TRUNC('month', month_date) AS monthDate,
          AVG(precipitation) AS sumPrecipitation,  
          AVG(temperature) AS sumTemperature
        FROM (
          SELECT
            com_county,
            com_subcounty,
            com_ward,
            make_date(com_year::int, com_month::int, 1) AS month_date,
            ((com_sum_tp * 1000) - AVG(com_sum_tp * 1000) OVER()) / STDDEV(com_sum_tp * 1000) OVER() AS precipitation,
            ((com_mean_t2m - 273.15) - AVG(com_mean_t2m - 273.15) OVER()) / STDDEV(com_mean_t2m - 273.15) OVER() AS temperature,
            com_year,
            com_month
          FROM biz_aggregated_copernicus_era5_ward_month_v2
        ) AS virtual_table
        GROUP BY 1
        ORDER BY 1 ASC;
      `;

      const result =
        await this.bizAggregatedCopernicusEra5WardMonth.query(query);

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching monthly temperature and precipitation: ${error.message}`,
      );
      throw error;
    }
  }

  async getRiskTreeMap(option?: PromptsRiskDto) {
    try {
      const query = `
          SELECT 
            category AS category, 
            priority_level AS "priorityLevel", 
            intent AS intent, 
            sum(intent_count)::integer AS "intentCount" 
          FROM (SELECT
            com_county,
            com_subcounty,
            com_ward,
            make_date(com_year::int,com_month::int,1) AS month_date,
            com_intent AS intent,
            com_intent_count AS intent_count,
            raw_broader_category AS category,
            raw_priority_level AS priority_level,
            com_year,
            com_month,
            com_geom
          FROM biz_computed_prompts_ward_month
          WHERE raw_broader_category != 'other'
            AND ($1::text IS NULL OR raw_broader_category = $1)
          ) AS virtual_table 
          GROUP BY category, priority_level, intent ;
        `;

      const result = await this.bizComputedPromptsWardMonth.query(query, [
        option?.category,
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching risk tree map: ${error.message}`);
      throw error;
    }
  }

  async getCategoryByPriorityLevel(filters?: { priorityLevel?: string }) {
    try {
      const { priorityLevel } = filters;

      const query = `
        SELECT 
          category,
          priority_level AS "priorityLevel",
          SUM(intent_count)::integer AS "totalIntentCount"
        FROM (
          SELECT  
            com_county,
            com_subcounty,
            com_ward,
            make_date(com_year::int, com_month::int, 1) AS month_date,
            com_intent AS intent,
            com_intent_count AS intent_count,
            raw_broader_category AS category,
            raw_priority_level AS priority_level,
            com_year,
            com_month,
            com_geom
          FROM biz_computed_prompts_ward_month  
          WHERE raw_broader_category != 'other'
        ) AS virtual_table
        WHERE 
          (
            $1::text IS NULL 
            OR priority_level = $1::text
          )
        GROUP BY category, priority_level
        ORDER BY SUM(intent_count) DESC;
      `;

      const result = await this.bizComputedPromptsWardMonth.query(query, [
        priorityLevel,
      ]);

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching category by priority level: ${error.message}`,
      );
      throw error;
    }
  }

  async getCategoryByPriorityLevelBar() {
    try {
      const query = `
        SELECT 
          category AS category, 
          priority_level AS "priorityLevel", 
          sum(intent_count)::integer AS "intentCount" 
        FROM (
          SELECT
            com_county,
            com_subcounty,
            com_ward,
            make_date(com_year::int,com_month::int,1) AS month_date,
            com_intent AS intent,
            com_intent_count AS intent_count,
            raw_broader_category AS category,
            raw_priority_level AS priority_level,
            com_year,
            com_month,
            com_geom
          FROM biz_computed_prompts_ward_month
          WHERE raw_broader_category != 'other'
        ) AS virtual_table 
        GROUP BY category, priority_level 
        ORDER BY "intentCount" DESC ;
      `;

      const result = await this.bizComputedPromptsWardMonth.query(query);
      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching category by priority level bar: ${error.message}`,
      );
      throw error;
    }
  }

  async getCategoryByPriorityLevelHeatmap() {
    try {
      const query = `
        SELECT 
          category AS category, 
          priority_level AS "priorityLevel", 
          sum(intent_count)::integer AS "intentCount" 
        FROM (
          SELECT
            com_county,
            com_subcounty,
            com_ward,
            make_date(com_year::int,com_month::int,1) AS month_date,
            com_intent AS intent,
            com_intent_count AS intent_count,
            raw_broader_category AS category,
            raw_priority_level AS priority_level,
            com_year,
            com_month,
            com_geom
          FROM biz_computed_prompts_ward_month
          WHERE raw_broader_category != 'other'
        ) AS virtual_table 
        GROUP BY category, priority_level 
        ORDER BY priority_level DESC ;
      `;

      const result = await this.bizComputedPromptsWardMonth.query(query);
      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching category by priority level heatmap: ${error.message}`,
      );
      throw error;
    }
  }

  // async getMonthlyPriorityTrend() {
  //   try {
  //     const query = `
  //       SELECT
  //         DATE_TRUNC('month', month_date) AS monthDate,
  //         priority_level AS priorityLevel,
  //         sum(intent_count)::integer AS "intentCount"
  //       FROM (
  //         SELECT
  //           com_county,
  //           com_subcounty,
  //           com_ward,
  //           make_date(com_year::int,com_month::int,1) AS month_date,
  //           raw_intent AS intent,
  //           com_intent_count AS intent_count,
  //           raw_broader_category AS category,
  //           raw_priority_level AS priority_level,
  //           com_year,
  //           com_month,
  //           com_geom
  //         FROM biz_computed_prompts_ward_month
  //         WHERE raw_broader_category != 'other'
  //       ) AS virtual_table
  //       GROUP BY DATE_TRUNC('month', month_date), priority_level
  //       ORDER BY "intentCount" DESC
  //     `;

  //     const result = await this.bizComputedPromptsWardMonth.query(query);
  //     return result;
  //   } catch (error) {
  //     this.logger.error(
  //       `Error fetching monthly priority trend: ${error.message}`,
  //     );
  //     throw error;
  //   }
  // }

  async getMonthlyPriorityTrend(filters: {
    category?: string;
    priorityLevel?: string;
  }) {
    try {
      const conditions: string[] = [`raw_broader_category != 'other'`];
      const values: any[] = [];

      if (filters.category) {
        values.push(filters.category);
        conditions.push(`raw_broader_category = $${values.length}`);
      }

      if (filters.priorityLevel) {
        values.push(filters.priorityLevel);
        conditions.push(`raw_priority_level = $${values.length}`);
      }

      const whereClause = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

      const query = `
      SELECT 
        DATE_TRUNC('month', month_date) AS monthDate, 
        priority_level AS priorityLevel, 
        sum(intent_count)::integer AS "intentCount" 
      FROM (
        SELECT
          com_county,
          com_subcounty,
          com_ward,
          make_date(com_year::int,com_month::int,1) AS month_date,
          com_intent AS intent,
          com_intent_count AS intent_count,
          raw_broader_category AS category,
          raw_priority_level AS priority_level,
          com_year,
          com_month,
          com_geom
        FROM biz_computed_prompts_ward_month
        ${whereClause}
      ) AS virtual_table 
      GROUP BY DATE_TRUNC('month', month_date), priority_level 
      ORDER BY "intentCount" DESC ;
    `;

      const result = await this.bizComputedPromptsWardMonth.query(
        query,
        values,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching monthly priority trend: ${error.message}`,
      );
      throw error;
    }
  }

  async getMonthlyRisks(options?: PromptsRiskDto) {
    try {
      const { category } = options || {};

      const query = `
        SELECT 
          DATE_TRUNC('month', month_date) AS monthDate, 
          intent AS intent, 
          sum(intent_count)::integer AS "intentCount" 
        FROM (
          SELECT
            com_county,
            com_subcounty,
            com_ward,
            make_date(com_year::int,com_month::int,1) AS month_date,
            com_intent AS intent,
            com_intent_count AS intent_count,
            raw_broader_category AS category,
            raw_priority_level AS priority_level,
            com_year,
            com_month,
            com_geom
          FROM biz_computed_prompts_ward_month
          WHERE raw_broader_category != 'other'
        ) AS virtual_table 
        WHERE ($1::text IS NULL OR category = $1)
        GROUP BY DATE_TRUNC('month', month_date), intent 
        ORDER BY monthDate DESC, "intentCount" DESC;
      `;

      const result = await this.bizComputedPromptsWardMonth.query(query, [
        category,
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching monthly risks: ${error.message}`);
      throw error;
    }
  }

  //   async getIndicatorCountByClimate(
  //   filters: IndicatorCountByClimateFilterDto,
  //   climateType: 'precipitation' | 'temperature',
  // ) {
  //   try {
  //     const { startYear, startMonth, endYear, endMonth, indicator } = filters;

  //     this.logger.log(
  //       `getIndicatorCountByClimate called with filters: ${JSON.stringify(filters)} and climateType: ${climateType}`,
  //     );

  //     const query = `
  //       WITH user_input AS (
  //         SELECT
  //           $1::int AS start_year,
  //           $2::int AS start_month,
  //           $3::int AS end_year,
  //           $4::int AS end_month,
  //           $5::text AS raw_dataelement_name,
  //           $6::text AS climate_type  -- 'precipitation' or 'temperature'
  //       ),
  //       filtered AS (
  //         SELECT
  //           khis.com_total_value,
  //           era5.com_mean_median_max_t2m AS temp,
  //           era5.com_sum_tp AS prep,
  //           ui.climate_type
  //         FROM user_input ui
  //         JOIN public.biz_computed_khis_ward_month khis
  //           ON khis.raw_dataelement_name = ui.raw_dataelement_name
  //          AND (khis.com_year > ui.start_year OR (khis.com_year = ui.start_year AND khis.com_month >= ui.start_month))
  //          AND (khis.com_year < ui.end_year OR (khis.com_year = ui.end_year AND khis.com_month <= ui.end_month))
  //         JOIN public.biz_aggregated_copernicus_era5_ward_month era5
  //           ON khis.com_year = era5.com_year AND khis.com_month = era5.com_month
  //       )
  //       SELECT
  //         com_total_value AS totalCount,
  //         CASE
  //           WHEN climate_type = 'precipitation' THEN prep
  //           ELSE temp
  //         END AS climate_value
  //       FROM filtered
  //       ORDER BY climate_value ASC;
  //     `;

  //     const result = await this.bizComputedKhisWardMonth.query(query, [
  //       startYear,
  //       startMonth,
  //       endYear,
  //       endMonth,
  //       indicator,
  //       climateType,
  //     ]);

  //     this.logger.log(
  //       `Fetched ${result.length} records for indicator count by ${climateType}`,
  //     );

  //     return result;
  //   } catch (error) {
  //     this.logger.error(
  //       `Error fetching indicator count by ${climateType}: ${error.message}`,
  //     );
  //     throw error;
  //   }
  // }

  async getIndicatorCountByClimate(
    filters: IndicatorCountByClimateFilterDto,
    climateType: 'precipitation' | 'temperature',
  ) {
    try {
      const {
        startYear,
        startMonth,
        endYear,
        endMonth,
        indicator,
        subcounty,
        ward,
      } = filters;

      this.logger.log(
        `getIndicatorCountByClimate called with filters: ${JSON.stringify(filters)} and climateType: ${climateType}`,
      );

      const binBy = climateType === 'precipitation' ? 'prep' : 'temp';

      const query = `
          WITH user_input AS (
            SELECT
              $1::int AS start_year,
              $2::int AS start_month,
              $3::int AS end_year,
              $4::int AS end_month,
              $5::text AS raw_dataelement_name,
              $6::text AS bin_by,  -- 'temp' or 'prep'
              $7::text AS filter_subcounty,  -- set to subcounty name or NULL
              $8::text AS filter_ward        -- set to ward name or NULL
          ),
          filtered AS (
            SELECT
              khis.com_total_value,
              COALESCE(era5.com_mean_t2m, 0) AS temp,
              COALESCE(era5.com_sum_tp, 0) AS prep,
              ui.bin_by
            FROM user_input ui
            JOIN public.biz_computed_khis_ward_month_v2 khis
              ON khis.raw_dataelement_name = ui.raw_dataelement_name
             AND (khis.com_year > ui.start_year OR (khis.com_year = ui.start_year AND khis.com_month >= ui.start_month))
             AND (khis.com_year < ui.end_year OR (khis.com_year = ui.end_year AND khis.com_month <= ui.end_month))
             AND (ui.filter_subcounty IS NULL OR khis.raw_subcounty = ui.filter_subcounty)
             AND (ui.filter_ward IS NULL OR khis.raw_ward = ui.filter_ward)
            LEFT JOIN public.biz_aggregated_copernicus_era5_ward_month_v2 era5
              ON khis.com_year = era5.com_year
             AND khis.com_month = era5.com_month
             AND khis.raw_ward = era5.com_ward
          ),
          binned AS (
            SELECT
              CASE
                WHEN bin_by = 'temp' THEN ROUND(temp::numeric, 0)
                ELSE ROUND(prep::numeric, 0)
              END AS bin_value,
              SUM(com_total_value) AS total_count
            FROM filtered
            GROUP BY
              CASE
                WHEN bin_by = 'temp' THEN ROUND(temp::numeric, 0)
                ELSE ROUND(prep::numeric, 0)
              END
          )
          SELECT
            bin_value::integer AS "climateValue",
            total_count::integer AS "totalCount"
          FROM binned
          ORDER BY bin_value ASC;
        `;

      const result = await this.bizComputedKhisWardMonthV2.query(query, [
        startYear,
        startMonth,
        endYear,
        endMonth,
        indicator,
        binBy,
        subcounty,
        ward,
      ]);

      this.logger.log(
        `Fetched ${result.length} records for indicator count by ${climateType}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching indicator count by ${climateType}: ${error.message}`,
      );
      throw error;
    }
  }

  async getIndicatorCountTrend(filters: IndicatorCountTrendDto) {
    try {
      const {
        startYear,
        startMonth,
        endYear,
        endMonth,
        indicator,
        // county,
        // subcounty,
        // ward,
      } = filters;

      this.logger.log(
        `getIndicatorCountTrend called with filters: ${JSON.stringify(filters)}`,
      );

      // // Map filters to correct names if needed
      // const mappedCounty = county ? COUNTY_MAP[county] || county : county;
      // const mappedWard = ward ? WARD_MAP[ward] || ward : ward;

      const query = `
        SELECT 
          DATE_TRUNC('month', monthDate) AS monthDate,
          indicator_name AS "indicatorName",
          SUM(indicator_count) AS "indicatorCount"
        FROM (
          SELECT
            khis.raw_county,
            khis.raw_subcounty,
            khis.raw_ward,
            make_date(khis.com_year::int, khis.com_month::int, 1) AS monthDate,
            khis.com_total_value AS indicator_count,
            khis.raw_dataelement_name AS indicator_name,
            khis.com_year,
            khis.com_month
          FROM biz_computed_khis_ward_month_v2 khis
          WHERE 
            ($1::integer IS NULL OR $2::integer IS NULL OR khis.com_year > $1 OR (khis.com_year = $1 AND khis.com_month >= $2))
            AND ($3::integer IS NULL OR $4::integer IS NULL OR khis.com_year < $3 OR (khis.com_year = $3 AND khis.com_month <= $4))
            AND ($5::text IS NULL OR khis.raw_dataelement_name = $5)
            AND ($6::text IS NULL OR khis.raw_county = $6)
            AND ($7::text IS NULL OR khis.raw_subcounty = $7)
            AND ($8::text IS NULL OR khis.raw_ward = $8)
        ) AS virtual_table 
        GROUP BY DATE_TRUNC('month', monthDate), indicator_name
        ORDER BY monthDate ASC;
      `;

      const result = await this.bizComputedKhisWardMonthV2.query(query, [
        startYear,
        startMonth,
        endYear,
        endMonth,
        indicator,
        null, // county parameter
        null, // subcounty parameter
        null, // ward parameter
      ]);

      this.logger.log(`Fetched ${result.length} records for indicator trend`);

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching indicator count trend: ${error.message}`,
      );
      throw error;
    }
  }

  async getKhisIndicatorCountByDateRange(
    filters: IndicatorCountByDateRangeDto,
  ) {
    try {
      const {
        startYear = 2022,
        startMonth = 1,
        endYear = 2025,
        endMonth = 10,
        indicator,
      } = filters || {};

      this.logger.log(
        `getKhisIndicatorCountByDateRange called with filters: ${JSON.stringify(filters)}`,
      );

      const query = `
        SELECT
          com_year AS "comYear",
          com_month AS "comMonth",
          raw_ward AS "rawWard",
          SUM(com_total_value)::integer AS "totalValue"
        FROM
          biz_computed_khis_ward_month_v2
        WHERE
          (com_year > $1 OR (com_year = $1 AND com_month >= $2))
          AND (com_year < $4 OR (com_year = $4 AND com_month <= $3))
          AND raw_dataelement_name = $5
        GROUP BY
          com_year,
          com_month,
          raw_ward
        ORDER BY
          com_year ASC,
          com_month ASC,
          raw_ward ASC;
      `;

      const result = await this.bizComputedKhisWardMonthV2.query(query, [
        startYear,
        startMonth,
        endMonth,
        endYear,
        indicator,
      ]);

      this.logger.log(`Fetched ${result.length} records for date range`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in getKhisIndicatorCountByDateRange: ${error.message}`,
      );
      throw error;
    }
  }

  async getPopulationWardChloropeth(filters: PopulationWardChloropethDto) {
    try {
      const {
        startYear = 2022,
        startMonth = 1,
        endYear = 2025,
        endMonth = 10,
        ward,
      } = filters || {};

      const query = `
        WITH user_input AS (
          SELECT
            $1::int AS start_year,
            $2::int AS start_month,
            $3::int AS end_year,
            $4::int AS end_month,
            $5::text AS ward_filter
        ),
        filtered AS (
          SELECT 
            p.raw_ward,
            p.raw_year,
            p.raw_month,
            p.raw_population
          FROM biz_raw_kajiado_population p
          CROSS JOIN user_input ui
          WHERE
            -- date range filter
            (p.raw_year > ui.start_year
              OR (p.raw_year = ui.start_year AND p.raw_month >= ui.start_month))
            AND
            (p.raw_year < ui.end_year
              OR (p.raw_year = ui.end_year AND p.raw_month <= ui.end_month))
            -- optional ward filter
            AND (ui.ward_filter IS NULL OR p.raw_ward = ui.ward_filter)
        ),
        latest_per_ward AS (
          SELECT DISTINCT ON (raw_ward)
            raw_ward,
            raw_year,
            raw_month,
            raw_population
          FROM filtered
          ORDER BY raw_ward, raw_year DESC, raw_month DESC
        )
        SELECT
          raw_ward AS ward,
          raw_population AS "latestPopulation"
        FROM latest_per_ward
        ORDER BY raw_ward;
      `;

      const result = await this.bizRawKajiadoPopulation.query(query, [
        startYear,
        startMonth,
        endYear,
        endMonth,
        ward,
      ]);

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching population chloropleth: ${error.message}`,
      );
      throw error;
    }
  }

  async getPopulationSubCountyChloropeth(
    filters: PopulationSubCountyChloropethDto,
  ) {
    try {
      const {
        startYear = 2022,
        startMonth = 1,
        endYear = 2025,
        endMonth = 10,
        subcounty,
      } = filters || {};

      const query = `
        WITH user_input AS (
          SELECT
            $1::int AS start_year,
            $2::int AS start_month,
            $3::int AS end_year,
            $4::int AS end_month,
            $5::text AS subcounty_filter
        ),
        date_bounds AS (
          SELECT
            make_date(end_year, end_month, 1) AS end_date,
            subcounty_filter
          FROM user_input
        ),
        candidates AS (
          SELECT
            p.raw_subcounty,
            p.raw_population,
            p.raw_year,
            p.raw_month,
            make_date(p.raw_year, p.raw_month, 1) AS data_date
          FROM biz_raw_kajiado_population p
          CROSS JOIN date_bounds db
          WHERE
            make_date(p.raw_year, p.raw_month, 1) <= db.end_date
            AND (db.subcounty_filter IS NULL OR p.raw_subcounty = db.subcounty_filter)
        ),
        latest AS (
          SELECT DISTINCT ON (raw_subcounty)
            raw_subcounty,
            raw_population,
            raw_year,
            raw_month,
            data_date
          FROM candidates
          ORDER BY raw_subcounty, data_date DESC
        )
        SELECT
          raw_subcounty AS subcounty,
          raw_population AS "latestPopulation"
        FROM latest
        ORDER BY raw_subcounty;
      `;

      const result = await this.bizRawKajiadoPopulation.query(query, [
        startYear,
        startMonth,
        endYear,
        endMonth,
        subcounty,
      ]);

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching subcounty population chloropleth: ${error.message}`,
      );
      throw error;
    }
  }

  async getPopulationChloropethSubCountyGeoJSON(
    filters: getPopulationChloropethSubCountyGeoJSONDto,
  ) {
    try {
      const { subcounty } = filters || {};

      const query = `
        WITH input AS (
          SELECT
            NULL::text AS county_filter,      
            $1::text AS subcounty_filter    
        ),
        filtered AS (
          SELECT *
          FROM biz_computed_kajiado_wards w
          CROSS JOIN input i
          WHERE 
            (i.county_filter IS NULL OR w.raw_county = i.county_filter)
            AND (i.subcounty_filter IS NULL OR w.raw_subcounty = i.subcounty_filter)
        ),
        subcounty_geom AS (
          SELECT
            raw_subcounty,
            raw_county,
            ST_Union(raw_geom) AS geom
          FROM filtered
          GROUP BY raw_subcounty, raw_county
        ),
        global_bbox AS (
          SELECT
            ST_XMin(env) AS minx,
            ST_YMin(env) AS miny,
            ST_XMax(env) AS maxx,
            ST_YMax(env) AS maxy
          FROM (
            SELECT ST_Extent(geom) AS env FROM subcounty_geom
          ) AS e
        ),
        features AS (
          SELECT jsonb_agg(
            jsonb_build_object(
              'type', 'Feature',
              'bbox', jsonb_build_array(
                ST_XMin(ST_Envelope(geom)),
                ST_YMin(ST_Envelope(geom)),
                ST_XMax(ST_Envelope(geom)),
                ST_YMax(ST_Envelope(geom))
              ),
              'geometry', ST_AsGeoJSON(geom)::jsonb,
              'properties', jsonb_build_object(
                'subcounty', raw_subcounty,
                'county', raw_county
              )
            )
          ) AS features
          FROM subcounty_geom
        )
        SELECT jsonb_build_object(
          'type', 'FeatureCollection',
          'bbox', jsonb_build_array(g.minx, g.miny, g.maxx, g.maxy),
          'features', fea.features
        ) AS geojson
        FROM global_bbox g, features fea;
      `;

      const result = await this.bizComputedKajiadoWards.query(query, [
        subcounty,
      ]);

      const geojson = result?.[0]?.geojson;

      if (!geojson || !geojson.features || geojson.features.length === 0) {
        throw new NotFoundException(
          'No subcounty data found for the given filters',
        );
      }

      return geojson;
    } catch (error) {
      this.logger.error(`Error fetching subcounty GeoJSON: ${error.message}`);
      throw error;
    }
  }

  async getKhisEachIndicatorTrend(filters: EachIndicatorTrendFilterDto) {
    try {
      const {
        startYear,
        startMonth,
        endYear,
        endMonth,
        ward,
        subcounty,
        indicator,
      } = filters || {};

      // Helper function to get indicator category
      const getIndicatorCategory = (indicatorName: string): string => {
        for (const [category, indicators] of Object.entries(
          defaultIndicators,
        )) {
          if (indicators.includes(indicatorName)) {
            return category;
          }
        }
        return 'Other';
      };

      const mappedWard = ward ? WARD_MAP[ward] || ward : ward;
      const paramsBase = [
        startYear,
        startMonth,
        endYear,
        endMonth,
        mappedWard,
        subcounty,
      ];

      // Query for trend data using the improved query structure
      const trendQuery = `
        WITH user_input AS (
          SELECT
            $1::int AS start_year,
            $2::int AS start_month,
            $3::int AS end_year,
            $4::int AS end_month,
            $5::text AS ward_filter,
            $6::text AS subcounty_filter,
            $7::text AS raw_dataelement_name
        ),
        month_range AS (
          SELECT
            generate_series(
              make_date(start_year, start_month, 1),
              make_date(end_year, end_month, 1),
              interval '1 month'
            )::date AS month_date
          FROM user_input
        ),
        filtered AS (
          SELECT
            khis.raw_ward,
            khis.raw_subcounty,
            khis.com_year,
            khis.com_month,
            khis.com_total_value
          FROM biz_computed_khis_ward_month_v2 khis
          JOIN user_input ui
            ON khis.raw_dataelement_name = ui.raw_dataelement_name
           AND (ui.ward_filter IS NOT NULL AND khis.raw_ward = ui.ward_filter
                 OR ui.ward_filter IS NULL)
           AND (ui.subcounty_filter IS NOT NULL AND khis.raw_subcounty = ui.subcounty_filter
                 OR ui.subcounty_filter IS NULL)
           AND make_date(khis.com_year, khis.com_month, 1)
               BETWEEN make_date(ui.start_year, ui.start_month, 1)
               AND make_date(ui.end_year, ui.end_month, 1)
        ),
        final AS (
          SELECT
            EXTRACT(YEAR FROM mr.month_date)::int  AS com_year,
            EXTRACT(MONTH FROM mr.month_date)::int AS com_month,
            -- Return ward only if filtering by ward
            CASE WHEN (SELECT ward_filter FROM user_input) IS NULL THEN NULL
                 ELSE f.raw_ward END AS raw_ward,
            CASE WHEN (SELECT subcounty_filter FROM user_input) IS NULL THEN NULL
                 ELSE f.raw_subcounty END AS raw_subcounty,
            COALESCE(SUM(f.com_total_value), 0)::int AS total_value
          FROM month_range mr
          LEFT JOIN filtered f
            ON make_date(f.com_year, f.com_month, 1) = mr.month_date
          GROUP BY
            mr.month_date,
            CASE WHEN (SELECT ward_filter FROM user_input) IS NULL THEN NULL ELSE f.raw_ward END,
            CASE WHEN (SELECT subcounty_filter FROM user_input) IS NULL THEN NULL ELSE f.raw_subcounty END
        )
        SELECT 
          com_year AS "comYear",
          com_month AS "comMonth", 
          raw_ward AS "rawWard",
          raw_subcounty AS "rawSubcounty",
          total_value AS "totalValue"
        FROM final
        ORDER BY com_year, com_month;
      `;

      if (indicator) {
        const params = [...paramsBase, indicator];
        const [trendData] = await Promise.all([
          this.bizComputedKhisWardMonthV2.query(trendQuery, params),
        ]);

        return [
          {
            indicator,
            category: getIndicatorCategory(indicator),
            trendData,
          },
        ];
      }

      const allIndicators = [
        ...defaultIndicators.Mother,
        ...defaultIndicators.Baby,
        ...defaultIndicators.Other,
      ];

      const results = [];
      for (const name of allIndicators) {
        const params = [...paramsBase, name];
        const [trendData] = await Promise.all([
          this.bizComputedKhisWardMonthV2.query(trendQuery, params),
        ]);

        results.push({
          indicator: name,
          category: getIndicatorCategory(name),
          trendData,
        });
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Error fetching indicator trend data: ${error.message}`,
      );
      throw error;
    }
  }

  async getPromptsEachIntentTrend(filters: EachIntentTrendFilterDto) {
    try {
      const {
        startYear,
        startMonth,
        endYear,
        endMonth,
        ward,
        subcounty,
        category,
        search,
        page,
        limit,
      } = filters || {};

      const mappedWard = ward ? WARD_MAP[ward] || ward : ward;
      const mappedSubcounty = subcounty
        ? SUBCOUNTY_MAP_PROMPTS[subcounty] || subcounty
        : subcounty;

      const paramsBase = [
        startYear,
        startMonth,
        endYear,
        endMonth,
        mappedWard,
        mappedSubcounty,
      ];

      // Query to get category and priority level for an intent
      const getCategoryQuery = `
        WITH user_input AS (SELECT $1::text AS intent)
        SELECT DISTINCT
          p.raw_broader_category AS category,
          p.raw_priority_level AS "priorityLevel"
        FROM biz_computed_prompts_ward_month p
        CROSS JOIN user_input ui
        WHERE p.com_intent = ui.intent;
      `;

      // Trend query: if start/end not provided, compute bounds from data
      const trendQuery = `
        WITH user_input AS (
          SELECT
            $1::int AS start_year,
            $2::int AS start_month,
            $3::int AS end_year,
            $4::int AS end_month,
            $5::text AS ward_filter,
            $6::text AS subcounty_filter,
            $7::text AS com_intent
        ),
        bounds AS (
          SELECT
            COALESCE(
              CASE WHEN ui.start_year IS NOT NULL AND ui.start_month IS NOT NULL THEN make_date(ui.start_year, ui.start_month, 1) END,
              (SELECT MIN(make_date(p.com_year, p.com_month, 1))
               FROM biz_computed_prompts_ward_month p
               WHERE (ui.ward_filter IS NULL OR p.com_ward = ui.ward_filter)
                 AND (ui.subcounty_filter IS NULL OR p.com_subcounty = ui.subcounty_filter)
                 AND (ui.com_intent IS NULL OR p.com_intent = ui.com_intent)
              )
            ) AS start_date,
            COALESCE(
              CASE WHEN ui.end_year IS NOT NULL AND ui.end_month IS NOT NULL THEN make_date(ui.end_year, ui.end_month, 1) END,
              (SELECT MAX(make_date(p.com_year, p.com_month, 1))
               FROM biz_computed_prompts_ward_month p
               WHERE (ui.ward_filter IS NULL OR p.com_ward = ui.ward_filter)
                 AND (ui.subcounty_filter IS NULL OR p.com_subcounty = ui.subcounty_filter)
                 AND (ui.com_intent IS NULL OR p.com_intent = ui.com_intent)
              )
            ) AS end_date
          FROM user_input ui
          LIMIT 1
        ),
        month_series AS (
          SELECT
            EXTRACT(YEAR FROM d)::int AS year,
            EXTRACT(MONTH FROM d)::int AS month
          FROM generate_series(
            (SELECT start_date FROM bounds),
            (SELECT end_date FROM bounds),
            interval '1 month'
          ) d
        ),
        filtered AS (
          SELECT
            prompts.com_ward,
            prompts.com_subcounty,
            prompts.com_year,
            prompts.com_month,
            prompts.com_intent_count,
            ui.ward_filter,
            ui.subcounty_filter
          FROM user_input ui
          JOIN biz_computed_prompts_ward_month prompts
            ON prompts.com_intent = ui.com_intent
           AND (ui.start_year IS NULL OR ui.start_month IS NULL
            OR prompts.com_year > ui.start_year
            OR (prompts.com_year = ui.start_year AND prompts.com_month >= ui.start_month))
           AND (ui.end_year IS NULL OR ui.end_month IS NULL
            OR prompts.com_year < ui.end_year
            OR (prompts.com_year = ui.end_year AND prompts.com_month <= ui.end_month))
           AND (ui.ward_filter IS NULL OR prompts.com_ward = ui.ward_filter)
           AND (ui.subcounty_filter IS NULL OR prompts.com_subcounty = ui.subcounty_filter)
        ),
        agg AS (
          SELECT
            com_year,
            com_month,
            SUM(com_intent_count)::integer AS totalValue
          FROM filtered
          GROUP BY com_year, com_month
        )
        SELECT
          ms.year AS "comYear",
          ms.month AS "comMonth",
          NULL::text AS "rawWard",
          NULL::text AS "rawSubcounty",
          COALESCE(a.totalValue, 0)::integer AS "totalValue"
        FROM month_series ms
        LEFT JOIN agg a
          ON a.com_year = ms.year
         AND a.com_month = ms.month
        ORDER BY ms.year, ms.month;
      `;

      const changeQuery = `
        WITH user_input AS (
          SELECT
            $1::int AS start_year,
            $2::int AS start_month,
            $3::int AS end_year,
            $4::int AS end_month,
            $5::text AS ward_filter,
            $6::text AS subcounty_filter,
            $7::text AS intent
        ),
        filtered AS (
          SELECT
            com_year,
            com_month,
            SUM(com_intent_count)::integer AS total_value
          FROM biz_computed_prompts_ward_month p
          JOIN user_input ui
            ON p.com_intent = ui.intent
           AND (ui.start_year IS NULL OR ui.start_month IS NULL OR p.com_year > ui.start_year
                OR (p.com_year = ui.start_year AND p.com_month >= ui.start_month))
           AND (ui.end_year IS NULL OR ui.end_month IS NULL OR p.com_year < ui.end_year
                OR (p.com_year = ui.end_year AND p.com_month <= ui.end_month))
           AND (ui.ward_filter IS NULL OR p.com_ward = ui.ward_filter)
           AND (ui.subcounty_filter IS NULL OR p.com_subcounty = ui.subcounty_filter)
          GROUP BY com_year, com_month
        ),
        first_val AS (
          SELECT total_value AS initial_value
          FROM filtered
          ORDER BY com_year, com_month
          LIMIT 1
        ),
        last_val AS (
          SELECT total_value AS final_value
          FROM filtered
          ORDER BY com_year DESC, com_month DESC
          LIMIT 1
        )
        SELECT
          fv.initial_value::integer AS "initialValue",
          lv.final_value::integer AS "finalValue",
          CASE
            WHEN fv.initial_value = 0 THEN NULL
            ELSE ROUND(((lv.final_value - fv.initial_value) / fv.initial_value::numeric) * 100, 2)::float
          END AS "overallPercentChange"
        FROM first_val fv
        CROSS JOIN last_val lv;
      `;

      const totalCountQuery = `
        WITH user_input AS (
          SELECT
            $1::int AS start_year,
            $2::int AS start_month,
            $3::int AS end_year,
            $4::int AS end_month,
            $5::text AS ward_filter,
            $6::text AS subcounty_filter,
            $7::text AS intent_name
        ),
        filtered AS (
          SELECT
            p.com_intent_count
          FROM biz_computed_prompts_ward_month p
          CROSS JOIN user_input ui
          WHERE
            p.com_intent = ui.intent_name
            AND (ui.start_year IS NULL OR ui.start_month IS NULL OR
                p.com_year > ui.start_year
                OR (p.com_year = ui.start_year AND p.com_month >= ui.start_month))
            AND (ui.end_year IS NULL OR ui.end_month IS NULL OR
                p.com_year < ui.end_year
                OR (p.com_year = ui.end_year AND p.com_month <= ui.end_month))
            AND (ui.ward_filter IS NULL OR p.com_ward = ui.ward_filter)
            AND (ui.subcounty_filter IS NULL OR p.com_subcounty = ui.subcounty_filter)
        )
        SELECT
          SUM(com_intent_count)::integer AS "totalCount"
        FROM filtered;
      `;

      // Build intents list query (filter by category + search if provided)
      const whereClauses: string[] = [`raw_broader_category != 'other'`];
      const params: any[] = [];

      if (category) {
        params.push(category);
        whereClauses.push(`raw_broader_category = $${params.length}`);
      }

      // Enhanced "starts-with" search:
      if (search && search.trim()) {
        const clean = search.trim();
        const tokens = clean.split(/\s+/).filter(Boolean);
        const tokenClauses: string[] = [];

        for (const token of tokens) {
          const escapedToken = token.replace(/([%_\\])/g, '\\$1');
          const patternStart = `${escapedToken}%`;
          const patternAfterSpace = `% ${escapedToken}%`;

          params.push(patternStart, patternAfterSpace);
          const idxStart = params.length - 1;
          const idxAfter = params.length;

          tokenClauses.push(
            `(com_intent ILIKE $${idxStart} ESCAPE '\\' OR com_intent ILIKE $${idxAfter} ESCAPE '\\')`,
          );
        }

        // require all tokens to match (AND) so multi-word queries are handled
        whereClauses.push(`(${tokenClauses.join(' AND ')})`);
      }

      const whereClauseSql = whereClauses.length
        ? `WHERE ${whereClauses.join(' AND ')}`
        : '';

      // total distinct intents count (for pagination meta)
      const countQuery = `
        SELECT COUNT(DISTINCT com_intent) AS total
        FROM biz_computed_prompts_ward_month
        ${whereClauseSql};
      `;

      const totalResult = await this.bizComputedPromptsWardMonth.query(
        countQuery,
        params,
      );
      const totalIntents = Number(totalResult?.[0]?.total || 0);

      // build list query with optional pagination
      const listParams = [...params]; // copy
      let listQuery = `
        SELECT DISTINCT com_intent
        FROM biz_computed_prompts_ward_month
        ${whereClauseSql}
        ORDER BY com_intent
      `;

      let offset = 0;
      let pageNum = 1;
      let pageLimit = totalIntents || 0;

      if (typeof page === 'number' && typeof limit === 'number' && limit > 0) {
        pageNum = Math.max(1, Math.floor(page));
        pageLimit = Math.max(1, Math.floor(limit));
        offset = (pageNum - 1) * pageLimit;
        listParams.push(pageLimit);
        listParams.push(offset);
        listQuery += ` LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`;
      }

      const intentRows = await this.bizComputedPromptsWardMonth.query(
        listQuery,
        listParams,
      );
      const allIntents = intentRows.map((r) => r.com_intent);

      const allPromises = allIntents.map((itm) => {
        const qParams = [...paramsBase, itm];
        return Promise.all([
          this.bizComputedPromptsWardMonth.query(trendQuery, qParams),
          this.bizComputedPromptsWardMonth.query(changeQuery, qParams),
          this.bizComputedPromptsWardMonth.query(totalCountQuery, qParams),
          this.bizComputedPromptsWardMonth.query(getCategoryQuery, [itm]),
        ]).then(([trendData, changeData, totalCountData, categoryData]) => ({
          intent: itm,
          category: categoryData[0]?.category || category || null,
          priorityLevel: categoryData[0]?.priorityLevel || null,
          trendData,
          changeData: changeData[0] || null,
          totalCount: totalCountData[0]?.totalCount || 0,
        }));
      });

      const results = await Promise.all(allPromises);

      const searchTerm = search && search.trim() ? search.trim() : null;

      // If pagination params provided return paged response with meta, otherwise full array
      if (typeof page === 'number' && typeof limit === 'number' && limit > 0) {
        const totalPages = Math.ceil(totalIntents / pageLimit);
        return {
          data: results,
          meta: {
            total: totalIntents,
            page: pageNum,
            limit: pageLimit,
            totalPages,
            category: category || null,
            search: searchTerm,
          },
        };
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Error fetching prompts intent trend data: ${error.message}`,
      );
      throw error;
    }
  }

  async getPromptsIntentRelativeIntensity(
    filters: PromptsIntentRelativeIntensityDto,
  ) {
    try {
      const { startYear, startMonth, endYear, endMonth, subcounty, ward } =
        filters || {};

      const mappedWard = ward ? WARD_MAP[ward] || ward : ward;
      const mappedSubcounty = subcounty
        ? SUBCOUNTY_MAP_PROMPTS[subcounty] || subcounty
        : subcounty;

      const query = `
        WITH climate_monthly AS (
          SELECT
            com_year,
            com_month,
            AVG(com_mean_t2m - 273.15) AS county_temp_celsius
          FROM biz_aggregated_copernicus_era5_ward_month_v2
          WHERE
            ($1::int IS NULL OR $2::int IS NULL OR com_year > $1 OR (com_year = $1 AND com_month >= $2))
            AND ($3::int IS NULL OR $4::int IS NULL OR com_year < $3 OR (com_year = $3 AND com_month <= $4))
          GROUP BY com_year, com_month
        ),

        intent_monthly AS (
          SELECT
            com_year,
            com_month,
            com_intent,
            COUNT(*) AS intent_count
          FROM biz_computed_prompts_ward_month
          WHERE
            ($1::int IS NULL OR $2::int IS NULL OR com_year > $1 OR (com_year = $1 AND com_month >= $2))
            AND ($3::int IS NULL OR $4::int IS NULL OR com_year < $3 OR (com_year = $3 AND com_month <= $4))
            AND ($5::text IS NULL OR com_subcounty = $5)
            AND ($6::text IS NULL OR com_ward = $6)
          GROUP BY com_year, com_month, com_intent
        ),

        combined AS (
          SELECT
            c.com_year,
            c.com_month,
            c.county_temp_celsius,
            i.com_intent,
            i.intent_count
          FROM climate_monthly c
          LEFT JOIN intent_monthly i
            ON c.com_year = i.com_year
           AND c.com_month = i.com_month
        ),

        range_stats AS (
          SELECT
            MIN(county_temp_celsius) AS min_temp,
            MAX(county_temp_celsius) AS max_temp
          FROM combined
        ),

        bin_edges AS (
          SELECT
            min_temp,
            max_temp,
            (max_temp - min_temp) / 3.0 AS bin_width
          FROM range_stats
        ),

        binned AS (
          SELECT
            *,
            CASE
              WHEN county_temp_celsius <  be.min_temp + be.bin_width THEN 1
              WHEN county_temp_celsius <  be.min_temp + 2 * be.bin_width THEN 2
              ELSE 3
            END AS temp_bin,
            CASE
              WHEN county_temp_celsius <  be.min_temp + be.bin_width THEN be.min_temp
              WHEN county_temp_celsius <  be.min_temp + 2 * be.bin_width THEN be.min_temp + be.bin_width
              ELSE be.min_temp + 2 * be.bin_width
            END AS bin_start,
            CASE
              WHEN county_temp_celsius < be.min_temp + be.bin_width THEN be.min_temp + be.bin_width
              WHEN county_temp_celsius < be.min_temp + 2 * be.bin_width THEN be.min_temp + 2 * be.bin_width
              ELSE be.max_temp
            END AS bin_end
          FROM combined
          CROSS JOIN bin_edges be
        ),

        intent_bin_counts AS (
          SELECT
            com_intent,
            temp_bin,
            ROUND(MIN(bin_start)) AS bin_start,
            ROUND(MIN(bin_end)) AS bin_end,
            SUM(intent_count) AS intent_count
          FROM binned
          GROUP BY com_intent, temp_bin
        ),

        bin_totals AS (
          SELECT
            temp_bin,
            SUM(intent_count) AS total_bin_count
          FROM intent_bin_counts
          GROUP BY temp_bin
        ),

        with_ratios AS (
          SELECT
            ibc.*,
            (ibc.intent_count::numeric / bt.total_bin_count::numeric) * 100 AS raw_percent,
            ROW_NUMBER() OVER (PARTITION BY ibc.temp_bin ORDER BY ibc.com_intent) AS rn,
            COUNT(*)  OVER (PARTITION BY ibc.temp_bin) AS total_rows
          FROM intent_bin_counts ibc
          JOIN bin_totals bt USING (temp_bin)
        )

        SELECT
          com_intent AS "rawIntent",
          temp_bin AS "tempBin",
          bin_start AS "tempRangeStart",
          bin_end AS "tempRangeEnd",
          intent_count::integer AS "intentCount",
          CASE
            WHEN rn = total_rows THEN ROUND(
                100 - SUM(raw_percent)
                      OVER (PARTITION BY temp_bin ORDER BY rn
                            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)
            , 2)
            ELSE ROUND(raw_percent, 2)
          END::float AS "intensityPercent"
        FROM with_ratios
        ORDER BY temp_bin, com_intent;
      `;

      const result = await this.bizComputedPromptsWardMonth.query(query, [
        startYear,
        startMonth,
        endYear,
        endMonth,
        mappedSubcounty,
        mappedWard,
      ]);

      this.logger.log(
        `Fetched ${result.length} records for prompts intent relative intensity`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching prompts intent relative intensity: ${error.message}`,
      );
      throw error;
    }
  }

  async getPromptsIntentPriorityFrequency(
    filters: PromptsIntentPriorityFrequencyDto,
  ) {
    try {
      const {
        startYear,
        startMonth,
        endYear,
        endMonth,
        subcounty,
        ward,
        category,
      } = filters || {};

      const mappedWard = ward ? WARD_MAP[ward] || ward : ward;
      const mappedSubcounty = subcounty
        ? SUBCOUNTY_MAP_PROMPTS[subcounty] || subcounty
        : subcounty;

      const query = `
        WITH user_input AS (
          SELECT
            $1::int AS start_year,
            $2::int AS start_month,
            $3::int AS end_year,
            $4::int AS end_month,
            $5::text AS filter_subcounty,
            $6::text AS filter_ward,
            $7::text AS filter_broader_category
        ),

        -- 1) COUNTY-LEVEL MONTHLY TEMPERATURE (AVG across wards)
        climate_monthly AS (
          SELECT
            com_year,
            com_month,
            AVG(com_mean_t2m - 273.15) AS county_temp_celsius
          FROM biz_aggregated_copernicus_era5_ward_month_v2
          GROUP BY com_year, com_month
        ),

        -- 2) COUNTY-LEVEL PRIORITY COUNTS (FILTER BY broader category)
        priority_monthly AS (
          SELECT
            com_year,
            com_month,
            raw_priority_level,
            COUNT(*) AS priority_count
          FROM biz_computed_prompts_ward_month p
          JOIN user_input u ON TRUE
          WHERE
            ($1::int IS NULL OR $2::int IS NULL OR p.com_year > $1 OR (p.com_year = $1 AND p.com_month >= $2))
            AND ($3::int IS NULL OR $4::int IS NULL OR p.com_year < $3 OR (p.com_year = $3 AND p.com_month <= $4))
            AND ($5::text IS NULL OR p.com_subcounty = $5)
            AND ($6::text IS NULL OR p.com_ward = $6)
            AND (
              u.filter_broader_category IS NULL
              OR LOWER(p.raw_broader_category) = LOWER(u.filter_broader_category)
            )
          GROUP BY com_year, com_month, raw_priority_level
        ),

        -- 3) JOIN CLIMATE + PRIORITY
        combined AS (
          SELECT
            c.com_year,
            c.com_month,
            c.county_temp_celsius,
            p.raw_priority_level,
            p.priority_count
          FROM climate_monthly c
          LEFT JOIN priority_monthly p
            ON c.com_year = p.com_year
           AND c.com_month = p.com_month
        ),

        -- 4) TEMP RANGE
        range_bounds AS (
          SELECT
            MIN(county_temp_celsius) AS min_temp,
            MAX(county_temp_celsius) AS max_temp
          FROM combined
        ),

        bin_edges AS (
          SELECT
            min_temp,
            max_temp,
            (max_temp - min_temp) / 3.0 AS bin_width
          FROM range_bounds
        ),

        -- 5) BIN EACH MONTH
        binned AS (
          SELECT
            *,
            width_bucket(county_temp_celsius, be.min_temp, be.max_temp, 3) AS temp_bin
          FROM combined
          CROSS JOIN bin_edges be
        ),

        -- 6) HUMAN-READABLE BINS
        bin_labels AS (
          SELECT
            1 AS temp_bin,
            min_temp AS start_val,
            min_temp + bin_width AS end_val
          FROM bin_edges
          UNION ALL
          SELECT
            2,
            min_temp + bin_width,
            min_temp + 2*bin_width
          FROM bin_edges
          UNION ALL
          SELECT
            3,
            min_temp + 2*bin_width,
            max_temp
          FROM bin_edges
        ),

        -- 7) SUM PRIORITIES PER BIN
        bin_priority_counts AS (
          SELECT
            b.temp_bin,
            bl.start_val,
            bl.end_val,
            b.raw_priority_level,
            SUM(b.priority_count) AS total_priority_count
          FROM binned b
          JOIN bin_labels bl USING (temp_bin)
          GROUP BY b.temp_bin, bl.start_val, bl.end_val, b.raw_priority_level
        ),

        -- 8) TOTAL PER PRIORITY (for frequency ratios)
        priority_totals AS (
          SELECT
            raw_priority_level,
            SUM(total_priority_count) AS total_across_bins
          FROM bin_priority_counts
          GROUP BY raw_priority_level
        )

        -- 9) FINAL OUTPUT
        SELECT
          b.temp_bin AS "tempBin",
          ROUND(b.start_val::numeric)::integer AS "tempRangeStart",
          ROUND(b.end_val::numeric)::integer AS "tempRangeEnd",
          CONCAT(ROUND(b.start_val::numeric), '–', ROUND(b.end_val::numeric)) AS "temperatureRange",
          b.raw_priority_level AS "priorityLevel",
          b.total_priority_count::integer AS "priorityCount",
          ROUND(b.total_priority_count::numeric / pt.total_across_bins, 4)::float AS "frequencyRatio"
        FROM bin_priority_counts b
        JOIN priority_totals pt USING (raw_priority_level)
        ORDER BY b.temp_bin, b.raw_priority_level;
      `;

      const result = await this.bizComputedPromptsWardMonth.query(query, [
        startYear,
        startMonth,
        endYear,
        endMonth,
        mappedSubcounty,
        mappedWard,
        category,
      ]);

      this.logger.log(
        `Fetched ${result.length} records for prompts intent priority frequency`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching prompts intent priority frequency: ${error.message}`,
      );
      throw error;
    }
  }

  async getKhisPrediction(filters: KhisPredictionDto) {
    try {
      const { indicatorName, startDate, endDate } = filters || {};

      const query = `
        SELECT 
          raw_date::DATE AS "rawDate",
          raw_value AS "rawValue",
          raw_ci_low AS "rawCiLow",
          raw_ci_high AS "rawCiHigh",
          raw_type AS "rawType"
        FROM biz_raw_kajiado_projections
        WHERE raw_indicator_rate_name = $1
          AND ($2::date IS NULL OR $3::date IS NULL OR raw_date BETWEEN $2 AND $3)
        ORDER BY raw_date;
      `;

      const result = await this.bizComputedKhisWardMonthV2.query(query, [
        indicatorName,
        startDate,
        endDate,
      ]);

      this.logger.log(`Fetched ${result.length} records for KHIS prediction`);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching KHIS prediction: ${error.message}`);
      throw error;
    }
  }

  async getCopernicusPrediction(filters: CopernicusPredictionDto) {
    try {
      const { startDate, endDate } = filters || {};

      const queryHistorical = `
        SELECT 
          ROUND(AVG(com_mean_t2m - 273.15)::numeric, 2)::float AS "temperature",
          ROUND((AVG(com_sum_tp) * 1000)::numeric, 2)::float AS "precipitation",
          com_year as "comYear",
          com_month as "comMonth",
          'historical' as "rawType"
        FROM
          biz_aggregated_copernicus_era5_ward_month_v2
        GROUP BY
          com_year,com_month
        ORDER BY 
          com_year,com_month;
      `;

      const queryProjected = `
      SELECT 
          ROUND(AVG(com_mean_t2m - 273.15)::numeric, 2)::float AS "temperature",
          ROUND(SUM(com_sum_tp *86400)::numeric, 2)::float AS "precipitation",
          com_year as "comYear",
          com_month as "comMonth",
          raw_type as "rawType"
        FROM
          biz_computed_kajiado_climate_projections
        GROUP BY
          com_year,com_month, raw_type
        ORDER BY 
          com_year,com_month, raw_type;
      `;

      const resultHistorical =
        await this.bizAggregatedCopernicusEra5WardMonthV2.query(
          queryHistorical,
        );

      const resultProjected =
        await this.bizComputedKajiadoClimateProjections.query(queryProjected);

      const result = [...resultHistorical, ...resultProjected];
      this.logger.log(`Fetched ${result.length} records for KHIS prediction`);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching KHIS prediction: ${error.message}`);
      throw error;
    }
  }
}
