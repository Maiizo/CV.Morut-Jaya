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
    const { title } = body; // Ambil judul pekerjaan dari Frontend

    // Masukkan ke database
    const query = 'INSERT INTO task_definitions (title) VALUES ($1) RETURNING *';
    const result = await pool.query(query, [title]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah pekerjaan' }, { status: 500 });
  }
}