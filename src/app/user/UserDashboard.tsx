"use client";

import React, { useState, useEffect } from 'react';
import { 
  Pencil, Plus, Clock, MapPin, Users, Briefcase, 
  Calendar, User, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// select removed (periode waktu removed)
import InputFormModal from "@/components/InputFormModal"; // Pastikan path ini benar
import EditFormModal2 from '@/components/EditFormModal2';
import LogoutButton from '@/components/LogoutButton';

// --- TIPE DATA ---
interface LogEntry {
  id: number;
  jam: string;
  tugas: string;
  lokasi: string;
  partner?: string; // Optional biar aman
  quantity?: string | null;
  satuan?: string | null;
  nama?: string;    // Tambahan jika API mengembalikan nama
}

interface UserDashboardProps {
  userName?: string;
}

export default function UserDashboard({ userName = 'Pekerja' }: UserDashboardProps) {
  // State Data
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter & Pagination
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
            quantity: item.quantity ?? null,
            satuan: item.satuan ?? null,
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
  const filteredData = logs; // No filtering for now, can add date filtering later if needed

  const [editItem, setEditItem] = useState<LogEntry | null>(null);

  function handleSaved(updated: any) {
    setLogs(prev => prev.map(l => l.id === updated.id ? ({
      ...l,
      tugas: updated.custom_description || l.tugas,
      lokasi: updated.location || l.lokasi,
      partner: updated.partners || updated.partner || l.partner,
      quantity: updated.quantity !== undefined ? updated.quantity : l.quantity,
      satuan: updated.satuan !== undefined ? updated.satuan : l.satuan,
    }) : l));
    setEditItem(null);
  }

  // 3. PAGINATION LOGIC
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);



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
                <p className="text-xs text-slate-500 font-medium">CV. Jaya Lestari Morut</p>
              </div>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-slate-800">{userName}</span>
               </div>
             
              <LogoutButton 
                variant="ghost" 
                size="icon"
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                showIcon={true}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* --- STATISTIK RINGKAS --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <StatsCard 
            icon={<Clock className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />}
            label="Total Log"
            value={filteredData.length}
            bg="bg-blue-50"
          />
          <StatsCard 
            icon={<Briefcase className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />}
            label="Pekerjaan"
            value={new Set(filteredData.map(i => i.tugas)).size}
            bg="bg-emerald-50"
          />
          <StatsCard 
            icon={<MapPin className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />}
            label="Lokasi"
            value={new Set(filteredData.map(i => i.lokasi)).size}
            bg="bg-amber-50"
          />
        </div>

        {/* --- ACTION BAR (Filter & Tombol) - Mobile Optimized --- */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          {/* Tombol Input - Full Width on Mobile */}
          <div className="w-full">
            <InputFormModal />
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
                    <th className="px-6 py-4">Jumlah</th>
                    <th className="px-6 py-4">Satuan</th>
                    <th className="px-6 py-4">Rekan</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
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
                        <td className="px-6 py-4 text-slate-700 text-center">{item.quantity ?? '-'}</td>
                        <td className="px-6 py-4 text-slate-700 text-center">{item.satuan ?? '-'}</td>
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

            {/* 2. TAMPILAN MOBILE (KARTU) - Improved */}
            <div className="md:hidden space-y-3">
              {currentData.length === 0 ? (
                <div className="text-center py-10 text-slate-400">Belum ada data.</div>
              ) : (
                currentData.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 active:bg-slate-50 transition-colors">
                    {/* Header Row */}
                    <div className="flex justify-between items-start gap-3">
                      <span className="text-sm font-bold font-mono text-slate-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                        {item.jam}
                      </span>
                    </div>
                    
                    {/* Task Title */}
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{item.tugas}</h3>
                    
                    {/* Location & Partner */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-start gap-2 text-sm text-slate-600">
                        <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">{item.lokasi}</div>
                          {item.partner && item.partner !== '-' && (
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Rekan: {item.partner}
                            </div>
                          )}
                          {(item.quantity || item.satuan) && (
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                              <div>Jumlah: <span className="font-medium">{item.quantity ?? '-'}</span></div>
                              <div>Satuan: <span className="font-medium">{item.satuan ?? '-'}</span></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-slate-100">
                      <Button 
                        onClick={() => setEditItem(item)} 
                        variant="outline" 
                        className="w-full h-11 text-base font-medium text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Laporan
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Edit Modal */}
            <EditFormModal2 item={editItem} onClose={() => setEditItem(null)} onSaved={handleSaved} />

            {/* PAGINATION - Mobile Optimized */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center gap-4 pt-4 border-t border-slate-200 mt-6 bg-white p-4 rounded-xl">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-11 px-4 md:px-6"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> 
                  <span className="hidden sm:inline">Prev</span>
                  <span className="sm:hidden">‹</span>
                </Button>
                <span className="text-sm md:text-base text-slate-700 font-semibold px-2">
                  Hal <span className="text-blue-600">{currentPage}</span> / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-11 px-4 md:px-6"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">›</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
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
    <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`p-2 md:p-3 rounded-lg ${bg} flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] md:text-xs text-slate-500 font-semibold uppercase tracking-wide truncate">{label}</p>
          <p className="text-xl md:text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}