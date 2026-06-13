import { Module } from '@nestjs/common';
import { SeriesConfigController } from './series-config.controller';
import {  SeriesConfigService } from './series-config.service';
import { CompanyModule } from 'src/company/company.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule, CompanyModule],
  controllers: [ SeriesConfigController, ],
  providers: [ SeriesConfigService, ],
  exports: []
})
export class  SeriesConfigModule {}
