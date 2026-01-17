// src/app/api/logs/route.js
import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Ini query SQL-nya
    // Kita join table user agar nama yang muncul bukan ID (misal '10'), tapi 'Budi'
    const query = `
      SELECT 
        activity_logs.id,
        users.username as nama,
        activity_logs.custom_description as tugas,
        activity_logs.location as lokasi,
        to_char(activity_logs.log_time, 'HH24:MI') as jam
      FROM activity_logs
      JOIN users ON activity_logs.logger_user_id = users.id
      ORDER BY activity_logs.log_time DESC
    `;
    
    const result = await pool.query(query);
    
    // Kembalikan data dalam format JSON
    return NextResponse.json(result.rows);
    
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Gagal ambil data' }, { status: 500 });
  }
}