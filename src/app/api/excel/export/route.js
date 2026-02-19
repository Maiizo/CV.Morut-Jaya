import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(request) {
  try {
    // Check if user is owner
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized - Owner access only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    if (!fromDate || !toDate) {
      return NextResponse.json({ error: 'fromDate and toDate are required' }, { status: 400 });
    }

    // Fetch logs within date range
    const query = `
      SELECT
        activity_logs.id,
        to_char(activity_logs.created_at, 'DD Mon YYYY') as tanggal,
        to_char(activity_logs.log_time, 'HH24:MI:SS') as jam,
        users.username as nama,
        activity_logs.custom_description as tugas,
        activity_logs.location as lokasi,
        activity_logs.quantity as jumlah,
        activity_logs.satuan,
        activity_logs.partners as rekan
      FROM activity_logs
      JOIN users ON activity_logs.logger_user_id = users.id
      WHERE activity_logs.created_at >= $1 AND activity_logs.created_at <= $2
      ORDER BY activity_logs.log_time DESC
    `;

    const result = await pool.query(query, [fromDate, toDate]);

    // Convert to Excel format
    const data = result.rows.map((row, index) => ({
      'No': index + 1,
      'Tanggal': row.tanggal,
      'Jam': row.jam,
      'Nama': row.nama,
      'Tugas': row.tugas || '-',
      'Lokasi': row.lokasi || '-',
      'Jumlah': row.jumlah || '-',
      'Satuan': row.satuan || '-',
      'Rekan': row.rekan || '-'
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },  // No
      { wch: 15 }, // Tanggal
      { wch: 10 }, // Jam
      { wch: 20 }, // Nama
      { wch: 30 }, // Tugas
      { wch: 25 }, // Lokasi
      { wch: 10 }, // Jumlah
      { wch: 10 }, // Satuan
      { wch: 25 }  // Rekan
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Logs');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="activity_logs_${fromDate}_to_${toDate}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
