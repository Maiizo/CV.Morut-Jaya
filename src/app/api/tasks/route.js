// src/app/api/tasks/route.js
import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// 1. GET: Ambil daftar pekerjaan untuk Dropdown
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM task_definitions ORDER BY title ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Tasks fetch error:', error);

    // If the table doesn't exist, try to create it (idempotent) and return empty list
    try {
      if (error && (error.code === '42P01' || /does not exist/i.test(error.message || ''))) {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS task_definitions (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL UNIQUE,
            is_archived BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
        return NextResponse.json([]);
      }
    } catch (createErr) {
      console.error('Failed to create task_definitions table on-the-fly:', createErr);
    }

    return NextResponse.json({ error: 'Error fetching tasks' }, { status: 500 });
  }
}

// 2. POST: Admin tambah pekerjaan baru
export async function POST(request) {
  try {
    const body = await request.json();
    const { title } = body;

    const query = 'INSERT INTO task_definitions (title) VALUES ($1) RETURNING *';
    const result = await pool.query(query, [title]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Tasks POST error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Pekerjaan sudah ada' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal menambah pekerjaan' }, { status: 500 });
  }
}

// 3. PUT: Update task by ID
export async function PUT(request) {
  try {
    const { id, title } = await request.json();
    if (!id || !title) return NextResponse.json({ error: 'Missing id or title' }, { status: 400 });

    const result = await pool.query('UPDATE task_definitions SET title = $1 WHERE id = $2 RETURNING *', [title, id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Pekerjaan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Tasks PUT error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Pekerjaan sudah ada' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengupdate pekerjaan' }, { status: 500 });
  }
}

// 4. DELETE: Delete task by ID
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const result = await pool.query('DELETE FROM task_definitions WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Pekerjaan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('Tasks DELETE error:', error);
    return NextResponse.json({ error: 'Gagal menghapus pekerjaan' }, { status: 500 });
  }
}