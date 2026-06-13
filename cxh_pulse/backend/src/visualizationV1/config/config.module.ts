import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModule } from 'scaffolding/user/roles/roles.module';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';
import { BizConfig } from '../entity/biz_config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BizConfig]), RoleModule],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [],
})
export class ConfigModule { }
