import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { User } from 'src/auth/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from 'src/auth/entities/session.entity';
import { ProducerService } from 'src/rmq/producer.service';
import { UserCompanyRelation } from 'src/company/entities/user-company-relation.entity';
import { Company } from 'src/company/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, UserCompanyRelation, Company]),
    ActivityModule
  ],
  controllers: [ActivityController],
  providers: [ActivityService, ProducerService],
  exports: [ActivityService],
})
export class ActivityModule { }