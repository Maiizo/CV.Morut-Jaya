import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET: List brands (optionally filtered by task)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskIdParam = searchParams.get('taskId');
    const taskId = taskIdParam ? parseInt(taskIdParam, 10) : null;

    const query = `
      SELECT b.*, t.title AS task_title, COALESCE(bs.stock, 0) AS stock
      FROM brands b
      JOIN task_definitions t ON b.task_def_id = t.id
      LEFT JOIN brand_stocks bs ON bs.brand_id = b.id
      WHERE ($1::int IS NULL OR b.task_def_id = $1)
      ORDER BY t.title ASC, b.name ASC
    `;
    const result = await pool.query(query, [taskId]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Brands GET error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data brand' }, { status: 500 });
  }
}

// POST: Create brand
export async function POST(request) {
  try {
    const { task_def_id, name, satuan } = await request.json();
    if (!task_def_id || !name || !String(name).trim()) {
      return NextResponse.json({ error: 'task_def_id dan nama brand wajib diisi' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertBrand = await client.query(
        `INSERT INTO brands (task_def_id, name, satuan)
         VALUES ($1, $2, $3)
         ON CONFLICT (task_def_id, name) DO NOTHING
         RETURNING *`,
        [task_def_id, name.trim(), satuan || null]
      );

      let brandRow;
      if (insertBrand.rows.length === 0) {
        // brand already exists
        const existing = await client.query(
          `SELECT b.*, t.title AS task_title, COALESCE(bs.stock, 0) AS stock
           FROM brands b
           JOIN task_definitions t ON b.task_def_id = t.id
           LEFT JOIN brand_stocks bs ON bs.brand_id = b.id
           WHERE b.task_def_id = $1 AND b.name = $2`,
          [task_def_id, name.trim()]
        );
        brandRow = existing.rows[0];
      } else {
        brandRow = insertBrand.rows[0];
      }

      // Ensure stock row exists
      await client.query(
        'INSERT INTO brand_stocks (brand_id, stock) VALUES ($1, 0) ON CONFLICT (brand_id) DO NOTHING',
        [brandRow.id]
      );

      const withStock = await client.query(
        `SELECT b.*, t.title AS task_title, COALESCE(bs.stock, 0) AS stock
         FROM brands b
         JOIN task_definitions t ON b.task_def_id = t.id
         LEFT JOIN brand_stocks bs ON bs.brand_id = b.id
         WHERE b.id = $1`,
        [brandRow.id]
      );
      await client.query('COMMIT');
      return NextResponse.json(withStock.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Brands POST error:', error);
    if (error.code === '23503') {
      return NextResponse.json({ error: 'Pekerjaan tidak ditemukan' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal menambah brand' }, { status: 500 });
  }
}

// PUT: Update brand
export async function PUT(request) {
  try {
    const { id, task_def_id, name, satuan } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

    const updates = [];
    const params = [];
    let idx = 1;

    if (task_def_id) {
      updates.push(`task_def_id = $${idx++}`);
      params.push(task_def_id);
    }
    if (name) {
      updates.push(`name = $${idx++}`);
      params.push(name.trim());
    }
    if (satuan !== undefined) {
      updates.push(`satuan = $${idx++}`);
      params.push(satuan || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data untuk diubah' }, { status: 400 });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE brands SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Brand tidak ditemukan' }, { status: 404 });
    }

    const withStock = await pool.query(
      `SELECT b.*, t.title AS task_title, COALESCE(bs.stock, 0) AS stock
       FROM brands b
       JOIN task_definitions t ON b.task_def_id = t.id
       LEFT JOIN brand_stocks bs ON bs.brand_id = b.id
       WHERE b.id = $1`,
      [id]
    );
    return NextResponse.json(withStock.rows[0]);
  } catch (error) {
    console.error('Brands PUT error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Nama brand sudah ada untuk pekerjaan ini' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengubah brand' }, { status: 500 });
  }
}

// DELETE: Remove brand
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

    const result = await pool.query('DELETE FROM brands WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Brand tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('Brands DELETE error:', error);
    return NextResponse.json({ error: 'Gagal menghapus brand' }, { status: 500 });
  }
}
