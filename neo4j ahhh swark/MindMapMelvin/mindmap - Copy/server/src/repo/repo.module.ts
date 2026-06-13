import { Module } from '@nestjs/common';
import { RepoService } from './repo.service';
import { RepoController } from './repo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Project } from 'src/entities/project.entity';

@Module({
  imports: [
     TypeOrmModule.forFeature([
      User,
      Project
     ])
  ],
  controllers: [RepoController],
  providers: [RepoService],
})
export class RepoModule {}
