import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  EachIndicatorTrendFilterDto,
  EachIndicatorTrendFilterDtoV1,
  EachIntentTrendFilterDto,
  getPopulationChloropethSubCountyGeoJSONDto,
  IndicatorCountByDateRangeDto,
  KajiadoFacilitiesFilterDto,
  PopulationSubCountyChloropethDto,
  PopulationWardChloropethDto,
  WARD_MAP,
} from '../dto/visualization.dto';
import { BizComputedKajiadoPopulation } from '../entity/biz_computed_kajiado_population.entity';
import { BizComputedKajiadoWards } from '../entity/biz_computed_kajiado_wards.entity';
import { BizComputedKhisWardMonth } from '../entity/biz_computed_khis_ward_month.entity';
import { BizComputedPromptsWardMonth } from '../entity/biz_computed_prompts_ward_month.entity';
import { PassThrough, Readable } from 'stream';
import * as fastcsv from 'fast-csv';
import * as ExcelJS from 'exceljs';
import { BizComputedKajiadoMasterHealthFacilities } from '../entity/biz_computed_kajiado_master_health_facilities.entity';



export interface Ward {
  wardId: string;
  wardName: string;
}

export interface SubcountyGroup {
  subcountyId: string;
  subcountyName: string;
  wards: Ward[];
}
@Injectable()
export class OverviewService {
    private readonly logger = new Logger(OverviewService.name);

  constructor(
    @InjectRepository(BizComputedKhisWardMonth)
    private readonly bizComputedKhisWardMonth: Repository<BizComputedKhisWardMonth>,
    @InjectRepository(BizComputedKajiadoWards)
    private readonly bizComputedKajiadoWards: Repository<BizComputedKajiadoWards>,
    @InjectRepository(BizComputedKajiadoPopulation)
    private readonly bizRawKajiadoPopulation: Repository<BizComputedKajiadoPopulation>,
    @InjectRepository(BizComputedPromptsWardMonth)
    private readonly bizComputedPromptsWardMonth: Repository<BizComputedPromptsWardMonth>,
    @InjectRepository(BizComputedKajiadoMasterHealthFacilities)
    private readonly bizComputedKajiadoMasterHealthFacilities: Repository<BizComputedKajiadoMasterHealthFacilities>,
    private readonly dataSource: DataSource,
  ) {}

  async getPopulationWardChloropeth(filters: PopulationWardChloropethDto) {
    try {
      const {
        startYear = 2022,
        startMonth = 1,
        endYear = 2025,
        endMonth = 10,
        wardId,
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
              p.com_ward_id,
			  w.ward_name,
              p.raw_year,
              p.raw_month,
              p.raw_population
            FROM biz_computed_kajiado_population p
			JOIN biz_master_wards w
			ON p.com_ward_id = w.ward_id
            CROSS JOIN user_input ui
            WHERE
              -- date range filter
              (p.raw_year > ui.start_year
                OR (p.raw_year = ui.start_year AND p.raw_month >= ui.start_month))
              AND
              (p.raw_year < ui.end_year
                OR (p.raw_year = ui.end_year AND p.raw_month <= ui.end_month))
              -- optional ward filter
              AND (ui.ward_filter IS NULL OR p.com_ward_id = ui.ward_filter)
          ),
          latest_per_ward AS (
            SELECT DISTINCT ON (com_ward_id)
              com_ward_id,
			  ward_name,
              raw_year,
              raw_month,
              raw_population
            FROM filtered
            ORDER BY com_ward_id, raw_year DESC, raw_month DESC
          )
          SELECT
            com_ward_id AS "wardId",
			      ward_name AS "wardName",
            raw_population :: integer AS "latestPopulation"
          FROM latest_per_ward
          ORDER BY com_ward_id;
        `;

      const result = await this.bizRawKajiadoPopulation.query(query, [
        startYear,
        startMonth,
        endYear,
        endMonth,
        wardId,
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
        subcountyId,
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
              p.com_subcounty_id,
			  sc.subcounty_name,
              p.raw_population,
              p.raw_year,
              p.raw_month,
              make_date(p.raw_year, p.raw_month, 1) AS data_date
            FROM biz_computed_kajiado_population p
			JOIN biz_master_subcounties sc
			ON sc.subcounty_id = p.com_subcounty_id
            CROSS JOIN date_bounds db
            WHERE
              make_date(p.raw_year, p.raw_month, 1) <= db.end_date
              AND (db.subcounty_filter IS NULL OR p.com_subcounty_id = db.subcounty_filter)
          ),
          latest AS (
            SELECT DISTINCT ON (com_subcounty_id)
              com_subcounty_id,
			  subcounty_name,
              raw_population,
              raw_year,
              raw_month,
              data_date
            FROM candidates
            ORDER BY com_subcounty_id, data_date DESC
          )
          SELECT
            com_subcounty_id AS "subCountyId",
			      subcounty_name AS "subCountyName",
            raw_population AS "latestPopulation"
          FROM latest
          ORDER BY com_subcounty_id;
        `;

      const result = await this.bizRawKajiadoPopulation.query(query, [
        startYear,
        startMonth,
        endYear,
        endMonth,
        subcountyId,
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
      const { countyId, subcountyId } = filters || {};

      const query = `
        SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'bbox', (
              SELECT jsonb_build_array(
                  ST_XMin(env),
                  ST_YMin(env),
                  ST_XMax(env),
                  ST_YMax(env)
              )
              FROM (
                  SELECT ST_Extent(geom) AS env
                  FROM (
                      SELECT
                          kw.com_subcounty_id,
                          kw.com_county_id,
                          ST_Union(raw_geom) AS geom
					  FROM biz_computed_kajiado_wards kw
                      WHERE
                          ('Hsk1YV8kHkT' :: text IS NULL OR kw.com_county_id = 'Hsk1YV8kHkT')
                          AND (NULL :: text IS NULL OR kw.com_subcounty_id = null)
                      GROUP BY kw.com_subcounty_id,kw.com_county_id
                  ) AS sg
              ) AS bbox
          ),
            'features', (
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
                            'subCountyId', com_subcounty_id,
							'subCountyName',subcounty_name,
                            'countyId', com_county_id,
							'countyName',county_name
                        )
                    )
                )
              FROM (
                  SELECT
                      kw.com_subcounty_id,
					  sc.subcounty_name,
                      kw.com_county_id,
					  c.county_name,
                      ST_Union(raw_geom) AS geom
				  FROM biz_computed_kajiado_wards kw
					  JOIN biz_master_subcounties sc
					  ON sc.subcounty_id = kw.com_subcounty_id
					  JOIN biz_master_counties c
					  ON c.county_id = kw.com_county_id
                  WHERE
                      ($1 :: text IS NULL OR kw.com_county_id = $1)
                      AND ($2 :: text IS NULL OR kw.com_subcounty_id = $2)
                  GROUP BY kw.com_subcounty_id,sc.subcounty_name, kw.com_county_id, c.county_name
              ) AS features
          )
      ) AS geojson;
      `;

      const result = await this.bizComputedKajiadoWards.query(query, [
        countyId,
        subcountyId,
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

  async getKajiadoSubcountyWardList(): Promise<any> {
    try {
      const query = `
      SELECT 
        kw.com_county_id AS "countyId",
        mc.county_name AS "countyName",
        kw.com_subcounty_id AS "rawsubcounty",
        sc.subcounty_name AS "subcountyName",
        kw.com_ward_id AS "rawward",
        w.ward_name AS "wardName"
        FROM biz_computed_kajiado_wards kw
      JOIN
          biz_master_wards w
      ON
          w.ward_id = kw.com_ward_id
      JOIN
          biz_master_subcounties sc
      ON
          sc.subcounty_id = kw.com_subcounty_id
      JOIN
          biz_master_counties mc
      ON
          mc.county_id = kw.com_county_id
      ORDER BY 
        kw.com_subcounty_id ASC,
        kw.com_ward_id ASC;`;

      const rawData = await this.bizComputedKajiadoWards.query(query);

      const subcountyWardMap: Record<string, SubcountyGroup> = {};

      for (const row of rawData) {
        const { rawsubcounty, subcountyName, rawward, wardName } = row;

        if (!rawsubcounty) continue;

        if (!subcountyWardMap[rawsubcounty]) {
          subcountyWardMap[rawsubcounty] = {
            subcountyId: rawsubcounty,
            subcountyName,
            wards: [],
          };
        }

        if (rawward) {
          subcountyWardMap[rawsubcounty].wards.push({
            wardId: rawward,
            wardName,
          });
        }
      }

      return {
        countyId: rawData[0].countyId,
        countyName: rawData[0].countyName,
        subcounties: Object.values(subcountyWardMap),
      };
    } catch (error) {
      this.logger.error(`Error fetching subcounty-ward list: ${error.message}`);
      throw error;
    }
  }

  async getIndicatorDateRange(indicatorId?: string) {
    try {
      const query = `
        SELECT
            khis.raw_dataelement AS "indicatorId",
            mi.com_dataelement_name AS "indicatorName",
            MIN(khis.com_year) AS "minYear",
            MIN(khis.com_month) AS "minMonth",
            MAX(khis.com_year) AS "maxYear",
            MAX(khis.com_month) AS "maxMonth",
            mi.com_category AS "category"
        FROM
          biz_computed_khis_ward_month khis
        JOIN
          biz_master_khis_indicators mi
        ON
          mi.raw_dataelement = khis.raw_dataelement
        WHERE
          ($1 :: text IS NULL OR khis.raw_dataelement = $1)
        AND mi.com_category IS NOT NULL
        GROUP BY
            khis.raw_dataelement,
            mi.com_dataelement_name,
            mi.com_category
        ORDER BY
            mi.com_dataelement_name ASC;`;

      const result = await this.bizComputedKhisWardMonth.query(query, [
        indicatorId,
      ]);

      if (indicatorId?.trim() && result.length === 0) {
        throw new NotFoundException(`Indicator '${indicatorId}' not found`);
      }
      return result;
    } catch (error) {
      this.logger.error(`Error fetching disease date range: ${error.message}`);
      throw error;
    }
  }

  async getKajiadoWardList(filters?: {
    countyId: string;
    subcountyId?: string;
    wardId?: string;
  }) {
    try {
      const { countyId, subcountyId, wardId } = filters || {};

      const result = await this.bizComputedKajiadoWards.query(
        `
      WITH filtered AS (
        SELECT
            geo.raw_geom,
            geo.com_county_id,
            geo.com_subcounty_id,
            geo.com_ward_id,
            c.county_name,
            s.subcounty_name,
            w.ward_name
        FROM biz_computed_kajiado_wards geo
        LEFT JOIN biz_master_counties c
            ON geo.com_county_id = c.county_id
        LEFT JOIN biz_master_subcounties s
            ON geo.com_subcounty_id = s.subcounty_id
        LEFT JOIN biz_master_wards w
            ON geo.com_ward_id = w.ward_id
        WHERE
            ($1::text IS NULL OR geo.com_county_id = $1)
            AND ($2::text IS NULL OR geo.com_subcounty_id = $2)
            AND ($3::text IS NULL OR geo.com_ward_id = $3)
    ),
    geom_with_env AS (
        SELECT
            raw_geom,
            com_county_id,
            com_subcounty_id,
            com_ward_id,
            county_name,
            subcounty_name,
            ward_name,
            ST_Envelope(raw_geom) AS env
        FROM filtered
    ),
    global_bbox AS (
        SELECT
            ST_XMin(ext) AS minX,
            ST_YMin(ext) AS minY,
            ST_XMax(ext) AS maxX,
            ST_YMax(ext) AS maxY
        FROM (
            SELECT ST_Extent(raw_geom) AS ext FROM filtered
        ) AS s
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
                'geometry', ST_AsGeoJSON(raw_geom)::jsonb,
                'properties', jsonb_build_object(
                    'countyId', com_county_id,
                    'countyName', county_name,
                    'subCountyId', com_subcounty_id,
                    'subCountyName', subcounty_name,
                    'wardId', com_ward_id,
                    'wardName', ward_name
                        )
                    )
                ) AS featureList
                FROM geom_with_env
            )
            SELECT jsonb_build_object(
                'type', 'FeatureCollection',
                'bbox', jsonb_build_array(g.minX, g.minY, g.maxX, g.maxY),
                'features', f.featureList
            ) AS geojson
            FROM global_bbox g, features f;
      `,
        [countyId, subcountyId, wardId],
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

  async getKhisIndicatorCountByDateRange(
    filters: IndicatorCountByDateRangeDto,
  ) {
    try {
      const {
        startYear = 2022,
        startMonth = 1,
        endYear = 2025,
        endMonth = 10,
        indicatorId,
      } = filters || {};

      this.logger.log(
        `getKhisIndicatorCountByDateRange called with filters: ${JSON.stringify(filters)}`,
      );

      const query = `
        SELECT
          kw.com_year AS "comYear",
          kw.com_month AS "comMonth",
          kw.com_ward_id AS "wardId",
          SUM(kw.raw_value)::integer AS "totalValue",
          w.ward_name AS "wardName"
        FROM
          biz_computed_khis_ward_month kw
        JOIN
          biz_master_wards w
        ON
          w.ward_id = kw.com_ward_id
        WHERE
          (kw.com_year > $1 OR (kw.com_year = $1 AND kw.com_month >= $2))
          AND (kw.com_year < $4 OR (kw.com_year = $4 AND kw.com_month <= $3))
          AND kw.raw_dataelement = $5
        GROUP BY
          kw.com_year,
          kw.com_month,
          kw.com_ward_id,
          w.ward_name
        ORDER BY
          kw.com_year ASC,
          kw.com_month ASC,
          kw.com_ward_id ASC;
        `;

      const result = await this.bizComputedKhisWardMonth.query(query, [
        startYear,
        startMonth,
        endMonth,
        endYear,
        indicatorId,
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

  async getKhisEachIndicatorTrend(filters: EachIndicatorTrendFilterDtoV1) {
    try {
      const {
        startYear,
        startMonth,
        endYear,
        endMonth,
        wardId,
        subcountyId,
        indicatorId,
      } = filters;

      // Fetch indicator metadata
      const indicatorMetaQuery = `
      SELECT
        raw_dataelement        AS "indicatorId",
        com_dataelement_name   AS "indicatorName",
        com_category   AS "category"
      FROM biz_master_khis_indicators
      ${indicatorId ? 'WHERE raw_dataelement = $1' : ''}
    `;

      const indicators = indicatorId
        ? await this.dataSource.query(indicatorMetaQuery, [indicatorId])
        : await this.dataSource.query(indicatorMetaQuery);

      if (!indicators.length) {
        return [];
      }

      // Trend query (ID-based)
      const trendQuery = `
      WITH month_range AS (
        SELECT generate_series(
          make_date($1::int, $2::int, 1),
          make_date($3::int, $4::int, 1),
          interval '1 month'
        )::date AS month_date
      ),
      filtered AS (
        SELECT
          k.com_year,
          k.com_month,
          k.raw_value
        FROM biz_computed_khis_ward_month k
        WHERE k.raw_dataelement = $5
          AND ($6::text IS NULL OR k.com_ward_id = $6)
          AND ($7::text IS NULL OR k.com_subcounty_id = $7)
      ),
      final AS (
        SELECT
          EXTRACT(YEAR FROM mr.month_date)::int  AS com_year,
          EXTRACT(MONTH FROM mr.month_date)::int AS com_month,
          COALESCE(SUM(f.raw_value), 0)::int     AS total_value
        FROM month_range mr
        LEFT JOIN filtered f
          ON make_date(f.com_year, f.com_month, 1) = mr.month_date
        GROUP BY mr.month_date
      )
      SELECT
        com_year   AS "comYear",
        com_month  AS "comMonth",
        total_value AS "totalValue"
      FROM final
      ORDER BY com_year, com_month;
    `;

      // Execute per indicator
      const results = [];

      for (const indicator of indicators) {
        const params = [
          startYear,
          startMonth,
          endYear,
          endMonth,
          indicator.indicatorId,
          wardId ?? null,
          subcountyId ?? null,
        ];

        const trendData = await this.bizComputedKhisWardMonth.query(
          trendQuery,
          params,
        );

        results.push({
          indicatorId: indicator.indicatorId,
          indicatorName: indicator.indicatorName,
          category: indicator.category,
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
        wardId,
        subcountyId,
        category,
        search,
        page,
        limit,
      } = filters || {};
  
      const paramsBase = [
        startYear,
        startMonth,
        endYear,
        endMonth,
        wardId,
        subcountyId,
      ];
  
      
      const getCategoryQuery = `
        WITH user_input AS (SELECT $1::text AS intent)
        SELECT DISTINCT
          p.raw_broader_category AS category,
          p.raw_priority_level AS "priorityLevel"
        FROM biz_computed_prompts_ward_month p
        CROSS JOIN user_input ui
        WHERE p.com_intent = ui.intent;
      `;
  
    
      const trendQuery = `
        WITH bounds AS (
          SELECT
            COALESCE(
              make_date($1::int, $2::int, 1),
              (
                SELECT MIN(make_date(p.com_year, p.com_month, 1))
                FROM biz_computed_prompts_ward_month p
                WHERE ($5::text IS NULL OR p.com_ward_id = $5::text)
                  AND ($6::text IS NULL OR p.com_subcounty_id = $6::text)
                  AND ($7::text IS NULL OR p.com_intent = $7::text)
              )
            ) AS start_date,
            COALESCE(
              make_date($3::int, $4::int, 1),
              (
                SELECT MAX(make_date(p.com_year, p.com_month, 1))
                FROM biz_computed_prompts_ward_month p
                WHERE ($5::text IS NULL OR p.com_ward_id = $5::text)
                  AND ($6::text IS NULL OR p.com_subcounty_id = $6::text)
                  AND ($7::text IS NULL OR p.com_intent = $7::text)
              )
            ) AS end_date
        ),
        month_series AS (
          SELECT
            EXTRACT(YEAR FROM d)::int  AS com_year,
            EXTRACT(MONTH FROM d)::int AS com_month
          FROM generate_series(
            (SELECT start_date FROM bounds),
            (SELECT end_date FROM bounds),
            interval '1 month'
          ) d
        ),
        agg AS (
          SELECT
            p.com_year,
            p.com_month,
            SUM(p.com_intent_count)::int AS total_value
          FROM biz_computed_prompts_ward_month p
          WHERE p.com_intent = $7::text
            AND ($5::text IS NULL OR p.com_ward_id = $5::text)
            AND ($6::text IS NULL OR p.com_subcounty_id = $6::text)
            AND (
              $1::int IS NULL OR $2::int IS NULL
              OR make_date(p.com_year, p.com_month, 1) >= make_date($1::int, $2::int, 1)
            )
            AND (
              $3::int IS NULL OR $4::int IS NULL
              OR make_date(p.com_year, p.com_month, 1) <= make_date($3::int, $4::int, 1)
            )
          GROUP BY p.com_year, p.com_month
        )
        SELECT
          ms.com_year  AS "comYear",
          ms.com_month AS "comMonth",
          COALESCE(a.total_value, 0) AS "totalValue"
        FROM month_series ms
        LEFT JOIN agg a
          ON a.com_year = ms.com_year
         AND a.com_month = ms.com_month
        ORDER BY ms.com_year, ms.com_month;
      `;
      const whereClauses: string[] = [`raw_broader_category != 'other'`];
      const params: any[] = [];
  
      if (category) {
        params.push(category);
        whereClauses.push(`raw_broader_category = $${params.length}`);
      }
  
      if (search && search.trim()) {
        const tokens = search.trim().split(/\s+/).filter(Boolean);
        const tokenClauses: string[] = [];
  
        for (const token of tokens) {
          const escaped = token.replace(/([%_\\])/g, '\\$1');
          params.push(`${escaped}%`, `% ${escaped}%`);
          const i = params.length;
          tokenClauses.push(
            `(com_intent ILIKE $${i - 1} ESCAPE '\\' OR com_intent ILIKE $${i} ESCAPE '\\')`,
          );
        }
  
        whereClauses.push(`(${tokenClauses.join(' AND ')})`);
      }
  
      const whereSql = whereClauses.length
        ? `WHERE ${whereClauses.join(' AND ')}`
        : '';
  
   
      const countQuery = `
        SELECT COUNT(DISTINCT com_intent) AS total
        FROM biz_computed_prompts_ward_month
        ${whereSql};
      `;
  
      const totalResult = await this.bizComputedPromptsWardMonth.query(
        countQuery,
        params,
      );
      const totalIntents = Number(totalResult?.[0]?.total || 0);
  
    
      const listParams = [...params];
      let listQuery = `
        SELECT DISTINCT com_intent
        FROM biz_computed_prompts_ward_month
        ${whereSql}
        ORDER BY com_intent
      `;
  
      let pageNum = 1;
      let pageLimit = totalIntents || 0;
      let offset = 0;
  
      if (typeof page === 'number' && typeof limit === 'number' && limit > 0) {
        pageNum = Math.max(1, Math.floor(page));
        pageLimit = Math.max(1, Math.floor(limit));
        offset = (pageNum - 1) * pageLimit;
  
        listParams.push(pageLimit, offset);
        listQuery += ` LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`;
      }
  
      const intentRows = await this.bizComputedPromptsWardMonth.query(
        listQuery,
        listParams,
      );
  
      const intents = intentRows.map((r) => r.com_intent);
  
      const results = await Promise.all(
        intents.map(async (intent) => {
          const qParams = [...paramsBase, intent];
  
          const [trendData, categoryData] = await Promise.all([
            this.bizComputedPromptsWardMonth.query(trendQuery, qParams),
            this.bizComputedPromptsWardMonth.query(getCategoryQuery, [intent]),
          ]);
  
          const values = trendData.map((r) => r.totalValue);
          const totalCount = values.reduce((s, v) => s + v, 0);
          const initialValue = values.length ? values[0] : 0;
          const finalValue = values.length ? values[values.length - 1] : 0;
  
          const overallPercentChange =
            initialValue === 0
              ? null
              : Number(
                  (((finalValue - initialValue) / initialValue) * 100).toFixed(2),
                );
  
          return {
            intent,
            category: categoryData[0]?.category || category || null,
            priorityLevel: categoryData[0]?.priorityLevel || null,
            trendData,
            changeData: {
              initialValue,
              finalValue,
              overallPercentChange,
            },
            totalCount,
          };
        }),
      );
  
      if (typeof page === 'number' && typeof limit === 'number' && limit > 0) {
        return {
          data: results,
          meta: {
            total: totalIntents,
            page: pageNum,
            limit: pageLimit,
            totalPages: Math.ceil(totalIntents / pageLimit),
            category: category || null,
            search: search?.trim() || null,
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



async getPromptsEachIntentTrendCsv(
  filters: EachIntentTrendFilterDto,
): Promise<Readable> {
  const result = await this.getPromptsEachIntentTrend(filters);
  const rawData = 'data' in result ? result.data : result;

  const csvStream = fastcsv.format({ headers: false });
  const stream = new PassThrough();


  stream.write('\uFEFF');
  csvStream.pipe(stream);

  const dateSet = new Set<string>();

  const formatMonthYear = (year: number, month: number) =>
    new Date(year, month - 1).toLocaleString('en-US', {
      month: 'short',
      year: 'numeric',
    });

  rawData.forEach(row => {
    row.trendData?.forEach(trend => {
      const key = `${trend.comYear}-${trend.comMonth
        .toString()
        .padStart(2, '0')}`;
      dateSet.add(key);
    });
  });

  const sortedKeys = Array.from(dateSet).sort((a, b) => {
    const [ay, am] = a.split('-').map(Number);
    const [by, bm] = b.split('-').map(Number);
    return ay !== by ? ay - by : am - bm;
  });


  const dateLabels = sortedKeys.map(k => {
    const [y, m] = k.split('-').map(Number);
    return formatMonthYear(y, m);
  });

 
  csvStream.write([
    'Intent',
    'Category',
    'Priority',
    ...dateLabels,
    'TotalCount',
  ]);

  rawData.forEach(row => {
    const dateMap: Record<string, number> = {};

    row.trendData?.forEach(trend => {
      const key = `${trend.comYear}-${trend.comMonth
        .toString()
        .padStart(2, '0')}`;
      dateMap[key] = trend.totalValue;
    });

    csvStream.write([
      row.intent,
      row.category,
      row.priorityLevel,
      ...sortedKeys.map(k => dateMap[k] ?? 0),
      row.totalCount,
    ]);
  });

  csvStream.end();
  return stream;
}




async getKhisEachIndicatorTrendCsv(
  filters: any,
): Promise<Readable> {
  const result = await this.getKhisEachIndicatorTrend(filters) as any;
  const rawData = 'data' in result ? result.data : result;

  const csvStream = fastcsv.format({ headers: false });
  const stream = new PassThrough();

  
  stream.write('\uFEFF');
  csvStream.pipe(stream);

  const dateSet = new Set<string>();

  
  const formatMonthYear = (year: number, month: number) =>
    new Date(year, month - 1).toLocaleString('en-US', {
      month: 'short',
      year: 'numeric',
    });

  rawData.forEach(row => {
    row.trendData?.forEach(trend => {
      const key = `${trend.comYear}-${trend.comMonth
        .toString()
        .padStart(2, '0')}`;
      dateSet.add(key);
    });
  });

  const sortedKeys = Array.from(dateSet).sort((a, b) => {
    const [ay, am] = a.split('-').map(Number);
    const [by, bm] = b.split('-').map(Number);
    return ay !== by ? ay - by : am - bm;
  });


  const dateLabels = sortedKeys.map(k => {
    const [y, m] = k.split('-').map(Number);
    return formatMonthYear(y, m);
  });

  csvStream.write([
    'IndicatorName',
    'Category',
    ...dateLabels,
    'TotalCount',
  ]);

  
  rawData.forEach(row => {
    const dateMap: Record<string, number> = {};
    let totalCount = 0;

    row.trendData?.forEach(trend => {
      const key = `${trend.comYear}-${trend.comMonth
        .toString()
        .padStart(2, '0')}`;
      dateMap[key] = trend.totalValue;
      totalCount += trend.totalValue;
    });

    csvStream.write([
      row.indicatorName,
      row.category ?? '',
      ...sortedKeys.map(k => dateMap[k] ?? 0),
      totalCount,
    ]);
  });

  csvStream.end();
  return stream;
  }
  
  async getKajiadoFacilities(filters: KajiadoFacilitiesFilterDto) {
    try {
      const { countyId, subCountyId, wardId } = filters || {};
      if( !countyId && !subCountyId && !wardId){
        throw new BadRequestException('Filters countyId, subCountyId and wardId are missing');
      }
      const queryFacilities = `
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(
          jsonb_build_object(
              'type', 'Feature',
              'geometry', jsonb_build_object(
                  'type', 'Point',
                  'coordinates', jsonb_build_array(raw_longitude, raw_latitude)
              ),
              'properties', jsonb_build_object(
                  'healthFacilityName', raw_official_health_facility_name,
                  'facilityType', raw_facility_type,
                  'latitude', raw_latitude,
                  'longitude', raw_longitude,
                  'noOfBeds', raw_no_of_beds,
                  'noOfCots', raw_no_of_cots
              )
          )
        )
        ) AS geojson
        FROM (
          SELECT raw_longitude, raw_latitude,
                raw_official_health_facility_name, raw_facility_type,
                raw_no_of_beds, raw_no_of_cots
          FROM biz_computed_kajiado_master_health_facilities
          WHERE ($1::text IS NULL OR com_county_id = $1)
            AND ($2::text IS NULL OR com_subcounty_id = $2)
            AND ($3::text IS NULL OR com_ward_id = $3)
            AND raw_operation_status = 'Operational'
      ) AS biz;
      `;
      const result = await this.bizComputedKajiadoMasterHealthFacilities.query(
        queryFacilities,
        [countyId, subCountyId, wardId,]
      );

      const geojson = result?.[0]?.geojson;
      if (!geojson || !geojson.features || geojson.features.length === 0) {
        throw new NotFoundException(
          'No facility data found for the given filters',
        );
      }
      return geojson;
    } catch (error) {
      this.logger.error(`Error fetching Kajiado facilities: ${error.message}`);
      throw error;
    }
  }

}