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
  const toLocalDateTimeString = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  // State untuk data form
  const [tasks, setTasks] = useState<{ id: number; title: string; description?: string }[]>([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState("");
  const [brandsByTask, setBrandsByTask] = useState<Record<string, { id: number; name: string; stock: number; description?: string; satuan?: string; task_def_id: number; task_title?: string; }[]>>({});
  const [selectedTaskHasBrands, setSelectedTaskHasBrands] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedBrandStock, setSelectedBrandStock] = useState<number | null>(null);
  const [selectedBrandSatuan, setSelectedBrandSatuan] = useState<string>('');
  const [location, setLocation] = useState("");
  const [locationsList, setLocationsList] = useState<{ id: number; name: string }[]>([]);
  const [satuanList, setSatuanList] = useState<{ id: number; name: string }[]>([]);
  const [partners, setPartners] = useState<string[]>([]);
  const [partnerInput, setPartnerInput] = useState('');
  const [quantity, setQuantity] = useState('');
  const [satuan, setSatuan] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // Untuk kontrol buka/tutup modal

  // 1. Ambil daftar pekerjaan dari Database saat modal dibuka
  useEffect(() => {
  async function fetchTasks() {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }
  
  fetchTasks();
  fetchLocations();
  fetchSatuan();
}, []);

  useEffect(() => {
    if (selectedTask) {
      fetchBrands(selectedTask);
    } else {
      setSelectedTaskHasBrands(false);
      setSelectedBrand('');
      setSelectedBrandStock(null);
      setSelectedBrandSatuan('');
    }
  }, [selectedTask]);

  useEffect(() => {
    if (!selectedTask) return;
    const list = brandsByTask[selectedTask] || [];
    const current = list.find((b) => b.id.toString() === selectedBrand);
    setSelectedBrandStock(current ? current.stock : null);
    setSelectedBrandSatuan(current?.satuan || '');
    if (current?.satuan) {
      setSatuan(current.satuan);
    }
  }, [selectedBrand, selectedTask, brandsByTask]);

  const filteredTasks = tasks.filter((task) => {
    const query = taskSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      task.title.toLowerCase().includes(query) ||
      (task.description || '').toLowerCase().includes(query)
    );
  });

  async function fetchLocations() {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setLocationsList(data);
        if (data.length > 0 && !location) setLocation(data[0].name);
      }
    } catch (error) {
      console.error('Gagal ambil lokasi:', error);
    }
  }

  async function fetchSatuan() {
    try {
      const res = await fetch('/api/satuan');
      if (res.ok) {
        const data = await res.json();
        setSatuanList(data);
      }
    } catch (error) {
      console.error('Gagal ambil satuan:', error);
    }
  }

  async function fetchBrands(taskId: string) {
    if (!taskId) return;
    // Avoid refetching if already cached
    if (brandsByTask[taskId]) {
      const list = brandsByTask[taskId];
      setSelectedTaskHasBrands(list.length > 0);
      if (list.length > 0 && !selectedBrand) {
        setSelectedBrand(list[0].id.toString());
        setSelectedBrandStock(list[0].stock ?? null);
      }
      return;
    }

    try {
      const res = await fetch(`/api/brands?taskId=${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setBrandsByTask(prev => ({ ...prev, [taskId]: data }));
        setSelectedTaskHasBrands(data.length > 0);
        if (data.length > 0) {
          setSelectedBrand(data[0].id.toString());
          setSelectedBrandStock(data[0].stock ?? null);
          setSelectedBrandSatuan(data[0].satuan || '');
          if (data[0].satuan) setSatuan(data[0].satuan);
        } else {
          setSelectedBrand('');
          setSelectedBrandStock(null);
          setSelectedBrandSatuan('');
        }
      }
    } catch (error) {
      console.error('Gagal ambil brand:', error);
    }
  }

  // 2. Fungsi Submit (Simpan Data)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedTask) {
        alert('Jenis pekerjaan wajib dipilih');
        return;
      }
      if (selectedTaskHasBrands && !selectedBrand) {
        alert('Brand wajib dipilih');
        return;
      }
      const qtyNumber = parseInt(quantity, 10);
      if (!Number.isFinite(qtyNumber) || qtyNumber <= 0) {
        alert('Jumlah harus lebih dari 0');
        return;
      }
      if (selectedBrandStock !== null && qtyNumber > selectedBrandStock) {
        alert(`Stok tidak cukup. Sisa: ${selectedBrandStock}`);
        return;
      }

      // Kirim data ke API Logs
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_def_id: selectedTask ? parseInt(selectedTask, 10) : null,
          custom_description: customDesc ? customDesc : null,
          brand_id: selectedTaskHasBrands && selectedBrand ? parseInt(selectedBrand, 10) : null,
          location,
          partners: partners.length > 0 ? partners.join(', ') : null,
          quantity: quantity || null,
          satuan: satuan || null,
          log_time: toLocalDateTimeString(new Date())
        }),
      });

      if (res.ok) {
        alert("✅ Data berhasil disimpan!");
        setOpen(false); // Tutup modal otomatis
        window.location.reload(); // Refresh halaman biar data baru muncul di tabel
      } else {
        const errorData = await res.json();
        console.error('Save failed:', errorData);
        alert(`❌ Gagal menyimpan: ${errorData.error || 'Coba lagi.'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert("Terjadi kesalahan sistem: " + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  function addPartner() {
    const v = partnerInput.trim();
    if (!v) return;
    setPartners(prev => [...prev, v]);
    setPartnerInput('');
  }

  function removePartner(idx: number) {
    setPartners(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto h-12 md:h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 rounded-lg shadow-md transition-all text-base">
          + Catat Pekerjaan Baru
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-bold text-center text-gray-800">
            Form Laporan Kerja
          </DialogTitle>
          <p className="text-center text-gray-500 text-sm md:text-base">
            Isi data pekerjaan yang baru saja kamu selesaikan.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5 md:gap-6 py-4">
          
          {/* INPUT 1: JENIS PEKERJAAN (Dropdown) */}
          <div className="grid gap-2">
            <Label htmlFor="task" className="font-semibold text-gray-700 text-sm md:text-base">
              Jenis Pekerjaan
            </Label>
            <Input
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              placeholder="Cari pekerjaan..."
              className="h-11 text-base"
            />
            <Select onValueChange={(val) => { setSelectedTask(val); setSelectedBrand(''); setSelectedBrandStock(null); }} required>
              <SelectTrigger className="w-full h-11 text-base">
                <SelectValue placeholder="-- Pilih Pekerjaan --" />
              </SelectTrigger>
              <SelectContent>
                {tasks.length === 0 ? (
                  <SelectItem value="loading" disabled>Memuat daftar...</SelectItem>
                ) : filteredTasks.length === 0 ? (
                  <SelectItem value="no-result" disabled>Tidak ada pekerjaan yang cocok</SelectItem>
                ) : (
                  filteredTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      {task.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {tasks.length > 0 && (
              <p className="text-xs text-gray-500">
                Menampilkan {filteredTasks.length} dari {tasks.length} pekerjaan.
              </p>
            )}
            {selectedTask && tasks.find(t => t.id.toString() === selectedTask)?.title && (
              <p className="text-sm text-gray-500">
                {tasks.find(t => t.id.toString() === selectedTask)?.description || 'Tidak ada deskripsi.'}
              </p>
            )}
          </div>

          {/* INPUT 1a: Deskripsi Pekerjaan (opsional) */}
          <div className="grid gap-2">
            <Label className="font-semibold text-gray-700 text-sm md:text-base">Deskripsi pekerjaan (opsional)</Label>
            <Input
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Tuliskan detail pekerjaan jika perlu"
              className="h-11 text-base"
            />
          </div>

          {/* INPUT 1b: BRAND */}
          {selectedTaskHasBrands && (
            <div className="grid gap-2">
              <Label className="font-semibold text-gray-700 text-sm md:text-base">Brand</Label>
              <Select
                value={selectedBrand}
                onValueChange={setSelectedBrand}
                disabled={!selectedTask || (brandsByTask[selectedTask]?.length ?? 0) === 0}
                required={selectedTaskHasBrands}
              >
                <SelectTrigger className="w-full h-11 text-base">
                  <SelectValue placeholder={selectedTask ? '-- Pilih Brand --' : 'Pilih pekerjaan dulu'} />
                </SelectTrigger>
                <SelectContent>
                  {!selectedTask ? (
                    <SelectItem value="no-task" disabled>Pilih pekerjaan dulu</SelectItem>
                  ) : (brandsByTask[selectedTask]?.length ?? 0) === 0 ? (
                    <SelectItem value="no-brand" disabled>Brand belum tersedia</SelectItem>
                  ) : (
                    (brandsByTask[selectedTask] || []).map((brand) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name} (Stok: {brand.stock ?? 0}{brand.satuan ? ` • ${brand.satuan}` : ''})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-500 space-y-1">
                {selectedBrandStock !== null && (
                  <p>Stok tersisa: <span className="font-semibold text-gray-700">{selectedBrandStock}</span></p>
                )}
                {selectedBrandSatuan && (
                  <p>Satuan brand: <span className="font-semibold text-gray-700">{selectedBrandSatuan}</span></p>
                )}
              </div>
            </div>
          )}

          {/* INPUT 2: LOKASI / KETERANGAN */}
          <div className="grid gap-2">
            <Label htmlFor="lokasi" className="font-semibold text-gray-700 text-sm md:text-base">
              Lokasi / Detail
            </Label>
            <Select value={location} onValueChange={setLocation} required>
              <SelectTrigger className="w-full h-11 text-base">
                <SelectValue placeholder="-- Pilih Lokasi --" />
              </SelectTrigger>
              <SelectContent>
                {locationsList.length === 0 ? (
                  <SelectItem value="loading" disabled>Memuat lokasi...</SelectItem>
                ) : (
                  locationsList.map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* INPUT 3: QUANTITY & SATUAN */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity" className="font-semibold text-gray-700 text-sm md:text-base">Jumlah</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Jumlah"
                className="h-11 text-base"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="satuan" className="font-semibold text-gray-700 text-sm md:text-base">Satuan</Label>
              <Select
                value={satuan}
                onValueChange={setSatuan}
                disabled={!!selectedBrandSatuan}
                required
              >
                <SelectTrigger className="w-full h-11 text-base">
                  <SelectValue placeholder="Pilih satuan" />
                </SelectTrigger>
                <SelectContent>
                  {satuanList.length === 0 ? (
                    <SelectItem value="loading" disabled>Memuat satuan...</SelectItem>
                  ) : (
                    satuanList.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              </div>
              {selectedBrandSatuan && (
                <p className="text-xs text-gray-500">Satuan mengikuti brand (tidak bisa diubah).</p>
              )}
          </div>

          {/* INPUT 4: PARTNERS (Optional, multiple) */}
          <div className="grid gap-2">
            <Label className="font-semibold text-gray-700 text-sm md:text-base">Rekan Kerja (opsional)</Label>
            <div className="flex gap-2">
              <Input 
                value={partnerInput} 
                onChange={(e) => setPartnerInput(e.target.value)} 
                placeholder="Tambah nama rekan" 
                className="h-11 text-base"
              />
              <Button type="button" onClick={addPartner} className="h-11 w-11 p-0 flex-shrink-0">+</Button>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {partners.map((p, i) => (
                <button 
                  key={i} 
                  type="button" 
                  onClick={() => removePartner(i)} 
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-sm border border-slate-200 active:bg-slate-300 transition-colors"
                >
                  {p} ×
                </button>
              ))}
            </div>
          </div>

          {/* TOMBOL SIMPAN */}
          <DialogFooter className="mt-2">
            <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold"
            >
              {loading ? "Menyimpan..." : "Simpan Laporan"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}