import { forwardRef, Module } from '@nestjs/common';
import { MigrationService } from './migration.service';
import { MigrationController } from './migration.controller';
import { CompanyModule } from 'src/company/company.module';


@Module({
  imports:[forwardRef(() => CompanyModule)],
  controllers: [MigrationController],
  providers: [MigrationService],
  exports:[MigrationService]
})
export class MigrationModule {}
