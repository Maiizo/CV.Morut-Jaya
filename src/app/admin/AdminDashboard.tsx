"use client"; //

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"; // Sesuaikan path import ini jika berbeda
import { Input } from "@/components/ui/input"; // Kita butuh input text biasa
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import EditFormModal2 from '@/components/EditFormModal2';

interface Log {
  id: number;
  tanggal: string;
  jam_mulai: string;
  nama: string;
  tugas: string;
  lokasi: string;
  // canonical API fields (may be present instead of the legacy ones)
  custom_description?: string | null;
  location?: string | null;
  partners?: string | null;
  task_def_id?: number | null;
  logger_user_id?: number | null;
  log_time?: string | null;
  created_at?: string | null;
}

interface AdminDashboardProps {
  userName?: string;
  onLogout?: () => void;
}

export default function AdminDashboard({ userName = 'Admin', onLogout }: AdminDashboardProps) {
  // State untuk Data Tabel
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [editItem, setEditItem] = useState<Log | null>(null);
  
  // State untuk Form Tambah Pekerjaan
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FETCH DATA: Ambil data logs saat halaman dibuka
  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error("Gagal ambil logs:", error);
    }
  }

  // ACTION: Tambah Pekerjaan Baru
  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault(); // Mencegah reload halaman
    if (!newTaskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle }),
      });

      if (res.ok) {
        alert("Pekerjaan berhasil ditambahkan!");
        setNewTaskTitle(""); // Kosongkan input
      } else {
        alert("Gagal menambah pekerjaan.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600 hidden sm:block">{userName}</p>
          {onLogout && (
            <Button variant="outline" className="border-gray-300" onClick={onLogout}>
              Keluar
            </Button>
          )}
        </div>
      </div>

      {/* --- BAGIAN 1: INPUT PEKERJAAN BARU --- */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Tambah Jenis Pekerjaan Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="flex gap-4 items-end">
            <div className="w-full max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Pekerjaan (Misal: Bersih Kaca, Sapu Halaman)
              </label>
              {/* Input field standard */}
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Ketik nama pekerjaan..."
              />
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Menyimpan..." : "+ Simpan Pekerjaan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* --- BAGIAN 2: TABEL LOG AKTIVITAS --- */}
      <Card>
        <CardHeader>
          <CardTitle>Log Aktivitas Karyawan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-700 uppercase tracking-wider">
                <tr>
                  <th className="p-4 border-b">Tanggal</th>
                  <th className="p-4 border-b">Jam (Mulai)</th>
                  <th className="p-4 border-b">Nama Karyawan</th>
                  <th className="p-4 border-b">Tugas / Ket.</th>
                  <th className="p-4 border-b">Lokasi</th>
                  <th className="p-4 border-b">Rekan</th>
                  <th className="p-4 border-b">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">
                      Belum ada data masuk.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{log.tanggal}</td>
                      {/* Tampilkan Jam Lengkap dengan Detik */}
                      <td className="p-4 font-mono text-blue-600">{log.jam_mulai}</td>
                      <td className="p-4 font-semibold">{log.nama}</td>
                      <td className="p-4">
                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-700">{log.custom_description ?? log.tugas}</span>
                      </td>
                      <td className="p-4 text-gray-600">{log.location ?? log.lokasi}</td>
                      <td className="p-4 text-gray-700">{log.partners || '-'}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedLog(log)}>Lihat Detail</Button>
                          <Button size="sm" onClick={() => setEditItem(log)}>Edit</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="py-4 space-y-3">
              <div><strong>ID:</strong> {selectedLog.id}</div>
              <div><strong>Nama:</strong> {selectedLog.nama}</div>
              <div><strong>Tugas / Keterangan:</strong> {selectedLog.custom_description ?? selectedLog.tugas}</div>
              <div><strong>Lokasi:</strong> {selectedLog.location ?? selectedLog.lokasi}</div>
              <div><strong>Rekan:</strong> {selectedLog.partners ?? '-'}</div>
              <div><strong>Log Time:</strong> {selectedLog.log_time ?? selectedLog.jam_mulai}</div>
              <div><strong>Dibuat:</strong> {selectedLog.created_at ?? selectedLog.tanggal}</div>
              <div><strong>Raw JSON:</strong></div>
              <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(selectedLog, null, 2)}</pre>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Tutup</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal for Admin (reuse EditFormModal) */}
      <EditFormModal2 item={editItem} onClose={() => setEditItem(null)} onSaved={(updated: any) => {
        // update logs list with returned row
        setLogs(prev => prev.map(l => l.id === updated.id ? ({
          ...l,
          custom_description: updated.custom_description ?? l.custom_description,
          location: updated.location ?? l.location,
          partners: updated.partners ?? l.partners,
          task_def_id: updated.task_def_id ?? l.task_def_id,
        }) : l));
        setEditItem(null);
      }} />
    </div>
  );
}