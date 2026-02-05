import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM locations ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Locations fetch error:', error);
    return NextResponse.json({ error: 'Error fetching locations' }, { status: 500 });
  }
}

// POST: Add new location
export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

    const result = await pool.query('INSERT INTO locations (name) VALUES ($1) RETURNING *', [name]);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Locations POST error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Lokasi sudah ada' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal menambah lokasi' }, { status: 500 });
  }
}

// PUT: Update location by ID
export async function PUT(request) {
  try {
    const { id, name } = await request.json();
    if (!id || !name) return NextResponse.json({ error: 'Missing id or name' }, { status: 400 });

    const result = await pool.query('UPDATE locations SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lokasi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Locations PUT error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Lokasi sudah ada' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengupdate lokasi' }, { status: 500 });
  }
}

// DELETE: Delete location by ID
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const result = await pool.query('DELETE FROM locations WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lokasi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('Locations DELETE error:', error);
    return NextResponse.json({ error: 'Gagal menghapus lokasi' }, { status: 500 });
  }
}
