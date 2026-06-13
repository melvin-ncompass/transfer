import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EachIntentTrendFilterDto, PromptsFilterDto, PromptsIntentPriorityFrequencyDto, PromptsIntentRelativeIntensityDto, PromptsRiskDto, WARD_MAP } from '../dto/visualization.dto';
import { BizAggregatedCopernicusEra5HistoricalWardMonthly } from '../entity/biz_aggregated_copernicus_era5_historical_ward_monthly.entity';
import { BizComputedKajiadoClimateProjections } from '../entity/biz_computed_kajiado_climate_projects.entity';
import { BizComputedKajiadoMasterHealthFacilities } from '../entity/biz_computed_kajiado_master_health_facilities.entity';
import { BizComputedKajiadoPopulation } from '../entity/biz_computed_kajiado_population.entity';
import { BizComputedKajiadoWards } from '../entity/biz_computed_kajiado_wards.entity';
import { BizComputedKhisWardMonth } from '../entity/biz_computed_khis_ward_month.entity';
import { BizComputedPromptsWardMonth } from '../entity/biz_computed_prompts_ward_month.entity';

@Injectable()
export class PromptsService {
  private readonly logger = new Logger(PromptsService.name);

  constructor(
    @InjectRepository(BizAggregatedCopernicusEra5HistoricalWardMonthly)
        private readonly bizAggregatedCopernicusEra5WardMonthV2: Repository<BizAggregatedCopernicusEra5HistoricalWardMonthly>,
        @InjectRepository(BizComputedKhisWardMonth)
        private readonly bizComputedKhisWardMonth: Repository<BizComputedKhisWardMonth>,
        @InjectRepository(BizComputedPromptsWardMonth)
        private readonly bizComputedPromptsWardMonth: Repository<BizComputedPromptsWardMonth>,
        @InjectRepository(BizComputedKajiadoMasterHealthFacilities)
        private readonly bizComputedKajiadoMasterHealthFacilities: Repository<BizComputedKajiadoMasterHealthFacilities>,
        @InjectRepository(BizComputedKajiadoWards)
        private readonly bizComputedKajiadoWards: Repository<BizComputedKajiadoWards>,
        @InjectRepository(BizComputedKajiadoPopulation)
        private readonly bizRawKajiadoPopulation: Repository<BizComputedKajiadoPopulation>,
        @InjectRepository(BizComputedKajiadoClimateProjections)
        private readonly bizComputedKajiadoClimateProjections: Repository<BizComputedKajiadoClimateProjections>,
  ) { }

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
  

  async getRiskTreeMap(option?: PromptsRiskDto) {
    try {
      const query = `
          SELECT 
            category AS category, 
            priority_level AS "priorityLevel", 
            intent AS intent, 
            sum(intent_count)::integer AS "intentCount" 
          FROM (SELECT
            make_date(com_year::int,com_month::int,1) AS month_date,
            com_intent AS intent,
            com_intent_count AS intent_count,
            raw_broader_category AS category,
            raw_priority_level AS priority_level,
            com_year,
            com_month
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

  


  async getPromptsIntentRelativeIntensity(
    filters: PromptsIntentRelativeIntensityDto,
  ) {
    try {
      const { startYear, startMonth, endYear, endMonth, subcountyId, wardId } =
        filters || {};

      
      const query = `
          WITH climate_monthly AS (
            SELECT
              com_year,
              com_month,
              AVG(com_max_zonal_stat_mean_t2m - 273.15) AS county_temp_celsius
            FROM biz_aggregated_copernicus_era5_historical_ward_monthly
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
              AND ($5::text IS NULL OR com_subcounty_id= $5)
              AND ($6::text IS NULL OR com_ward_id = $6)
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
        subcountyId,
        wardId,
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
        subcountyId,
        wardId,
        category,
      } = filters || {};

      

      const query = `
        WITH climate_monthly AS (
			  SELECT
			    com_year,
			    com_month,
			    AVG(com_max_zonal_stat_mean_t2m - 273.15) AS county_temp_celsius
			  FROM biz_aggregated_copernicus_era5_historical_ward_monthly
			  WHERE
			    (2022::int IS NULL OR 1::int IS NULL
			      OR com_year > 2022
			      OR (com_year = 2022 AND com_month >= 1))
			    AND
			    (2025::int IS NULL OR 9::int IS NULL
			      OR com_year < 2025
			      OR (com_year = 2025 AND com_month <= 9))
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
              WHERE
                (
                (2022::int IS NULL OR 1::int IS NULL OR p.com_year > 2022 OR (p.com_year = 2022 AND p.com_month >= 1))
                AND (2025::int IS NULL OR 9::int IS NULL OR p.com_year < 2025 OR (p.com_year = 2025 AND p.com_month <= 9))
                )
                AND (null::text IS NULL OR p.com_subcounty_id = null)
                AND (null::text IS NULL OR p.com_ward_id = null)
                AND ($1::text IS NULL OR LOWER(p.raw_broader_category) = LOWER( $1))
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

      const result = await this.bizComputedPromptsWardMonth.query(query,[category ?? null]);

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


}
