import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import * as XLSX from 'xlsx';

const MONTH_MAP = {
  jan:0, feb:1, mar:2, apr:3, may:4, jun:5,
  jul:6, aug:7, sep:8, oct:9, nov:10, dec:11,
  // Indonesian month names
  januari:0, februari:1, maret:2, april:3, mei:4, juni:5,
  juli:6, agustus:7, september:8, oktober:9, november:10, desember:11
};

/**
 * Parse Excel date/time values into a JS Date built with LOCAL-time
 * constructors to avoid UTC timezone drift.
 *
 * Handles:
 *   - JS Date objects  (cellDates:true)
 *   - Excel serial numbers
 *   - "14 Feb 2026"  / "14 February 2026"  (from our own export)
 *   - "DD/MM/YYYY"  or  "YYYY-MM-DD"
 *   - Time as "HH:MM" / "HH:MM:SS" string or Excel fraction-of-day number
 */
function parseExcelDateTime(tanggal, jam) {
  try {
    let year, month, day;

    if (tanggal instanceof Date) {
      // XLSX with cellDates:true creates dates at UTC midnight (e.g. 2026-02-14T00:00:00Z).
      // Always use getUTC* to extract the intended calendar date regardless of server timezone.
      year  = tanggal.getUTCFullYear();
      month = tanggal.getUTCMonth();
      day   = tanggal.getUTCDate();
    } else if (typeof tanggal === 'number') {
      // Excel serial → convert via UTC then read UTC parts (serial is always UTC-midnight)
      const ms = Math.round((tanggal - 25569) * 86400 * 1000);
      const tmp = new Date(ms);
      year  = tmp.getUTCFullYear();
      month = tmp.getUTCMonth();
      day   = tmp.getUTCDate();
    } else {
      const s = String(tanggal).trim();

      // "14 Feb 2026"  or  "14 February 2026"
      const dMonY = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
      if (dMonY) {
        const m = MONTH_MAP[dMonY[2].toLowerCase()];
        if (m === undefined) return null;
        day   = parseInt(dMonY[1], 10);
        month = m;
        year  = parseInt(dMonY[3], 10);
      } else {
        // "DD/MM/YYYY" or "DD-MM-YYYY"
        const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (dmy) {
          day   = parseInt(dmy[1], 10);
          month = parseInt(dmy[2], 10) - 1;
          year  = parseInt(dmy[3], 10);
        } else {
          // "YYYY-MM-DD"
          const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
          if (ymd) {
            year  = parseInt(ymd[1], 10);
            month = parseInt(ymd[2], 10) - 1;
            day   = parseInt(ymd[3], 10);
          } else {
            return null; // unrecognised format
          }
        }
      }
    }

    // Parse time
    let h = 0, m = 0, sec = 0;
    if (jam !== undefined && jam !== null) {
      if (jam instanceof Date) {
        // XLSX Date objects store time in UTC
        h   = jam.getUTCHours();
        m   = jam.getUTCMinutes();
        sec = jam.getUTCSeconds();
      } else if (typeof jam === 'number') {
        // Excel time fraction of a day
        const totalSec = Math.round(jam * 86400);
        h   = Math.floor(totalSec / 3600);
        m   = Math.floor((totalSec % 3600) / 60);
        sec = totalSec % 60;
      } else {
        const parts = String(jam).trim().split(':');
        if (parts.length >= 2) {
          h   = parseInt(parts[0], 10) || 0;
          m   = parseInt(parts[1], 10) || 0;
          sec = parseInt(parts[2] || '0', 10) || 0;
        }
      }
    }

    // Build in LOCAL time – avoids UTC midnight shifting the date
    const result = new Date(year, month, day, h, m, sec, 0);
    return isNaN(result.getTime()) ? null : result;
  } catch {
    return null;
  }
}

/**
 * Format a Date built in local time as a naive ISO string (no timezone suffix)
 * so the pg driver stores exactly the intended calendar date/time.
 */
function toLocalISOString(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function POST(request) {
  try {
    // Check if user is owner
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized - Owner access only' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file buffer — cellDates:true so Excel date cells become JS Date objects
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'Data tidak terdapat dalam file Excel' }, { status: 400 });
    }

    // ── PASS 1: validate every row before touching the DB ──────────────────
    const validationErrors = [];
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row['Nama'] || !row['Tugas']) {
        validationErrors.push(`Baris ${i + 2}: Nama dan Tugas wajib diisi`);
        continue;
      }
      const userResult = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [row['Nama']]
      );
      if (userResult.rows.length === 0) {
        validationErrors.push(`Baris ${i + 2}: User '${row['Nama']}' tidak ditemukan`);
      }
    }

    if (validationErrors.length > 0) {
      // Return errors without inserting anything
      return NextResponse.json({
        success: false,
        imported: 0,
        total: jsonData.length,
        errors: validationErrors,
        message: 'Import dibatalkan karena ada error. Tidak ada data yang dimasukkan.'
      }, { status: 422 });
    }

    // ── PASS 2: insert everything inside a single transaction ──────────────
    const client = await pool.connect();
    let imported = 0;

    try {
      await client.query('BEGIN');

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];

        const userResult = await client.query(
          'SELECT id FROM users WHERE username = $1',
          [row['Nama']]
        );
        const userId = userResult.rows[0].id;

        // Find or create task
        let taskId;
        const taskResult = await client.query(
          'SELECT id FROM task_definitions WHERE title = $1',
          [row['Tugas']]
        );
        if (taskResult.rows.length > 0) {
          taskId = taskResult.rows[0].id;
        } else {
          const newTask = await client.query(
            'INSERT INTO task_definitions (title) VALUES ($1) RETURNING id',
            [row['Tugas']]
          );
          taskId = newTask.rows[0].id;
        }

        // Parse date + time — use toLocalISOString so pg doesn't UTC-shift the value
        const logTimeParsed = parseExcelDateTime(row['Tanggal'], row['Jam']);
        const logTimeStr = logTimeParsed ? toLocalISOString(logTimeParsed) : toLocalISOString(new Date());

        await client.query(
          `INSERT INTO activity_logs
           (task_def_id, logger_user_id, custom_description, location, quantity, satuan, partners, log_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            taskId,
            userId,
            row['Tugas'] || null,
            row['Lokasi'] || null,
            row['Jumlah'] != null ? String(row['Jumlah']) : null,
            row['Satuan'] || null,
            row['Rekan'] || null,
            logTimeStr
          ]
        );

        imported++;
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Import transaction error:', err);
      return NextResponse.json({ error: 'Gagal import data: ' + err.message }, { status: 500 });
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      imported,
      total: jsonData.length,
      errors: null
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import data: ' + error.message }, { status: 500 });
  }
}
