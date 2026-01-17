import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// 1. GET: Untuk mengisi Dropdown di User Dashboard
export async function GET() {
  try {
      // Ambil data yang TIDAK diarsipkan
          const result = await pool.query('SELECT * FROM task_definitions WHERE is_archived = FALSE ORDER BY title ASC');
              
                  // Kirim data ke frontend (JSON)
                      return NextResponse.json(result.rows);
                        } catch (error) {
                            console.error('Error fetching tasks:', error);
                                return NextResponse.json({ error: 'Gagal mengambil data pekerjaan' }, { status: 500 });
                                  }
                                  }

                                  // 2. POST: Untuk Admin menambah pekerjaan baru
                                  export async function POST(request) {
                                    try {
                                        const body = await request.json();
                                            const { title } = body;

                                                const query = 'INSERT INTO task_definitions (title) VALUES ($1) RETURNING *';
                                                    const result = await pool.query(query, [title]);

                                                        return NextResponse.json(result.rows[0]);
                                                          } catch (error) {
                                                              console.error('Error creating task:', error);
                                                                  return NextResponse.json({ error: 'Gagal menambah pekerjaan' }, { status: 500 });
                                                                    }
                                                                    }
                                                                    