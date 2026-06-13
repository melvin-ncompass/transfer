import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModule } from 'scaffolding/user/roles/roles.module';
;
import { DataTableController } from './data-table.controller';
import { DataTableService } from './data-table.service';
import { BizAggregatedCopernicusEra5HistoricalWardMonthly } from '../entity/biz_aggregated_copernicus_era5_historical_ward_monthly.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BizAggregatedCopernicusEra5HistoricalWardMonthly]),
    RoleModule,
  ],
  controllers: [DataTableController],
  providers: [DataTableService],
})
export class DataTableModule { }
