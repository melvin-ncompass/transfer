import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchemaService } from './schema.service';
import { QueryValidator } from './query.validator';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const configuredDbUrl = configService.getConfig()?.database?.url?.trim();
                const envDbUrl = process.env.DATABASE_URL?.trim();
                const dbUrl = configuredDbUrl || envDbUrl;

                if (dbUrl) {
                    const parsed = new URL(dbUrl);
                    const dbName = parsed.pathname.replace(/^\//, '') || 'postgres';
                    return {
                        type: 'postgres' as const,
                        host: parsed.hostname || 'localhost',
                        port: parsed.port ? Number(parsed.port) : 5432,
                        username: decodeURIComponent(parsed.username || 'postgres'),
                        password: decodeURIComponent(parsed.password || 'postgres'),
                        database: dbName,
                        autoLoadEntities: true,
                        synchronize: process.env.NODE_ENV !== 'production',
                        logging: ['query', 'error'],
                    };
                }

                return {
                    type: 'postgres' as const,
                    host: process.env.DB_HOST ?? 'localhost',
                    port: Number(process.env.DB_PORT ?? 5432),
                    username: process.env.DB_USER ?? 'postgres',
                    password: process.env.DB_PASS ?? 'postgres',
                    database: process.env.DB_NAME ?? 'postgres',
                    autoLoadEntities: true,
                    synchronize: process.env.NODE_ENV !== 'production',
                    logging: ['query', 'error'],
                };
            },
        }),
    ],
    providers: [SchemaService, QueryValidator],
    exports: [SchemaService, QueryValidator],
})
export class DatabaseModule { }
