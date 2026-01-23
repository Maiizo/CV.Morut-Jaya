//
import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try selecting partners if column exists; otherwise fall back without partners
    // Return all activity_logs columns plus username to give admin full visibility
    const query = `
      SELECT
        activity_logs.*, 
        users.username as nama,
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
    const location = body.location || custom_description || null;
    const partners = body.partners || null; // expected string like 'A, B'
    const quantity = body.quantity || null;
    const satuan = body.satuan || null;

    // NOTE: belum ada mekanisme auth; gunakan user id default 1 sebagai logger
    const loggerUserId = 1;

    // Try inserting including partners, quantity, satuan if provided; fallback to insert without partners on failure
    try {
      if (partners !== null) {
        const insertQuery = `
          INSERT INTO activity_logs (task_def_id, logger_user_id, custom_description, location, partners, quantity, satuan, log_time)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
        `;
        const result = await pool.query(insertQuery, [task_def_id, loggerUserId, custom_description, location, partners, quantity, satuan, log_time]);
        return NextResponse.json(result.rows[0]);
      } else {
        const insertQuery = `
          INSERT INTO activity_logs (task_def_id, logger_user_id, custom_description, location, quantity, satuan, log_time)
          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `;
        const result = await pool.query(insertQuery, [task_def_id, loggerUserId, custom_description, location, quantity, satuan, log_time]);
        return NextResponse.json(result.rows[0]);
      }
    } catch (insertErr) {
      console.error('Insert error (retrying without partners if needed):', insertErr);
      // If partners insertion failed and partners were provided, try without partners
      if (partners !== null) {
        try {
          const insertQuery = `
            INSERT INTO activity_logs (task_def_id, logger_user_id, custom_description, location, quantity, satuan, log_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
          `;
          const result = await pool.query(insertQuery, [task_def_id, loggerUserId, custom_description, location, quantity, satuan, log_time]);
          return NextResponse.json(result.rows[0]);
        } catch (err2) {
          console.error('Fallback insert also failed:', err2);
          return NextResponse.json({ error: 'Gagal menyimpan log' }, { status: 500 });
        }
      }
      return NextResponse.json({ error: 'Gagal menyimpan log' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error inserting log:', error);
    return NextResponse.json({ error: 'Gagal menyimpan log' }, { status: 500 });
  }
}

// PUT: Update existing log by id
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, task_def_id, custom_description, location, log_time, partners } = body;

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
    if (partners !== undefined) {
      fields.push(`partners = $${idx++}`);
      values.push(partners);
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