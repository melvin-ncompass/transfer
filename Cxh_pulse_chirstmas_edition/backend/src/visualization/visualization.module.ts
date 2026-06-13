import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VisualizationController } from './visualization.controller';
import { VisualizationService } from './visualization.service';
import { BizComputedCopernicusEra5 } from '../visualizationV1/entity/biz_computed_copernicus_era5.entity';
import { BizComputedKajiadoMasterHealthFacilities } from '../visualizationV1/entity/biz_computed_kajiado_master_health_facilities.entity';
import { BizComputedKhisWardMonth } from '../visualizationV1/entity/biz_computed_khis_ward_month.entity';
import { BizComputedPromptsWardMonth } from '../visualizationV1/entity/biz_computed_prompts_ward_month.entity';
import { BizAggregatedCopernicusEra5WardMonth } from '../visualizationV1/entity/biz_aggregated_copernicus_era5_ward_month.entity';
import { BizComputedKajiadoWards } from '../visualizationV1/entity/biz_computed_kajiado_wards.entity';
import { BizPermission } from '../visualizationV1/entity/biz_permission.entity';
import { BizRolePermission } from '../visualizationV1/entity/biz_role_permission.entity';
import { BizComputedKhisWardMonthV2 } from 'src/visualizationV1/entity/biz_computed_khis_ward_month_v2.entity';
import { BizAggregatedCopernicusEra5WardMonthV2 } from 'src/visualizationV1/entity/biz_aggregated_copernicus_era5_ward_month_v2.entity';

@Module({
  imports: [
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
        BizPermission,
        BizRolePermission,
      ],
      // 'visualizationConnection',
    ),
  ],
  controllers: [VisualizationController],
  providers: [VisualizationService],
  exports: [VisualizationService],
})
export class VisualizationModule {}
