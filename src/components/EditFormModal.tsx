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

export default function EditFormModal({ item, onClose, onSaved }: EditFormModalProps) {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<{ id: number; title: string }[]>([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOpen(!!item);
    if (item) {
      setSelectedTask(item.tugas || '');
      setLocation(item.lokasi || '');
    }
  }, [item]);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (err) {
        console.error('Gagal ambil daftar tugas:', err);
      }
    }
    if (open) fetchTasks();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setLoading(true);
    try {
      const res = await fetch('/api/logs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, custom_description: selectedTask, location }),
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
                    <SelectItem key={t.id} value={t.title}>{t.title}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-right font-semibold text-gray-700 text-left">Lokasi / Detail</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Lantai 2, Ruang Server..."
              required
            />
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
