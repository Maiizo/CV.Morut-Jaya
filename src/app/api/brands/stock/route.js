import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// POST: Increment stock for a brand (only adds, never subtracts here)
export async function POST(request) {
  try {
    const { brand_id, amount } = await request.json();
    const brandId = parseInt(brand_id, 10);
    const increment = parseInt(amount, 10);

    if (!brandId || Number.isNaN(brandId)) {
      return NextResponse.json({ error: 'brand_id wajib diisi' }, { status: 400 });
    }
    if (!increment || Number.isNaN(increment) || increment <= 0) {
      return NextResponse.json({ error: 'Jumlah penambahan stok harus lebih dari 0' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const brandExists = await client.query('SELECT id FROM brands WHERE id = $1', [brandId]);
      if (brandExists.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Brand tidak ditemukan' }, { status: 404 });
      }

      await client.query(
        'INSERT INTO brand_stocks (brand_id, stock) VALUES ($1, 0) ON CONFLICT (brand_id) DO NOTHING',
        [brandId]
      );

      const updated = await client.query(
        `UPDATE brand_stocks
         SET stock = stock + $1, updated_at = NOW()
         WHERE brand_id = $2
         RETURNING brand_id, stock, updated_at`,
        [increment, brandId]
      );

      await client.query('COMMIT');
      return NextResponse.json({ success: true, added: increment, ...updated.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Brand stock POST error:', error);
    return NextResponse.json({ error: 'Gagal menambah stok' }, { status: 500 });
  }
}
