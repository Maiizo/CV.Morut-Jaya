
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
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Brand catalog per pekerjaan
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        task_def_id INTEGER NOT NULL REFERENCES task_definitions(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        satuan TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(task_def_id, name)
      );
      ALTER TABLE brands ADD COLUMN IF NOT EXISTS satuan TEXT;
      CREATE INDEX IF NOT EXISTS idx_brands_task ON brands(task_def_id);

      -- Stock per brand (non-negative)
      CREATE TABLE IF NOT EXISTS brand_stocks (
        brand_id INTEGER PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Track brand used on each activity log
      ALTER TABLE activity_logs
        ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL;

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
  

    // List User yang mau dibuat
    const users = [
      { username: 'admin', email: 'admin@gmail.com', role: 'admin', password: hashAdmin }
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
      { title: 'Paras', description: 'Perawatan/perapian area kebun.' },
      { title: 'Spout', description: 'Pengaplikasian spout di area kerja.' },
      { title: 'Pupuk', description: 'Pemupukan sesuai kebutuhan tanaman.' },
      { title: 'Kastrasi', description: 'Kastrasi atau perawatan bunga/tandan.' },
      { title: 'Perbaikan pagar', description: 'Perbaikan atau pemeliharaan pagar.' },
    ];

    for (const task of tasks) {
      const check = await client.query('SELECT id FROM task_definitions WHERE title = $1', [task.title]);
      let taskId;
      if (check.rows.length === 0) {
        const inserted = await client.query(
          'INSERT INTO task_definitions (title, description) VALUES ($1, $2) RETURNING id',
          [task.title, task.description || null]
        );
        taskId = inserted.rows[0].id;
        console.log(`Pekerjaan ditambah: ${task.title}`);
      } else {
        taskId = check.rows[0].id;
        if (task.description) {
          await client.query('UPDATE task_definitions SET description = COALESCE(description, $2) WHERE id = $1', [taskId, task.description]);
        }
        console.log(`Pekerjaan sudah ada: ${task.title}`);
      }

      // Seed a default brand per pekerjaan so user bisa memilih brand
      const defaultBrandName = `${task.title} - Default`;
      const brandRes = await client.query(
        `INSERT INTO brands (task_def_id, name, satuan)
         VALUES ($1, $2, $3)
         ON CONFLICT (task_def_id, name)
         DO UPDATE SET satuan = COALESCE(brands.satuan, EXCLUDED.satuan)
         RETURNING id`,
        [taskId, defaultBrandName, 'unit']
      );
      const brandId = brandRes.rows[0].id;
      await client.query(
        'INSERT INTO brand_stocks (brand_id, stock) VALUES ($1, 0) ON CONFLICT (brand_id) DO NOTHING',
        [brandId]
      );
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