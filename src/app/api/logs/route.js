//
import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const query = `
      SELECT 
        activity_logs.id,
        users.username as nama,
        activity_logs.custom_description as tugas,
        activity_logs.location as lokasi,
        to_char(activity_logs.log_time, 'HH24:MI:SS') as jam_mulai, 
        to_char(activity_logs.created_at, 'DD Mon YYYY') as tanggal
      FROM activity_logs
      JOIN users ON activity_logs.logger_user_id = users.id
      ORDER BY activity_logs.log_time DESC
    `;
    
    const result = await pool.query(query);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Gagal ambil data' }, { status: 500 });
  }
}