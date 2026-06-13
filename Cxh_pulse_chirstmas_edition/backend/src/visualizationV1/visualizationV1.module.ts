import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BizComputedCopernicusEra5 } from 'src/visualizationV1/entity/biz_computed_copernicus_era5.entity';
import { BizComputedKajiadoMasterHealthFacilities } from 'src/visualizationV1/entity/biz_computed_kajiado_master_health_facilities.entity';
import { BizComputedKhisWardMonth } from 'src/visualizationV1/entity/biz_computed_khis_ward_month.entity';
import { BizComputedPromptsWardMonth } from 'src/visualizationV1/entity/biz_computed_prompts_ward_month.entity';
import { BizAggregatedCopernicusEra5WardMonth } from 'src/visualizationV1/entity/biz_aggregated_copernicus_era5_ward_month.entity';
import { BizComputedKajiadoWards } from 'src/visualizationV1/entity/biz_computed_kajiado_wards.entity';
import { ConfigModule } from './config/config.module';
import { VisualizationV1Controller } from './visualizationV1.controller';
import { VisualizationV1Service } from './visualizationV1.service';
import { DataTableModule } from './data-table/data-table.module';
import { BizRawKajiadoPopulation } from './entity/biz_raw_kajiado_population.entity';
import { BizRawKajiadoProjections } from './entity/biz_computed_kajiado_projections.entity';
import { BizComputedKhisWardMonthV2 } from './entity/biz_computed_khis_ward_month_v2.entity';
import { BizAggregatedCopernicusEra5WardMonthV2 } from './entity/biz_aggregated_copernicus_era5_ward_month_v2.entity';
import { BizComputedKajiadoClimateProjections } from './entity/biz_computed_kajiado_climate_projects.entity';
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
        BizComputedCopernicusEra5,
        BizComputedKajiadoMasterHealthFacilities,
        BizComputedKhisWardMonth,
        BizComputedKhisWardMonthV2,
        BizComputedPromptsWardMonth,
        BizAggregatedCopernicusEra5WardMonth,
        BizAggregatedCopernicusEra5WardMonthV2,
        BizComputedKajiadoWards,
        BizRawKajiadoPopulation,
        BizRawKajiadoProjections,
        BizComputedKajiadoClimateProjections
      ],
      // 'visualizationConnection',
    ),
  ],
  controllers: [VisualizationV1Controller],
  providers: [VisualizationV1Service],
  exports: [VisualizationV1Service],
})
export class VisualizationV1Module {}
