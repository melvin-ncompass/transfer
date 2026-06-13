import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

const config = new ConfigService();

const MasterDataSource = new DataSource({
    type: 'postgres',
    host: config.get<string>('DB_HOST'),
    port: config.get<number>('DB_PORT'),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_NAME'),
    entities: [path.join(__dirname, '..', '..', '**', 'entities', '[!tT]*.entity.{ts,js}')],
    migrations: [path.join(__dirname, '..', 'migrations', 'master-migration-scripts', '*.{ts,js}')],
    synchronize: false,
});

export default MasterDataSource;