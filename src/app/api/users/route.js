import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

// GET: Fetch all users
export async function GET() {
  try {
    const result = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY username ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
  }
}

// POST: Add new user
export async function POST(request) {
  try {
    const { username, email, password, role } = await request.json();
    
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
      [username, email, password_hash, role || 'user']
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Users POST error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal menambah user' }, { status: 500 });
  }
}

// PUT: Update user by ID
export async function PUT(request) {
  try {
    const { id, username, email, password, role } = await request.json();
    
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    let query;
    let params;

    // If password provided, hash it and update
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      query = 'UPDATE users SET username = $1, email = $2, password_hash = $3, role = $4 WHERE id = $5 RETURNING id, username, email, role, created_at';
      params = [username, email, password_hash, role || 'user', id];
    } else {
      query = 'UPDATE users SET username = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, username, email, role, created_at';
      params = [username, email, role || 'user', id];
    }

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Users PUT error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengupdate user' }, { status: 500 });
  }
}

// DELETE: Delete user by ID
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, username, email', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('Users DELETE error:', error);
    return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 });
  }
}
