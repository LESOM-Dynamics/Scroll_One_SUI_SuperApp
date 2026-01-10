/**
 * Script to create or update a user to Super Admin role
 * 
 * Usage:
 * node scripts/create-super-admin.js <wallet_address>
 * 
 * Example:
 * node scripts/create-super-admin.js 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
 */

const { Pool } = require('pg');
require('dotenv').config();

const walletAddress = process.argv[2];

if (!walletAddress) {
  console.error('Error: Wallet address required');
  console.log('Usage: node scripts/create-super-admin.js <wallet_address>');
  process.exit(1);
}

if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
  console.error('Error: Invalid wallet address format');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'scroll_one',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true',
});

async function createSuperAdmin() {
  try {
    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, wallet_address, role, status FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (userCheck.rows.length === 0) {
      // Create new user with Super Admin role
      const result = await pool.query(
        `INSERT INTO users (wallet_address, role, status, created_at, updated_at)
         VALUES ($1, 'super_admin', 'active', NOW(), NOW())
         RETURNING id, wallet_address, role, status`,
        [walletAddress]
      );
      console.log('✅ Created new Super Admin user:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      // Update existing user to Super Admin
      const user = userCheck.rows[0];
      const result = await pool.query(
        `UPDATE users 
         SET role = 'super_admin', status = 'active', updated_at = NOW()
         WHERE wallet_address = $1
         RETURNING id, wallet_address, role, status`,
        [walletAddress]
      );
      console.log('✅ Updated user to Super Admin:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      console.log(`   Previous role: ${user.role}`);
      console.log(`   Previous status: ${user.status}`);
    }

    console.log('\n🎉 Super Admin user created/updated successfully!');
    console.log(`\nYou can now access the admin dashboard at:`);
    console.log(`   http://localhost:3000/admin-super`);
    console.log(`\n(Or your production URL + /admin-super)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createSuperAdmin();

