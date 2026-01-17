import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM locations ORDER BY name ASC');
    return NextResponse.json(result.rows.map(r => r.name));
  } catch (error) {
    console.error('Locations fetch error (falling back):', error);
    // Fallback list so UI still works if table missing
    return NextResponse.json(['Lobby', 'Gudang', 'Lantai 1', 'Lantai 2', 'Toilet Pria', 'Toilet Wanita']);
  }
}

// POST: Add new location (admin only)
export async function POST(request) {
  try {
    // Simple admin check: client must send header x-admin: true
    const isAdmin = request.headers.get('x-admin') === 'true';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

    try {
      const result = await pool.query('INSERT INTO locations (name) VALUES ($1) RETURNING *', [name]);
      return NextResponse.json(result.rows[0]);
    } catch (dbErr) {
      console.error('Failed to insert location:', dbErr);
      return NextResponse.json({ error: 'Gagal menambah lokasi' }, { status: 500 });
    }
  } catch (error) {
    console.error('Locations POST error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
