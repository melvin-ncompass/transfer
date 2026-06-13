import { Module } from '@nestjs/common';
import { SettingService } from './setting.service';
import { SettingController } from './setting.controller';
import { CompanyModule } from 'src/company/company.module';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCompanyRelation } from 'src/company/entities/user-company-relation.entity';
import { GcsService } from '../user/gcs.service';
import { Company } from 'src/company/entities/company.entity';
import { UserRole } from 'src/rba/entities/user-role.entity';
import { ActivityModule } from 'src/activity/activity.module';
import { safeLoadEntities } from 'src/shared/utils';
import { User } from 'src/auth/entities/user.entity';
import { MagicToken } from 'src/company/entities/magic-token.entity';
import { Role } from 'src/rba/entities/role.entity';
import { EmailService } from 'src/auth/mail.service';

const authEntities = safeLoadEntities('../auth/entities')

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, ...(authEntities ? [User] : []), UserCompanyRelation, MagicToken, Role, UserRole] ),
    CompanyModule,
    DatabaseModule,
    ActivityModule
    
  ],
  controllers: [SettingController],
  providers: [SettingService,GcsService,EmailService],
  exports: [SettingService],
})
export class SettingModule {}
