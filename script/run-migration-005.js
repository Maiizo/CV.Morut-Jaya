#!/usr/bin/env node

/**
 * Migration Script - Add Owner Role
 * This script adds the 'owner' role to the users table
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function runMigration() {
  console.log('🔄 Running migration 005: Add owner role...\n');
  
  const client = await pool.connect();
  
  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '005_add_owner_role.sql'),
      'utf8'
    );
    
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added "owner" role to users table\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
