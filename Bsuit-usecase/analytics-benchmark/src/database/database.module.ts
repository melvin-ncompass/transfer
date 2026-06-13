import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

/**
 * Token for injecting the database connection pool.
 */
export const DATABASE_POOL = 'DATABASE_POOL';

/**
 * Global module for database connections.
 * Provides a shared PostgreSQL connection pool via `DATABASE_POOL`.
 */
@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          database: configService.get('database.name'),
          user: configService.get('database.user'),
          password: configService.get('database.password'),
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });

        pool.on('error', (err) => {
          console.error('Unexpected error on idle client', err);
        });

        return pool;
      },
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
