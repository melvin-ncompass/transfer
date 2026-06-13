import {
  Injectable,
  Logger,
  InternalServerErrorException,
  ConflictException,
} from "@nestjs/common";
import { Client } from "pg";
import Vault from "node-vault";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import path from "path";
import { CompanySetting } from "src/setting/entities/tenant.company-setting.entity";
import {
  CompanyIdentity,
  CompanyMetaData,
} from "src/setting/entities/tenant.company-identity.entity";
import { InvoiceTemplate } from "src/setting/entities/tenant.invoice-template.entity";
import { Reminders } from "src/reminder/entities/reminder.entity";
interface DbCredentials {
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  lease_id?: string;
  lease_duration?: number;
  renewable?: boolean;
}
@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);
  private vaultAdmin: any;
  private tenantDataSources: Map<
    string,
    { ds: DataSource; leaseId?: string; timeoutRef?: NodeJS.Timeout }
  > = new Map();
  constructor(private config: ConfigService) {
    this.vaultAdmin = Vault({
      apiVersion: "v1",
      endpoint: this.config.get<string>("VAULT_ENDPOINT"),
      token: this.config.get<string>("VAULT_ADMIN_TOKEN"),
    });
  }
  private getDbSuperClient() {
    return new Client({
      host: this.config.get<string>("DB_HOST"),
      port: Number(this.config.get<number>("DB_PORT")),
      user: String(this.config.get<string>("DB_USERNAME")),
      password: String(this.config.get<string>("DB_PASSWORD")),
    });
  }
  private async vaultAdminWrite(path: string, body: any) {
    try {
      return await this.vaultAdmin.write(path, body);
    } catch (err) {
      this.logger.error(`Vault write failed: ${path}`, err?.message || err);
      throw err;
    }
  }
  private async vaultAdminRead(path: string) {
    try {
      return await this.vaultAdmin.read(path);
    } catch (err) {
      this.logger.error(`Vault read failed: ${path}`, err?.message || err);
      throw err;
    }
  }
  private async vaultAdminDelete(path: string) {
    try {
      return await this.vaultAdmin.delete(path);
    } catch (err) {
      this.logger.error(`Vault delete failed: ${path}`, err?.message || err);
      throw err;
    }
  }
  private async grantVaultAdminPrivileges(dbName: string) {
    const client = this.getDbSuperClient();
    await client.connect();
    try {
      this.logger.log(`Granted vault_admin privileges on database ${dbName}`);
      await client.query(`ALTER ROLE vault_admin WITH SUPERUSER;`);
    } catch (err) {
      this.logger.error(
        `Failed to grant vault_admin privileges on ${dbName}`,
        err
      );
      throw new InternalServerErrorException(
        `Failed to grant privileges to vault_admin`
      );
    } finally {
      await client.end();
    }
  }
  private async createTenantDatabase(tenantId: string) {
    const dbName = `${tenantId}_db`;
    const vaultAdminUser = this.config.get<string>("DB_VAULT_ADMIN_USER");
    const client = this.getDbSuperClient();
    await client.connect();
    try {
      const check = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [dbName]
      );
      if (check.rows.length > 0) return;
      // Create the DB and immediately assign ownership to the vault admin user
      await client.query(
        `CREATE DATABASE "${dbName}" OWNER "${vaultAdminUser}"`
      );
      this.logger.log(`Created database ${dbName} owned by ${vaultAdminUser}`);
    } catch (err) {
      this.logger.error(`Failed to create database ${dbName}`, err);
      throw new InternalServerErrorException(
        `Failed to create tenant database`
      );
    } finally {
      await client.end();
    }
  }
  private async configureVaultForTenant(tenantId: string) {
    const dbName = `${tenantId}_db`;
    const dbConfig = `${tenantId}-db`;
    const dbRole = `${tenantId}-role`;
    // 1. Keep connection to 'postgres' so cleanup is always possible
    const maintenanceUrl = `postgresql://{{username}}:{{password}}@${this.config.get<string>("DB_HOST")}:${this.config.get<number>("DB_PORT")}/postgres?sslmode=disable`;
    await this.vaultAdminWrite(`database/config/${dbConfig}`, {
      plugin_name: "postgresql-database-plugin",
      allowed_roles: [dbRole],
      connection_url: maintenanceUrl,
      username: String(this.config.get<string>("DB_VAULT_ADMIN_USER")),
      password: String(this.config.get<string>("DB_VAULT_ADMIN_PASSWORD")),
    });
    // 2. The critical change: Use fully qualified GRANTs or "In Database" logic
    // Since we are connected to 'postgres', we grant CONNECT first.
    // Then we use a special trick: ALTER DEFAULT PRIVILEGES for the WHOLE database.
    const creationStatements = [
      `CREATE ROLE "{{name}}" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';`,
      `GRANT CONNECT ON DATABASE "${dbName}" TO "{{name}}";`,
      // Switch schema context for the following commands
      `ALTER ROLE "{{name}}" SET search_path TO public;`,
      // Instead of "ALL TABLES" (which only looks at current DB),
      // we must ensure that as soon as they log into the tenant DB, they have rights.
      // We do this by granting the role to the vault_admin which owns the DB.
      `GRANT "${this.config.get<string>("DB_VAULT_ADMIN_USER")}" TO "{{name}}";`,
      `ALTER ROLE "{{name}}" SET ROLE "${this.config.get<string>("DB_VAULT_ADMIN_USER")}";`,
    ];
    await this.vaultAdminWrite(`database/roles/${dbRole}`, {
      db_name: dbConfig,
      creation_statements: creationStatements.join(" "),
      default_ttl: "1h",
      max_ttl: "24h",
    });
  }
  async createTenantPolicy(tenantId: string) {
    const policyName = `${tenantId}-policy`;
    const policyHCL = `
      path "tenant-secrets/data/${tenantId}/*" {
       capabilities = ["create", "update", "read", "delete", "list"]
       }
       path "tenant-secrets/metadata/${tenantId}/*" {
       capabilities = ["read", "list"]
       }
       path "tenant-secrets/*" {
       capabilities = ["deny"]
       }`;
    try {
      await this.vaultAdminWrite(`sys/policies/acl/${policyName}`, {
        policy: policyHCL,
      });
      this.logger.log(`Created Vault policy ${policyName}`);
      return policyName;
    } catch (err) {
      this.logger.error(
        `Failed to create policy ${policyName}`,
        err?.message || err
      );
      throw new InternalServerErrorException("Failed to create tenant policy");
    }
  }
  private async createTenantUserToken(
    userId: string,
    tenantId: string,
    policyName: string
  ) {
    try {
      const resp = await this.vaultAdminWrite("auth/token/create", {
        policies: [policyName],
        meta: { userId, tenantId },
        ttl: "1h",
      });
      const token = resp?.auth?.client_token;
      if (!token)
        throw new InternalServerErrorException(
          "Vault did not return client token"
        );
      this.logger.log(
        `Created Vault token for user ${userId} on tenant ${tenantId}`
      );
      return token as string;
    } catch (err) {
      this.logger.error(
        "Failed to create tenant user token",
        err?.message || err
      );
      throw new InternalServerErrorException(
        "Failed to create tenant user token"
      );
    }
  }
  async getTenantDbCredentials(tenantId: string) {
    const dbRole = `${tenantId}-role`;
    try {
      const resp = await this.vaultAdminRead(`database/creds/${dbRole}`);
      const data = resp.data || {};
      const creds: DbCredentials = {
        username: data.username,
        password: data.password,
        database: `${tenantId}_db`,
        host: this.config.get<string>("DB_HOST")!,
        port: Number(this.config.get<number>("DB_PORT")),
        lease_id: resp.lease_id,
        lease_duration: resp.lease_duration,
        renewable: resp.renewable,
      };
      if (creds.lease_id && creds.lease_duration) {
        this.logger.log(
          `Received DB creds for tenant ${tenantId}, lease ${creds.lease_id} (${creds.lease_duration}s)`
        );
      }
      return creds;
    } catch (err) {
      this.logger.error(
        `Failed to get DB credentials for tenant ${tenantId}`,
        err?.message || err
      );
      throw new InternalServerErrorException(
        `Vault could not issue DB credentials for tenant ${tenantId}`
      );
    }
  }
  async getTenantDataSource(tenantId: string) {
    const cached = this.tenantDataSources.get(tenantId);
    if (cached && cached.ds && cached.ds.isInitialized) {
      return cached.ds;
    }
    const creds = await this.getTenantDbCredentials(tenantId);
    const ds = new DataSource({
      type: "postgres",
      host: creds.host,
      port: creds.port,
      username: creds.username,
      password: creds.password,
      database: creds.database,
      entities: [
        path.join(
          __dirname,
          "..",
          "books",
          "**",
          "entities",
          "tenant*.entity.{ts,js}"
        ),
        path.join(
          __dirname,
          "..",
          "people",
          "**",
          "entities",
          "tenant*.entity.{ts,js}"
        ),
        CompanySetting,
        CompanyIdentity,
        CompanyMetaData,
        InvoiceTemplate,
        Reminders
      ],
      synchronize: false,
      name: `tenant_${tenantId}`,
    });
    try {
      await ds.initialize();
      this.logger.log(`Initialized tenant DataSource for ${tenantId}`);
    } catch (err) {
      this.logger.error(
        `Failed to initialize datasource for tenant ${tenantId}`,
        err?.message || err
      );
      if (creds.lease_id) {
        try {
          await this.vaultAdminWrite("sys/leases/revoke", {
            lease_id: creds.lease_id,
          });
        } catch (revErr) {
          this.logger.warn(
            "Failed to revoke lease after datasource init failure",
            revErr?.message || revErr
          );
        }
      }
      throw new InternalServerErrorException(
        `Failed to initialize tenant datasource for ${tenantId}`
      );
    }
    const timeoutRef = creds.lease_duration
      ? setTimeout(
        async () => {
          this.logger.log(
            `Lease expired for tenant ${tenantId} (revoking & cleaning datasource)`
          );
          await this.cleanupTenantDataSource(tenantId);
        },
        (creds.lease_duration + 5) * 1000
      )
      : undefined;
    this.tenantDataSources.set(tenantId, {
      ds,
      leaseId: creds.lease_id,
      timeoutRef,
    });
    return ds;
  }
  // Add the 'shouldRevoke' parameter, defaulting to true for normal lease expiry
  private async cleanupTenantDataSource(tenantId: string, shouldRevoke = true) {
    const entry = this.tenantDataSources.get(tenantId);
    if (!entry) return;
    try {
      if (entry.ds && entry.ds.isInitialized) {
        await entry.ds.destroy();
        this.logger.log(`Destroyed DataSource for tenant ${tenantId}`);
      }
    } catch (err) {
      this.logger.warn("Error destroying DataSource", err?.message);
    }
    // ONLY revoke if we aren't in the middle of a 'removeTenant' call
    if (shouldRevoke && entry.leaseId) {
      try {
        await this.vaultAdminWrite("sys/leases/revoke", {
          lease_id: entry.leaseId,
        });
      } catch (err) {
        this.logger.warn(
          "Lease revocation failed during cleanup",
          err?.message
        );
      }
    }
    if (entry.timeoutRef) clearTimeout(entry.timeoutRef);
    this.tenantDataSources.delete(tenantId);
  }
  async onboardTenant(tenantId: string) {
    if (!tenantId) throw new InternalServerErrorException("tenantId required");
    await this.createTenantDatabase(tenantId);
    await this.grantVaultAdminPrivileges(tenantId);
    await this.configureVaultForTenant(tenantId);
    await this.createTenantPolicy(tenantId);
    return {
      tenantId,
      dbName: `${tenantId}_db`,
      dbConfig: `${tenantId}-db`,
      dbRole: `${tenantId}-role`,
      policy: `${tenantId}-policy`,
    };
  }
  async onboardTenantUser(
    tenantId: string
    // userId: string
  ) {
    if (!tenantId)
      throw new InternalServerErrorException("tenantId and userId required");
    const tenantPolicy = await this.createTenantPolicy(tenantId);
    // const token = await this.createTenantUserToken(userId, tenantId, tenantPolicy);
    const dbCreds = await this.getTenantDbCredentials(tenantId);
    return {
      message: `Tenant user onboarded for ${tenantId}`,
      // vaultToken: token,
      assignedPolicy: `${tenantId}-policy`,
      dbCreds,
    };
  }
  async storeTenantSecret(
    tenantId: string,
    secretKey: string,
    secretValue: any
  ) {
    const path = `tenant-secrets/data/${tenantId}/${secretKey}`;
    try {
      await this.vaultAdminWrite(path, { data: { value: secretValue } });
      this.logger.log(`Stored tenant secret at ${path}`);
    } catch (err) {
      throw new InternalServerErrorException("Failed to store tenant secret");
    }
  }
  async getTenantSecretWithToken(
    tenantId: string,
    secretKey: string,
    tenantToken: string
  ) {
    const client = Vault({
      endpoint: this.config.get("VAULT_ENDPOINT"),
      token: tenantToken,
    });
    const path = `tenant-secrets/data/${tenantId}/${secretKey}`;
    try {
      const resp = await client.read(path);
      return resp?.data?.data?.value;
    } catch (err) {
      this.logger.error(
        "Failed to read tenant secret with token",
        err?.message || err
      );
      throw new InternalServerErrorException("Failed to read tenant secret");
    }
  }
  async getTenantSecret(tenantId: string, secretKey: string) {
    const path = `tenant-secrets/data/${tenantId}/${secretKey}`;
    try {
      const resp = await this.vaultAdminRead(path);
      return resp?.data?.data?.value;
    } catch (err) {
      this.logger.error(
        "Failed to admin-read tenant secret",
        err?.message || err
      );
      throw new InternalServerErrorException("Failed to read tenant secret");
    }
  }
  async revokeToken(token: string) {
    try {
      await this.vaultAdminWrite("auth/token/revoke", { token });
      this.logger.log("Revoked Vault token");
    } catch (err) {
      this.logger.warn("Failed to revoke token", err?.message || err); 
    }
  }
  async destroyAllTenantDataSources() {
    for (const [tenantId] of this.tenantDataSources) {
      try {
        await this.cleanupTenantDataSource(tenantId);
      } catch (err) {
        this.logger.warn("Error cleaning tenant DS", err?.message || err);
      }
    }
  }
  async removeTenantUser(tenantId: string, userId: number) {
    const policyName = `${tenantId}-policy`;
    try {
      await this.vaultAdminDelete(`sys/policies/acl/${policyName}`);
      // remove the token and revoke the permissions in future when createToken is activated
      this.logger.log(
        `Deleted Vault policy ${policyName} for tenant user ${userId}`
      );
    } catch (err) {
      this.logger.warn(
        `Failed to delete policy ${policyName} for tenant user ${userId}`,
        err?.message || err
      );
    }
  }
  async removeTenant(tenantId: string) {
    if (!tenantId) throw new InternalServerErrorException("tenantId required");
    const dbName = `${tenantId}_db`;
    const dbConfig = `${tenantId}-db`;
    const dbRole = `${tenantId}-role`;
    // 1. Close TypeORM connections ONLY (pass false to skip Vault revocation for now)
    await this.cleanupTenantDataSource(tenantId, false);
    // 2. Drop the Database FIRST
    // This destroys all tables/sequences owned by the dynamic roles
    const client = this.getDbSuperClient();
    await client.connect();
    try {
      await client.query(
        `
      SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
      WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [dbName]
      );
      await new Promise((res) => setTimeout(res, 1000));
      await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
      this.logger.log(`Dropped database ${dbName}`);
    } catch (err) {
      this.logger.error(`Failed to drop database ${dbName}`, err);
      throw err;
    } finally {
      await client.end();
    }
    // 3. NOW tell Vault to revoke all leases for this tenant
    // Because the DB is gone, Postgres will allow the roles to be dropped
    try {
      // Use revoke-prefix to catch all dynamic users generated for this role
      await this.vaultAdminWrite(
        `sys/leases/revoke-prefix/database/creds/${dbRole}`,
        {}
      );
      this.logger.log(`Revoked all Vault leases for ${dbRole}`);
    } catch (err) {
      this.logger.warn(
        `Vault lease revocation failed (expected if prefix is empty): ${err.message}`
      );
    }
    // 4. Delete Vault Configs and Policy
    await this.vaultAdminDelete(`database/roles/${dbRole}`);
    await this.vaultAdminDelete(`database/config/${dbConfig}`);
    await this.vaultAdminDelete(`sys/policies/acl/${tenantId}-policy`);
  }
}