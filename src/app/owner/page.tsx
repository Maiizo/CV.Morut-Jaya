'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LogoutButton from '@/components/LogoutButton';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';

export default function OwnerPage() {
  const router = useRouter();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (!data.user || data.user.role !== 'owner') {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  const handleExport = async () => {
    if (!fromDate || !toDate) {
      alert('Silakan pilih tanggal mulai dan tanggal akhir');
      return;
    }

    try {
      setExporting(true);
      const response = await fetch(
        `/api/excel/export?fromDate=${fromDate}&toDate=${toDate}`
      );

      if (!response.ok) {
        const error = await response.json();
        alert('Export gagal: ' + (error.error || 'Unknown error'));
        return;
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_logs_${fromDate}_to_${toDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export gagal');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Silakan pilih file Excel terlebih dahulu');
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/excel/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        alert('Import gagal: ' + (result.error || 'Unknown error'));
        return;
      }

      setImportResult(result);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import gagal');
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Owner Dashboard</h1>
          <LogoutButton />
        </div>

        {/* Export Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data ke Excel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="from-date">Dari Tanggal</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="to-date">Sampai Tanggal</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full"
                >
                  {exporting ? 'Exporting...' : 'Export Excel'}
                  <Download className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Format: No, Tanggal, Jam, Nama, Tugas, Lokasi, Jumlah, Satuan, Rekan
            </p>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data dari Excel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-input">Pilih File Excel</Label>
                <Input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {file && (
                  <p className="text-sm text-gray-600 mt-2">
                    File terpilih: {file.name}
                  </p>
                )}
              </div>
              <Button
                onClick={handleImport}
                disabled={importing || !file}
                className="w-full md:w-auto"
              >
                {importing ? 'Importing...' : 'Import Excel'}
                <Upload className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-sm text-gray-500">
                Format file harus sesuai: No, Tanggal, Jam, Nama, Tugas, Lokasi, Jumlah, Satuan, Rekan
              </p>
            </div>

            {/* Import Results */}
            {importResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Hasil Import
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-green-600">
                    ✓ Berhasil import: {importResult.imported} dari {importResult.total} baris
                  </p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-red-600 font-medium mb-1">
                        Error ({importResult.errors.length}):
                      </p>
                      <div className="max-h-48 overflow-y-auto bg-white p-2 rounded border">
                        {importResult.errors.map((error: string, idx: number) => (
                          <p key={idx} className="text-red-600 text-xs">
                            • {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Petunjuk Penggunaan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 space-y-2">
            <p><strong>Export:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Pilih tanggal mulai dan tanggal akhir</li>
              <li>Klik tombol "Export Excel" untuk download file</li>
              <li>File akan berisi data sesuai format template</li>
            </ul>
            <p className="mt-4"><strong>Import:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>File Excel harus mengikuti format yang sama dengan export</li>
              <li>Kolom wajib: Nama, Tugas</li>
              <li>Nama user harus sudah terdaftar di sistem</li>
              <li>Jika tugas belum ada, akan otomatis dibuat</li>
              <li>Format tanggal dan jam akan di-parse otomatis</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
