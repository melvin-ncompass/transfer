import { Module } from '@nestjs/common';
import { AccountService, GroupService } from './account.service';
import { AccountController, GroupController } from './account.controller';
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
  controllers: [AccountController,GroupController],
  providers: [AccountService,GroupService],
})
export class AccountModule {}
