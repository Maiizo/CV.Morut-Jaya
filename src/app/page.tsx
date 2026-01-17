"use client";

import React, { useState } from 'react';
import UserDashboard from './user/UserDashboard';
import AdminDashboard from './admin/AdminDashboard';
import { Button } from "@/components/ui/button";
import { Briefcase, ShieldCheck } from 'lucide-react';

type ViewMode = 'user' | 'admin' | 'login';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('login');

  const handleLogin = (mode: 'user' | 'admin') => {
    setViewMode(mode);
  };

  const handleLogout = () => {
    setViewMode('login');
  };

  // Login Screen
  if (viewMode === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="border-2 border-gray-300 rounded-xl p-8 bg-white shadow-lg">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-sky-600 to-emerald-600 p-4 rounded-full">
                <Briefcase className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-center mb-2">
              Sistem Kehadiran Pekerja
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Pilih mode akses untuk melanjutkan
            </p>
            
            <div className="space-y-4">
              <Button
                onClick={() => handleLogin('user')}
                className="w-full bg-gradient-to-r from-sky-700 to-sky-600 text-white hover:from-sky-800 hover:to-sky-700 h-12 text-base shadow-md gap-3"
              >
                <Briefcase className="h-5 w-5" />
                Masuk sebagai Pekerja
              </Button>
              
              <Button
                onClick={() => handleLogin('admin')}
                className="w-full bg-gradient-to-r from-emerald-700 to-emerald-600 text-white hover:from-emerald-800 hover:to-emerald-700 h-12 text-base shadow-md gap-3"
              >
                <ShieldCheck className="h-5 w-5" />
                Masuk sebagai Admin
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Aplikasi pencatatan kehadiran dan tugas untuk pekerja lapangan
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User Dashboard View
  if (viewMode === 'user') {
    return (
      // ✅ Error Fixed: Removed onInputLog/onEditLog props
      // UserDashboard now handles its own modals internally
      <UserDashboard
        userName="Ahmad Saputra"
        onLogout={handleLogout}
      />
    );
  }

  // Admin Dashboard View
  return (
    <AdminDashboard
      userName="Administrator"
      onLogout={handleLogout}
    />
  );
}