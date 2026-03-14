import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'username, email and password are required' }, { status: 400 });
    }

    // Check if email or username already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'User with this email or username already exists' }, { status: 409 });
    }

    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    const insert = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
      [username, email, hash, 'owner']
    );

    const created = insert.rows[0];
    return NextResponse.json({ success: true, user: created });

  } catch (error) {
    console.error('Create owner error:', error);
    return NextResponse.json({ error: 'Failed to create owner' }, { status: 500 });
  }
}
