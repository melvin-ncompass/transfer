const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);
  
  const schemaMap = {};
  for (const row of res.rows) {
    if (!schemaMap[row.table_name]) {
      schemaMap[row.table_name] = [];
    }
    schemaMap[row.table_name].push(row.column_name);
  }
  
  console.log(JSON.stringify(schemaMap, null, 2));
  await client.end();
}

main().catch(console.error);
