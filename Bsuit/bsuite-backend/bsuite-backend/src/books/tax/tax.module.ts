import { Module } from '@nestjs/common';
import { TaxService } from './tax.service';
import { TaxController } from './tax.controller';
import { DatabaseModule } from 'src/database/database.module';
import { CompanyModule } from 'src/company/company.module';
import { ActivityModule } from 'src/activity/activity.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from 'src/company/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]),
    DatabaseModule,
    CompanyModule,
    ActivityModule
  ],
  controllers: [TaxController],
  providers: [TaxService],
})
export class TaxModule { }
