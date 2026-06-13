import { Module } from '@nestjs/common';
import { RepoService } from './repo.service';
import { RepoController } from './repo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Project } from 'src/entities/project.entity';
import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Project]),
    MulterModule.register({
      storage: multer.memoryStorage(),
      // limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    }),
  ],
  controllers: [RepoController],
  providers: [RepoService],
})
export class RepoModule {}
