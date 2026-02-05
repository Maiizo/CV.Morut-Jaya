"use client";

import React from 'react';
import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';
import { ListChecks } from 'lucide-react';

export default function ManageDropdownsPage() {
  return (
    <AdminLayoutWrapper>
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-600 p-3 rounded-xl shadow-lg">
              <ListChecks className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Manage Dropdowns</h1>
              <p className="text-slate-500">Kelola dropdown dan opsi pilihan</p>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
            <ListChecks className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Manage Dropdowns</h3>
            <p className="text-slate-500">Fitur ini sedang dalam pengembangan.</p>
          </div>
        </div>
      </div>
    </AdminLayoutWrapper>
  );
}
