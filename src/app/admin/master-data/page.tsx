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

  // User form states
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  // Fetch all data on mount
  useEffect(() => {
    sections.forEach(section => {
      fetchData(section.key, section.apiEndpoint);
    });
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
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal menambah data');
      }
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
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
                  {section.key === 'users' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input 
                          placeholder="Username" 
                          value={userForm.username}
                          onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                          className="h-11 text-base"
                        />
                        <Input 
                          placeholder="Email" 
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                          className="h-11 text-base"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input 
                          placeholder="Password" 
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                          className="h-11 text-base"
                        />
                        <select 
                          value={userForm.role}
                          onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                          className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <Button 
                        onClick={() => handleAdd(section.key, section.apiEndpoint, section.nameField)}
                        className="w-full h-11 text-base bg-slate-700 hover:bg-slate-800 text-white font-medium"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah User
                      </Button>
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
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
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
