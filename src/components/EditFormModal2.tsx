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
  const [tasks, setTasks] = useState<{ id: number; title: string }[]>([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [location, setLocation] = useState('');
  const [locationsList, setLocationsList] = useState<string[]>([]);
  const [partners, setPartners] = useState<string[]>([]);
  const [partnerInput, setPartnerInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOpen(!!item);
    if (item) {
      // Prefer API's canonical fields: custom_description and location
      setSelectedTask('');
      setLocation((item as any).location ?? (item as any).lokasi ?? '');
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
    async function fetchLocations() {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const data = await res.json();
          setLocationsList(data);
          if (!location && data.length > 0) setLocation(data[0]);
        }
      } catch (err) {
        console.error('Gagal ambil lokasi:', err);
      }
    }
    if (open) fetchLocations();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setLoading(true);
    try {
      const payload: any = { id: item.id, location };
      if (selectedTask) {
        payload.task_def_id = parseInt(selectedTask, 10);
        const taskTitle = tasks.find(t => t.id.toString() === selectedTask)?.title || null;
        if (taskTitle) payload.custom_description = taskTitle;
      }
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

      <DialogContent className="sm:max-w-[425px] bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-gray-800">Edit Laporan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label className="text-right font-semibold text-gray-700 text-left">Jenis Pekerjaan</Label>
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
          </div>

          <div className="grid gap-2">
            <Label className="text-right font-semibold text-gray-700 text-left">Lokasi / Detail</Label>
            <Select value={location} onValueChange={setLocation} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Pilih Lokasi --" />
              </SelectTrigger>
              <SelectContent>
                {locationsList.length === 0 ? (
                  <SelectItem value="loading" disabled>Memuat lokasi...</SelectItem>
                ) : (
                  locationsList.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-right font-semibold text-gray-700 text-left">Rekan Kerja (opsional)</Label>
            <div className="flex gap-2">
              <Input value={partnerInput} onChange={(e) => setPartnerInput(e.target.value)} placeholder="Tambah nama rekan, tekan +" />
              <Button type="button" onClick={addPartner}>+</Button>
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
