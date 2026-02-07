"use client";

import React from 'react';
import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';
import { FileText } from 'lucide-react';

export default function RingkasanHarianPage() {
  return (
    <AdminLayoutWrapper>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header - Mobile Optimized */}
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="bg-green-600 p-2.5 md:p-3 rounded-xl shadow-lg">
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Ringkasan Harian</h1>
              <p className="text-sm md:text-base text-slate-500">Laporan aktivitas harian</p>
            </div>
          </div>

          {/* Content Area - Mobile Optimized */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="bg-slate-50 p-6 md:p-8 rounded-xl">
                <FileText className="h-12 w-12 md:h-16 md:w-16 text-slate-300 mx-auto mb-4" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-slate-700">Ringkasan Harian</h3>
              <p className="text-sm md:text-base text-slate-500 leading-relaxed">
                Fitur ini sedang dalam pengembangan. Anda akan dapat melihat ringkasan laporan harian di sini.
              </p>
              <div className="pt-4">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Segera Hadir
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutWrapper>
  );
}
