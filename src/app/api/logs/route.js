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

// POST: Terima request untuk menyimpan log aktivitas
export async function POST(request) {
  try {
    const body = await request.json();
    const { task_def_id, custom_description, log_time } = body;

    // Jika frontend hanya mengirim satu field untuk lokasi/deskripsi,
    // kita simpan ke kedua kolom agar GET tetap menampilkan sesuatu.
    const location = body.location || custom_description || null;

    // NOTE: belum ada mekanisme auth; gunakan user id default 1 sebagai logger
    const loggerUserId = 1;

    const insertQuery = `
      INSERT INTO activity_logs (task_def_id, logger_user_id, custom_description, location, log_time)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;

    const result = await pool.query(insertQuery, [task_def_id, loggerUserId, custom_description, location, log_time]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error inserting log:', error);
    return NextResponse.json({ error: 'Gagal menyimpan log' }, { status: 500 });
  }
}

// PUT: Update existing log by id
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, task_def_id, custom_description, location, log_time } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Build dynamic SET clause for provided fields
    const fields = [];
    const values = [];
    let idx = 1;

    if (task_def_id !== undefined) {
      fields.push(`task_def_id = $${idx++}`);
      values.push(task_def_id);
    }
    if (custom_description !== undefined) {
      fields.push(`custom_description = $${idx++}`);
      values.push(custom_description);
    }
    if (location !== undefined) {
      fields.push(`location = $${idx++}`);
      values.push(location);
    }
    if (log_time !== undefined) {
      fields.push(`log_time = $${idx++}`);
      values.push(log_time);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const query = `UPDATE activity_logs SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating log:', error);
    return NextResponse.json({ error: 'Gagal update log' }, { status: 500 });
  }
}