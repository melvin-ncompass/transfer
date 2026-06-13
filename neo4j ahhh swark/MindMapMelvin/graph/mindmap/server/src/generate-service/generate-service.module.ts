import { Module } from '@nestjs/common';
import { GenerateServiceController } from './generate-service.controller';
import { GenerateService } from './generate-service.service';
import { GenerateDiagramService } from './utils/generate-d2.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Project } from 'src/entities/project.entity';
import { GeneratedOutput } from 'src/entities/generated-output.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, 
      Project,
      GeneratedOutput
    ])],
  controllers: [GenerateServiceController],
  providers: [GenerateService, GenerateDiagramService],
})
export class GenerateServiceModule {}
