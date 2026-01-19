"use client";

import React, { useState, useEffect } from 'react';
import { 
  Pencil, Plus, Clock, MapPin, Users, Briefcase, 
  Filter, Calendar, User, LogOut, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import InputFormModal from "@/components/InputFormModal"; // Pastikan path ini benar
import EditFormModal2 from '@/components/EditFormModal2';

// --- TIPE DATA ---
interface LogEntry {
  id: number;
  jam: string;
  tugas: string;
  lokasi: string;
  partner?: string; // Optional biar aman
  nama?: string;    // Tambahan jika API mengembalikan nama
}

interface UserDashboardProps {
  userName?: string;
  onLogout?: () => void;
}

export default function UserDashboard({ userName = 'Pekerja', onLogout }: UserDashboardProps) {
  // State Data
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter & Pagination
  const [selectedDate, setSelectedDate] = useState<string>('hari-ini');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Sedikit dikurangi biar pas di layar

  // 1. FETCH DATA DARI API (Real Data)
  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/logs');
        if (res.ok) {
          const data = await res.json();
          // Mapping data dari API ke format UI jika perlu
          const formattedData = data.map((item: any) => ({
            id: item.id,
            jam: item.jam_mulai || item.jam, // Menangani variasi nama field
            tugas: item.custom_description ?? item.tugas ?? '',
            lokasi: item.location ?? item.lokasi ?? '',
            partner: item.partners ?? item.partner ?? '-', // support partners
            nama: item.nama
          }));
          setLogs(formattedData);
        }
      } catch (error) {
        console.error("Gagal ambil data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  // 2. FILTERING LOGIC
  const filteredData = logs.filter(item => {
    // Filter Date bisa ditambahkan di sini nanti
    return true;
  });

  const [editItem, setEditItem] = useState<LogEntry | null>(null);

  function handleSaved(updated: any) {
    setLogs(prev => prev.map(l => l.id === updated.id ? ({
      ...l,
      tugas: updated.custom_description || l.tugas,
      lokasi: updated.location || l.lokasi,
      partner: updated.partners || updated.partner || l.partner,
    }) : l));
    setEditItem(null);
  }

  // 3. PAGINATION LOGIC
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // (No status-based styling required anymore)

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* --- TOP BAR (Header) --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-200">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Portal Kerja</h1>
                <p className="text-xs text-slate-500 font-medium">CV. Morut Jaya</p>
              </div>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-slate-800">{userName}</span>
                <span className="text-xs text-slate-500">Staff Lapangan</span>
              </div>
              <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                <User className="h-5 w-5 text-slate-600" />
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onLogout}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Keluar"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* --- STATISTIK RINGKAS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard 
            icon={<Clock className="h-5 w-5 text-blue-600" />}
            label="Total Log"
            value={filteredData.length}
            bg="bg-blue-50"
          />
          <StatsCard 
            icon={<Users className="h-5 w-5 text-indigo-600" />}
            label="Dengan Rekan"
            value={filteredData.filter(i => i.partner && i.partner !== '-').length}
            bg="bg-indigo-50"
          />
          {/* Tombol Input Cepat di Mobile (muncul di grid stats) */}
          <div className="md:hidden col-span-1 flex flex-col justify-center">
             <InputFormModal />
          </div>
        </div>

        {/* --- ACTION BAR (Filter & Tombol) --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          {/* Tombol Input Desktop */}
          <div className="hidden md:block">
            <InputFormModal />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Filter Tanggal */}
            <div className="relative w-full sm:w-48">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="pl-9 bg-slate-50 border-slate-200 focus:ring-blue-500">
                  <SelectValue placeholder="Pilih Waktu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hari-ini">Hari Ini</SelectItem>
                  <SelectItem value="minggu-ini">Minggu Ini</SelectItem>
                  <SelectItem value="bulan-ini">Bulan Ini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* (Status filter removed) */}
          </div>
        </div>

        {/* --- CONTENT AREA --- */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500 animate-pulse">Sedang memuat data...</p>
          </div>
        ) : (
          <>
            {/* 1. TAMPILAN DESKTOP (TABEL) */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Waktu</th>
                    <th className="px-6 py-4">Tugas</th>
                      <th className="px-6 py-4">Lokasi</th>
                      <th className="px-6 py-4">Rekan</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                        Belum ada data untuk ditampilkan.
                      </td>
                    </tr>
                  ) : (
                    currentData.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                        <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">
                          {item.jam}
                        </td>
                        <td className="px-6 py-4 text-slate-800 font-semibold">
                          {item.tugas}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <div>
                              <div>{item.lokasi}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{item.partner && item.partner !== '-' ? item.partner : '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => setEditItem(item)} className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 2. TAMPILAN MOBILE (KARTU) - Lebih nyaman dibaca di HP */}
            <div className="md:hidden space-y-4">
              {currentData.length === 0 ? (
                <div className="text-center py-10 text-slate-400">Belum ada data.</div>
              ) : (
                currentData.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div>
                        <h3 className="font-bold text-slate-800 text-lg">{item.tugas}</h3>
                      </div>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {item.jam}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <div>
                        <div>{item.lokasi}</div>
                        {item.partner && item.partner !== '-' && (
                          <div className="text-xs text-slate-400">Rekan: {item.partner}</div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-1 border-t border-slate-100 flex justify-end">
                      <Button onClick={() => setEditItem(item)} variant="outline" size="sm" className="text-xs h-8">
                        <Pencil className="h-3 w-3 mr-2" />
                        Edit Laporan
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Edit Modal */}
            <EditFormModal2 item={editItem} onClose={() => setEditItem(null)} onSaved={handleSaved} />

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <span className="text-sm text-slate-500 font-medium">
                  Hal {currentPage} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// --- KOMPONEN KECIL (Helper) ---
function StatsCard({ icon, label, value, bg }: any) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-lg ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}