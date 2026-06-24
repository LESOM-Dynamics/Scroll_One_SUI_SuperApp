/**
 * Script to create or update a user to Super Admin role
 *
 * Usage:
 * node scripts/create-super-admin.js <sui_wallet_address>
 */

const { Pool } = require('pg');
const { isValidSuiAddress } = require('@mysten/sui/utils');
require('dotenv').config();

const walletAddress = process.argv[2];

if (!walletAddress) {
  console.error('Error: Wallet address required');
  console.log('Usage: node scripts/create-super-admin.js <sui_wallet_address>');
  process.exit(1);
}

if (!isValidSuiAddress(walletAddress)) {
  console.error('Error: Invalid Sui wallet address format');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'sui_one',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true',
});

async function createSuperAdmin() {
  try {
    const userCheck = await pool.query(
      'SELECT id, wallet_address, role, status FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (userCheck.rows.length === 0) {
      const result = await pool.query(
        `INSERT INTO users (wallet_address, role, status, created_at, updated_at)
         VALUES ($1, 'super_admin', 'active', NOW(), NOW())
         RETURNING id, wallet_address, role, status`,
        [walletAddress]
      );
      console.log('Created new Super Admin user:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      const user = userCheck.rows[0];
      const result = await pool.query(
        `UPDATE users
         SET role = 'super_admin', status = 'active', updated_at = NOW()
         WHERE wallet_address = $1
         RETURNING id, wallet_address, role, status`,
        [walletAddress]
      );
      console.log('Updated user to Super Admin:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      console.log(`   Previous role: ${user.role}`);
      console.log(`   Previous status: ${user.status}`);
    }

    console.log('\nSuper Admin user created/updated successfully.');
    console.log('\nAccess the admin dashboard at:');
    console.log('   http://localhost:3001/admin-super');
    console.log('\n(Or your production landing URL + /admin-super)');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createSuperAdmin();
