import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
// import * as ExcelJs from 'exceljs';
import { WARD_MAP } from '../dto/visualization.dto';
import { BizAggregatedCopernicusEra5HistoricalWardMonthly } from '../entity/biz_aggregated_copernicus_era5_historical_ward_monthly.entity';
import { BizComputedKhisWardMonth } from '../entity/biz_computed_khis_ward_month.entity';
import { BizMasterSubcounties } from '../entity/biz_master_subcounties.entity';
import { BizMasterWards } from '../entity/biz_master_wards.entity';

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

  //   // Climate query
  //   const climateQueryBuilder = this.dataSource
  //     .getRepository(BizAggregatedCopernicusEra5HistoricalWardMonthly)
  //     .createQueryBuilder('climate')
  //     .select([
  //       'climate.comWard as ward',
  //       'climate.comSubcounty as subcounty',
  //       '(climate.comMeanT2m - 273.15) as temperature',
  //       '(climate.comSumTp * 1000) as precipitation',
  //       'climate.comYear as year',
  //       'climate.comMonth as month',
  //     ]);

  //   // Health query
  //   const healthQueryBuilder = this.dataSource
  //     .getRepository(BizComputedKhisWardMonth)
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
  //         // 'MOH 711 PPH (Post Partum Haemorrage)',
  //         'MOH 711 MUAC 6 - 59 months Severe (Red)',
  //       ],
  //     });

  //   // Apply year/month filters
  //   if (defaultStartYear === defaultEndYear) {
  //     climateQueryBuilder.where(
  //       'climate.comYear = :year AND climate.comMonth BETWEEN :startMonth AND :endMonth',
  //       {
  //         year: defaultStartYear,
  //         startMonth: defaultStartMonth,
  //         endMonth: defaultEndMonth,
  //       },
  //     );

  //     healthQueryBuilder.andWhere(
  //       'health.comYear = :year AND health.comMonth BETWEEN :startMonth AND :endMonth',
  //       {
  //         year: defaultStartYear,
  //         startMonth: defaultStartMonth,
  //         endMonth: defaultEndMonth,
  //       },
  //     );
  //   } else {
  //     climateQueryBuilder.where(
  //       '(climate.comYear = :startYear AND climate.comMonth >= :startMonth) OR ' +
  //       '(climate.comYear = :endYear AND climate.comMonth <= :endMonth) OR ' +
  //       '(climate.comYear > :startYear AND climate.comYear < :endYear)',
  //       {
  //         startYear: defaultStartYear,
  //         endYear: defaultEndYear,
  //         startMonth: defaultStartMonth,
  //         endMonth: defaultEndMonth,
  //       },
  //     );

  //     healthQueryBuilder.andWhere(
  //       '(health.comYear = :startYear AND health.comMonth >= :startMonth) OR ' +
  //       '(health.comYear = :endYear AND health.comMonth <= :endMonth) OR ' +
  //       '(health.comYear > :startYear AND health.comYear < :endYear)',
  //       {
  //         startYear: defaultStartYear,
  //         endYear: defaultEndYear,
  //         startMonth: defaultStartMonth,
  //         endMonth: defaultEndMonth,
  //       },
  //     );
  //   }

  //   // Optional filters
  //   if (filters?.subcounty) {
  //     climateQueryBuilder.andWhere('climate.comSubcounty = :subcounty', {
  //       subcounty: filters.subcounty,
  //     });
  //     healthQueryBuilder.andWhere('health.rawSubcounty = :subcounty', {
  //       subcounty: filters.subcounty,
  //     });
  //   }

  //   if (filters?.ward) {
  //     climateQueryBuilder.andWhere('climate.comWard = :ward', {
  //       ward: filters.ward,
  //     });
  //     healthQueryBuilder.andWhere('health.rawWard = :ward', {
  //       ward: filters.ward,
  //     });
  //   }

  //   const [climateData, healthData] = await Promise.all([
  //     climateQueryBuilder.getRawMany(),
  //     healthQueryBuilder.getRawMany(),
  //   ]);

  //   // Combine and format the data
  //   const combinedData = climateData.map((climate) => {
  //     const mappedClimateWard =
  //       Object.keys(WARD_MAP).find((key) => WARD_MAP[key] === climate.ward) ||
  //       climate.ward;

  //     const wardHealthData = healthData.filter((health) => {
  //       const mappedHealthWard = WARD_MAP[health.ward] || health.ward;
  //       const mappedClimateWardForComparison =
  //         WARD_MAP[mappedClimateWard] || mappedClimateWard;

  //       return (
  //         mappedHealthWard === mappedClimateWardForComparison &&
  //         health.subcounty === climate.subcounty &&
  //         health.year === climate.year &&
  //         health.month === climate.month
  //       );
  //     });

  //     const maternalMortality =
  //       wardHealthData.find(
  //         (h) => h.indicator === 'MOH 711 MUAC 6 - 59 months Severe (Red)',
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

  // async getAllDataTable(filters?: {
  //   startYear?: number;
  //   endYear?: number;
  //   startMonth?: number;
  //   endMonth?: number;
  //   subcountyId?: string;
  //   wardId?: string;
  // }) {
  //   const defaultStartYear = filters?.startYear ?? 2022;
  //   const defaultEndYear = filters?.endYear ?? 2022;
  //   const defaultStartMonth = filters?.startMonth ?? 1;
  //   const defaultEndMonth = filters?.endMonth ?? 12;

  //   /* ------------------------------------------------------------------
  //    * CLIMATE QUERY (ID driven + joins for names)
  //    * ------------------------------------------------------------------ */
  //   const climateQueryBuilder = this.dataSource
  //     .getRepository(BizAggregatedCopernicusEra5HistoricalWardMonthly)
  //     .createQueryBuilder('climate')
  //     .leftJoin(
  //       BizMasterSubcounties,
  //       'sc',
  //       'sc.subcounty_id = climate.com_subcounty_id',
  //     )
  //     .leftJoin(BizMasterWards, 'w', 'w.ward_id = climate.com_ward_id')
  //     .select([
  //       'climate.comWardId as wardId',
  //       'w.wardName as ward',
  //       'climate.comSubcountyId as subcountyId',
  //       'sc.subcountyName as subcounty',
  //       '(climate.comMaxZonalStatMeanT2m - 273.15) as temperature',
  //       '(climate.comSumZonalStatSumTp * 1000) as precipitation',
  //       'climate.comYear as year',
  //       'climate.comMonth as month',
  //     ]);

  //   /* ------------------------------------------------------------------
  //    * HEALTH QUERY (ID driven + aggregation)
  //    * ------------------------------------------------------------------ */
  //   const healthQueryBuilder = this.dataSource
  //     .getRepository(BizComputedKhisWardMonth)
  //     .createQueryBuilder('health')
  //     .select([
  //       'health.comWardId AS wardId',
  //       'health.comSubcountyId AS subcountyId',
  //       'health.rawDataElementName AS indicator',
  //       'SUM(health.rawValue)::int AS value', // cast to integer so it's returned as number
  //       'health.comYear AS year',
  //       'health.comMonth AS month',
  //     ])
  //     .where('health.rawDataElementName IN (:...indicators)', {
  //       indicators: [
  //         'Confirmed Malaria Cases',
  //         'MOH 711 MUAC 6 - 59 months Severe (Red)',
  //       ],
  //     })
  //     .groupBy('health.comWardId')
  //     .addGroupBy('health.comSubcountyId')
  //     .addGroupBy('health.rawDataElementName')
  //     .addGroupBy('health.comYear')
  //     .addGroupBy('health.comMonth');

  //   /* ------------------------------------------------------------------
  //    * YEAR / MONTH FILTERS
  //    * ------------------------------------------------------------------ */
  //   if (defaultStartYear === defaultEndYear) {
  //     climateQueryBuilder.where(
  //       'climate.comYear = :year AND climate.comMonth BETWEEN :startMonth AND :endMonth',
  //       {
  //         year: defaultStartYear,
  //         startMonth: defaultStartMonth,
  //         endMonth: defaultEndMonth,
  //       },
  //     );

  //     healthQueryBuilder.andWhere(
  //       'health.comYear = :year AND health.comMonth BETWEEN :startMonth AND :endMonth',
  //       {
  //         year: defaultStartYear,
  //         startMonth: defaultStartMonth,
  //         endMonth: defaultEndMonth,
  //       },
  //     );
  //   } else {
  //     climateQueryBuilder.where(
  //       `
  //     (climate.comYear = :startYear AND climate.comMonth >= :startMonth)
  //     OR (climate.comYear = :endYear AND climate.comMonth <= :endMonth)
  //     OR (climate.comYear > :startYear AND climate.comYear < :endYear)
  //     `,
  //       {
  //         startYear: defaultStartYear,
  //         endYear: defaultEndYear,
  //         startMonth: defaultStartMonth,
  //         endMonth: defaultEndMonth,
  //       },
  //     );

  //     healthQueryBuilder.andWhere(
  //       `
  //     (health.comYear = :startYear AND health.comMonth >= :startMonth)
  //     OR (health.comYear = :endYear AND health.comMonth <= :endMonth)
  //     OR (health.comYear > :startYear AND health.comYear < :endYear)
  //     `,
  //       {
  //         startYear: defaultStartYear,
  //         endYear: defaultEndYear,
  //         startMonth: defaultStartMonth,
  //         endMonth: defaultEndMonth,
  //       },
  //     );
  //   }

  //   /* ------------------------------------------------------------------
  //    * OPTIONAL ID FILTERS
  //    * ------------------------------------------------------------------ */
  //   if (filters?.subcountyId) {
  //     climateQueryBuilder.andWhere('climate.comSubcountyId = :subcountyId', {
  //       subcountyId: filters.subcountyId,
  //     });

  //     healthQueryBuilder.andWhere('health.comSubcountyId = :subcountyId', {
  //       subcountyId: filters.subcountyId,
  //     });
  //   }

  //   if (filters?.wardId) {
  //     climateQueryBuilder.andWhere('climate.comWardId = :wardId', {
  //       wardId: filters.wardId,
  //     });

  //     healthQueryBuilder.andWhere('health.comWardId = :wardId', {
  //       wardId: filters.wardId,
  //     });
  //   }

  //   /* ------------------------------------------------------------------
  //    * EXECUTE QUERIES
  //    * ------------------------------------------------------------------ */
  //   const [climateData, healthData] = await Promise.all([
  //     climateQueryBuilder.getRawMany(),
  //     healthQueryBuilder.getRawMany(),
  //   ]);

  //   /* ------------------------------------------------------------------
  //    * COMBINE CLIMATE + HEALTH (STRICT ID MATCH)
  //    * ------------------------------------------------------------------ */
  //   const combinedData = climateData.map((climate) => {
  //     const wardHealthData = healthData.filter(
  //       (health) =>
  //         health.wardId === climate.wardId &&
  //         health.subcountyId === climate.subcountyId &&
  //         health.year === climate.year &&
  //         health.month === climate.month,
  //     );

  //     const maternalMortality =
  //       wardHealthData.find(
  //         (h) => h.indicator === 'MOH 711 MUAC 6 - 59 months Severe (Red)',
  //         // 'MOH 711 MUAC 6 - 59 months Severe (Red)',
  //       )?.value || 0;

  //     const malariaCases =
  //       wardHealthData.find((h) => h.indicator === 'Confirmed Malaria Cases')
  //         ?.value || 0;

  //     return {
  //       wardId: climate.wardId,
  //       ward: climate.ward,
  //       subcountyId: climate.subcountyId,
  //       subcounty: climate.subcounty,
  //       avgTemp: Number(Number(climate.temperature).toFixed(2)),
  //       precip: Number(Number(climate.precipitation).toFixed(2)),
  //       maternalMortality: Number(maternalMortality),
  //       malariaCases: Number(malariaCases),
  //       year: climate.year,
  //       month: climate.month,
  //     };
  //   });

  //   /* ------------------------------------------------------------------
  //    * RESPONSE
  //    * ------------------------------------------------------------------ */
  //   return {
  //     data: combinedData,
  //     healthData,
  //     filters: {
  //       startYear: defaultStartYear,
  //       endYear: defaultEndYear,
  //       startMonth: defaultStartMonth,
  //       endMonth: defaultEndMonth,
  //       subcountyId: filters?.subcountyId ?? null,
  //       wardId: filters?.wardId ?? null,
  //     },
  //   };
  // }

async getAllDataTable(filters?: {
  startYear?: number;
  endYear?: number;
  startMonth?: number;
  endMonth?: number;
  subcountyId?: string;
  wardId?: string;
}) {
  const defaultStartYear = filters?.startYear ?? 2022;
  const defaultEndYear = filters?.endYear ?? 2022;
  const defaultStartMonth = filters?.startMonth ?? 1;
  const defaultEndMonth = filters?.endMonth ?? 12;

  /* ------------------------------------------------------------------
   * RAW SQL: CLIMATE QUERY
   * ------------------------------------------------------------------ */
  const climateSql = `
    SELECT
      climate.com_ward_id AS "wardId",
      w.ward_name AS "ward",
      climate.com_subcounty_id AS "subcountyId",
      sc.subcounty_name AS "subcounty",
      (climate.com_max_zonal_stat_mean_t2m - 273.15) AS "temperature",
      (climate.com_sum_zonal_stat_sum_tp * 1000) AS "precipitation",
      climate.com_year AS "year",
      climate.com_month AS "month"
    FROM biz_aggregated_copernicus_era5_historical_ward_monthly climate
    LEFT JOIN biz_master_subcounties sc
      ON sc.subcounty_id = climate.com_subcounty_id
    LEFT JOIN biz_master_wards w
      ON w.ward_id = climate.com_ward_id
    WHERE (
      (
        $1::int = $4::int
        AND climate.com_year = $1::int
        AND climate.com_month BETWEEN $2::int AND $3::int
      )
      OR (
        $1::int <> $4::int
        AND (
          (climate.com_year = $1::int AND climate.com_month >= $2::int)
          OR (climate.com_year = $4::int AND climate.com_month <= $3::int)
          OR (climate.com_year > $1::int AND climate.com_year < $4::int)
        )
      )
    )
    ${filters?.subcountyId ? 'AND climate.com_subcounty_id = $5::text' : ''}
    ${filters?.wardId ? 'AND climate.com_ward_id = $6::text' : ''}
  `;

  /* ------------------------------------------------------------------
   * RAW SQL: HEALTH QUERY
   * ------------------------------------------------------------------ */
  const healthSql = `
    SELECT
      health.com_ward_id AS "wardId",
      health.com_subcounty_id AS "subcountyId",
      health.raw_dataelement_name AS "indicator",
      SUM(health.raw_value)::int AS "value",
      health.com_year AS "year",
      health.com_month AS "month"
    FROM biz_computed_khis_ward_month health
    WHERE health.raw_dataelement_name IN (
      'Confirmed Malaria Cases',
      'MOH 711 MUAC 6 - 59 months Severe (Red)'
    )
    AND (
      (
        $1::int = $4::int
        AND health.com_year = $1::int
        AND health.com_month BETWEEN $2::int AND $3::int
      )
      OR (
        $1::int <> $4::int
        AND (
          (health.com_year = $1::int AND health.com_month >= $2::int)
          OR (health.com_year = $4::int AND health.com_month <= $3::int)
          OR (health.com_year > $1::int AND health.com_year < $4::int)
        )
      )
    )
    ${filters?.subcountyId ? 'AND health.com_subcounty_id = $5::text' : ''}
    ${filters?.wardId ? 'AND health.com_ward_id = $6::text' : ''}
    GROUP BY
      health.com_ward_id,
      health.com_subcounty_id,
      health.raw_dataelement_name,
      health.com_year,
      health.com_month
  `;

  /* ------------------------------------------------------------------
   * PARAMETER ARRAY
   * ------------------------------------------------------------------ */
  const params: any[] = [
    defaultStartYear,   // $1
    defaultStartMonth,  // $2
    defaultEndMonth,    // $3
    defaultEndYear,     // $4
  ];

  if (filters?.subcountyId) params.push(filters.subcountyId); // $5
  if (filters?.wardId) params.push(filters.wardId); // $6

  /* ------------------------------------------------------------------
   * EXECUTE RAW SQL
   * ------------------------------------------------------------------ */
  const [climateData, healthData] = await Promise.all([
    this.dataSource.query(climateSql, params),
    this.dataSource.query(healthSql, params),
  ]);

  /* ------------------------------------------------------------------
   * COMBINE CLIMATE + HEALTH
   * ------------------------------------------------------------------ */
  const combinedData = climateData.map((climate) => {
    const wardHealthData = healthData.filter(
      (health) =>
        health.wardId === climate.wardId &&
        health.subcountyId === climate.subcountyId &&
        health.year === climate.year &&
        health.month === climate.month,
    );

    const maternalMortality =
      wardHealthData.find(
        (h) => h.indicator === 'MOH 711 MUAC 6 - 59 months Severe (Red)',
      )?.value ?? 0;

    const malariaCases =
      wardHealthData.find(
        (h) => h.indicator === 'Confirmed Malaria Cases',
      )?.value ?? 0;

    return {
      wardId: climate.wardId,
      ward: climate.ward,
      subcountyId: climate.subcountyId,
      subcounty: climate.subcounty,
      avgTemp: Number(Number(climate.temperature).toFixed(2)),
      precip: Number(Number(climate.precipitation).toFixed(2)),
      maternalMortality,
      malariaCases,
      year: climate.year,
      month: climate.month,
    };
  });

  /* ------------------------------------------------------------------
   * RESPONSE
   * ------------------------------------------------------------------ */
  return {
    data: combinedData,
    filters: {
      startYear: defaultStartYear,
      endYear: defaultEndYear,
      startMonth: defaultStartMonth,
      endMonth: defaultEndMonth,
      subcountyId: filters?.subcountyId ?? null,
      wardId: filters?.wardId ?? null,
    },
  };
}
}
