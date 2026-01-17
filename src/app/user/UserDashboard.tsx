"use client"; // Wajib ada di baris pertama

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"; // Pastikan path ini sesuai
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Definisikan tipe data agar tidak merah (TypeScript)
interface Log {
  id: number;
  jam: string;
  nama: string;
  tugas: string;
  lokasi: string;
}

interface UserDashboardProps {
  onInputLog?: () => void;
  onEditLog?: (id: number) => void;
  userName?: string;
  onLogout?: () => void;
}

export default function UserDashboard({ onInputLog, onEditLog, userName, onLogout }: UserDashboardProps) {
  // 1. STATE: Tempat menyimpan data dari database
  const [logs, setLogs] = useState<Log[]>([]); 
  const [loading, setLoading] = useState(true);

  // 2. EFFECT: Ambil data saat halaman pertama kali dibuka
  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await fetch('/api/logs'); // Panggil API backend
        if (!response.ok) throw new Error('Gagal mengambil data');
        const data = await response.json();
        setLogs(data); // Simpan ke state
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false); // Matikan loading apapun hasilnya
      }
    }

    fetchLogs();
  }, []); // Array kosong [] artinya cuma jalan sekali pas load

  // Tampilan saat Loading
  if (loading) {
    return <div className="p-10 text-center">Sedang memuat data...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header Dashboard */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Halo, {userName ?? 'Tim Kebersihan'}</h1>
          <p className="text-gray-600">Selamat bekerja, jangan lupa catat kegiatan.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onInputLog?.()}>
            + Catat Pekerjaan Baru
          </Button>
          {onLogout && (
            <Button variant="outline" className="border-gray-300" onClick={onLogout}>
              Keluar
            </Button>
          )}
        </div>
      </div>

      {/* Tabel Riwayat Kerja */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 font-medium">Jam</th>
                  <th className="p-3 font-medium">Nama</th>
                  <th className="p-3 font-medium">Tugas</th>
                  <th className="p-3 font-medium">Lokasi</th>
                  <th className="p-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {/* 3. LOOPING DATA: Tampilkan data dari state 'logs' */}
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      Belum ada data hari ini.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-gray-900">{log.jam}</td>
                      <td className="p-3 font-semibold">{log.nama}</td>
                      <td className="p-3 bg-blue-50 text-blue-700 rounded-md inline-block my-1 text-sm px-2 py-1">
                        {log.tugas}
                      </td>
                      <td className="p-3 text-gray-600">{log.lokasi}</td>
                      <td className="p-3">
                        <button
                          className="text-gray-400 hover:text-blue-600"
                          onClick={() => onEditLog?.(log.id)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}