import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CopernicusPredictionDto,
  KhisPredictionDto,
} from '../dto/visualization.dto';
import { BizAggregatedCopernicusEra5HistoricalWardMonthly } from '../entity/biz_aggregated_copernicus_era5_historical_ward_monthly.entity';
import { BizComputedKajiadoClimateProjections } from '../entity/biz_computed_kajiado_climate_projects.entity';
import { BizComputedKajiadoMasterHealthFacilities } from '../entity/biz_computed_kajiado_master_health_facilities.entity';
import { BizComputedKajiadoPopulation } from '../entity/biz_computed_kajiado_population.entity';
import { BizComputedKajiadoWards } from '../entity/biz_computed_kajiado_wards.entity';
import { BizComputedKhisWardMonth } from '../entity/biz_computed_khis_ward_month.entity';
import { BizComputedPromptsWardMonth } from '../entity/biz_computed_prompts_ward_month.entity';
import { BizComputedKhisIndicatorRate } from '../entity/biz_computed_khis_indicator_rate_ward_monthly.entity';
import { BizComputedKhisIndicatorSubCountyRateMonthly } from '../entity/biz_computed_khis_indicator_rate_subcounty_monthly.entity';
import { BizComputedKhisIndicatorRateMonthly } from '../entity/biz_computed_khis_indicator_rate_county_monthly.entity';
import { BizAggregatedCopernicusEra5ProjectedCountyMonthly } from '../entity/biz_aggregated_copernicus_era5_projected_county_monthly.entity';
import { BizAggregatedCopernicusEra5ProjectedSubCountyMonthly } from '../entity/biz_aggregated_copernicus_era5_projected_subcounty_monthly.entity';
import { BizAggregatedCopernicusEra5ProjectedWardMonthly } from '../entity/biz_aggregated_copernicus_era5_projected_ward_monthly.entity';

@Injectable()
export class ForecastService {
  private readonly logger = new Logger(ForecastService.name);

  constructor(
    @InjectRepository(BizAggregatedCopernicusEra5HistoricalWardMonthly)
    private readonly bizAggregatedCopernicusEra5HistoricalWardmonthly: Repository<BizAggregatedCopernicusEra5HistoricalWardMonthly>,
    @InjectRepository(BizAggregatedCopernicusEra5ProjectedCountyMonthly)
    private readonly bizAggregatedCopernicusEra5ProjectedCountyMonthly: Repository<BizAggregatedCopernicusEra5ProjectedCountyMonthly>,
    @InjectRepository(BizAggregatedCopernicusEra5ProjectedSubCountyMonthly)
    private readonly bizAggregatedCopernicusEra5ProjectedSubCountyMonthly: Repository<BizAggregatedCopernicusEra5ProjectedSubCountyMonthly>,
    @InjectRepository(BizAggregatedCopernicusEra5ProjectedWardMonthly)
    private readonly bizAggregatedCopernicusEra5ProjectedWardMonthly: Repository<BizAggregatedCopernicusEra5ProjectedWardMonthly>,
    @InjectRepository(BizComputedKhisWardMonth)
    private readonly bizComputedKhisWardMonth: Repository<BizComputedKhisWardMonth>,
    @InjectRepository(BizComputedKajiadoClimateProjections)
    private readonly bizComputedKajiadoClimateProjections: Repository<BizComputedKajiadoClimateProjections>,
    @InjectRepository(BizComputedKhisIndicatorRate)
    private readonly bizComputedKhisIndicatorWardRate: Repository<BizComputedKhisIndicatorRate>,
    @InjectRepository(BizComputedKhisIndicatorSubCountyRateMonthly)
    private readonly bizComputedKhisIndicatorSubCountyRateMonthly: Repository<BizComputedKhisIndicatorSubCountyRateMonthly>,
    @InjectRepository(BizComputedKhisIndicatorRateMonthly)
    private readonly bizComputedKhisIndicatorCountyRateMonthly: Repository<BizComputedKhisIndicatorRateMonthly>
  ) {}

  async getKhisPrediction(filters: KhisPredictionDto) {
    try {
      const { indicatorId, countyId, subCountyId, wardId } = filters || {};

      let query;
      let result;
      if (wardId && subCountyId && countyId) { 
        query = `
          SELECT
              DATE_TRUNC('month', MAKE_DATE(ki.com_year, ki.com_month, 1)) AS "monthDate",
              CASE
                WHEN ki.raw_value < 0 THEN ki.raw_ci_high - ki.raw_value 
                ELSE ki.raw_ci_high
              END AS "rawCiHigh",
              CASE
                  WHEN ki.raw_value < 0 THEN ki.raw_ci_low - ki.raw_value
                  ELSE ki.raw_ci_low
              END AS "rawCiLow",
              CASE
                  WHEN ki.raw_value < 0 THEN 0
                  ELSE ki.raw_value
              END AS "rawValue",
              ki.raw_type AS "rawType"
          FROM biz_computed_khis_indicator_rate_ward_monthly ki
          JOIN biz_master_khis_computed_indicators kci
          ON kci.raw_dataelement_name = ki.com_dataelement
          WHERE kci.com_dataelement = $1 :: text
            AND ( $2::text IS NULL OR ki.com_ward_id = $2)
            AND ki.com_year >= 2022
          ORDER BY ki.com_year, ki.com_month;`;
        result = await this.bizComputedKhisIndicatorWardRate.query(query, [
        indicatorId,
        wardId,
      ]);
      } else if (subCountyId && countyId) {
        query =`
          SELECT
            DATE_TRUNC('month', MAKE_DATE(ki.com_year, ki.com_month, 1)) AS "monthDate",

            CASE
                WHEN ki.raw_value < 0 THEN ki.raw_ci_high - ki.raw_value 
                ELSE ki.raw_ci_high
            END AS "rawCiHigh",
            CASE
                WHEN ki.raw_value < 0 THEN ki.raw_ci_low - ki.raw_value
                ELSE ki.raw_ci_low
            END AS "rawCiLow",
            CASE
                WHEN ki.raw_value < 0 THEN 0
                ELSE ki.raw_value
            END AS "rawValue",
            ki.raw_type AS "rawType"
          FROM biz_computed_khis_indicator_rate_subcounty_monthly ki
          JOIN biz_master_khis_computed_indicators kci
              ON kci.raw_dataelement_name = ki.com_dataelement
          WHERE kci.com_dataelement = $1::text
            AND ($2::text IS NULL OR ki.com_subcounty_id = $2)
            AND ki.com_year >= 2022
          ORDER BY ki.com_year, ki.com_month;`
        result = await this.bizComputedKhisIndicatorSubCountyRateMonthly.query(query, [
        indicatorId,
        subCountyId,
      ]);
      }
      else if (countyId) {
        query =`
          SELECT
              DATE_TRUNC('month', MAKE_DATE(ki.com_year, ki.com_month, 1)) AS "monthDate",
              CASE
                WHEN ki.raw_value < 0 THEN ki.raw_ci_high - ki.raw_value 
                ELSE ki.raw_ci_high
              END AS "rawCiHigh",
              CASE
                  WHEN ki.raw_value < 0 THEN ki.raw_ci_low - ki.raw_value
                  ELSE ki.raw_ci_low
              END AS "rawCiLow", 
              CASE
                  WHEN ki.raw_value < 0 THEN 0
                  ELSE ki.raw_value
              END AS "rawValue",
              ki.raw_type AS "rawType"
          FROM biz_computed_khis_indicator_rate_county_monthly ki
          JOIN biz_master_khis_computed_indicators kci
          ON kci.raw_dataelement_name = ki.com_dataelement
          WHERE kci.com_dataelement = $1 :: text
            AND ( $2::text IS NULL OR ki.com_county_id = $2)
            AND ki.com_year >= 2022
          ORDER BY ki.com_year, ki.com_month;`
        result = await this.bizComputedKhisIndicatorCountyRateMonthly.query(query, [
        indicatorId,
        countyId,
      ]);
      }

      if (result) {
        this.logger.log(`Fetched ${result.length} records for KHIS prediction`);
      } else {
        this.logger.warn('No records fetched because result is undefined');
      }

      return result;
    } catch (error) {
      this.logger.error(`Error fetching KHIS prediction: ${error.message}`);
      throw error;
    }
  }

  async getCopernicusPrediction(filters: CopernicusPredictionDto) {
    try {
      const { countyId, subCountyId, wardId } = filters || {};

      const queryHistorical = `
        SELECT
            ROUND(AVG(com_max_zonal_stat_mean_t2m - 273.15)::numeric, 2)::float AS "temperature",
            ROUND((AVG(com_sum_zonal_stat_sum_tp) * 1000)::numeric, 2)::float AS "precipitation",
            com_year AS "comYear",
            com_month AS "comMonth",
            'historical' AS "rawType"
        FROM
            biz_aggregated_copernicus_era5_historical_ward_monthly
        WHERE
            ($1::text IS NULL OR com_county_id = $1)       
            AND ($2::text IS NULL OR com_subcounty_id = $2) 
            AND ($3::text IS NULL OR com_ward_id = $3)     
            AND com_year >= 2022
        GROUP BY
            com_year, com_month
        ORDER BY
            com_year, com_month;
      `;

      let queryProjected;
      let resultProjected = [];
      if (wardId && subCountyId && countyId) {
        queryProjected = `
        SELECT
            ROUND(AVG(com_mean_tmax - 273.15)::numeric, 2)::float AS "temperature",
            ROUND(SUM(com_sum_tp *86400)::numeric, 2)::float AS "precipitation",
            com_year as "comYear",
            com_month as "comMonth",
            'projected' as "rawType"
        FROM
          biz_aggregated_copernicus_era5_projected_ward_monthly
        WHERE
          ($1::text IS NULL OR com_ward_id = $1)
        GROUP BY
          com_year,com_month
        ORDER BY
          com_year,com_month;`
        resultProjected =
        await this.bizAggregatedCopernicusEra5ProjectedWardMonthly.query(queryProjected, [
          wardId,
        ]);
      } else if (subCountyId && countyId) {
        queryProjected =
          `SELECT
            ROUND(AVG(com_mean_tmax - 273.15)::numeric, 2)::float AS "temperature",
            ROUND(SUM(com_sum_tp *86400)::numeric, 2)::float AS "precipitation",
            com_year as "comYear",
            com_month as "comMonth",
            'projected' as "rawType"
        FROM
          biz_aggregated_copernicus_era5_projected_subcounty_monthly
        WHERE
          ($1::text IS NULL OR com_subcounty_id = $1)
        GROUP BY
          com_year,com_month
        ORDER BY
          com_year,com_month;`
        resultProjected =
        await this.bizAggregatedCopernicusEra5ProjectedSubCountyMonthly.query(queryProjected, [
          subCountyId
        ]);
      } else if (countyId) {
        queryProjected = `
        SELECT
            ROUND(AVG(com_mean_tmax - 273.15)::numeric, 2)::float AS "temperature",
            ROUND(SUM(com_sum_tp *86400)::numeric, 2)::float AS "precipitation",
            com_year as "comYear",
            com_month as "comMonth",
            'projected' as "rawType"
        FROM
          biz_aggregated_copernicus_era5_projected_county_monthly
        WHERE
          ($1::text IS NULL OR com_county_id = $1)
        GROUP BY
          com_year,com_month
        ORDER BY
          com_year,com_month;`
        resultProjected =
        await this.bizAggregatedCopernicusEra5ProjectedCountyMonthly.query(queryProjected, [
          countyId,
        ]);
  }

      const resultHistorical =
        await this.bizAggregatedCopernicusEra5HistoricalWardmonthly.query(
          queryHistorical,
          [countyId, subCountyId, wardId],
      );

      const result = [...resultHistorical, ...resultProjected];
      if (result) {
        this.logger.log(`Fetched ${result.length} records for KHIS prediction`);
      } else {
        this.logger.warn('No records fetched because result is undefined');
      }

      return result;
    } catch (error) {
      this.logger.error(`Error fetching Copernicus prediction: ${error.message}`);
      throw error;
    }
  }

  async getPredictionIndicators() {
    try {
      const query = `
        SELECT DISTINCT
          com_dataelement AS "indicatorId",
          com_dataelement_name AS "indicatorName",
          com_x_axis_title AS "label",
          primary_indicator::boolean AS "primaryIndicator"
        FROM biz_master_khis_computed_indicators
        ORDER BY com_dataelement_name
      `;
      const result = await this.bizComputedKhisWardMonth.query(query);

      this.logger.log(`Fetched ${result.length} prediction indicators`);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching KHIS prediction: ${error.message}`);
      throw error;
    }
  }
}
