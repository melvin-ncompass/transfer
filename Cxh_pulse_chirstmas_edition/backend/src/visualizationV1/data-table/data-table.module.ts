import { Module } from '@nestjs/common';
import { DataTableService } from './data-table.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModule } from 'scaffolding/user/roles/roles.module';
import { BizAggregatedCopernicusEra5WardMonthV2 } from '../entity/biz_aggregated_copernicus_era5_ward_month_v2.entity';
import { DataTableController } from './data-table.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BizAggregatedCopernicusEra5WardMonthV2]),
    RoleModule,
  ],
  controllers: [DataTableController],
  providers: [DataTableService],
})
export class DataTableModule {}
