"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus, Building, MapPin, Briefcase, Scale, Users, X } from 'lucide-react';
import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';

interface DataItem {
  id: number;
  name?: string;
  title?: string;
  username?: string;
  email?: string;
  role?: string;
  created_at?: string;
}

type DataType = 'tasks' | 'locations' | 'satuan' | 'users';

interface Section {
  key: DataType;
  title: string;
  icon: React.ReactNode;
  apiEndpoint: string;
  nameField: 'title' | 'name' | 'username';
  color: string;
}

export default function MasterDataPage() {
  const sections: Section[] = [
    { 
      key: 'tasks', 
      title: 'Master Tugas', 
      icon: <Briefcase className="h-5 w-5" />, 
      apiEndpoint: '/api/tasks',
      nameField: 'title',
      color: 'blue'
    },
    { 
      key: 'locations', 
      title: 'Master Lokasi', 
      icon: <MapPin className="h-5 w-5" />, 
      apiEndpoint: '/api/locations',
      nameField: 'name',
      color: 'indigo'
    },
    { 
      key: 'satuan', 
      title: 'Master Satuan', 
      icon: <Scale className="h-5 w-5" />, 
      apiEndpoint: '/api/satuan',
      nameField: 'name',
      color: 'cyan'
    },
    { 
      key: 'users', 
      title: 'Master User', 
      icon: <Users className="h-5 w-5" />, 
      apiEndpoint: '/api/users',
      nameField: 'username',
      color: 'slate'
    },
  ];

  const [data, setData] = useState<Record<DataType, DataItem[]>>({
    tasks: [],
    locations: [],
    satuan: [],
    users: []
  });

  const [loading, setLoading] = useState<Record<DataType, boolean>>({
    tasks: true,
    locations: true,
    satuan: true,
    users: true
  });

  // Modal states
  const [editModal, setEditModal] = useState<{ 
    isOpen: boolean; 
    type: DataType | null; 
    item: DataItem | null;
    section: Section | null;
  }>({ isOpen: false, type: null, item: null, section: null });

  const [deleteModal, setDeleteModal] = useState<{ 
    isOpen: boolean; 
    type: DataType | null; 
    item: DataItem | null;
  }>({ isOpen: false, type: null, item: null });

  const [addInput, setAddInput] = useState<Record<DataType, string>>({
    tasks: '',
    locations: '',
    satuan: '',
    users: ''
  });

  // Brand & Stock state
  const [brandList, setBrandList] = useState<any[]>([]);
  const [brandLoading, setBrandLoading] = useState(true);
  const [brandForm, setBrandForm] = useState({ taskId: '', name: '', satuan: '' });
  const [stockForm, setStockForm] = useState<Record<number, string>>({});

  // User form states
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  const [taskDescription, setTaskDescription] = useState('');

  // Fetch all data on mount
  useEffect(() => {
    sections.forEach(section => {
      fetchData(section.key, section.apiEndpoint);
    });
    fetchBrands();
  }, []);

  async function fetchData(type: DataType, endpoint: string) {
    try {
      const res = await fetch(endpoint);
      const result = await res.json();
      setData(prev => ({ ...prev, [type]: result }));
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  }

  async function fetchBrands() {
    try {
      const res = await fetch('/api/brands');
      const result = await res.json();
      setBrandList(result);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setBrandLoading(false);
    }
  }

  // Add new item
  async function handleAdd(type: DataType, endpoint: string, nameField: string) {
    const value = addInput[type].trim();
    if (!value) return;

    try {
      let body: any = {};
      
      if (type === 'users') {
        // Validate user form
        if (!userForm.username || !userForm.email || !userForm.password) {
          alert('Username, email, dan password wajib diisi');
          return;
        }
        body = userForm;
      } else if (type === 'tasks') {
        body = { title: value, description: taskDescription || null };
      } else {
        body = { [nameField]: value };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const newItem = await res.json();
        setData(prev => ({ ...prev, [type]: [...prev[type], newItem] }));
        setAddInput(prev => ({ ...prev, [type]: '' }));
        
        // Reset user form
        if (type === 'users') {
          setUserForm({ username: '', email: '', password: '', role: 'user' });
        }
        if (type === 'tasks') {
          setTaskDescription('');
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal menambah data');
      }
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      alert('Terjadi kesalahan');
    }
  }

  // --- BRAND HANDLERS ---
  async function handleAddBrand() {
    if (!brandForm.taskId || !brandForm.name.trim()) {
      alert('Pilih pekerjaan dan isi nama brand');
      return;
    }
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_def_id: parseInt(brandForm.taskId, 10),
          name: brandForm.name.trim(),
          satuan: brandForm.satuan || null,
        })
      });
      if (res.ok) {
        const newBrand = await res.json();
        setBrandList(prev => [...prev, newBrand]);
        setBrandForm({ taskId: '', name: '', satuan: '' });
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menambah brand');
      }
    } catch (error) {
      console.error('Error adding brand:', error);
      alert('Terjadi kesalahan');
    }
  }

  async function handleAddStock(brandId: number) {
    const val = stockForm[brandId];
    const amount = val ? parseInt(val, 10) : NaN;
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      alert('Jumlah stok harus lebih dari 0');
      return;
    }
    try {
      const res = await fetch('/api/brands/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: brandId, amount })
      });
      if (res.ok) {
        const updated = await res.json();
        setBrandList(prev => prev.map(b => b.id === brandId ? { ...b, stock: updated.stock } : b));
        setStockForm(prev => ({ ...prev, [brandId]: '' }));
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menambah stok');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Terjadi kesalahan');
    }
  }

  async function handleDeleteBrand(brandId: number) {
    if (!confirm('Hapus brand ini?')) return;
    try {
      const res = await fetch(`/api/brands?id=${brandId}`, { method: 'DELETE' });
      if (res.ok) {
        setBrandList(prev => prev.filter(b => b.id !== brandId));
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus brand');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert('Terjadi kesalahan');
    }
  }

  // Update item
  async function handleUpdate() {
    if (!editModal.type || !editModal.item || !editModal.section) return;

    try {
      const res = await fetch(editModal.section.apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editModal.item)
      });

      if (res.ok) {
        const updated = await res.json();
        setData(prev => ({
          ...prev,
          [editModal.type!]: prev[editModal.type!].map(item => 
            item.id === updated.id ? updated : item
          )
        }));
        setEditModal({ isOpen: false, type: null, item: null, section: null });
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal mengupdate data');
      }
    } catch (error) {
      console.error('Error updating:', error);
      alert('Terjadi kesalahan');
    }
  }

  // Delete item
  async function handleDelete() {
    if (!deleteModal.type || !deleteModal.item) return;

    const section = sections.find(s => s.key === deleteModal.type);
    if (!section) return;

    try {
      const res = await fetch(`${section.apiEndpoint}?id=${deleteModal.item.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setData(prev => ({
          ...prev,
          [deleteModal.type!]: prev[deleteModal.type!].filter(item => item.id !== deleteModal.item!.id)
        }));
        setDeleteModal({ isOpen: false, type: null, item: null });
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal menghapus data');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Terjadi kesalahan');
    }
  }

  // Get display name for item
  function getDisplayName(item: DataItem, nameField: string): string {
    if (nameField === 'username' && item.username) {
      return `${item.username} (${item.email})`;
    }
    return (item as any)[nameField] || '-';
  }

  return (
    <AdminLayoutWrapper>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header - Mobile Optimized */}
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="bg-blue-600 p-2.5 md:p-3 rounded-xl shadow-lg">
            <Building className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Master Data</h1>
            <p className="text-sm md:text-base text-slate-500">Kelola semua data referensi sistem</p>
          </div>
        </div>

        {/* Grid of sections - Mobile Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {sections.map(section => {
            const items = data[section.key];
            const isLoading = loading[section.key];
            const colorClasses = {
              blue: 'bg-blue-600 border-blue-200',
              indigo: 'bg-indigo-600 border-indigo-200',
              cyan: 'bg-cyan-600 border-cyan-200',
              slate: 'bg-slate-700 border-slate-200'
            };

            return (
              <div key={section.key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                
                {/* Section Header */}
                <div className={`${colorClasses[section.color as keyof typeof colorClasses]} text-white p-4 md:p-5 flex items-center gap-3`}>
                  <div className="flex-shrink-0">{section.icon}</div>
                  <h2 className="text-base md:text-lg font-semibold flex-1">{section.title}</h2>
                  <span className="bg-white/20 px-3 py-1.5 rounded-full text-sm font-medium">
                    {items.length}
                  </span>
                </div>

                {/* Add Form - Mobile Optimized */}
                <div className="p-4 md:p-5 bg-slate-50 border-b border-slate-200">
                  {section.key === 'users' ? null : section.key === 'tasks' ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input 
                          placeholder={`Tambah ${section.title.toLowerCase()} baru...`}
                          value={addInput[section.key]}
                          onChange={(e) => setAddInput(prev => ({ ...prev, [section.key]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAdd(section.key, section.apiEndpoint, section.nameField);
                            }
                          }}
                          className="flex-1 h-11 text-base"
                        />
                        <Button 
                          onClick={() => handleAdd(section.key, section.apiEndpoint, section.nameField)}
                          className="h-11 w-11 p-0 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Deskripsi pekerjaan (opsional)"
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        className="h-11 text-base"
                      />
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input 
                        placeholder={`Tambah ${section.title.toLowerCase()} baru...`}
                        value={addInput[section.key]}
                        onChange={(e) => setAddInput(prev => ({ ...prev, [section.key]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAdd(section.key, section.apiEndpoint, section.nameField);
                          }
                        }}
                        className="flex-1 h-11 text-base"
                      />
                      <Button 
                        onClick={() => handleAdd(section.key, section.apiEndpoint, section.nameField)}
                        className="h-11 w-11 p-0 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Items List - Mobile Optimized */}
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-8 text-center text-slate-400">Memuat...</div>
                  ) : items.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Belum ada data</div>
                  ) : (
                    items.map(item => (
                      <div key={item.id} className="p-4 md:p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors group flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-800 text-sm md:text-base truncate">
                            {getDisplayName(item, section.nameField)}
                          </div>
                          {section.key === 'users' && (
                            <div className="text-xs md:text-sm text-slate-500 mt-1">
                              Role: <span className="font-medium capitalize">{item.role}</span>
                            </div>
                          )}
                        </div>
                        {section.key !== 'users' ? (
                          <div className="flex gap-1 md:gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditModal({ 
                                isOpen: true, 
                                type: section.key, 
                                item: { ...item },
                                section 
                              })}
                              className="h-9 w-9 md:h-10 md:w-10 p-0 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteModal({ isOpen: true, type: section.key, item })}
                              className="h-9 w-9 md:h-10 md:w-10 p-0 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Brand & Stock */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-emerald-600 text-white p-4 md:p-5 flex items-center gap-3">
            <div className="flex-shrink-0"><Briefcase className="h-5 w-5" /></div>
            <div className="flex-1">
              <h2 className="text-base md:text-lg font-semibold">Brand & Stok Per Pekerjaan</h2>
              <p className="text-sm text-white/80">Admin menambah brand dan stok awal</p>
            </div>
          </div>

          <div className="p-4 md:p-5 space-y-4 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="text-sm font-medium text-slate-700 mb-1 block">Pekerjaan</label>
                <select
                  value={brandForm.taskId}
                  onChange={(e) => setBrandForm(prev => ({ ...prev, taskId: e.target.value }))}
                  className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Pilih pekerjaan</option>
                  {data.tasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Nama Brand</label>
                <Input
                  value={brandForm.name}
                  onChange={(e) => setBrandForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Misal: Brand A"
                  className="h-11 text-base"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Satuan Brand</label>
                <select
                  value={brandForm.satuan}
                  onChange={(e) => setBrandForm(prev => ({ ...prev, satuan: e.target.value }))}
                  className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Pilih satuan (opsional)</option>
                  {data.satuan.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAddBrand} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4">
                <Plus className="h-4 w-4 mr-2" />Tambah Brand
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Brand</th>
                  <th className="px-4 py-3 text-left">Pekerjaan</th>
                  <th className="px-4 py-3 text-left">Satuan</th>
                  <th className="px-4 py-3 text-center">Stok</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {brandLoading ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Memuat brand...</td></tr>
                  ) : brandList.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Belum ada brand</td></tr>
                  ) : (
                  brandList.map((brand) => (
                    <tr key={brand.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{brand.name}</td>
                      <td className="px-4 py-3 text-slate-700">{brand.task_title || brand.task_def_id}</td>
                      <td className="px-4 py-3 text-slate-700">{brand.satuan || '-'}</td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-800">{brand.stock ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Tambah stok"
                            value={stockForm[brand.id] || ''}
                            onChange={(e) => setStockForm(prev => ({ ...prev, [brand.id]: e.target.value }))}
                            className="w-28 h-10"
                          />
                          <Button size="sm" onClick={() => handleAddStock(brand.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            Tambah
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteBrand(brand.id)} className="text-red-600 border-red-200 hover:bg-red-50">
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModal.isOpen} onOpenChange={(open) => !open && setEditModal({ isOpen: false, type: null, item: null, section: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data</DialogTitle>
          </DialogHeader>
          {editModal.item && editModal.section && (
            <div className="space-y-4 py-4">
              {editModal.type === 'users' ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Username</label>
                    <Input 
                      value={editModal.item.username || ''}
                      onChange={(e) => setEditModal(prev => ({
                        ...prev,
                        item: prev.item ? { ...prev.item, username: e.target.value } : null
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Email</label>
                    <Input 
                      type="email"
                      value={editModal.item.email || ''}
                      onChange={(e) => setEditModal(prev => ({
                        ...prev,
                        item: prev.item ? { ...prev.item, email: e.target.value } : null
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Password Baru (kosongkan jika tidak diubah)</label>
                    <Input 
                      type="password"
                      placeholder="Kosongkan jika tidak diubah"
                      onChange={(e) => setEditModal(prev => ({
                        ...prev,
                        item: prev.item ? { ...prev.item, password: e.target.value } : null
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Role</label>
                    <select 
                      value={editModal.item.role || 'user'}
                      onChange={(e) => setEditModal(prev => ({
                        ...prev,
                        item: prev.item ? { ...prev.item, role: e.target.value } : null
                      }))}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </>
              ) : editModal.type === 'tasks' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Nama</label>
                    <Input 
                      value={(editModal.item as any)[editModal.section.nameField] || ''}
                      onChange={(e) => setEditModal(prev => ({
                        ...prev,
                        item: prev.item && prev.section ? { 
                          ...prev.item, 
                          [prev.section.nameField]: e.target.value 
                        } : null
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Deskripsi (opsional)</label>
                    <Input
                      value={(editModal.item as any).description || ''}
                      onChange={(e) => setEditModal(prev => ({
                        ...prev,
                        item: prev.item ? { ...prev.item, description: e.target.value } : null
                      }))}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Nama</label>
                  <Input 
                    value={(editModal.item as any)[editModal.section.nameField] || ''}
                    onChange={(e) => setEditModal(prev => ({
                      ...prev,
                      item: prev.item && prev.section ? { 
                        ...prev.item, 
                        [prev.section.nameField]: e.target.value 
                      } : null
                    }))}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditModal({ isOpen: false, type: null, item: null, section: null })}
            >
              Batal
            </Button>
            <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal.isOpen} onOpenChange={(open) => !open && setDeleteModal({ isOpen: false, type: null, item: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 py-4">
            Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteModal({ isOpen: false, type: null, item: null })}
            >
              Batal
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayoutWrapper>
  );
}
