import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BizComputedCopernicusEra5 } from '../visualizationV1/entity/biz_computed_copernicus_era5.entity';
import { BizAggregatedCopernicusEra5WardMonth } from '../visualizationV1/entity/biz_aggregated_copernicus_era5_ward_month.entity';
import { BizComputedKhisWardMonth } from '../visualizationV1/entity/biz_computed_khis_ward_month.entity';
import { BizComputedPromptsWardMonth } from '../visualizationV1/entity/biz_computed_prompts_ward_month.entity';
import { BizComputedKajiadoWards } from '../visualizationV1/entity/biz_computed_kajiado_wards.entity';
import { BizComputedKajiadoMasterHealthFacilities } from '../visualizationV1/entity/biz_computed_kajiado_master_health_facilities.entity';
import { BizComputedKhisWardMonthV2 } from 'src/visualizationV1/entity/biz_computed_khis_ward_month_v2.entity';
import { BizAggregatedCopernicusEra5WardMonthV2 } from 'src/visualizationV1/entity/biz_aggregated_copernicus_era5_ward_month_v2.entity';

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

// const defaultIndicators = {
//   Mother: [
//     'MOH 711 ANC Client given folic',
//     'MOH 711 ANC Client given Iron',
//     'MOH 711 APH (Ante partum Haemorrage)',
//     'MOH 711 Birth with diformities',
//     'MOH 711 Eclampsia',
//     'MOH 711 PPH (Post Partum Haemorrage)',
//   ],
//   Baby: [
//     'MOH 711 Fresh Still Birth',
//     'MOH 711 Live birth',
//     'MOH 711 Low Birth Weight <2500gms',
//     'MOH 711 MUAC 6 - 59 months Moderate (Yellow)',
//     'MOH 711 MUAC 6 - 59 months Normal (Green)',
//     'MOH 711 MUAC 6 - 59 months Severe (Red)',
//     'MOH 711 Neonatal deaths 0-28 Days',
//   ],
//   Other: ['IDSR Malaria Cases', 'IDSR Malaria Deaths'],
// };

@Injectable()
export class VisualizationService {
  private readonly logger = new Logger(VisualizationService.name);

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
  ) {}

  async getAllCopernicusData(limit?: number, offset?: number) {
    this.logger.log(
      `getAllCopernicusData called with limit: ${limit}, offset: ${offset}`,
    );

    try {
      const queryBuilder = this.bizComputedCopernicusEra5
        .createQueryBuilder('copernicus')
        .orderBy('copernicus.created_at', 'DESC');

      if (limit) {
        queryBuilder.take(limit);
      }

      if (offset) {
        queryBuilder.skip(offset);
      }

      const [data, total] = await queryBuilder.getManyAndCount();

      this.logger.log(`Fetched ${data.length} records out of ${total} total`);

      return {
        data,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error(`Error in getAllCopernicusData: ${error.message}`);
      throw error;
    }
  }

  async getCopernicusDataById(id: number) {
    this.logger.log(`getCopernicusDataById called with ID: ${id}`);

    try {
      const data = await this.bizComputedCopernicusEra5.findOne({
        where: { id },
      });

      if (!data) {
        this.logger.warn(`Copernicus data not found with ID: ${id}`);
        return null;
      }

      this.logger.log(`Copernicus data found with ID: ${id}`);
      return data;
    } catch (error) {
      this.logger.error(`Error in getCopernicusDataById: ${error.message}`);
      throw error;
    }
  }

  // async getCopernicusDataByDateRange(startDate: Date, endDate: Date) {
  //   this.logger.log(
  //     `getCopernicusDataByDateRange called with range: ${startDate} to ${endDate}`,
  //   );

  //   try {
  //     const data = await this.copernicusRepo
  //       .createQueryBuilder('copernicus')
  //       .where('copernicus.raw_valid_time BETWEEN :startDate AND :endDate', {
  //         startDate,
  //         endDate,
  //       })
  //       .orderBy('copernicus.raw_valid_time', 'ASC')
  //       .getMany();

  //     this.logger.log(`Fetched ${data.length} records for date range`);
  //     return data;
  //   } catch (error) {
  //     this.logger.error(
  //       `Error in getCopernicusDataByDateRange: ${error.message}`,
  //     );
  //     throw error;
  //   }
  // }

  async getCopernicusDataByDateRange(startDate: Date, endDate: Date) {
    this.logger.log(
      `getCopernicusDataByDateRange called with range: ${startDate} to ${endDate}`,
    );

    try {
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth() + 1;
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth() + 1;

      const data = await this.bizAggregatedCopernicusEra5WardMonth
        .createQueryBuilder('era5')
        .where(
          '(era5.comYear > :startYear OR (era5.comYear = :startYear AND era5.comMonth >= :startMonth))',
          { startYear, startMonth },
        )
        .andWhere(
          '(era5.comYear < :endYear OR (era5.comYear = :endYear AND era5.comMonth <= :endMonth))',
          { endYear, endMonth },
        )
        .orderBy('era5.comYear', 'ASC')
        .addOrderBy('era5.comMonth', 'ASC')
        .getMany();

      this.logger.log(`Fetched ${data.length} records for date range`);
      return data;
    } catch (error) {
      this.logger.error(
        `Error in getCopernicusDataByDateRange: ${error.message}`,
      );
      throw error;
    }
  }

  async getCopernicusDataByLocation(
    latitude: number,
    longitude: number,
    tolerance: number = 0.1,
  ) {
    this.logger.log(
      `getCopernicusDataByLocation called with lat: ${latitude}, lon: ${longitude}, tolerance: ${tolerance}`,
    );

    try {
      const data = await this.bizComputedCopernicusEra5
        .createQueryBuilder('copernicus')
        .where('copernicus.raw_latitude BETWEEN :latMin AND :latMax', {
          latMin: latitude - tolerance,
          latMax: latitude + tolerance,
        })
        .andWhere('copernicus.raw_longitude BETWEEN :lonMin AND :lonMax', {
          lonMin: longitude - tolerance,
          lonMax: longitude + tolerance,
        })
        .orderBy('copernicus.raw_valid_time', 'DESC')
        .getMany();

      this.logger.log(`Fetched ${data.length} records for location`);
      return data;
    } catch (error) {
      this.logger.error(
        `Error in getCopernicusDataByLocation: ${error.message}`,
      );
      throw error;
    }
  }

  async getDataStatistics() {
    this.logger.log('getDataStatistics called');

    try {
      const totalRecords = await this.bizComputedCopernicusEra5.count();

      const stats = await this.bizComputedCopernicusEra5
        .createQueryBuilder('copernicus')
        .select('MIN(copernicus.raw_valid_time)', 'earliest_date')
        .addSelect('MAX(copernicus.raw_valid_time)', 'latest_date')
        .addSelect('MIN(copernicus.raw_latitude)', 'min_latitude')
        .addSelect('MAX(copernicus.raw_latitude)', 'max_latitude')
        .addSelect('MIN(copernicus.raw_longitude)', 'min_longitude')
        .addSelect('MAX(copernicus.raw_longitude)', 'max_longitude')
        .addSelect('AVG(copernicus.raw_t2m)', 'avg_temperature')
        .addSelect('AVG(copernicus.raw_d2m)', 'avg_dewpoint')
        .addSelect('AVG(copernicus.raw_tp)', 'avg_precipitation')
        .getRawOne();

      this.logger.log('Statistics fetched successfully');

      return {
        totalRecords,
        ...stats,
      };
    } catch (error) {
      this.logger.error(`Error in getDataStatistics: ${error.message}`);
      throw error;
    }
  }

  async getDataByRoundedHour(inputTime: Date) {
    this.logger.log(
      `getDataByRoundedHour called with input time: ${inputTime}`,
    );

    try {
      // Round the time to the nearest hour
      const roundedTime = new Date(inputTime);
      roundedTime.setMinutes(0, 0, 0); // Set minutes, seconds, and milliseconds to 0

      this.logger.log(`Time rounded to: ${roundedTime.toISOString()}`);

      // Query data for the specific hour
      const data = await this.bizComputedCopernicusEra5
        .createQueryBuilder('copernicus')
        .where("DATE_TRUNC('hour', copernicus.raw_valid_time) = :roundedTime", {
          roundedTime,
        })
        .orderBy('copernicus.raw_latitude', 'ASC')
        .addOrderBy('copernicus.raw_longitude', 'ASC')
        .getMany();

      this.logger.log(
        `Fetched ${data.length} records for hour: ${roundedTime.toISOString()}`,
      );

      return {
        requestedTime: inputTime,
        roundedTime: roundedTime,
        totalRecords: data.length,
        data: data,
      };
    } catch (error) {
      this.logger.error(`Error in getDataByRoundedHour: ${error.message}`);
      throw error;
    }
  }

  async getAllDkKhisData(limit?: number, offset?: number) {
    this.logger.log(
      `getAllDkKhisData called with limit: ${limit}, offset: ${offset}`,
    );

    try {
      const queryBuilder = this.bizComputedKhisWardMonthV2
        .createQueryBuilder('dkkis')
        .addSelect('ST_AsGeoJSON(dkkis.com_geom)', 'geojson')
        .where('dkkis.com_geom IS NOT NULL');

      if (limit) queryBuilder.take(limit);
      if (offset) queryBuilder.skip(offset);

      const result = await queryBuilder.getRawAndEntities();
      const rawData = result.raw;
      const entities = result.entities;

      // Get total count separately
      const total = await this.bizComputedKhisWardMonthV2
        .createQueryBuilder('dkkis')
        .where('dkkis.com_geom IS NOT NULL')
        .getCount();

      const data = rawData
        .map((raw, index) => {
          let geometry = null;
          try {
            geometry = JSON.parse(raw.geojson);
          } catch (e) {
            this.logger.warn(
              `Failed to parse geojson for KHIS record: ${e.message}`,
            );
            return null;
          }

          return {
            ...entities[index],
            computed_geojson: geometry,
          };
        })
        .filter((r) => r !== null);

      // Extract unique location values
      const countySet = new Set<string>();
      const subcountySet = new Set<string>();
      const wardSet = new Set<string>();

      for (const row of data) {
        if (row.rawCounty) countySet.add(row.rawCounty);
        if (row.rawSubcounty) subcountySet.add(row.rawSubcounty);
        if (row.rawWard) wardSet.add(row.rawWard);
      }

      const locationSummary = {
        counties: {
          count: countySet.size,
          names: Array.from(countySet),
        },
        subcounties: {
          count: subcountySet.size,
          names: Array.from(subcountySet),
        },
        wards: {
          count: wardSet.size,
          names: Array.from(wardSet),
        },
      };

      this.logger.log(`Fetched ${data.length} records out of ${total} total`);

      return {
        data,
        total,
        limit,
        offset,
        locations: locationSummary,
      };
    } catch (error) {
      this.logger.error(`Error in getAllDkKhisData: ${error.message}`);
      throw error;
    }
  }

  async getAllDkPromptsData(limit?: number, offset?: number) {
    this.logger.log(
      `getAllDkPromptsData called with limit: ${limit}, offset: ${offset}`,
    );

    try {
      const queryBuilder = this.bizComputedPromptsWardMonth
        .createQueryBuilder('prompts')
        .addSelect('ST_AsGeoJSON(prompts.com_geom)', 'geojson')
        .where('prompts.com_geom IS NOT NULL');

      if (limit) queryBuilder.take(limit);
      if (offset) queryBuilder.skip(offset);

      const result = await queryBuilder.getRawAndEntities();
      const rawData = result.raw;
      const entities = result.entities;

      // Get total count separately
      const total = await this.bizComputedPromptsWardMonth
        .createQueryBuilder('prompts')
        .where('prompts.com_geom IS NOT NULL')
        .getCount();

      const data = rawData
        .map((raw, index) => {
          let geometry = null;
          try {
            geometry = JSON.parse(raw.geojson);
          } catch (e) {
            this.logger.warn(
              `Failed to parse geojson for prompts record: ${e.message}`,
            );
            return null;
          }

          return {
            ...entities[index],
            computed_geojson: geometry,
          };
        })
        .filter((r) => r !== null);

      this.logger.log(`Fetched ${data.length} records out of ${total} total`);

      return {
        data,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error(`Error in getAllDkPromptsData: ${error.message}`);
      throw error;
    }
  }

  async getAllDkKajiadoHealthFacilityListData(limit?: number, offset?: number) {
    this.logger.log(
      `getAllDkKajiadoHealthFacilityListData called with limit: ${limit}, offset: ${offset}`,
    );

    try {
      const queryBuilder = this.bizComputedKajiadoMasterHealthFacilities
        .createQueryBuilder('facility')
        .addSelect('ST_AsGeoJSON(facility.com_geom)', 'geojson')
        .where('facility.com_geom IS NOT NULL');

      if (limit) queryBuilder.take(limit);
      if (offset) queryBuilder.skip(offset);

      const result = await queryBuilder.getRawAndEntities();
      const rawData = result.raw;
      const entities = result.entities;

      // Get total count separately
      const total = await this.bizComputedKajiadoMasterHealthFacilities
        .createQueryBuilder('facility')
        .where('facility.com_geom IS NOT NULL')
        .getCount();

      const data = rawData
        .map((raw, index) => {
          let geometry = null;
          try {
            geometry = JSON.parse(raw.geojson);
          } catch (e) {
            this.logger.warn(
              `Failed to parse geojson for health facility record: ${e.message}`,
            );
            return null;
          }

          return {
            ...entities[index],
            computed_geojson: geometry,
          };
        })
        .filter((r) => r !== null);

      this.logger.log(`Fetched ${data.length} records out of ${total} total`);

      return {
        data,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error(
        `Error in getAllDkKajiadoHealthFacilityListData: ${error.message}`,
      );
      throw error;
    }
  }

  async getKajiadoWardGeometryAsGeoJSON() {
    this.logger.log('getKajiadoWardGeometryAsGeoJSON called');

    try {
      const wards = await this.bizComputedKajiadoWards
        .createQueryBuilder('ward')
        .addSelect('ST_AsGeoJSON(ward.com_geom)', 'geojson')
        .where('ward.com_geom IS NOT NULL')
        .getRawAndEntities();

      const rawData = wards.raw;
      const entities = wards.entities;

      this.logger.log(`Fetched ${entities.length} ward records`);

      // Convert to GeoJSON FeatureCollection
      const features = rawData
        .map((raw, index) => {
          let geometry = null;

          try {
            geometry = JSON.parse(raw.geojson);
          } catch (e) {
            this.logger.warn(
              `Failed to parse geojson for ward ${entities[index].rawWard}: ${e.message}`,
            );
            return null;
          }

          // Skip if no valid geometry found
          if (!geometry || !geometry.type) {
            this.logger.warn(
              `No valid geometry found for ward ${entities[index].rawWard}`,
            );
            return null;
          }

          return {
            type: 'Feature',
            geometry: geometry,
            properties: {
              county: entities[index].rawCounty,
              subcounty: entities[index].rawSubcounty,
              ward: entities[index].rawWard,
            },
          };
        })
        .filter((feature) => feature !== null); // Remove null entries

      const geoJSON = {
        type: 'FeatureCollection',
        features: features,
      };

      this.logger.log(
        `Created GeoJSON FeatureCollection with ${features.length} features`,
      );

      return geoJSON;
    } catch (error) {
      this.logger.error(
        `Error in getKajiadoWardGeometryAsGeoJSON: ${error.message}`,
      );
      throw error;
    }
  }

  // async getAveragedT2mByMonth(monthYear: string) {
  //   this.logger.log(`getAveragedT2mByMonth called with month: ${monthYear}`);

  //   try {
  //     // Parse month-year string (e.g., "2022-06")
  //     const [year, month] = monthYear.split('-').map(Number);

  //     if (!year || !month || month < 1 || month > 12) {
  //       throw new Error(
  //         'Invalid month format. Use YYYY-MM format (e.g., 2022-06)',
  //       );
  //     }

  //     // Calculate start and end dates for the month
  //     const startDate = new Date(year, month - 1, 1); // First day of month
  //     const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

  //     this.logger.log(
  //       `Calculating averages for month ${monthYear} (${startDate.toISOString()} to ${endDate.toISOString()})`,
  //     );

  //     // Query to get averaged t2m grouped by date, latitude, and longitude
  //     const result = await this.copernicusRepo
  //       .createQueryBuilder('copernicus')
  //       .select('DATE(copernicus.raw_valid_time)', 'date')
  //       .addSelect('copernicus.raw_latitude', 'latitude')
  //       .addSelect('copernicus.raw_longitude', 'longitude')
  //       .addSelect('AVG(copernicus.raw_t2m)', 'avg_t2m')
  //       .addSelect('COUNT(copernicus.raw_t2m)', 'count')
  //       .where('copernicus.raw_valid_time >= :startDate', { startDate })
  //       .andWhere('copernicus.raw_valid_time <= :endDate', { endDate })
  //       .groupBy('DATE(copernicus.raw_valid_time)')
  //       .addGroupBy('copernicus.raw_latitude')
  //       .addGroupBy('copernicus.raw_longitude')
  //       .orderBy('DATE(copernicus.raw_valid_time)', 'ASC')
  //       .addOrderBy('copernicus.raw_latitude', 'ASC')
  //       .addOrderBy('copernicus.raw_longitude', 'ASC')
  //       .getRawMany();

  //     // Format the result
  //     const formattedData = result.map((row) => ({
  //       date: row.date,
  //       latitude: row.latitude,
  //       longitude: row.longitude,
  //       avg_t2m: parseFloat(row.avg_t2m),
  //       count: parseInt(row.count, 10), // Number of readings that were averaged
  //     }));

  //     this.logger.log(
  //       `Returning ${formattedData.length} averaged records for month ${monthYear}`,
  //     );

  //     return {
  //       month: monthYear,
  //       startDate: startDate.toISOString(),
  //       endDate: endDate.toISOString(),
  //       totalRecords: formattedData.length,
  //       data: formattedData,
  //     };
  //   } catch (error) {
  //     this.logger.error(`Error in getAveragedT2mByMonth: ${error.message}`);
  //     throw error;
  //   }
  // }

  async getAveragedT2mByMonth(monthYear: string) {
    this.logger.log(`getAveragedT2mByMonth called with month: ${monthYear}`);

    try {
      const [year, month] = monthYear.split('-').map(Number);
      if (!year || !month || month < 1 || month > 12) {
        throw new Error('Invalid month format. Use YYYY-MM (e.g., 2022-06)');
      }

      const result = await this.bizAggregatedCopernicusEra5WardMonth
        .createQueryBuilder('era5')
        .select('era5.comCounty', 'county')
        .addSelect('era5.comSubcounty', 'subcounty')
        .addSelect('era5.comWard', 'ward')
        .addSelect('AVG(era5.comMeanT2m)', 'avgT2m')
        .addSelect('COUNT(*)', 'count')
        .where('era5.comYear = :year', { year })
        .andWhere('era5.comMonth = :month', { month })
        .groupBy('era5.comCounty')
        .addGroupBy('era5.comSubcounty')
        .addGroupBy('era5.comWard')
        .orderBy('era5.comCounty', 'ASC')
        .addOrderBy('era5.comSubcounty', 'ASC')
        .addOrderBy('era5.comWard', 'ASC')
        .getRawMany();

      const formattedData = result.map((row) => ({
        county: row.county,
        subcounty: row.subcounty,
        ward: row.ward,
        avg_t2m: parseFloat(row.avgT2m),
        count: parseInt(row.count, 10),
      }));

      this.logger.log(
        `Returning ${formattedData.length} averaged records for ${monthYear}`,
      );
      return {
        year,
        month,
        totalRecords: formattedData.length,
        data: formattedData,
      };
    } catch (error) {
      this.logger.error(`Error in getAveragedT2mByMonth: ${error.message}`);
      throw error;
    }
  }

  async getKajiadoWardChoroplethData(limit?: number, offset?: number) {
    this.logger.log(
      `getKajiadoWardChoroplethData called with limit: ${limit}, offset: ${offset}`,
    );

    try {
      // Flatten all indicators from defaultIndicators object
      const allIndicators = [
        ...defaultIndicators.Mother,
        ...defaultIndicators.Baby,
        ...defaultIndicators.Other,
      ];

      const queryBuilder = this.bizComputedKhisWardMonthV2
        .createQueryBuilder('dk_khis')
        .select([
          'dk_khis.rawCounty',
          'dk_khis.rawSubcounty',
          'dk_khis.rawWard',
          'dk_khis.rawDataElement',
          'dk_khis.rawDxType',
          'SUM(dk_khis.rawValue)',
        ])
        .where('dk_khis.rawDataElement IN (:...indicators)', {
          indicators: allIndicators,
        })
        .groupBy('dk_khis.rawCounty')
        .addGroupBy('dk_khis.rawSubcounty')
        .addGroupBy('dk_khis.rawWard')
        .addGroupBy('dk_khis.rawDataElement')
        .addGroupBy('dk_khis.rawDxType')
        .orderBy('dk_khis.rawCounty', 'ASC')
        .addOrderBy('dk_khis.rawSubcounty', 'ASC')
        .addOrderBy('dk_khis.rawWard', 'ASC')
        .addOrderBy('dk_khis.rawDataElement', 'ASC');

      if (limit) {
        queryBuilder.take(limit);
      }

      if (offset) {
        queryBuilder.skip(offset);
      }

      const wards = await queryBuilder.getRawMany();

      // Get total count for pagination
      const total = await queryBuilder.getCount();

      // Extract unique location values
      const countySet = new Set<string>();
      const subcountySet = new Set<string>();
      const wardSet = new Set<string>();

      for (const row of wards) {
        if (row.County) countySet.add(row.County);
        if (row.Subcounty) subcountySet.add(row.Subcounty);
        if (row.Ward) wardSet.add(row.Ward);
      }

      const locationSummary = {
        counties: {
          count: countySet.size,
          names: Array.from(countySet),
        },
        subcounties: {
          count: subcountySet.size,
          names: Array.from(subcountySet),
        },
        wards: {
          count: wardSet.size,
          names: Array.from(wardSet),
        },
      };

      this.logger.log(`Fetched ${wards.length} records out of ${total} total`);

      return {
        wards,
        locationSummary,
        defaultIndicators,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error(
        `Error in getKajiadoWardChoroplethData: ${error.message}`,
      );
      throw error;
    }
  }
}
