import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { DatabaseModule } from 'src/database/database.module';
import { MigrationModule } from 'src/migration/migration.module';
import { Company } from './entities/company.entity';
import { MagicToken } from './entities/magic-token.entity';
import { UserCompanyRelation } from './entities/user-company-relation.entity';
import { safeImportModule, safeLoadEntities } from 'src/shared/utils';
import { CompanySetting } from '../setting/entities/tenant.company-setting.entity';
import { Role } from 'src/rba/entities/role.entity';
import { UserRole } from 'src/rba/entities/user-role.entity';
import { ActivityModule } from 'src/activity/activity.module';
import { Session } from 'src/auth/entities/session.entity';
import { GcsService } from 'src/user/gcs.service';
import { RbaModule } from 'src/rba/rba.module';

const AuthModule = safeImportModule('../auth/auth.module');
const authEntities = safeLoadEntities('../auth/entities')

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, ...(authEntities ? [User, Session] : []), UserCompanyRelation, MagicToken, Role, UserRole]),
    MigrationModule,
    DatabaseModule,
    RbaModule,
    ...(AuthModule ? [AuthModule] : []),
    ActivityModule
  ],
  controllers: [CompanyController],
  providers: [CompanyService, GcsService],
  exports: [CompanyService]
})
export class CompanyModule { }
