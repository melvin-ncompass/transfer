import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config(); // load .env before reading process.env

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DOCKER_DB_HOST || 'postgres',
  port: parseInt(process.env.DOCKER_DB_PORT || '5432', 10),
  username: process.env.DOCKER_DB_USERNAME,
  password: process.env.DOCKER_DB_PASSWORD,
  database: process.env.DOCKER_DB_NAME,
  entities: [
    __dirname + '/src/**/*.entity{.ts,.js}',
    __dirname + '/src/scaffolding/**/*.entity{.ts,.js}',
    __dirname + '/src/../scaffolding/**/*.entity{.ts,.js}', // scaffolding at root (docker/prod)

  ],
  migrations: ['src/migrations/**/*{.ts,.js}'],
  synchronize: false,
});