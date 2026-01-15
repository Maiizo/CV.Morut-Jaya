import React, { useState } from 'react';
import { ShieldCheck, Calendar, User, MapPin, Clock, Briefcase, TrendingUp, Filter, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface AdminLogEntry {
  id: number;
  tanggal: string;
  namaKaryawan: string;
  tugas: string;
  waktuMulai: string;
  waktuSelesai: string;
  dieditOleh: string;
  jamKerja: number;
}

const mockAdminData: AdminLogEntry[] = [
  { id: 1, tanggal: '15 Jan 2026', namaKaryawan: 'Ahmad Saputra', tugas: 'Pemasangan Pipa', waktuMulai: '08:00', waktuSelesai: '12:00', dieditOleh: 'Ahmad', jamKerja: 4 },
  { id: 2, tanggal: '15 Jan 2026', namaKaryawan: 'Budi Hartono', tugas: 'Perbaikan AC', waktuMulai: '13:00', waktuSelesai: '17:00', dieditOleh: 'Budi', jamKerja: 4 },
  { id: 3, tanggal: '15 Jan 2026', namaKaryawan: 'Citra Dewi', tugas: 'Instalasi Listrik', waktuMulai: '08:30', waktuSelesai: '11:00', dieditOleh: 'Citra', jamKerja: 2.5 },
  { id: 4, tanggal: '14 Jan 2026', namaKaryawan: 'Doni Prakoso', tugas: 'Pengecatan Dinding', waktuMulai: '14:00', waktuSelesai: '16:30', dieditOleh: 'Admin', jamKerja: 2.5 },
  { id: 5, tanggal: '14 Jan 2026', namaKaryawan: 'Eko Susilo', tugas: 'Perbaikan Atap', waktuMulai: '07:00', waktuSelesai: '10:00', dieditOleh: 'Eko', jamKerja: 3 },
  { id: 6, tanggal: '14 Jan 2026', namaKaryawan: 'Fahmi Rahman', tugas: 'Pemasangan Keramik', waktuMulai: '10:30', waktuSelesai: '15:00', dieditOleh: 'Fahmi', jamKerja: 4.5 },
  { id: 7, tanggal: '13 Jan 2026', namaKaryawan: 'Gilang Pratama', tugas: 'Service Pompa Air', waktuMulai: '08:00', waktuSelesai: '12:30', dieditOleh: 'Admin', jamKerja: 4.5 },
  { id: 8, tanggal: '13 Jan 2026', namaKaryawan: 'Hadi Wijaya', tugas: 'Perbaikan Pintu', waktuMulai: '13:30', waktuSelesai: '17:00', dieditOleh: 'Hadi', jamKerja: 3.5 },
  { id: 9, tanggal: '13 Jan 2026', namaKaryawan: 'Indra Gunawan', tugas: 'Pengecatan Pagar', waktuMulai: '08:00', waktuSelesai: '16:00', dieditOleh: 'Indra', jamKerja: 8 },
  { id: 10, tanggal: '12 Jan 2026', namaKaryawan: 'Joko Santoso', tugas: 'Perbaikan Plafon', waktuMulai: '09:00', waktuSelesai: '15:30', dieditOleh: 'Admin', jamKerja: 6.5 },
];

interface AdminDashboardProps {
  userName?: string;
  onLogout?: () => void;
}

export function AdminDashboard({ userName = 'Admin', onLogout }: AdminDashboardProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('semua');
  const [selectedMonth, setSelectedMonth] = useState<string>('bulan-ini');
  const [selectedLocation, setSelectedLocation] = useState<string>('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter data
  const filteredData = mockAdminData.filter(item => {
    if (selectedEmployee !== 'semua' && item.namaKaryawan !== selectedEmployee) {
      return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Calculate total hours
  const totalJamKerja = filteredData.reduce((sum, item) => sum + item.jamKerja, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="border-b-2 border-emerald-700 bg-gradient-to-r from-emerald-700 to-emerald-600 px-4 py-5 md:px-6 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white">Dashboard Admin - Master Data</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
              <User className="h-4 w-4 text-white" />
              <p className="font-medium text-white">{userName}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-emerald-700 transition-colors gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Karyawan</p>
                <p className="text-2xl font-semibold">{new Set(filteredData.map(i => i.namaKaryawan)).size}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <User className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tugas</p>
                <p className="text-2xl font-semibold">{filteredData.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Jam Kerja</p>
                <p className="text-2xl font-semibold">{totalJamKerja.toFixed(1)} Jam</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-full sm:w-[220px] border-2 border-gray-300 h-11 pl-10">
                  <SelectValue placeholder="Pilih Karyawan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Karyawan</SelectItem>
                  <SelectItem value="Ahmad Saputra">Ahmad Saputra</SelectItem>
                  <SelectItem value="Budi Hartono">Budi Hartono</SelectItem>
                  <SelectItem value="Citra Dewi">Citra Dewi</SelectItem>
                  <SelectItem value="Doni Prakoso">Doni Prakoso</SelectItem>
                  <SelectItem value="Eko Susilo">Eko Susilo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[220px] border-2 border-gray-300 h-11 pl-10">
                  <SelectValue placeholder="Pilih Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulan-ini">Bulan Ini</SelectItem>
                  <SelectItem value="bulan-lalu">Bulan Lalu</SelectItem>
                  <SelectItem value="3-bulan">3 Bulan Terakhir</SelectItem>
                  <SelectItem value="tahun-ini">Tahun Ini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-full sm:w-[220px] border-2 border-gray-300 h-11 pl-10">
                  <SelectValue placeholder="Pilih Lokasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Lokasi</SelectItem>
                  <SelectItem value="gedung-a">Gedung A</SelectItem>
                  <SelectItem value="gedung-b">Gedung B</SelectItem>
                  <SelectItem value="gedung-c">Gedung C</SelectItem>
                  <SelectItem value="gedung-d">Gedung D</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="hidden md:block border-2 border-gray-300 rounded-lg overflow-hidden shadow-md bg-white">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: '14px' }}>
              <thead>
                <tr className="bg-emerald-700 text-white border-b-2 border-emerald-800">
                  <th className="px-4 py-3.5 text-left font-semibold border-r border-emerald-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Tanggal</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold border-r border-emerald-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Nama Karyawan</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold border-r border-emerald-600">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>Tugas</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold border-r border-emerald-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Mulai</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold border-r border-emerald-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Selesai</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold">Diedit Oleh</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`border-b border-gray-200 hover:bg-emerald-50 transition-all duration-150 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } ${item.jamKerja >= 8 ? 'border-l-4 border-l-emerald-500' : ''}`}
                  >
                    <td className="px-4 py-3.5 border-r border-gray-200">
                      <span className="font-medium">{item.tanggal}</span>
                    </td>
                    <td className="px-4 py-3.5 border-r border-gray-200">{item.namaKaryawan}</td>
                    <td className="px-4 py-3.5 border-r border-gray-200 text-gray-700">{item.tugas}</td>
                    <td className="px-4 py-3.5 border-r border-gray-200">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">{item.waktuMulai}</span>
                    </td>
                    <td className="px-4 py-3.5 border-r border-gray-200">
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-medium">{item.waktuSelesai}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 ${
                        item.dieditOleh === 'Admin' ? 'text-purple-700' : 'text-gray-700'
                      }`}>
                        {item.dieditOleh === 'Admin' && <ShieldCheck className="h-3.5 w-3.5" />}
                        {item.dieditOleh}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table - Mobile (Horizontal Scroll) */}
        <div className="md:hidden border-2 border-gray-300 rounded-lg overflow-hidden shadow-md bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]" style={{ fontSize: '14px' }}>
              <thead>
                <tr className="bg-emerald-700 text-white border-b-2 border-emerald-800">
                  <th className="px-3 py-3 text-left font-semibold border-r border-emerald-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Tanggal</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left font-semibold border-r border-emerald-600">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>Karyawan</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left font-semibold border-r border-emerald-600">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>Tugas</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left font-semibold border-r border-emerald-600">Mulai</th>
                  <th className="px-3 py-3 text-left font-semibold border-r border-emerald-600">Selesai</th>
                  <th className="px-3 py-3 text-left font-semibold">Diedit</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } ${item.jamKerja >= 8 ? 'border-l-4 border-l-emerald-500' : ''}`}
                  >
                    <td className="px-3 py-3 border-r border-gray-200 font-medium">{item.tanggal}</td>
                    <td className="px-3 py-3 border-r border-gray-200">{item.namaKaryawan}</td>
                    <td className="px-3 py-3 border-r border-gray-200">{item.tugas}</td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{item.waktuMulai}</span>
                    </td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-medium">{item.waktuSelesai}</span>
                    </td>
                    <td className="px-3 py-3">{item.dieditOleh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredData.length)} dari {filteredData.length} data
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-2 border-gray-300"
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-2 border-gray-300"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}

        {/* Summary Footer */}
        <div className="mt-6 border-2 border-emerald-300 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-base text-emerald-900">Total Jam Kerja:</span>
            </div>
            <span className="font-bold text-2xl text-emerald-700">{totalJamKerja.toFixed(1)} Jam</span>
          </div>
        </div>
      </div>
    </div>
  );
}