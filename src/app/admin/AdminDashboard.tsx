"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import EditFormModal2 from '@/components/EditFormModal2';
import { 
  ArrowUpDown, 
  Filter, 
  X, 
  User, 
  MapPin, 
  Calendar, 
  Search
} from 'lucide-react'; 

interface Log {
  id: number;
  tanggal: string;
  jam_mulai: string;
  nama: string;
  tugas: string; // This is now guaranteed by our mapping
  lokasi: string; // This is now guaranteed by our mapping
  partners?: string | null;
  quantity?: string | null;
  satuan?: string | null;
  // Keep these for reference/compatibility
  custom_description?: string | null;
  location?: string | null;
  task_def_id?: number | null;
  logger_user_id?: number | null;
  log_time?: string | null;
  created_at?: string | null;
}

interface AdminDashboardProps {
  userName?: string;
  onLogout?: () => void;
}

// Helper for highlighting text during search
const Highlight = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim() || !text) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? <span key={i} className="bg-yellow-200 font-bold">{part}</span> : part
      )}
    </span>
  );
};

export default function AdminDashboard({ userName = 'Admin', onLogout }: AdminDashboardProps) {
  // --- STATE ---
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [editItem, setEditItem] = useState<Log | null>(null);
  
  // State for Form
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for "Smart View" (Filters & Sorting)
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{
    key: keyof Log | 'partners'; 
    value: string;
    label: string;
  }[]>([]);
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof Log; direction: 'asc' | 'desc' } | null>(null);

  // --- FETCH DATA ---
  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch('/api/logs');
      const rawData = await res.json();
      
      // ✅ FIX: Map data immediately so 'tugas' and 'lokasi' definitely exist
      const formattedData = rawData.map((item: any) => ({
        ...item,
        tugas: item.custom_description || item.tugas || '-',
        lokasi: item.location || item.lokasi || '-',
        partners: item.partners || '',
        quantity: item.quantity || '',
        satuan: item.satuan || '',
      }));

      setLogs(formattedData);
    } catch (error) {
      console.error("Gagal ambil logs:", error);
    }
  }

  // --- HANDLERS ---

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
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
        setNewTaskTitle(""); 
      } else {
        alert("Gagal menambah pekerjaan.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Smart Filter Logic
  const addFilter = (key: keyof Log | 'partners', value: string, labelPrefix: string) => {
    // Prevent empty filters
    if (!value || value === '-') return;

    // Avoid duplicate filters
    setActiveFilters(prev => {
      const filtered = prev.filter(f => f.key !== key);
      return [...filtered, { key, value, label: `${labelPrefix}: ${value}` }];
    });
  };

  const removeFilter = (key: string) => {
    setActiveFilters(prev => prev.filter(f => f.key !== key));
  };

  const handleSort = (key: keyof Log) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- DERIVED DATA (FILTERING & SORTING) ---
  const processedLogs = useMemo(() => {
    let data = [...logs];

    // 1. Global Search
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      data = data.filter(item => 
        (item.nama || '').toLowerCase().includes(lowerQ) ||
        (item.tugas || '').toLowerCase().includes(lowerQ) ||
        (item.lokasi || '').toLowerCase().includes(lowerQ)
      );
    }

    // 2. Specific Column Filters (Drill Down)
    activeFilters.forEach(filter => {
      data = data.filter(item => {
        const itemValue = String(item[filter.key as keyof Log] || '');
        
        // Special logic for partners (contains) vs others (exact match)
        if (filter.key === 'partners') {
          return itemValue.toLowerCase().includes(filter.value.toLowerCase());
        }
        return itemValue === filter.value;
      });
    });

    // 3. Sorting
    if (sortConfig) {
      data.sort((a, b) => {
        const valA = (a[sortConfig.key] || '').toString().toLowerCase();
        const valB = (b[sortConfig.key] || '').toString().toLowerCase();
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [logs, searchQuery, activeFilters, sortConfig]);


  // --- RENDER HELPERS ---
  const renderSortIcon = (key: keyof Log) => {
    if (sortConfig?.key === key) {
      return (
        <span className={`ml-2 inline-block transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`}>
          ▼
        </span>
      );
    }
    return <ArrowUpDown className="ml-2 h-3 w-3 inline-block opacity-30 group-hover:opacity-100" />;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-8 font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard Utama</h1>
          <p className="text-slate-500">
            Halo, <span className="font-semibold text-blue-600">{userName}</span>. 
            Saat ini menampilkan <span className="font-bold">{processedLogs.length}</span> data.
          </p>
        </div>
      </div>

      {/* --- STATS BAR --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-blue-100 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Log Ditampilkan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{processedLogs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* --- CONTROLS AREA --- */}
      <div className="space-y-4">
        
        {/* Search & Add Task */}
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            {/* Search Bar */}
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Cari nama, tugas, atau lokasi..." 
                    className="pl-9 bg-slate-50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Quick Add Task */}
            <form onSubmit={handleAddTask} className="flex w-full md:w-auto gap-2 items-center">
                <Input 
                    value={newTaskTitle} 
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Tambah jenis pekerjaan baru..." 
                    className="min-w-[200px]"
                />
                <Button type="submit" disabled={isSubmitting} size="sm" className="bg-blue-200 hover:bg-blue-400">
                    {isSubmitting ? "..." : "+"}
                </Button>
            </form>
        </div>

        {/* Active Filters Display */}
        {(activeFilters.length > 0 || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-medium text-slate-500 mr-2 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Filter Aktif:
                </span>
                
                {activeFilters.map((filter, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                        {filter.label}
                        <button onClick={() => removeFilter(filter.key)} className="hover:text-red-500 ml-1">
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}

                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-slate-500 hover:text-red-600"
                    onClick={() => { setActiveFilters([]); setSearchQuery(""); }}
                >
                    Reset Semua
                </Button>
            </div>
        )}
      </div>

      {/* --- DATA TABLE --- */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
              <th 
                className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => handleSort('tanggal')}
              >
                <div className="flex items-center">Tanggal {renderSortIcon('tanggal')}</div>
              </th>
              <th 
                className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => handleSort('jam_mulai')}
              >
                <div className="flex items-center">Jam {renderSortIcon('jam_mulai')}</div>
              </th>
              <th 
                className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => handleSort('nama')}
              >
                <div className="flex items-center">Nama {renderSortIcon('nama')}</div>
              </th>
              <th 
                className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => handleSort('tugas')}
              >
                <div className="flex items-center">Tugas {renderSortIcon('tugas')}</div>
              </th>
              <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('lokasi')}>
                <div className="flex items-center">Lokasi {renderSortIcon('lokasi')}</div>
              </th>
              <th className="px-6 py-4 font-semibold">Jumlah</th>
              <th className="px-6 py-4 font-semibold">Satuan</th>
              <th className="px-6 py-4 font-semibold">Rekan</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {processedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-lg font-medium text-slate-600 mb-1">Tidak ada data ditemukan</p>
                    <p className="text-sm">Coba ubah filter atau kata kunci pencarian Anda.</p>
                  </td>
                </tr>
              ) : (
                processedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                    
                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                            onClick={() => addFilter('tanggal', log.tanggal, 'Tanggal')}
                            className="flex items-center gap-2 hover:text-blue-600 hover:underline decoration-blue-300 underline-offset-4 decoration-dashed"
                            title="Filter tanggal ini"
                        >
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-medium text-slate-700">{log.tanggal}</span>
                        </button>
                    </td>

                    {/* Time */}
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                        {log.jam_mulai}
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4">
                        <button 
                            onClick={() => addFilter('nama', log.nama, 'User')}
                            className="flex items-center gap-2 px-2 py-1 -ml-2 rounded-lg hover:bg-blue-50 transition-colors text-slate-800 hover:text-blue-700"
                            title="Lihat semua log orang ini"
                        >
                             <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                <User className="h-3 w-3 text-slate-500" />
                             </div>
                             <span className="font-semibold"><Highlight text={log.nama} highlight={searchQuery} /></span>
                        </button>
                    </td>

                    {/* Task */}
                    <td className="px-6 py-4">
                        <button 
                             onClick={() => addFilter('tugas', log.tugas, 'Tugas')}
                             className="text-left hover:text-blue-600 group-hover:underline decoration-blue-300 underline-offset-4 decoration-dashed"
                        >
                            <Highlight text={log.tugas} highlight={searchQuery} />
                        </button>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                         <button 
                             onClick={() => addFilter('lokasi', log.lokasi, 'Lokasi')}
                             className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 text-slate-600 text-xs border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
                        >
                            <MapPin className="h-3 w-3" />
                            <Highlight text={log.lokasi} highlight={searchQuery} />
                        </button>
                    </td>


                    {/* Quantity */}
                    <td className="px-6 py-4 text-slate-700 text-sm text-center">
                      {log.quantity || '-'}
                    </td>
                    {/* Satuan */}
                    <td className="px-6 py-4 text-slate-700 text-sm text-center">
                      {log.satuan || '-'}
                    </td>
                    {/* Partners */}
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {log.partners ? log.partners : '-'}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setSelectedLog(log)}>Detail</Button>
                        <Button size="sm" className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800" onClick={() => setEditItem(log)}>Edit</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- MODALS --- */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Aktivitas</DialogTitle>
          </DialogHeader>
           {selectedLog && (
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-slate-500">Karyawan</span>
                <span className="col-span-2 font-medium text-slate-900">{selectedLog.nama}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-slate-500">Tugas</span>
                <span className="col-span-2 bg-slate-100 p-2 rounded">{selectedLog.tugas}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-slate-500">Waktu</span>
                <span className="col-span-2">{selectedLog.tanggal} — {selectedLog.jam_mulai}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-slate-500">Lokasi</span>
                <span className="col-span-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {selectedLog.lokasi}
                </span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-slate-500">Jumlah</span>
                <span className="col-span-2">{selectedLog.quantity || '-'}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-slate-500">Satuan</span>
                <span className="col-span-2">{selectedLog.satuan || '-'}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-slate-500">Rekan</span>
                <span className="col-span-2">{selectedLog.partners || '-'}</span>
              </div>
            </div>
           )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Tutup</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditFormModal2 
        item={editItem} 
        onClose={() => setEditItem(null)} 
        onSaved={(updated: any) => {
            // Update local state to reflect changes immediately
            setLogs(prev => prev.map(l => l.id === updated.id ? ({
            ...l,
            tugas: updated.custom_description || l.tugas,
            lokasi: updated.location || l.lokasi,
            partners: updated.partners || l.partners,
            // also update raw fields if needed
            custom_description: updated.custom_description,
            location: updated.location
            }) : l));
            setEditItem(null);
        }} 
      />
    </div>
  );
}