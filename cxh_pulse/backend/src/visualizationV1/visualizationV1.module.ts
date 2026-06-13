import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClimateModule } from './climate/climate.module';
import { ConfigModule } from './config/config.module';
import { DataTableModule } from './data-table/data-table.module';

import { ForecastModule } from './forecast/forecast.module';
import { OverviewModule } from './overview/overview.module';
import { PromptsModule } from './prompts/prompts.module';
import { BizAggregatedCopernicusEra5HistoricalWardMonthly } from './entity/biz_aggregated_copernicus_era5_historical_ward_monthly.entity';
import { BizComputedKajiadoClimateProjections } from './entity/biz_computed_kajiado_climate_projects.entity';
import { BizComputedKajiadoMasterHealthFacilities } from './entity/biz_computed_kajiado_master_health_facilities.entity';
import { BizComputedKajiadoPopulation } from './entity/biz_computed_kajiado_population.entity';
// import { BizRawKajiadoProjections } from './entity/biz_computed_kajiado_projections.entity';
import { BizComputedKajiadoWards } from './entity/biz_computed_kajiado_wards.entity';
import { BizComputedKhisWardMonth } from './entity/biz_computed_khis_ward_month.entity';
import { BizComputedPromptsWardMonth } from './entity/biz_computed_prompts_ward_month.entity';
@Module({
  imports: [
    ConfigModule,
    DataTableModule,
    // TypeOrmModule.forRootAsync({
    //   name: 'visualizationConnection',
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => {
    //     return {
    //       type: 'postgres',
    //       host: configService.get('VISUALIZATION_DB_HOST'),
    //       port: configService.get('VISUALIZATION_DB_PORT'),
    //       username: configService.get('VISUALIZATION_DB_USERNAME'),
    //       password: configService.get('VISUALIZATION_DB_PASSWORD'),
    //       database: configService.get('VISUALIZATION_DB_NAME'),
    //       entities: [
    //         BizComputedCopernicusEra5,
    //         BizComputedKajiadoMasterHealthFacilities,
    //         BizComputedKhisWardMonth,
    //         BizComputedPromptsWardMonth,
    //         BizAggregatedCopernicusEra5WardMonth,
    //         BizComputedKajiadoWards,
    //       ],
    //       synchronize: false, // Never auto-sync for secondary read-only DB
    //       logging: configService.get('NODE_ENV') === 'development',
    //       ssl:
    //         configService.get('NODE_ENV') === 'production'
    //           ? { rejectUnauthorized: false }
    //           : false,
    //     };
    //   },
    //   inject: [ConfigService],
    // }),
    TypeOrmModule.forFeature(
      [
        BizAggregatedCopernicusEra5HistoricalWardMonthly,
        BizComputedKajiadoMasterHealthFacilities,
        BizComputedKhisWardMonth,
        BizComputedPromptsWardMonth,
        BizComputedKajiadoWards,
        BizComputedKajiadoPopulation,
        // BizRawKajiadoProjections,
        BizComputedKajiadoClimateProjections
      ],
      // 'visualizationConnection',
    ),
    ForecastModule,
    OverviewModule,
    ClimateModule,
    PromptsModule,
  ],
})
export class VisualizationV1Module { }
