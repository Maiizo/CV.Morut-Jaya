
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' }); // Baca file .env.local

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function seed() {
  const client = await pool.connect();

  try {
    // --- RUN DB DDL MIGRATIONS (idempotent) ---
    console.log('Menjalankan DDL migrasi (jika perlu)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create task_definitions table if missing
      CREATE TABLE IF NOT EXISTS task_definitions (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL UNIQUE,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE activity_logs
        ADD COLUMN IF NOT EXISTS partners TEXT;
      
      -- Add quantity and satuan columns (from migration 003)
      ALTER TABLE activity_logs
        ADD COLUMN IF NOT EXISTS quantity TEXT;
      
      ALTER TABLE activity_logs
        ADD COLUMN IF NOT EXISTS satuan TEXT;
    `);
    // Insert some default locations if table empty
    const locCount = await client.query('SELECT COUNT(*) FROM locations');
    if (parseInt(locCount.rows[0].count, 10) === 0) {
      const defaultLocs = ['Gudang', 'Lantai 1', 'Lantai 2'];
      for (const name of defaultLocs) {
        await client.query('INSERT INTO locations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
      }
      console.log('   ✅ Default locations added.');
    }

    console.log('🌱 Mulai proses seeding...');

    // --- 1. SEED USERS (Pengguna) ---
    console.log('👤 Membuat user...');
    
    // Hash password untuk admin khusus
    const saltAdmin = await bcrypt.genSalt(10);
    const hashAdmin = await bcrypt.hash('admin123cvjlm', saltAdmin);
    
    // Password seragam untuk user lain: "123456"
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('123456', salt);

    // List User yang mau dibuat
    const users = [
      { username: 'admincvjlm', email: 'admin@cvjlm.com', role: 'admin', password: hashAdmin },
      { username: 'Bapak Owner', email: 'owner@kantor.com', role: 'owner', password: hash },
      { username: 'Bu Admin', email: 'admin@kantor.com', role: 'admin', password: hash },
      { username: 'Ujang (Staff)', email: 'ujang@kantor.com', role: 'user', password: hash },
      { username: 'Siti (Staff)', email: 'siti@kantor.com', role: 'user', password: hash },
    ];

    for (const u of users) {
      // Cek dulu apakah user sudah ada biar tidak error kalau di-run 2x
      const check = await client.query('SELECT * FROM users WHERE email = $1', [u.email]);
      
      if (check.rows.length === 0) {
        await client.query(
          `INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
          [u.username, u.email, u.password, u.role]
        );
        console.log(`   ✅ User dibuat: ${u.username}`);
      } else {
        console.log(`   ⚠️ User sudah ada: ${u.username}`);
      }
    }

    // --- 2. SEED TASKS (Pekerjaan) ---
    console.log('\n📋 Membuat daftar pekerjaan...');

    const tasks = [
      'Paras',
      'Spout',
      'Pupuk',
      'Kastrasi',
      'Perbaikan pagar',
    ];

    for (const title of tasks) {
      const check = await client.query('SELECT * FROM task_definitions WHERE title = $1', [title]);
      
      if (check.rows.length === 0) {
        await client.query('INSERT INTO task_definitions (title) VALUES ($1)', [title]);
        console.log(`Pekerjaan ditambah: ${title}`);
      } else {
        console.log(`Pekerjaan sudah ada: ${title}`);
      }
    }

    // --- 3. SEED SATUAN (Units) ---
    console.log('\n Membuat daftar satuan...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS satuan (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const satuanList = ['cm', 'meter', 'hektar', 'biji', 'kg', 'liter', 'unit', 'buah', 'batang', 'lembar'];
    
    for (const name of satuanList) {
      await client.query('INSERT INTO satuan (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
    }
    console.log('Satuan berhasil ditambahkan.');

    console.log('\needing Selesai! Database sudah terisi.');

  } catch (error) {
    console.error('Gagal Seeding:', error);
  } finally {
    client.release();
    pool.end(); // Tutup koneksi
  }
}

seed();