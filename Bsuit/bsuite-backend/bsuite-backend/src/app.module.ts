import { EarningsModule } from './people/components/earnings/earnings.module';
import { ClassSerializerInterceptor, Module, Global } from "@nestjs/common";
import { AppService } from "./app.service";
import { safeImportModule } from "./shared/utils";
import { CompanyModule } from "./company/company.module";
import { typeOrmConfig } from "./database/master-db.config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { PassportModule } from "@nestjs/passport";
import { UserModule } from "./user/user.module";
import { MigrationModule } from "./migration/migration.module";
import { TenantService } from "./database/tenants.service";
import { SettingModule } from "./setting/setting.module";
import { SubDomainGuard } from "./common/guard/subdomain.guard";
import { EmployeeConfigModule } from './people/employee-config/employee-config.module';
import { RbaModule } from "./rba/rba.module";
import { ContactModule } from "./books/contact/contact.module";
import { TaxModule } from "./books/tax/tax.module";
import { AccountModule } from "./books/account/account.module";
import { PayrollConfigModule } from "./people/payroll-config/payroll-config.module";
import { QueueModule } from "./rmq/queue.module";
import { ActivityModule } from "./activity/activity.module";
import { ElasticLoggerInterceptor } from "./common/interceptors/elastic-logger.interceptor";
import { TransactModule } from "./books/transact/transact.module";
import { InvoiceModule } from "./books/invoice/invoice.module";
import { BillModule } from "./books/bill/bill.module";
import { JournalModule } from "./books/journal/journal.module";
import { UncategorizedModule } from "./books/uncategorized/uncategorized.module";
import { StorageModule } from "./storage/storage.module";
import { FxModule } from "./fx/fx.module";
import { CacheModule } from "@nestjs/cache-manager";
import KeyvRedis from "@keyv/redis";
import { ReportsModule } from "./books/reports/reports.module";
import { NotificationModule } from "./notification/notification.module";
import { BullModule } from "@nestjs/bullmq";
import { ReminderModule } from "./reminder/reminder.module";
import { AppController } from "./app.controller";
import { DeductionsModule } from "./people/components/deductions/deductions.module";
import { SeriesConfigModule } from './people/components/series-config/series-config.module';
import { SalaryTemplateModule } from "./people/components/salary-template/template.module";
import { LeaveModule } from './people/time/leaves/leaves.module';

const AuthModule = safeImportModule("../auth/auth.module");

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    }),

    TypeOrmModule.forRootAsync(typeOrmConfig),
    ConfigModule.forRoot({ isGlobal: true }),
    ...(AuthModule ? [AuthModule] : []),
    PassportModule.register({ session: true }),
    CompanyModule,
    RbaModule,
    UserModule,
    ContactModule,
    MigrationModule,
    TaxModule,
    AccountModule,
    SettingModule,
    EmployeeConfigModule,
    PayrollConfigModule,
    DeductionsModule,
    SeriesConfigModule,
    ActivityModule,
    QueueModule,
    TransactModule,
    InvoiceModule,
    BillModule,
    JournalModule,
    UncategorizedModule,
    ReminderModule,
    StorageModule,
    FxModule,
    ReportsModule,
    EarningsModule,
    SalaryTemplateModule,
    LeaveModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'REDIS_CACHE',
      useFactory: async () => {
        const redisStore = new (KeyvRedis as any)({
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379", 10),
          password: process.env.REDIS_PASSWORD,
        });

        return {
          get: async (key: string) => await redisStore.get(key),
          set: async (key: string, value: any, ttl?: number) => {
            await redisStore.set(key, value, ttl);
          },
          del: async (key: string) => {
            await redisStore.delete(key);
          },
        };
      },
    },
    { provide: APP_GUARD, useClass: SubDomainGuard },
    TenantService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ElasticLoggerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
  exports: ['REDIS_CACHE'],
})
export class AppModule { }