"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditFormModalProps {
  item: any | null;
  onClose: () => void;
  onSaved: (updated: any) => void;
}

export default function EditFormModal2({ item, onClose, onSaved }: EditFormModalProps) {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<{ id: number; title: string; description?: string }[]>([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [brandsByTask, setBrandsByTask] = useState<Record<string, { id: number; name: string; stock: number; description?: string; satuan?: string; task_def_id: number; task_title?: string; }[]>>({});
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedBrandStock, setSelectedBrandStock] = useState<number | null>(null);
  const [selectedBrandSatuan, setSelectedBrandSatuan] = useState<string>('');
  const [location, setLocation] = useState('');
  const [locationsList, setLocationsList] = useState<{ id: number; name: string }[]>([]);
  const [partners, setPartners] = useState<string[]>([]);
  const [partnerInput, setPartnerInput] = useState('');
  const [satuanList, setSatuanList] = useState<{ id: number; name: string }[]>([]);
  const [quantity, setQuantity] = useState('');
  const [satuan, setSatuan] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOpen(!!item);
    if (item) {
      // Prefer API's canonical fields: custom_description and location
      setSelectedTask((item as any).task_def_id ? String((item as any).task_def_id) : '');
      setSelectedBrand((item as any).brand_id ? String((item as any).brand_id) : '');
      setLocation((item as any).location ?? (item as any).lokasi ?? '');
      setQuantity(String((item as any).quantity ?? ''));
      setSatuan((item as any).satuan ?? '');
      setCustomDesc((item as any).custom_description ?? '');
      // Parse partners string into array if provided
      const partnerStr = (item as any).partners ?? (item as any).partner ?? null;
      if (partnerStr && String(partnerStr).trim().length > 0) {
        setPartners(String(partnerStr).split(',').map((s: string) => s.trim()).filter(Boolean));
      } else {
        setPartners([]);
      }
    }
  }, [item]);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
          // Preselect based on item.task_def_id if available,
          // otherwise try matching by title/custom_description
          if (item) {
            if ((item as any).task_def_id) {
              setSelectedTask(String((item as any).task_def_id));
            } else if ((item as any).custom_description) {
              const found = data.find((t: any) => t.title === (item as any).custom_description || (item as any).tugas);
              if (found) setSelectedTask(found.id.toString());
            } else if ((item as any).tugas) {
              const found = data.find((t: any) => t.title === (item as any).tugas);
              if (found) setSelectedTask(found.id.toString());
            }
          }
        }
      } catch (err) {
        console.error('Gagal ambil daftar tugas:', err);
      }
    }
    if (open) fetchTasks();
  }, [open]);

  useEffect(() => {
    if (open && selectedTask) {
      fetchBrands(selectedTask, (item as any)?.brand_id ? String((item as any).brand_id) : undefined);
    }
    if (!selectedTask) {
      setSelectedBrand('');
      setSelectedBrandStock(null);
    }
  }, [selectedTask, open]);

  useEffect(() => {
    if (!selectedTask) return;
    const list = brandsByTask[selectedTask] || [];
    const current = list.find((b) => b.id.toString() === selectedBrand);
    if (current) {
      setSelectedBrandStock(current.stock ?? null);
      setSelectedBrandSatuan(current.satuan || '');
      if (current.satuan) setSatuan(current.satuan);
    } else if (list.length > 0 && !selectedBrand) {
      setSelectedBrand(list[0].id.toString());
      setSelectedBrandStock(list[0].stock ?? null);
      setSelectedBrandSatuan(list[0].satuan || '');
      if (list[0].satuan) setSatuan(list[0].satuan);
    } else {
      setSelectedBrandStock(null);
      setSelectedBrandSatuan('');
    }
  }, [brandsByTask, selectedBrand, selectedTask]);

  useEffect(() => {
    async function fetchSatuan() {
      try {
        const res = await fetch('/api/satuan');
        if (res.ok) {
          const data = await res.json();
          setSatuanList(data);
          if (!satuan && data.length > 0) setSatuan(data[0].name);
        }
      } catch (err) {
        console.error('Gagal ambil satuan:', err);
      }
    }
    async function fetchLocations() {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const data = await res.json();
          setLocationsList(data);
          if (!location && data.length > 0) setLocation(data[0].name);
        }
      } catch (err) {
        console.error('Gagal ambil lokasi:', err);
      }
    }
    if (open) {
      fetchLocations();
      fetchSatuan();
    }
  }, [open]);

  async function fetchBrands(taskId: string, preferBrandId?: string) {
    if (!taskId) return;
    if (brandsByTask[taskId]) {
      if (preferBrandId) setSelectedBrand(preferBrandId);
      return;
    }
    try {
      const res = await fetch(`/api/brands?taskId=${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setBrandsByTask(prev => ({ ...prev, [taskId]: data }));
        if (preferBrandId) {
          setSelectedBrand(preferBrandId);
        } else if (data.length > 0) {
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
    } catch (err) {
      console.error('Gagal ambil brand:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setLoading(true);
    try {
      if (!selectedTask) {
        alert('Jenis pekerjaan wajib dipilih');
        return;
      }
      if (!selectedBrand) {
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

      const payload: any = { id: item.id, location };
      if (selectedTask) {
        payload.task_def_id = parseInt(selectedTask, 10);
      }
      payload.custom_description = customDesc || null;
      payload.brand_id = parseInt(selectedBrand, 10);
      // include quantity and satuan similar to add form
      payload.quantity = quantity || null;
      payload.satuan = satuan || null;
      if (partners.length > 0) payload.partners = partners.join(', ');

      const res = await fetch('/api/logs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        onSaved(updated);
        setOpen(false);
        onClose();
      } else {
        alert('❌ Gagal memperbarui. Coba lagi.');
      }
    } catch (error) {
      console.error('Error updating log:', error);
      alert('Terjadi kesalahan saat memperbarui.');
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
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) onClose(); }}>
      <DialogTrigger asChild>
        <span />
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-bold text-center text-gray-800">Form Laporan Kerja</DialogTitle>
          <p className="text-center text-gray-500 text-sm md:text-base">
            Ubah data pekerjaan yang sudah dicatat.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5 md:gap-6 py-4">
          <div className="grid gap-2">
            <Label className="font-semibold text-gray-700 text-sm md:text-base">Jenis Pekerjaan</Label>
                  <Select onValueChange={setSelectedTask} value={selectedTask} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Pilih Pekerjaan --" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.length === 0 ? (
                        <SelectItem value="loading" disabled>Memuat daftar...</SelectItem>
                      ) : (
                        tasks.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>{t.title}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedTask && tasks.find(t => t.id.toString() === selectedTask)?.title && (
                    <p className="text-sm text-gray-500">
                      {tasks.find(t => t.id.toString() === selectedTask)?.description || 'Tidak ada deskripsi.'}
                    </p>
                  )}
          </div>

          <div className="grid gap-2">
            <Label className="font-semibold text-gray-700 text-sm md:text-base">Deskripsi pekerjaan (opsional)</Label>
            <Input
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="Tuliskan detail pekerjaan jika perlu"
              className="h-10 md:h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label className="font-semibold text-gray-700 text-sm md:text-base">Brand</Label>
            <Select
              value={selectedBrand}
              onValueChange={setSelectedBrand}
              disabled={!selectedTask || (brandsByTask[selectedTask]?.length ?? 0) === 0}
              required
            >
              <SelectTrigger className="w-full">
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

          <div className="grid gap-2">
            <Label className="font-semibold text-gray-700 text-sm md:text-base">Lokasi / Detail</Label>
            <Select value={location} onValueChange={setLocation} required>
              <SelectTrigger className="w-full">
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

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="grid gap-2">
              <Label className="font-semibold text-gray-700 text-sm md:text-base">Jumlah</Label>
              <Input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-10 md:h-11"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-semibold text-gray-700 text-sm md:text-base">Satuan</Label>
              <Select
                value={satuan}
                onValueChange={setSatuan}
                disabled={!!selectedBrandSatuan}
              >
                <SelectTrigger className="w-full">
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
              {selectedBrandSatuan && (
                  <p className="text-xs text-gray-500">Satuan mengikuti brand (tidak bisa diubah).</p>
                )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="font-semibold text-gray-700 text-sm md:text-base">Rekan Kerja (opsional)</Label>
            <div className="flex gap-2">
              <Input value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} placeholder="Tambah nama rekan" className="h-10 md:h-11" />
              <Button type="button" onClick={addPartner} className="h-10 md:h-11 w-11 p-0">+</Button>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {partners.map((p, i) => (
                <button key={i} type="button" onClick={() => removePartner(i)} className="px-2 py-1 bg-slate-100 rounded-full text-sm border">
                  {p} ×
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
