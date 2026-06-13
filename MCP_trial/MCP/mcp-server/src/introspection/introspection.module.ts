import { Module } from '@nestjs/common';
import { RepoModule } from '../repo/repo.module';
import { DatabaseModule } from '../database/database.module';
import { IntrospectionController } from './introspection.controller';
import { IntrospectionService } from './introspection.service';

@Module({
  imports: [RepoModule, DatabaseModule],
  controllers: [IntrospectionController],
  providers: [IntrospectionService],
})
export class IntrospectionModule {}
