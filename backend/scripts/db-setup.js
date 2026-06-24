/**
 * Apply database schema, admin extensions, and seed data.
 *
 * Usage: node scripts/db-setup.js
 * Requires backend/.env with DB_* variables (or defaults for local Docker).
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'sui_one',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runSqlFile(relativePath) {
  const filePath = path.join(__dirname, '..', 'database', relativePath);
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`Applying ${relativePath}...`);
  await pool.query(sql);
}

async function main() {
  try {
    await runSqlFile('schema.sql');
    await runSqlFile('admin_schema.sql');
    await runSqlFile('seed_miniapps.sql');
    console.log('Database setup complete.');
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
