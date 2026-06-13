/**
 * Global configuration factory.
 * Loads environment variables and provides defaults.
 */
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'datastuff',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Password',
  },
  
  clickhouse: {
    host: process.env.CLICKHOUSE_HOST || 'localhost',
    port: parseInt(process.env.CLICKHOUSE_PORT, 10) || 8123,
    user: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
  },
  
  defaultEngine: process.env.DEFAULT_ENGINE || 'postgresql-docker',
});
