import React, { useState } from 'react';
import { Pencil, Plus, Clock, MapPin, Users, Briefcase, Filter, Calendar, User, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface LogEntry {
  id: number;
  jam: string;
  tugas: string;
  lokasi: string;
  partner: string;
  status: 'Selesai' | 'Dalam Proses' | 'Pending';
}

const mockData: LogEntry[] = [
  { id: 1, jam: '08:00 - 12:00', tugas: 'Pemasangan Pipa', lokasi: 'Gedung A - Lt. 3', partner: 'Ahmad, Budi', status: 'Selesai' },
  { id: 2, jam: '13:00 - 17:00', tugas: 'Perbaikan AC', lokasi: 'Gedung B - Lt. 1', partner: 'Citra', status: 'Selesai' },
  { id: 3, jam: '08:30 - 11:00', tugas: 'Instalasi Listrik', lokasi: 'Gedung C - Lt. 2', partner: 'Doni, Eko', status: 'Dalam Proses' },
  { id: 4, jam: '14:00 - 16:30', tugas: 'Pengecatan Dinding', lokasi: 'Gedung A - Lt. 1', partner: 'Fahmi', status: 'Pending' },
  { id: 5, jam: '07:00 - 10:00', tugas: 'Perbaikan Atap', lokasi: 'Gedung D - Rooftop', partner: 'Gilang, Hadi', status: 'Selesai' },
  { id: 6, jam: '10:30 - 15:00', tugas: 'Pemasangan Keramik', lokasi: 'Gedung B - Lt. 2', partner: 'Indra', status: 'Dalam Proses' },
  { id: 7, jam: '08:00 - 12:30', tugas: 'Service Pompa Air', lokasi: 'Gedung C - Basement', partner: 'Joko, Kurnia', status: 'Selesai' },
  { id: 8, jam: '13:30 - 17:00', tugas: 'Perbaikan Pintu', lokasi: 'Gedung A - Lt. 2', partner: 'Luki', status: 'Pending' },
];

interface UserDashboardProps {
  onInputLog: () => void;
  onEditLog: (id: number) => void;
  userName?: string;
  onLogout?: () => void;
}

export function UserDashboard({ onInputLog, onEditLog, userName = 'Pekerja', onLogout }: UserDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter data
  const filteredData = mockData.filter(item => {
    if (selectedStatus !== 'semua' && item.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Selesai':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Dalam Proses':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="border-b-2 border-sky-700 bg-gradient-to-r from-sky-700 to-sky-600 px-4 py-5 md:px-6 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white">Dashboard Pekerja</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
              <User className="h-4 w-4 text-white" />
              <p className="font-medium text-white">{userName}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-sky-700 transition-colors gap-2"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Log</p>
                <p className="text-xl font-semibold">{filteredData.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Briefcase className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Selesai</p>
                <p className="text-xl font-semibold">{filteredData.filter(i => i.status === 'Selesai').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Proses</p>
                <p className="text-xl font-semibold">{filteredData.filter(i => i.status === 'Dalam Proses').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-xl font-semibold">{filteredData.filter(i => i.status === 'Pending').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="mb-6 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Button 
              onClick={onInputLog}
              className="bg-sky-700 text-white hover:bg-sky-800 gap-2 text-base h-11 shadow-md"
            >
              <Plus className="h-5 w-5" />
              Input Log Baru
            </Button>
            
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger className="w-full sm:w-[200px] border-2 border-gray-300 h-11 pl-10">
                    <SelectValue placeholder="Pilih Tanggal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hari-ini">Hari Ini</SelectItem>
                    <SelectItem value="kemarin">Kemarin</SelectItem>
                    <SelectItem value="minggu-ini">Minggu Ini</SelectItem>
                    <SelectItem value="bulan-ini">Bulan Ini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-[200px] border-2 border-gray-300 h-11 pl-10">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Semua Status</SelectItem>
                    <SelectItem value="Selesai">Selesai</SelectItem>
                    <SelectItem value="Dalam Proses">Dalam Proses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="hidden md:block border-2 border-gray-300 rounded-lg overflow-hidden shadow-md bg-white">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: '14px' }}>
              <thead>
                <tr className="bg-sky-700 text-white border-b-2 border-sky-800">
                  <th className="px-4 py-3.5 text-left font-semibold border-r border-sky-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Jam</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold border-r border-sky-600">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>Tugas</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold border-r border-sky-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Lokasi</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold border-r border-sky-600">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Partner</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-left font-semibold border-r border-sky-600">Status</th>
                  <th className="px-4 py-3.5 text-left font-semibold w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`border-b border-gray-200 hover:bg-sky-50 transition-all duration-150 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } ${item.status === 'Dalam Proses' ? 'border-l-4 border-l-blue-500' : ''} ${item.status === 'Pending' ? 'border-l-4 border-l-yellow-500' : ''}`}
                  >
                    <td className="px-4 py-3.5 border-r border-gray-200">
                      <span className="font-medium">{item.jam}</span>
                    </td>
                    <td className="px-4 py-3.5 border-r border-gray-200">{item.tugas}</td>
                    <td className="px-4 py-3.5 border-r border-gray-200 text-gray-700">{item.lokasi}</td>
                    <td className="px-4 py-3.5 border-r border-gray-200 text-gray-700">{item.partner}</td>
                    <td className="px-4 py-3.5 border-r border-gray-200">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium text-xs ${getStatusColor(item.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'Selesai' ? 'bg-green-600' : 
                          item.status === 'Dalam Proses' ? 'bg-blue-600' : 'bg-yellow-600'
                        }`}></span>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => onEditLog(item.id)}
                        className="p-2 hover:bg-sky-100 rounded-lg transition-colors text-sky-700"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
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
            <table className="w-full min-w-[640px]" style={{ fontSize: '14px' }}>
              <thead>
                <tr className="bg-sky-700 text-white border-b-2 border-sky-800">
                  <th className="px-3 py-3 text-left font-semibold border-r border-sky-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Jam</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left font-semibold border-r border-sky-600">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>Tugas</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left font-semibold border-r border-sky-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Lokasi</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left font-semibold border-r border-sky-600">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>Partner</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left font-semibold border-r border-sky-600">Status</th>
                  <th className="px-3 py-3 text-left font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } ${item.status === 'Dalam Proses' ? 'border-l-4 border-l-blue-500' : ''} ${item.status === 'Pending' ? 'border-l-4 border-l-yellow-500' : ''}`}
                  >
                    <td className="px-3 py-3 border-r border-gray-200 font-medium">{item.jam}</td>
                    <td className="px-3 py-3 border-r border-gray-200">{item.tugas}</td>
                    <td className="px-3 py-3 border-r border-gray-200">{item.lokasi}</td>
                    <td className="px-3 py-3 border-r border-gray-200">{item.partner}</td>
                    <td className="px-3 py-3 border-r border-gray-200">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${getStatusColor(item.status)}`}>
                        <span className={`w-1 h-1 rounded-full ${
                          item.status === 'Selesai' ? 'bg-green-600' : 
                          item.status === 'Dalam Proses' ? 'bg-blue-600' : 'bg-yellow-600'
                        }`}></span>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => onEditLog(item.id)}
                        className="p-2 hover:bg-sky-100 rounded-lg text-sky-700"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
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
      </div>
    </div>
  );
}