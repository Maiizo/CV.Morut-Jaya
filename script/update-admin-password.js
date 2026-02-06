const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function updateAdminPassword() {
  try {
    console.log('Updating admin password...');
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123cvjlm', salt);
    
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING username, email',
      [hash, 'admin@cvjlm.com']
    );
    
    if (result.rows.length > 0) {
      console.log('Password admin berhasil diupdate!');
      console.log('Username:', result.rows[0].username);
      console.log('Email:', result.rows[0].email);
      console.log('Password: admin123cvjlm');
    } else {
      console.log(' Admin user tidak ditemukan!');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateAdminPassword();
