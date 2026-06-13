import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get('DB_HOST') || 'postgres',
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
          // entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          entities: [
            __dirname + '/../**/*.entity{.ts,.js}',
            __dirname + '/../scaffolding/**/*.entity{.ts,.js}', // scaffolding inside src (dev)
            __dirname + '/../../scaffolding/**/*.entity{.ts,.js}', // scaffolding at root (docker/prod)
          ],
          synchronize: 
          configService.get('NODE_ENV') === 'development',
          // false,
          // logging: configService.get('NODE_ENV') === 'development',
          ssl: false
            // configService.get('NODE_ENV') === 'production'
            //   ? { rejectUnauthorized: false }
            //   : false,
        };
      },
      inject: [ConfigService],
    }),
  ],
  //   providers: [DatabaseService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
