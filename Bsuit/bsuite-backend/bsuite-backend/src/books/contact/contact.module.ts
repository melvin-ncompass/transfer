import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
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
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
