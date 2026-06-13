import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MigrationService } from './migration.service';
import { ParseStringPipe } from 'src/common/pipes/parse-string.pipe';
import { ignoreModuleClassInterceptor } from 'src/common/decorators/ignore-interceptor.decorator';

@ignoreModuleClassInterceptor()
@Controller('migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) { }

  @Post('generate_migration_script_master')
  async generateMasterMigrationScript(@Body('migrationName', new ParseStringPipe('migrationName')) migrationName: string) {
    return await this.migrationService.generateMasterMigrationScript(migrationName);
  }

  @Post('run_migration_master')
  async runMasterMigration() {
    return this.migrationService.runMasterMigration();
  }

  @Post('generate_migration_script_company')
  async generateCompanyMigrationScript(@Body('migrationName', new ParseStringPipe('migrationName')) migrationName: string) {
    return await this.migrationService.generateCompanyMigrationScript(migrationName);
  }

  @Post('run_migration_single_company')
  async runSingleCompanyMigration(@Body('companyId', new ParseStringPipe('companyId')) companyId: string,) {
    return await this.migrationService.runSingleCompanyMigration(companyId);
  }

  @Post('run_migration_all_company')
  async runAllCompanyMigration() {
    return await this.migrationService.runAllCompanyMigration();
  }

  @Post('demo_migration')
  async demoMigration() {
    return await this.migrationService.demoMigration();
  }


}

