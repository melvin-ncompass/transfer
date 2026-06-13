import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
// import * as ExcelJs from 'exceljs';
import { PassThrough } from 'stream';
import { BizComputedKhisWardMonth } from 'src/visualizationV1/entity/biz_computed_khis_ward_month.entity';
import { BizAggregatedCopernicusEra5WardMonth } from 'src/visualizationV1/entity/biz_aggregated_copernicus_era5_ward_month.entity';
import { BizComputedKhisWardMonthV2 } from '../entity/biz_computed_khis_ward_month_v2.entity';
import { BizAggregatedCopernicusEra5WardMonthV2 } from '../entity/biz_aggregated_copernicus_era5_ward_month_v2.entity';
import { WARD_MAP } from '../dto/visualization.dto';
// import { generateCsvBuffer } from 'src/common/utils/export-csv.util';

@Injectable()
export class DataTableService {
  private readonly logger = new Logger(DataTableService.name);

  constructor(private dataSource: DataSource) {}
  // constructor(
  //     private dataSource: DataSource,
  //     @InjectRepository(Data) private readonly dataRepo: Repository<Data>,
  //   ) { }

  // async getAllDataTable(filters?: {
  //   startYear?: number;
  //   endYear?: number;
  //   startMonth?: number;
  //   endMonth?: number;
  //   subcounty?: string;
  //   ward?: string;
  // }) {
  //   const defaultStartYear = filters?.startYear || 2022;
  //   const defaultEndYear = filters?.endYear || 2022;
  //   const defaultStartMonth = filters?.startMonth || 1;
  //   const defaultEndMonth = filters?.endMonth || 12;

  //   // // Map the ward using WARD_MAP
  //   // const mappedWard = filters?.ward
  //   //   ? WARD_MAP[filters.ward] || filters.ward
  //   //   : filters.ward;

  //   // Build the query using QueryBuilder for type safety
  //   const climateQueryBuilder = this.dataSource
  //     .getRepository(BizAggregatedCopernicusEra5WardMonthV2)
  //     .createQueryBuilder('climate')
  //     .select([
  //       'climate.comWard as ward',
  //       'climate.comSubcounty as subcounty',
  //       '(climate.comMeanT2m - 273.15) as temperature',
  //       '(climate.comSumTp * 1000) as precipitation',
  //       'climate.comYear as year',
  //       'climate.comMonth as month',
  //     ])
  //     .where(
  //       '(climate.comYear = :startYear AND climate.comMonth >= :startMonth) OR ' +
  //         '(climate.comYear = :endYear AND climate.comMonth <= :endMonth) OR ' +
  //         '(climate.comYear > :startYear AND climate.comYear < :endYear)',
  //       {
  //         startYear: defaultStartYear,
  //         endYear: defaultEndYear,
  //         startMonth: defaultStartMonth,
  //         endMonth: defaultEndMonth,
  //       },
  //     );

  //   const healthQueryBuilder = this.dataSource
  //     .getRepository(BizComputedKhisWardMonthV2)
  //     .createQueryBuilder('health')
  //     .select([
  //       'health.rawSubcounty as subcounty',
  //       'health.rawWard as ward',
  //       'health.rawDataElementName as indicator',
  //       'health.comTotalValue as value',
  //       'health.comYear as year',
  //       'health.comMonth as month',
  //     ])
  //     .where('health.rawDataElementName IN (:...indicators)', {
  //       indicators: [
  //         'Confirmed Malaria Cases',
  //         // 'IDSR Malaria Cases',
  //         'MOH 711 PPH (Post Partum Haemorrage)',
  //       ],
  //     })
  //     .andWhere(
  //       '(health.comYear = :startYear AND health.comMonth >= :startMonth) OR ' +
  //         '(health.comYear = :endYear AND health.comMonth <= :endMonth) OR ' +
  //         '(health.comYear > :startYear AND health.comYear < :endYear)',
  //       {
  //         startYear: defaultStartYear,
  //         endYear: defaultEndYear,
  //         startMonth: defaultStartMonth,
  //         endMonth: defaultEndMonth,
  //       },
  //     );

  //   // if (filters?.subcounty) {
  //   //   climateQueryBuilder.andWhere('climate.comSubcounty = :subcounty', {
  //   //     subcounty: filters.subcounty,
  //   //   });
  //   //   healthQueryBuilder.andWhere('health.rawSubcounty = :subcounty', {
  //   //     subcounty: filters.subcounty,
  //   //   });
  //   // }

  //   // if (mappedWard) {
  //   //   climateQueryBuilder.andWhere('climate.comWard = :ward', {
  //   //     ward: mappedWard,
  //   //   });
  //   //   healthQueryBuilder.andWhere('health.rawWard = :ward', {
  //   //     ward: mappedWard,
  //   //   });
  //   // }

  //   const [climateData, healthData] = await Promise.all([
  //     climateQueryBuilder.getRawMany(),
  //     healthQueryBuilder.getRawMany(),
  //   ]);

  //   // Combine and format the data
  //   const combinedData = climateData.map((climate) => {
  //     // Map the climate ward using WARD_MAP
  //     const mappedClimateWard = Object.keys(WARD_MAP).find(
  //     key => WARD_MAP[key] === climate.ward
  //     ) || climate.ward;

  //     const wardHealthData = healthData.filter(
  //     (health) => {
  //       // Map the health ward using WARD_MAP
  //       const mappedHealthWard = WARD_MAP[health.ward] || health.ward;
  //       const mappedClimateWardForComparison = WARD_MAP[mappedClimateWard] || mappedClimateWard;

  //       return mappedHealthWard === mappedClimateWardForComparison &&
  //          health.subcounty === climate.subcounty &&
  //          health.year === climate.year &&
  //          health.month === climate.month;
  //     }
  //     );

  //     const maternalMortality =
  //       wardHealthData.find(
  //         (h) => h.indicator === 'MOH 711 PPH (Post Partum Haemorrage)',
  //       )?.value || 0;
  //     const malariaCases =
  //       wardHealthData.find((h) => h.indicator === 'Confirmed Malaria Cases')
  //         ?.value || 0;

  //     return {
  //       ward: climate.ward,
  //       subcounty: climate.subcounty,
  //       avgTemp: parseFloat(parseFloat(climate.temperature).toFixed(2)),
  //       precip: parseFloat(parseFloat(climate.precipitation).toFixed(2)),
  //       maternalMortality,
  //       malariaCases,
  //       year: climate.year,
  //       month: climate.month,
  //     };
  //   });

  //   return {
  //     data: combinedData,
  //     filters: {
  //       startYear: defaultStartYear,
  //       endYear: defaultEndYear,
  //       startMonth: defaultStartMonth,
  //       endMonth: defaultEndMonth,
  //       subcounty: filters?.subcounty || null,
  //       ward: filters?.ward || null,
  //     },
  //   };
  // }

  async getAllDataTable(filters?: {
    startYear?: number;
    endYear?: number;
    startMonth?: number;
    endMonth?: number;
    subcounty?: string;
    ward?: string;
  }) {
    const defaultStartYear = filters?.startYear || 2022;
    const defaultEndYear = filters?.endYear || 2022;
    const defaultStartMonth = filters?.startMonth || 1;
    const defaultEndMonth = filters?.endMonth || 12;

    // Climate query
    const climateQueryBuilder = this.dataSource
      .getRepository(BizAggregatedCopernicusEra5WardMonthV2)
      .createQueryBuilder('climate')
      .select([
        'climate.comWard as ward',
        'climate.comSubcounty as subcounty',
        '(climate.comMeanT2m - 273.15) as temperature',
        '(climate.comSumTp * 1000) as precipitation',
        'climate.comYear as year',
        'climate.comMonth as month',
      ]);

    // Health query
    const healthQueryBuilder = this.dataSource
      .getRepository(BizComputedKhisWardMonthV2)
      .createQueryBuilder('health')
      .select([
        'health.rawSubcounty as subcounty',
        'health.rawWard as ward',
        'health.rawDataElementName as indicator',
        'health.comTotalValue as value',
        'health.comYear as year',
        'health.comMonth as month',
      ])
      .where('health.rawDataElementName IN (:...indicators)', {
        indicators: [
          'Confirmed Malaria Cases',
          // 'MOH 711 PPH (Post Partum Haemorrage)',
          'MOH 711 MUAC 6 - 59 months Severe (Red)',
        ],
      });

    // Apply year/month filters
    if (defaultStartYear === defaultEndYear) {
      climateQueryBuilder.where(
        'climate.comYear = :year AND climate.comMonth BETWEEN :startMonth AND :endMonth',
        {
          year: defaultStartYear,
          startMonth: defaultStartMonth,
          endMonth: defaultEndMonth,
        },
      );

      healthQueryBuilder.andWhere(
        'health.comYear = :year AND health.comMonth BETWEEN :startMonth AND :endMonth',
        {
          year: defaultStartYear,
          startMonth: defaultStartMonth,
          endMonth: defaultEndMonth,
        },
      );
    } else {
      climateQueryBuilder.where(
        '(climate.comYear = :startYear AND climate.comMonth >= :startMonth) OR ' +
          '(climate.comYear = :endYear AND climate.comMonth <= :endMonth) OR ' +
          '(climate.comYear > :startYear AND climate.comYear < :endYear)',
        {
          startYear: defaultStartYear,
          endYear: defaultEndYear,
          startMonth: defaultStartMonth,
          endMonth: defaultEndMonth,
        },
      );

      healthQueryBuilder.andWhere(
        '(health.comYear = :startYear AND health.comMonth >= :startMonth) OR ' +
          '(health.comYear = :endYear AND health.comMonth <= :endMonth) OR ' +
          '(health.comYear > :startYear AND health.comYear < :endYear)',
        {
          startYear: defaultStartYear,
          endYear: defaultEndYear,
          startMonth: defaultStartMonth,
          endMonth: defaultEndMonth,
        },
      );
    }

    // Optional filters
    if (filters?.subcounty) {
      climateQueryBuilder.andWhere('climate.comSubcounty = :subcounty', {
        subcounty: filters.subcounty,
      });
      healthQueryBuilder.andWhere('health.rawSubcounty = :subcounty', {
        subcounty: filters.subcounty,
      });
    }

    if (filters?.ward) {
      climateQueryBuilder.andWhere('climate.comWard = :ward', {
        ward: filters.ward,
      });
      healthQueryBuilder.andWhere('health.rawWard = :ward', {
        ward: filters.ward,
      });
    }

    const [climateData, healthData] = await Promise.all([
      climateQueryBuilder.getRawMany(),
      healthQueryBuilder.getRawMany(),
    ]);

    // Combine and format the data
    const combinedData = climateData.map((climate) => {
      const mappedClimateWard =
        Object.keys(WARD_MAP).find((key) => WARD_MAP[key] === climate.ward) ||
        climate.ward;

      const wardHealthData = healthData.filter((health) => {
        const mappedHealthWard = WARD_MAP[health.ward] || health.ward;
        const mappedClimateWardForComparison =
          WARD_MAP[mappedClimateWard] || mappedClimateWard;

        return (
          mappedHealthWard === mappedClimateWardForComparison &&
          health.subcounty === climate.subcounty &&
          health.year === climate.year &&
          health.month === climate.month
        );
      });

      const maternalMortality =
        wardHealthData.find(
          (h) => h.indicator === 'MOH 711 MUAC 6 - 59 months Severe (Red)',
        )?.value || 0;

      const malariaCases =
        wardHealthData.find((h) => h.indicator === 'Confirmed Malaria Cases')
          ?.value || 0;

      return {
        ward: climate.ward,
        subcounty: climate.subcounty,
        avgTemp: parseFloat(parseFloat(climate.temperature).toFixed(2)),
        precip: parseFloat(parseFloat(climate.precipitation).toFixed(2)),
        maternalMortality,
        malariaCases,
        year: climate.year,
        month: climate.month,
      };
    });

    return {
      data: combinedData,
      filters: {
        startYear: defaultStartYear,
        endYear: defaultEndYear,
        startMonth: defaultStartMonth,
        endMonth: defaultEndMonth,
        subcounty: filters?.subcounty || null,
        ward: filters?.ward || null,
      },
    };
  }

  // async getAllDataTable(filters?: {
  //   startYear?: number;
  //   endYear?: number;
  //   startMonth?: number;
  //   endMonth?: number;
  //   // subcounty?: string;
  //   // ward?: string;
  // }) {
  //   const defaultStartYear = filters?.startYear || 2022;
  //   const defaultEndYear = filters?.endYear || 2024;
  //   const defaultStartMonth = filters?.startMonth || 1;
  //   const defaultEndMonth = filters?.endMonth || 12;

  //   const query = `
  //     WITH user_input AS (
  //         SELECT
  //             $1::int AS start_year,
  //             $2::int AS end_year,
  //             $3::int AS start_month,
  //             $4::int AS end_month,
  //             $5::text AS subcounty_filter,
  //             $6::text AS ward_filter
  //     ),

  //     -- Ward name normalization function for Copernicus
  //     climate_normalized AS (
  //         SELECT
  //             c.*,
  //             CASE
  //                 WHEN c.com_ward ILIKE 'Olkeri Ward' THEN 'Olkeri Ward'
  //                 WHEN c.com_ward ILIKE 'Kenyawa-poka Ward' THEN 'Kenyawa-poka Ward'
  //                 WHEN c.com_ward ILIKE 'Keekonyokie Ward' THEN 'Keekonyokie Ward'
  //                 WHEN c.com_ward ILIKE 'Imaroro Ward' THEN 'Imaroro Ward'
  //                 WHEN c.com_ward ILIKE 'Rombo Ward' THEN 'Rombo Ward'
  //                 WHEN c.com_ward ILIKE 'Dalalekutuk Ward' THEN 'Dalalekutuk Ward'
  //                 WHEN c.com_ward ILIKE 'Iloodokilani Ward' THEN 'Iloodokilani Ward'
  //                 WHEN c.com_ward ILIKE 'Kimana Ward' THEN 'Kimana Ward'
  //                 WHEN c.com_ward ILIKE 'Matapato north Ward' THEN 'Matapato North Ward'
  //                 WHEN c.com_ward ILIKE 'Magadi Ward' THEN 'Magadi Ward'
  //                 WHEN c.com_ward ILIKE 'Kitengela Ward' THEN 'Kitengela Ward'
  //                 WHEN c.com_ward ILIKE 'Kaputiei north Ward' THEN 'Kaputiei North Ward'
  //                 WHEN c.com_ward ILIKE 'Kuku Ward' THEN 'Kuku Ward'
  //                 WHEN c.com_ward ILIKE 'Nkaimurunya Ward' THEN 'Nkaimurunya Ward'
  //                 WHEN c.com_ward ILIKE 'Ongata rongai Ward' THEN 'Ongata Rongai Ward'
  //                 WHEN c.com_ward ILIKE 'Ildamat Ward' THEN 'Ildamat Ward'
  //                 WHEN c.com_ward ILIKE 'Oloolua Ward' THEN 'Oloolua Ward'
  //                 WHEN c.com_ward ILIKE 'Oloosirkon/sholinke Ward' THEN 'Oloosirkon/Sholinke Ward'
  //                 WHEN c.com_ward ILIKE 'Ngong Ward' THEN 'Ngong Ward'
  //                 WHEN c.com_ward ILIKE 'Purko Ward' THEN 'Purko Ward'
  //                 WHEN c.com_ward ILIKE 'Imbrikani/eselelnkei Ward' THEN 'Imbrikani/Eselelnkei Ward'
  //                 WHEN c.com_ward ILIKE 'Matapato south Ward' THEN 'Matapato South Ward'
  //                 WHEN c.com_ward ILIKE 'Mosiro Ward' THEN 'Mosiro Ward'
  //                 WHEN c.com_ward ILIKE 'Ewuaso oonkidong''i Ward' THEN 'Ewuaso Oo Nkidong''i Ward'
  //                 WHEN c.com_ward ILIKE 'Entonet/lenkism Ward' THEN 'Entonet/Lenkism Ward'
  //                 ELSE c.com_ward
  //             END AS ward_normalized
  //         FROM biz_aggregated_copernicus_era5_ward_month_v2 c
  //     ),

  //     -- Ward normalization for KHIS
  //     health_normalized AS (
  //         SELECT
  //             h.*,
  //             CASE
  //                 WHEN h.raw_ward ILIKE 'Mosiro Ward' THEN 'Mosiro Ward'
  //                 WHEN h.raw_ward ILIKE 'Ongata Rongai Ward' THEN 'Ongata Rongai Ward'
  //                 WHEN h.raw_ward ILIKE 'Olkeri Ward' THEN 'Olkeri Ward'
  //                 WHEN h.raw_ward ILIKE 'Kaputiei North Ward' THEN 'Kaputiei North Ward'
  //                 WHEN h.raw_ward ILIKE 'Kenyawa-poka Ward' THEN 'Kenyawa-poka Ward'
  //                 WHEN h.raw_ward ILIKE 'Oloosirkon/Sholinke Ward' THEN 'Oloosirkon/Sholinke Ward'
  //                 WHEN h.raw_ward ILIKE 'Keekonyokie Ward' THEN 'Keekonyokie Ward'
  //                 WHEN h.raw_ward ILIKE 'Imaroro Ward' THEN 'Imaroro Ward'
  //                 WHEN h.raw_ward ILIKE 'Rombo Ward' THEN 'Rombo Ward'
  //                 WHEN h.raw_ward ILIKE 'Matapato South Ward' THEN 'Matapato South Ward'
  //                 WHEN h.raw_ward ILIKE 'Dalalekutuk Ward' THEN 'Dalalekutuk Ward'
  //                 WHEN h.raw_ward ILIKE 'Kimana Ward' THEN 'Kimana Ward'
  //                 WHEN h.raw_ward ILIKE 'Iloodokilani Ward' THEN 'Iloodokilani Ward'
  //                 WHEN h.raw_ward ILIKE 'Imbrikani/Eselelnkei Ward' THEN 'Imbrikani/Eselelnkei Ward'
  //                 WHEN h.raw_ward ILIKE 'Magadi Ward' THEN 'Magadi Ward'
  //                 WHEN h.raw_ward ILIKE 'Kitengela Ward' THEN 'Kitengela Ward'
  //                 WHEN h.raw_ward ILIKE 'Entonet/Lenkism Ward' THEN 'Entonet/Lenkism Ward'
  //                 WHEN h.raw_ward ILIKE 'Kuku Ward' THEN 'Kuku Ward'
  //                 WHEN h.raw_ward ILIKE 'Nkaimurunya Ward' THEN 'Nkaimurunya Ward'
  //                 WHEN h.raw_ward ILIKE 'Ildamat Ward' THEN 'Ildamat Ward'
  //                 WHEN h.raw_ward ILIKE 'Oloolua Ward' THEN 'Oloolua Ward'
  //                 WHEN h.raw_ward ILIKE 'Matapato North Ward' THEN 'Matapato North Ward'
  //                 WHEN h.raw_ward ILIKE 'Ngong Ward' THEN 'Ngong Ward'
  //                 WHEN h.raw_ward ILIKE 'Ewuaso Oo Nkidong''i Ward' THEN 'Ewuaso Oo Nkidong''i Ward'
  //                 WHEN h.raw_ward ILIKE 'Purko Ward' THEN 'Purko Ward'
  //                 ELSE h.raw_ward
  //             END AS ward_normalized
  //         FROM biz_computed_khis_ward_month_v2 h
  //     ),

  //     -- Filtered climate data after mapping
  //     climate_filtered AS (
  //         SELECT
  //             ward_normalized,
  //             com_subcounty,
  //             (com_mean_t2m - 273.15) AS temperature,
  //             (com_sum_tp * 1000) AS precipitation,
  //             com_year,
  //             com_month
  //         FROM climate_normalized c
  //         JOIN user_input u ON TRUE
  //         WHERE
  //             (
  //                 (c.com_year = u.start_year AND c.com_month >= u.start_month)
  //                 OR (c.com_year = u.end_year AND c.com_month <= u.end_month)
  //                 OR (c.com_year > u.start_year AND c.com_year < u.end_year)
  //             )
  //             AND (u.subcounty_filter IS NULL OR c.com_subcounty = u.subcounty_filter)
  //             AND (u.ward_filter IS NULL OR ward_normalized = u.ward_filter)
  //     ),

  //     -- Filtered health data after mapping
  //     health_filtered AS (
  //         SELECT
  //             ward_normalized,
  //             raw_subcounty,
  //             raw_dataelement_name,
  //             com_total_value,
  //             com_year,
  //             com_month
  //         FROM health_normalized h
  //         JOIN user_input u ON TRUE
  //         WHERE
  //             raw_dataelement_name IN (
  //                 'Confirmed Malaria Cases',
  //                 'MOH 711 PPH (Post Partum Haemorrage)'
  //             )
  //             AND (
  //                 (h.com_year = u.start_year AND h.com_month >= u.start_month)
  //                 OR (h.com_year = u.end_year AND h.com_month <= u.end_month)
  //                 OR (h.com_year > u.start_year AND h.com_year < u.end_year)
  //             )
  //             AND (u.subcounty_filter IS NULL OR h.raw_subcounty = u.subcounty_filter)
  //             AND (u.ward_filter IS NULL OR ward_normalized = u.ward_filter)
  //     ),

  //     -- Combine data
  //     combined AS (
  //         SELECT
  //             c.ward_normalized AS ward,
  //             c.com_subcounty AS subcounty,
  //             ROUND(c.temperature::numeric, 2) AS avgTemp,
  //             ROUND(c.precipitation::numeric, 2) AS precip,
  //             COALESCE(MAX(CASE WHEN h.raw_dataelement_name = 'MOH 711 PPH (Post Partum Haemorrage)' THEN h.com_total_value END), 0) AS maternalMortality,
  //             COALESCE(MAX(CASE WHEN h.raw_dataelement_name = 'Confirmed Malaria Cases' THEN h.com_total_value END), 0) AS malariaCases,
  //             c.com_year AS year,
  //             c.com_month AS month
  //         FROM climate_filtered c
  //         LEFT JOIN health_filtered h
  //             ON h.ward_normalized = c.ward_normalized
  //            AND h.com_year = c.com_year
  //            AND h.com_month = c.com_month
  //         GROUP BY
  //             c.ward_normalized,
  //             c.com_subcounty,
  //             c.temperature,
  //             c.precipitation,
  //             c.com_year,
  //             c.com_month
  //     )

  //     SELECT *
  //     FROM combined
  //     ORDER BY year, month, subcounty, ward;
  //   `;

  //   const result = await this.dataSource.query(query, [
  //     defaultStartYear,
  //     defaultEndYear,
  //     defaultStartMonth,
  //     defaultEndMonth,
  //     null ,// filters?.subcounty || null,
  //     null ,    // filters?.ward || null,
  //   ]);

  //   return {
  //     data: result,
  //     filters: {
  //       startYear: defaultStartYear,
  //       endYear: defaultEndYear,
  //       startMonth: defaultStartMonth,
  //       endMonth: defaultEndMonth,
  //       // subcounty: filters?.subcounty || null,
  //       // ward: filters?.ward || null,
  //     },
  //   };
  // }

  // async exportHealthDataCsv() {
  //   const healthData = []; //data to be exported (repo.find())

  //   // const workbook = new ExcelJs.Workbook();
  //   // const worksheet = workbook.addWorksheet('HealthData');

  //   // worksheet.columns = [
  //   // { header: 'Ward', key: 'ward' },
  //   // { header: 'SubCounty', key: 'subcounty' },
  //   // { header: 'Average Temperature (°C)', key: 'avgTemp' },
  //   // { header: 'Precipitation (mm)', key: 'precip' },
  //   // { header: 'Maternal Mortality Rate ', key: 'maternalMortality' },
  //   // { header: 'Malaria Cases Count', key: 'malariaCases' },
  //   // {header: 'Risk Level', key: 'riskLevel'}
  //   // ];
  //   const healthDataColumns: ColumnConfigDto[] = [
  //     { header: 'Ward', key: 'ward' },
  //     { header: 'SubCounty', key: 'subcounty' },
  //     { header: 'Average Temperature (°C)', key: 'avgTemp' },
  //     { header: 'Precipitation (mm)', key: 'precip' },
  //     { header: 'Maternal Mortality Rate ', key: 'maternalMortality' },
  //     { header: 'Malaria Cases Count', key: 'malariaCases' },
  //     { header: 'Risk Level', key: 'riskLevel' },
  //   ];

  //   const buffer = await generateCsvBuffer(
  //     healthData,
  //     'HealthData',
  //     healthDataColumns,
  //   );
  //   //const buffer = this.getCsvBufferFromWorkbook(workbook);
  //   return buffer;
  // }
}
