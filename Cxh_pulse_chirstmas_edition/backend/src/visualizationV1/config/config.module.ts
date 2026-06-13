import { BizConfig } from '../entity/biz_config.entity';
import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModule } from 'scaffolding/user/roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([BizConfig]), RoleModule],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [],
})
export class ConfigModule {}
