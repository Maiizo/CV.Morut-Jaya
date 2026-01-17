// src/app/api/tasks/route.js
import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// 1. GET: Ambil daftar pekerjaan untuk Dropdown
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM task_definitions WHERE is_archived = FALSE ORDER BY title ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
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