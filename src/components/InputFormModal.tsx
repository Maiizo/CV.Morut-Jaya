"use client"; //

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"; // Pastikan path import benar (sesuai folder kamu)
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InputFormModal() {
  // State untuk data form
  const [tasks, setTasks] = useState<{ id: number; title: string }[]>([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // Untuk kontrol buka/tutup modal

  // 1. Ambil daftar pekerjaan dari Database saat modal dibuka
  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('/api/tasks'); // Panggil API Tasks yang sudah kita buat
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (error) {
        console.error("Gagal ambil daftar tugas:", error);
      }
    }
    
    // Panggil hanya jika modal sedang terbuka
    if (open) {
      fetchTasks();
    }
  }, [open]);

  // 2. Fungsi Submit (Simpan Data)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Kirim data ke API Logs
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            // Sesuaikan nama field dengan yang diminta API
            task_def_id: selectedTask, 
            custom_description: location, // Kita pakai kolom deskripsi untuk detail lokasi
            log_time: new Date().toISOString() // Kirim waktu sekarang
        }),
      });

      if (res.ok) {
        alert("✅ Data berhasil disimpan!");
        setOpen(false); // Tutup modal otomatis
        window.location.reload(); // Refresh halaman biar data baru muncul di tabel
      } else {
        alert("❌ Gagal menyimpan. Coba lagi.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all">
          + Catat Pekerjaan Baru
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-gray-800">
            Form Laporan Kerja
          </DialogTitle>
          <p className="text-center text-gray-500 text-sm">
            Isi data pekerjaan yang baru saja kamu selesaikan.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          
          {/* INPUT 1: JENIS PEKERJAAN (Dropdown) */}
          <div className="grid gap-2">
            <Label htmlFor="task" className="text-right font-semibold text-gray-700 text-left">
              Jenis Pekerjaan
            </Label>
            <Select onValueChange={setSelectedTask} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Pilih Pekerjaan --" />
              </SelectTrigger>
              <SelectContent>
                {tasks.length === 0 ? (
                  <SelectItem value="loading" disabled>Memuat daftar...</SelectItem>
                ) : (
                  tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      {task.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* INPUT 2: LOKASI / KETERANGAN */}
          <div className="grid gap-2">
            <Label htmlFor="lokasi" className="text-right font-semibold text-gray-700 text-left">
              Lokasi / Detail
            </Label>
            <Input
              id="lokasi"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Lantai 2, Toilet Pria, Ruang Meeting..."
              className="col-span-3"
              required
            />
          </div>

          {/* TOMBOL SIMPAN */}
          <DialogFooter>
            <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
            >
              {loading ? "Menyimpan..." : "Simpan Laporan"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}