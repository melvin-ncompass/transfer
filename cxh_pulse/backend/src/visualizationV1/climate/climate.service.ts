import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CopernicusPredictionDto, PromptsFilterDto } from '../dto/visualization.dto';
import { BizAggregatedCopernicusEra5HistoricalWardMonthly } from '../entity/biz_aggregated_copernicus_era5_historical_ward_monthly.entity';
import { BizComputedKajiadoClimateProjections } from '../entity/biz_computed_kajiado_climate_projects.entity';
import { BizComputedKajiadoMasterHealthFacilities } from '../entity/biz_computed_kajiado_master_health_facilities.entity';
import { BizComputedKajiadoPopulation } from '../entity/biz_computed_kajiado_population.entity';
import { BizComputedKajiadoWards } from '../entity/biz_computed_kajiado_wards.entity';
import { BizComputedKhisWardMonth } from '../entity/biz_computed_khis_ward_month.entity';
import { BizComputedPromptsWardMonth } from '../entity/biz_computed_prompts_ward_month.entity';

@Injectable()
export class ClimateService {
  private readonly logger = new Logger(ClimateService.name);

  constructor(
    @InjectRepository(BizAggregatedCopernicusEra5HistoricalWardMonthly)
    private readonly bizAggregatedCopernicusEra5HistoricalWardmonthly: Repository<BizAggregatedCopernicusEra5HistoricalWardMonthly>,
  ) { }
  async getMonthlyTemperature(filters?: PromptsFilterDto) {
    try {
      const { startYear, startMonth, endYear, endMonth, subcountyId, wardId, countyId } =
        filters || {};

      // const mappedWard = ward ? WARD_MAP[ward] || ward : ward;

      const query = `
            SELECT
                monthDate,
                AVG(temperature) AS temperature
            FROM (
                  SELECT
                      DATE_TRUNC('month', make_date(com_year, com_month, 1)) AS monthDate,
                      com_max_zonal_stat_mean_t2m - 273.15 AS temperature
                  FROM public.biz_aggregated_copernicus_era5_historical_ward_monthly
                  WHERE
                      ($1::int IS NULL OR $2::int IS NULL
                    OR (com_year, com_month) >= ($1, $2))
                    AND
                        ($3::int IS NULL 
                        OR $4::int IS NULL
                        OR (com_year, com_month) <= ($3, $4))
                    AND (
                        ($5::text IS NOT NULL AND com_ward_id = $5)
                        OR ($5::text IS NULL AND $6::text IS NOT NULL AND com_subcounty_id = $6)
                        OR ($5::text IS NULL AND $6::text IS NULL AND com_county_id = $7)
                  )
            ) AS t
            GROUP BY monthDate
            ORDER BY monthDate ASC`;

      const result = await this.bizAggregatedCopernicusEra5HistoricalWardmonthly.query(
        query,
        [startYear, startMonth, endYear, endMonth, wardId, subcountyId, countyId],
      );

      return result;
    } catch (error) {
      this.logger.error(`Error fetching monthly temperature: ${error.message}`);
      throw error;
    }
  }

  async getMonthlyRainfall(filters?: PromptsFilterDto) {
    try {
      const { startYear, startMonth, endYear, endMonth, wardId, subcountyId, countyId } =
        filters || {};

      // const mappedWard = ward ? WARD_MAP[ward] || ward : ward;
      // const countyId= from enpoint param || 'Hsk1YV8kHkT'
      const query = `
                    SELECT
                          monthDate,
                          AVG(precipitation) AS precipitation
                    FROM (
                          SELECT
                                DATE_TRUNC('month', make_date(com_year, com_month, 1)) AS monthDate,
                                com_sum_zonal_stat_sum_tp*1000 AS precipitation
                          FROM public.biz_aggregated_copernicus_era5_historical_ward_monthly
                          WHERE
                              ($1::int IS NULL OR $2::int IS NULL
                                OR (com_year, com_month) >= ($1, $2))
                              AND
                                ($3::int IS NULL OR $4::int IS NULL
                                OR (com_year, com_month) <= ($3, $4))
                              AND (
                                ($5::text IS NOT NULL AND com_ward_id = $5)
                                OR ($5::text IS NULL AND $6::text IS NOT NULL AND com_subcounty_id = $6)
                                OR ($5::text IS NULL AND $6::text IS NULL AND com_county_id = $7)
                              )
                      ) AS t
                    GROUP BY monthDate
                    ORDER BY monthDate ASC;
                  `;

      const result = await this.bizAggregatedCopernicusEra5HistoricalWardmonthly.query(
        query,
        [startYear, startMonth, endYear, endMonth, wardId, subcountyId, countyId],
      );

      return result;
    } catch (error) {
      this.logger.error(`Error fetching monthly rainfall: ${error.message}`);
      throw error;
    }
  }
  

  

}
