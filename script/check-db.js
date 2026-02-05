#!/usr/bin/env node

/**
 * Database Check Script
 * This script verifies that the database is properly set up for the application
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function checkDatabase() {
  console.log('🔍 Checking database configuration...\n');
  
  const client = await pool.connect();
  
  try {
    // Test connection
    console.log('✅ Database connection successful!');
    console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`   Database: ${process.env.DB_NAME}\n`);
    
    // Check users table
    console.log('👤 Checking users table...');
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(usersResult.rows[0].count, 10);
    console.log(`   Found ${userCount} users`);
    
    if (userCount === 0) {
      console.log('   ⚠️  WARNING: No users found! Please run: npm run seed');
    } else {
      // Check if user ID 1 exists
      const user1 = await client.query('SELECT id, username, role FROM users WHERE id = 1');
      if (user1.rows.length === 0) {
        console.log('   ⚠️  WARNING: Default user (ID=1) not found! Please run: npm run seed');
      } else {
        console.log(`   ✅ Default user found: ${user1.rows[0].username} (${user1.rows[0].role})`);
      }
    }
    
    // Check task_definitions table
    console.log('\n📋 Checking task_definitions table...');
    const tasksResult = await client.query('SELECT COUNT(*) as count FROM task_definitions');
    const taskCount = parseInt(tasksResult.rows[0].count, 10);
    console.log(`   Found ${taskCount} task definitions`);
    
    if (taskCount === 0) {
      console.log('   ⚠️  WARNING: No tasks found! Please run: npm run seed');
    } else {
      console.log('   ✅ Tasks are properly seeded');
    }
    
    // Check locations table
    console.log('\n📍 Checking locations table...');
    const locationsResult = await client.query('SELECT COUNT(*) as count FROM locations');
    const locationCount = parseInt(locationsResult.rows[0].count, 10);
    console.log(`   Found ${locationCount} locations`);
    
    if (locationCount === 0) {
      console.log('   ⚠️  WARNING: No locations found! Please run: npm run seed');
    } else {
      console.log('   ✅ Locations are properly seeded');
    }
    
    // Check satuan table
    console.log('\n📏 Checking satuan table...');
    const satuanResult = await client.query('SELECT COUNT(*) as count FROM satuan');
    const satuanCount = parseInt(satuanResult.rows[0].count, 10);
    console.log(`   Found ${satuanCount} satuan`);
    
    if (satuanCount === 0) {
      console.log('   ⚠️  WARNING: No satuan found! Please run: npm run seed');
    } else {
      console.log('   ✅ Satuan are properly seeded');
    }
    
    // Check activity_logs table structure
    console.log('\n📝 Checking activity_logs table structure...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'activity_logs'
      ORDER BY ordinal_position
    `);
    
    const columns = columnsResult.rows.map(r => r.column_name);
    console.log(`   Columns: ${columns.join(', ')}`);
    
    const requiredColumns = ['task_def_id', 'logger_user_id', 'custom_description', 'location', 'partners', 'quantity', 'satuan', 'log_time'];
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`   ⚠️  WARNING: Missing columns: ${missingColumns.join(', ')}`);
      console.log('   Please run migrations or seed script');
    } else {
      console.log('   ✅ All required columns present');
    }
    
    console.log('\n' + '='.repeat(50));
    
    const hasIssues = userCount === 0 || taskCount === 0 || locationCount === 0 || satuanCount === 0 || missingColumns.length > 0;
    
    if (hasIssues) {
      console.log('⚠️  Database setup incomplete!');
      console.log('To fix, run: npm run seed');
    } else {
      console.log('✅ Database is properly configured!');
      console.log('You can now start the application with: npm run dev');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Database connection refused. Is PostgreSQL running?');
    }
    if (error.code === '3D000') {
      console.error('   Database does not exist. Please create it first.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();
