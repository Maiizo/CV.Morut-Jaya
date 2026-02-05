import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET: Fetch all satuan (units)
export async function GET() {
  try {
    // Create table if doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS satuan (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const result = await pool.query('SELECT * FROM satuan ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Satuan fetch error:', error);
    return NextResponse.json({ error: 'Error fetching satuan' }, { status: 500 });
  }
}

// POST: Add new satuan
export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

    const result = await pool.query('INSERT INTO satuan (name) VALUES ($1) RETURNING *', [name]);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Satuan POST error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Satuan sudah ada' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal menambah satuan' }, { status: 500 });
  }
}

// PUT: Update satuan by ID
export async function PUT(request) {
  try {
    const { id, name } = await request.json();
    if (!id || !name) return NextResponse.json({ error: 'Missing id or name' }, { status: 400 });

    const result = await pool.query('UPDATE satuan SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Satuan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Satuan PUT error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Satuan sudah ada' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengupdate satuan' }, { status: 500 });
  }
}

// DELETE: Delete satuan by ID
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const result = await pool.query('DELETE FROM satuan WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Satuan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('Satuan DELETE error:', error);
    return NextResponse.json({ error: 'Gagal menghapus satuan' }, { status: 500 });
  }
}
