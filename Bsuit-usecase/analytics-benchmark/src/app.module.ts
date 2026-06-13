import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { EnginesModule } from './engines/engines.module';
import { CustomersModule } from './customers/customers.module';
import { MerchantsModule } from './merchants/merchants.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AnalyticsModule } from './analytics/analytics.module';
import configuration from './config/configuration';

/**
 * Root module of the application.
 * Imports all feature modules and global configuration.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    EnginesModule,
    CustomersModule,
    MerchantsModule,
    TransactionsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
