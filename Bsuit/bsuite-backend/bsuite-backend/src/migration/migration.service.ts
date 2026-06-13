import { forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompanyService } from 'src/company/company.service';
import Vault from 'node-vault';
import { DataSource } from 'typeorm';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { CompanySetting } from 'src/setting/entities/tenant.company-setting.entity';
import { CompanyIdentity, CompanyMetaData } from 'src/setting/entities/tenant.company-identity.entity';
import { Reminders } from 'src/reminder/entities/reminder.entity';
import { InvoiceTemplate } from 'src/setting/entities/tenant.invoice-template.entity';

const execPromise = promisify(exec);

@Injectable()
export class MigrationService {
  private vault: Vault.client;

  constructor(
    @Inject(forwardRef(() => CompanyService))
    private readonly companyService: CompanyService,
    private readonly config: ConfigService,
  ) {
    this.vault = Vault({
      endpoint: this.config.get('VAULT_ENDPOINT'),
      token: this.config.get('VAULT_ADMIN_TOKEN'),
    });
  }

  private createDataSource(dbName: string, username: string, password: string, migrations: any, entities: any): DataSource {
    return new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT!, 10),
      username,
      password,
      database: dbName,
      entities,
      migrations,
      synchronize: false,
      name: dbName,
      logging: ['query', 'schema', 'migration'],
    });
  }

  private async createMigrationRoleAndGenerateCreds(companyId: string) {

    const dbConfigName = `${companyId}-db`;
    const roleName = `${companyId}-migration-role`;

    try {
      const existing = await this.vault.read(`database/config/${dbConfigName}`);

      const allowed = existing.data.allowed_roles || [];

      if (!allowed.includes(roleName)) {
        allowed.push(roleName);
      }

      await this.vault.write(`database/config/${dbConfigName}`, {
        ...existing.data,
        allowed_roles: allowed,
      });

      console.log(`Updated allowed_roles for ${dbConfigName}`);
    } catch (err) {
      console.error("Failed to update allowed_roles:", err?.response || err);
      throw err;
    }

    const ttl = "2h";

    try {

      await this.vault.write(`database/roles/${roleName}`, {
        db_name: dbConfigName,
        creation_statements: `
        CREATE ROLE "{{name}}" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';
        ALTER USER "{{name}}" WITH SUPERUSER;
          GRANT USAGE ON SCHEMA public TO "{{name}}";

          GRANT CREATE ON SCHEMA public TO "{{name}}";
          ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "{{name}}";
          ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "{{name}}";
        `,
        default_ttl: ttl,
        max_ttl: ttl,
      });

      console.log(`Migration role created: ${roleName}`);

      const credsResp = await this.vault.read(`database/creds/${roleName}`);

      return {
        username: credsResp.data.username,
        password: credsResp.data.password,
      };

    } catch (err) {
      console.error("Vault migration role error:", err?.response || err);
      throw new InternalServerErrorException("Failed to create migration role or generate credentials:", err);
    }
  }

  private async CompanyMigration(dbName: string, username: string, password: string): Promise<string> {

    const entities = [path.join(__dirname, '..', 'books', '**', 'entities', 'tenant*.entity.{ts,js}'), path.join(__dirname, '..', 'people', '**', 'entities', 'tenant*.entity.{ts,js}'), CompanySetting, CompanyIdentity, CompanyMetaData, InvoiceTemplate,Reminders]
    const migrations = [path.join(__dirname, 'company-migration-scripts', '*.{ts,js}')]

    const dataSource = this.createDataSource(dbName, username, password, migrations, entities);

    try {
      await dataSource.initialize();

      const pendingMigrations = await dataSource.showMigrations();

      if (!pendingMigrations) {
        await dataSource.destroy();
        return `No pending migrations found for ${dbName}.`;
      }

      const executed = await dataSource.runMigrations();

      await dataSource.destroy();

      return `Migrations completed successfully for ${dbName}. Executed: ${executed.length} scripts.`;

    } catch (error) {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
      throw new Error(`Migration failure for ${dbName}: ${error.message}`);
    }
  }

  async generateMasterMigrationScript(migrationName: string) {
    if (!migrationName || migrationName.trim() === '') {
      throw new Error('Migration name cannot be empty.');
    }

    const migrationDir = path.join(process.cwd(), 'src/migration/master-migration-scripts');

    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }

    const fullPathToMigration = path.join(migrationDir, migrationName);

    const command = `ts-node -r tsconfig-paths/register node_modules/typeorm/cli.js migration:generate -d src/migration/data-sources/master-data-source.ts "${fullPathToMigration}"`;;

    try {
      const { stdout, stderr } = await execPromise(command, {
        cwd: process.cwd(),
      });

      if (stderr && !stderr.toLowerCase().includes('deprecated')) {
        console.warn('Migration stderr:', stderr);
      }

      return `Migration generated successfully: ${stdout.trim()}`;
    } catch (error: any) {
      console.error('Attempted command:', command);
      console.error('Migration error:', error.stderr || error.message);
      throw new Error(
        `Migration script generation failed: ${error.stderr || error.message}`
      );
    }
  }

  async runMasterMigration() {
    const dbName = process.env.DB_NAME!
    const username = process.env.DB_USERNAME!
    const password = process.env.DB_PASSWORD!
    const migrations = [path.join(__dirname, 'master-migration-scripts', '*.{ts,js}')]
    const entities = [path.join(__dirname, '..', '**', 'entities', '[!tT]*.entity.{ts,js}')]

    const dataSource = this.createDataSource(dbName, username, password, migrations, entities);

    try {
      await dataSource.initialize();

      const pendingMigrations = await dataSource.showMigrations();

      if (!pendingMigrations) {
        await dataSource.destroy();
        return `No pending migrations found for ${dbName}.`;
      }

      const executed = await dataSource.runMigrations();

      await dataSource.destroy();

      return `Migrations completed successfully for ${dbName}. Executed: ${executed.length} scripts.`;

    } catch (error) {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
      throw new Error(`Migration failure for ${dbName}: ${error.message}`);
    }
  }

  async generateCompanyMigrationScript(migrationName: string) {

    if (!migrationName || migrationName.trim() === '') {
      throw new Error('Migration name cannot be empty.');
    }

    const migrationDir = path.join(process.cwd(), 'src/migration/company-migration-scripts');

    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }

    const command = `ts-node -r tsconfig-paths/register node_modules/typeorm/cli.js migration:generate -d src/migration/data-sources/demo-company-data-source.ts "${migrationDir}/${migrationName}"`;

    try {
      const { stdout, stderr } = await execPromise(command, {
        cwd: process.cwd(),
      });

      return `Script generated:\n${stdout.trim()}`;
    } catch (error) {
      throw new Error(`Migration script generation failed: ${error.message}`);
    }
  }

  async demoMigration() {
    const dbName = process.env.DEMO!
    const username = process.env.DB_USERNAME!
    const password = process.env.DB_PASSWORD!

    await this.CompanyMigration(dbName, username, password)
  }

  async runSingleCompanyMigration(companyId: string) {
    const { username, password } = await this.createMigrationRoleAndGenerateCreds(companyId);
    await this.CompanyMigration(`${companyId}_db`, username, password)
  }

  async runAllCompanyMigration() {
    const companies = await this.companyService.findAll();

    for (const company of companies) {
      try {
        const { companyId } = company
        const { username, password } = await this.createMigrationRoleAndGenerateCreds(companyId);

        await this.CompanyMigration(`${companyId}_db`, username, password)

        console.log(`Migration completed for company ${company.id} (${company})`);
      } catch (error) {
        console.error(`Error processing migration for company ${company.id}:`, error);
      }
    }
  }

}