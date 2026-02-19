import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import * as XLSX from 'xlsx';

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

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'No data found in Excel file' }, { status: 400 });
    }

    let imported = 0;
    let errors = [];

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      try {
        // Validate required fields
        if (!row['Nama'] || !row['Tugas']) {
          errors.push(`Row ${i + 2}: Missing required fields (Nama or Tugas)`);
          continue;
        }

        // Find user by username
        const userResult = await pool.query(
          'SELECT id FROM users WHERE username = $1',
          [row['Nama']]
        );

        if (userResult.rows.length === 0) {
          errors.push(`Row ${i + 2}: User '${row['Nama']}' not found`);
          continue;
        }

        const userId = userResult.rows[0].id;

        // Find or create task
        let taskId = null;
        const taskResult = await pool.query(
          'SELECT id FROM task_definitions WHERE title = $1',
          [row['Tugas']]
        );

        if (taskResult.rows.length > 0) {
          taskId = taskResult.rows[0].id;
        } else {
          // Create new task if not exists
          const newTask = await pool.query(
            'INSERT INTO task_definitions (title) VALUES ($1) RETURNING id',
            [row['Tugas']]
          );
          taskId = newTask.rows[0].id;
        }

        // Parse date and time - handle multiple formats
        let logTime = new Date();
        if (row['Tanggal'] && row['Jam']) {
          try {
            // Try to parse date
            const dateStr = String(row['Tanggal']);
            const timeStr = String(row['Jam']);
            logTime = new Date(`${dateStr} ${timeStr}`);
            
            // If invalid, use current time
            if (isNaN(logTime.getTime())) {
              logTime = new Date();
            }
          } catch (e) {
            logTime = new Date();
          }
        }

        // Insert activity log
        await pool.query(
          `INSERT INTO activity_logs 
           (task_def_id, logger_user_id, custom_description, location, quantity, satuan, partners, log_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            taskId,
            userId,
            row['Tugas'] || null,
            row['Lokasi'] || null,
            row['Jumlah'] || null,
            row['Satuan'] || null,
            row['Rekan'] || null,
            logTime
          ]
        );

        imported++;
      } catch (err) {
        console.error(`Error importing row ${i + 2}:`, err);
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      total: jsonData.length,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Failed to import data: ' + error.message }, { status: 500 });
  }
}
