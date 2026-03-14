//
import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    // Get authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Anda harus login terlebih dahulu' }, { status: 401 });
    }

    // Build query based on user role
    let query;
    let queryParams = [];
    
    if (currentUser.role === 'admin') {
      // Admin sees all logs
      query = `
        SELECT
          activity_logs.*, 
          users.username as nama,
          brands.name as brand_name,
          t.title AS task_title,
          to_char(activity_logs.log_time, 'HH24:MI:SS') as jam_mulai,
          to_char(activity_logs.created_at, 'DD Mon YYYY') as tanggal
        FROM activity_logs
        JOIN users ON activity_logs.logger_user_id = users.id
        LEFT JOIN brands ON activity_logs.brand_id = brands.id
        LEFT JOIN task_definitions t ON activity_logs.task_def_id = t.id
        ORDER BY activity_logs.log_time DESC
      `;
    } else {
      // Regular users only see their own logs
      query = `
        SELECT
          activity_logs.*, 
          users.username as nama,
          brands.name as brand_name,
          t.title AS task_title,
          to_char(activity_logs.log_time, 'HH24:MI:SS') as jam_mulai,
          to_char(activity_logs.created_at, 'DD Mon YYYY') as tanggal
        FROM activity_logs
        JOIN users ON activity_logs.logger_user_id = users.id
        LEFT JOIN brands ON activity_logs.brand_id = brands.id
        LEFT JOIN task_definitions t ON activity_logs.task_def_id = t.id
        WHERE activity_logs.logger_user_id = $1
        ORDER BY activity_logs.log_time DESC
      `;
      queryParams = [currentUser.id];
    }
    
    const result = await pool.query(query, queryParams);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Gagal ambil data' }, { status: 500 });
  }
}

// POST: Terima request untuk menyimpan log aktivitas
export async function POST(request) {
  try {
    const body = await request.json();
    const { task_def_id, custom_description, log_time, brand_id } = body;
    const taskId = task_def_id ? parseInt(task_def_id, 10) : NaN;
    const location = body.location || custom_description || null;
    const partners = body.partners || null; // expected string like 'A, B'
    const satuan = body.satuan || null;

    const brandId = brand_id !== undefined && brand_id !== null ? parseInt(brand_id, 10) : NaN;
    const quantityRaw = body.quantity;
    const quantityNumber = quantityRaw === undefined || quantityRaw === null || quantityRaw === ''
      ? 0
      : parseInt(quantityRaw, 10);
    const quantity = quantityRaw !== undefined && quantityRaw !== null && quantityRaw !== ''
      ? String(quantityNumber)
      : null;

    // Validate required fields
    if (!Number.isInteger(taskId)) {
      console.error('Validation error: task_def_id is required');
      return NextResponse.json({ error: 'Jenis pekerjaan harus dipilih' }, { status: 400 });
    }

    if (!Number.isInteger(brandId)) {
      console.error('Validation error: brand_id is required');
      return NextResponse.json({ error: 'Brand harus dipilih' }, { status: 400 });
    }

    if (!log_time) {
      console.error('Validation error: log_time is required');
      return NextResponse.json({ error: 'Waktu log harus diisi' }, { status: 400 });
    }

    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      return NextResponse.json({ error: 'Jumlah pemakaian harus lebih dari 0' }, { status: 400 });
    }

    // Get authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('User tidak terautentikasi');
      return NextResponse.json({ error: 'Anda harus login terlebih dahulu' }, { status: 401 });
    }
    const loggerUserId = currentUser.id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure stock row exists then lock brand stock
      await client.query(
        'INSERT INTO brand_stocks (brand_id, stock) VALUES ($1, 0) ON CONFLICT (brand_id) DO NOTHING',
        [brandId]
      );

      const brandRowRes = await client.query(
        `SELECT id, task_def_id, name AS brand_name, satuan AS brand_satuan
         FROM brands
         WHERE id = $1
         FOR UPDATE`,
        [brandId]
      );

      if (brandRowRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Brand tidak ditemukan' }, { status: 404 });
      }

      const brandRow = brandRowRes.rows[0];
      if (brandRow.task_def_id !== taskId) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Brand tidak sesuai dengan pekerjaan yang dipilih' }, { status: 400 });
      }

      const brandSatuan = brandRow.brand_satuan ? String(brandRow.brand_satuan).trim().toLowerCase() : '';
      const inputSatuan = satuan ? String(satuan).trim().toLowerCase() : '';
      const shouldDeduct = brandSatuan && inputSatuan && brandSatuan === inputSatuan;

      if (shouldDeduct) {
        const stockRes = await client.query('SELECT stock FROM brand_stocks WHERE brand_id = $1 FOR UPDATE', [brandId]);
        const stock = stockRes.rows.length ? parseInt(stockRes.rows[0].stock, 10) : 0;
        if (stock < quantityNumber) {
          await client.query('ROLLBACK');
          return NextResponse.json({
            error: `Stok brand tidak cukup. Sisa: ${stock}`
          }, { status: 400 });
        }

        await client.query(
          `UPDATE brand_stocks
           SET stock = stock - $1, updated_at = NOW()
           WHERE brand_id = $2`,
          [quantityNumber, brandId]
        );
      }

      const insertQuery = `
        INSERT INTO activity_logs (task_def_id, logger_user_id, custom_description, location, partners, quantity, satuan, log_time, brand_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        taskId,
        loggerUserId,
        custom_description,
        location,
        partners,
        quantity,
        satuan,
        log_time,
        brandId,
      ]);

      await client.query('COMMIT');
      return NextResponse.json({ ...result.rows[0], brand_name: brandRow.brand_name });
    } catch (insertErr) {
      await client.query('ROLLBACK');
      console.error('Insert error details:', insertErr);
      console.error('Error code:', insertErr.code);
      console.error('Error message:', insertErr.message);
      
      if (insertErr.code === '23503') {
        return NextResponse.json({ error: 'Pekerjaan atau user tidak valid' }, { status: 400 });
      }
      if (insertErr.code === '23505') {
        return NextResponse.json({ error: 'Data duplikat terdeteksi' }, { status: 400 });
      }
      if (insertErr.code === '42703') {
        return NextResponse.json({ error: 'Kolom database tidak ditemukan. Jalankan migrasi.' }, { status: 500 });
      }
      return NextResponse.json({ error: `Gagal menyimpan log: ${insertErr.message}` }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error inserting log - Outer catch:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Gagal menyimpan log: ' + (error.message || 'Unknown error'),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PUT: Update existing log by id
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, task_def_id, custom_description, location, log_time, partners, brand_id } = body;
    const quantityRaw = body.quantity;
    const satuan = body.satuan;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existingRes = await client.query('SELECT id, task_def_id, brand_id, quantity, satuan FROM activity_logs WHERE id = $1 FOR UPDATE', [id]);
      if (existingRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Log tidak ditemukan' }, { status: 404 });
      }

      const existing = existingRes.rows[0];
      const prevBrandId = existing.brand_id;
      const parsedPrevQty = existing.quantity ? parseInt(existing.quantity, 10) : 0;
      const prevQty = Number.isFinite(parsedPrevQty) && parsedPrevQty > 0 ? parsedPrevQty : 0;
      const prevSatuan = existing.satuan ? String(existing.satuan).trim().toLowerCase() : '';

      const newBrandId = brand_id !== undefined ? parseInt(brand_id, 10) : prevBrandId;
      const taskIdNumber = task_def_id !== undefined ? parseInt(task_def_id, 10) : existing.task_def_id;
      const newTaskId = Number.isInteger(taskIdNumber) ? taskIdNumber : existing.task_def_id;
      const parsedQty = quantityRaw === undefined || quantityRaw === null || quantityRaw === ''
        ? prevQty
        : parseInt(quantityRaw, 10);
      const quantityNumber = Number.isFinite(parsedQty) ? parsedQty : 0;
      const quantity = quantityRaw === undefined ? existing.quantity : (quantityRaw === null || quantityRaw === '' ? null : String(quantityNumber));

      if (!Number.isInteger(newBrandId)) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Brand harus dipilih' }, { status: 400 });
      }
      if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Jumlah pemakaian harus lebih dari 0' }, { status: 400 });
      }

      // Ensure brand exists and matches task
      await client.query(
        'INSERT INTO brand_stocks (brand_id, stock) VALUES ($1, 0) ON CONFLICT (brand_id) DO NOTHING',
        [newBrandId]
      );
      const brandRowRes = await client.query(
        `SELECT id, task_def_id, name AS brand_name, satuan AS brand_satuan
         FROM brands
         WHERE id = $1
         FOR UPDATE`,
        [newBrandId]
      );
      if (brandRowRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Brand tidak ditemukan' }, { status: 404 });
      }
      const brandRow = brandRowRes.rows[0];
      if (brandRow.task_def_id !== newTaskId) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Brand tidak sesuai dengan pekerjaan yang dipilih' }, { status: 400 });
      }

      const brandSatuan = brandRow.brand_satuan ? String(brandRow.brand_satuan).trim().toLowerCase() : '';
      const finalSatuan = satuan !== undefined ? satuan : existing.satuan;
      const newSatuanNormalized = finalSatuan ? String(finalSatuan).trim().toLowerCase() : '';
      const shouldDeductNew = brandSatuan && newSatuanNormalized && brandSatuan === newSatuanNormalized;

      // Restore previous stock if applicable and satuan matched previously
      if (prevBrandId && prevQty > 0) {
        const prevBrandRes = await client.query('SELECT satuan FROM brands WHERE id = $1 FOR UPDATE', [prevBrandId]);
        const prevBrandSatuan = prevBrandRes.rows.length ? String(prevBrandRes.rows[0].satuan || '').trim().toLowerCase() : '';
        const shouldRestorePrev = prevBrandSatuan && prevSatuan && prevBrandSatuan === prevSatuan;

        if (shouldRestorePrev) {
          await client.query(
            'INSERT INTO brand_stocks (brand_id, stock) VALUES ($1, 0) ON CONFLICT (brand_id) DO NOTHING',
            [prevBrandId]
          );
          await client.query(
            'UPDATE brand_stocks SET stock = stock + $1, updated_at = NOW() WHERE brand_id = $2',
            [prevQty, prevBrandId]
          );
        }
      }

      // Deduct new stock requirement only when satuan matches
      if (shouldDeductNew) {
        const stockCheck = await client.query('SELECT stock FROM brand_stocks WHERE brand_id = $1 FOR UPDATE', [newBrandId]);
        const availableStock = stockCheck.rows.length > 0 ? parseInt(stockCheck.rows[0].stock, 10) : 0;
        if (availableStock < quantityNumber) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: `Stok brand tidak cukup. Sisa: ${availableStock}` }, { status: 400 });
        }
        await client.query(
          'UPDATE brand_stocks SET stock = stock - $1, updated_at = NOW() WHERE brand_id = $2',
          [quantityNumber, newBrandId]
        );
      }

      // Build update query
      const fields = [];
      const values = [];
      let idx = 1;

      fields.push(`brand_id = $${idx++}`);
      values.push(newBrandId);

      if (newTaskId !== undefined) {
        fields.push(`task_def_id = $${idx++}`);
        values.push(newTaskId);
      }
      if (custom_description !== undefined) {
        fields.push(`custom_description = $${idx++}`);
        values.push(custom_description);
      }
      if (partners !== undefined) {
        fields.push(`partners = $${idx++}`);
        values.push(partners);
      }
      if (quantity !== undefined) {
        fields.push(`quantity = $${idx++}`);
        values.push(quantity);
      }
      if (satuan !== undefined) {
        fields.push(`satuan = $${idx++}`);
        values.push(satuan);
      }
      if (location !== undefined) {
        fields.push(`location = $${idx++}`);
        values.push(location);
      }
      if (log_time !== undefined) {
        fields.push(`log_time = $${idx++}`);
        values.push(log_time);
      }

      if (fields.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }

      values.push(id);
      const query = `UPDATE activity_logs SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
      const result = await client.query(query, values);

      await client.query('COMMIT');
      return NextResponse.json({ ...result.rows[0], brand_name: brandRow.brand_name });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating log:', error);
      return NextResponse.json({ error: 'Gagal update log' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating log:', error);
    return NextResponse.json({ error: 'Gagal update log' }, { status: 500 });
  }
}