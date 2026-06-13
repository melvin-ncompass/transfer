import { forwardRef, Module } from '@nestjs/common';
import { RbaService } from './rba.service';
import { RbaController } from './rba.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module as BsuiteModule } from './entities/module.entity';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { Company } from 'src/company/entities/company.entity';
import { DatabaseModule } from 'src/database/database.module';
import { CompanyModule } from 'src/company/company.module';
import { User } from 'src/auth/entities/user.entity';
import { UserCompanyRelation } from 'src/company/entities/user-company-relation.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([BsuiteModule, Permission,Role,UserRole,Company,User,UserCompanyRelation]),   
      DatabaseModule,
      forwardRef(() => CompanyModule),
    ],
  controllers: [RbaController],
  providers: [RbaService],
  exports: [RbaService],
})
export class RbaModule {}
